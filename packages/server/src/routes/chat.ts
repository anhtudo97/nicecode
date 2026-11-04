import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    streamText,
    toUIMessageStream,
    validateUIMessages,
    type InferUITools,
    type LanguageModelUsage,
    type UIMessage
} from "ai"
import { db } from "@nicecode/database/client"
import type { Prisma } from "@nicecode/database"
import { getToolContracts, modeSchema, type ModeType, type ToolContracts } from "@nicecode/shared"
import { buildSystemPrompt } from "../system-prompt"
import type { AuthenticatedEnv } from "../middleware/require-auth"
import { requireCreditsBalance } from "../middleware/require-credits-balance"
import { calculateCreditsForUsage } from "../lib/credits"
import { ingestAiUsage } from "../lib/polar"
import { isSupportedChatModel, resolveChatModel } from "../lib/models"

type ChatMessageMetadata = {
    mode?: ModeType
    model?: string
    durationMs?: number
    usage?: LanguageModelUsage
}

type NicecodeUIMessage = UIMessage<ChatMessageMetadata, never, InferUITools<ToolContracts>>

const submitSchema = z.object({
    id: z.string(),
    messages: z
        .array(
            z.custom<NicecodeUIMessage>((value) => {
                return (
                    value != null && typeof value === "object" && "id" in value && "parts" in value
                )
            })
        )
        .min(1)
        .max(200),
    mode: modeSchema,
    model: z.string().refine(isSupportedChatModel, "Unsupported model")
})

const submitValidator = zValidator("json", submitSchema, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Invalid request body" }, 400)
    }
})

const app = new Hono<AuthenticatedEnv>().post(
    "/",
    requireCreditsBalance,
    submitValidator,
    async (c) => {
        const userId = c.get("userId")
        const { id, messages, mode, model } = c.req.valid("json")

        const session = await db.session.findUnique({
            where: { id, userId }
        })

        if (!session) {
            return c.json({ error: "Session not found" }, 404)
        }

        const startTime = Date.now()
        const tools = getToolContracts(mode)
        const resolvedModel = resolveChatModel(model)
        const previousMessages = Array.isArray(session.messages)
            ? (session.messages as unknown as NicecodeUIMessage[])
            : []
        const mergedMessages = [...previousMessages]

        for (const message of messages) {
            const incomingMessage = {
                ...message,
                metadata: { ...message.metadata, mode, model }
            } satisfies NicecodeUIMessage

            const existingMessageIndex = mergedMessages.findIndex(
                (m) => m.id === incomingMessage.id
            )

            if (existingMessageIndex === -1) {
                mergedMessages.push(incomingMessage)
                continue
            }

            const existingMessage = mergedMessages[existingMessageIndex]!

            // Stored history is server-owned: the only legitimate rewrite is the client resending
            // the trailing assistant message with tool outputs filled in.
            const isTrailingAssistant =
                existingMessageIndex === previousMessages.length - 1 &&
                existingMessage.role === "assistant" &&
                incomingMessage.role === "assistant"

            // The server copy wins: the client re-sends the user message that opened a turn it
            // already saved, and a rewrite of anything older is ignored rather than trusted.
            if (!isTrailingAssistant) continue

            mergedMessages[existingMessageIndex] = incomingMessage
        }

        let nextMessages: NicecodeUIMessage[]
        try {
            nextMessages = await validateUIMessages<NicecodeUIMessage>({
                messages: mergedMessages,
                tools
            })
        } catch {
            return c.json({ error: "Invalid messages" }, 400)
        }
        // Tool calls the user interrupted never got an output; drop them instead of failing
        const modelMessages = await convertToModelMessages(nextMessages, {
            tools,
            ignoreIncompleteToolCalls: true
        })
        let completedUsage: LanguageModelUsage | null = null

        const result = streamText({
            model: resolvedModel.model,
            system: buildSystemPrompt({ mode }),
            messages: modelMessages,
            tools,
            providerOptions: resolvedModel.providerOptions,
            onEnd(event) {
                completedUsage = event.usage
            }
        })

        const stream = toUIMessageStream<typeof tools, NicecodeUIMessage>({
            stream: result.stream,
            tools,
            originalMessages: nextMessages,
            messageMetadata({ part }) {
                if (part.type === "start") {
                    return { mode, model }
                }

                if (part.type !== "finish") return undefined

                return {
                    mode,
                    model,
                    durationMs: Date.now() - startTime,
                    ...(completedUsage ? { usage: completedUsage } : {})
                }
            },
            async onEnd(event) {
                if (event.isAborted) return

                // Bill every request, including ones that end in a client-side tool call: the
                // model tokens were already spent. The continuation after the tool result reuses
                // the same response message id, so the part count keeps each event id unique
                // (Polar dedups on external_id).
                if (completedUsage) {
                    try {
                        const billableUsage = calculateCreditsForUsage({
                            provider: resolvedModel.provider,
                            model: resolvedModel.modelId,
                            usage: completedUsage
                        })

                        await ingestAiUsage({
                            externalCustomerId: userId,
                            eventId: `chat-message:${event.responseMessage.id}:${event.responseMessage.parts.length}`,
                            credits: billableUsage.credits
                        })
                    } catch (error) {
                        console.error("Failed to ingest Polar AI usage for chat message", {
                            error,
                            sessionId: id,
                            messageId: event.responseMessage.id,
                            userId
                        })
                    }
                }

                // Saved even while client-side tool calls are pending, so an interrupted turn
                // keeps its user message; the client later re-sends the trailing assistant
                // message with outputs filled in.
                // The history is one JSON blob, so a concurrent request on the same session would
                // overwrite this one. Only write if nobody saved since we loaded it.
                const saved = await db.session.updateMany({
                    where: { id, userId, updatedAt: session.updatedAt },
                    data: {
                        messages: event.messages as unknown as Prisma.InputJsonValue
                    }
                })

                if (saved.count === 0) {
                    console.error("Chat history not saved: session changed during the request", {
                        sessionId: id,
                        userId
                    })
                }
            },
            onError(error) {
                console.error("Chat stream failed", { error, sessionId: id, userId })
                return "The model request failed. Please try again."
            }
        })

        return createUIMessageStreamResponse({ stream })
    }
)

export default app
