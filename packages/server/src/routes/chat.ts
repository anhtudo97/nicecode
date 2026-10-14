import { MessageStatus, Mode } from "@nicecode/database/enums"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { z } from "zod"
import { isSupportedChatModel, resolveChatModel } from "../lib/models"
import { zValidator } from "@hono/zod-validator"
import { streamText as aiStreamText, tool } from "ai"
import {
    messagePartsSchema,
    toolCallArgsSchema,
    type ChatStreamEvent,
    type MessagePart
} from "@nicecode/shared"
import { db } from "@nicecode/database/client"
import type { Prisma } from "@nicecode/database"

const submitSchema = z.object({
    content: z.string(),
    mode: z.enum(Mode),
    model: z.string().refine(isSupportedChatModel, "Unsupported chat model")
})

const submitValidator = zValidator("json", submitSchema, (result, c) => {
    if (!result.success) {
        return c.json({ error: result.error }, 400)
    }
})

const activeResumeSessionIds = new Set<string>()

const buildConversationHistory = (
    messages: { role: "USER" | "ASSISTANT" | "ERROR"; content: string; status: MessageStatus }[]
) => {
    return messages.flatMap((m) => {
        if (m.role === "ERROR") return []
        if (m.role === "ASSISTANT" && m.content.length === 0) return []
        return [
            {
                role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
                content: m.content
            }
        ]
    })
}

const getResumeableUserMessage = (
    messages: {
        role: "USER" | "ASSISTANT" | "ERROR"
        model: string
        mode: Mode
    }[]
) => {
    const lasMessage = messages.at(-1)
    if (!lasMessage || lasMessage.role !== "USER") return null
    return lasMessage
}

type StreamParams = {
    sessionId: string
    model: string
    history: { role: "user" | "assistant"; content: string }[]
    mode: Mode
    abortController: AbortController
}

const streamAIResponse = async (
    stream: Parameters<Parameters<typeof streamSSE>[1]>[0],
    params: StreamParams
) => {
    const { sessionId, model, history, mode, abortController } = params
    const startTime = Date.now()
    const parts: MessagePart[] = []
    const resolvedModel = resolveChatModel(model)

    const persistInterruptedMessage = async () => {
        const fullText = parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("")

        if (fullText.length === 0 && parts.length === 0) return

        const elapsedMs = Date.now() - startTime
        const validatedParts: Prisma.InputJsonValue | undefined =
            parts.length > 0 ? messagePartsSchema.parse(parts) : undefined

        await db.message.create({
            data: {
                sessionId,
                role: "ASSISTANT",
                status: MessageStatus.INTERRUPTED,
                model,
                content: fullText,
                parts: validatedParts,
                mode,
                duration: Math.round(elapsedMs / 1000)
            }
        })
    }

    try {
        const result = aiStreamText({
            model: resolvedModel.model,
            messages: history,
            abortSignal: abortController.signal,
            providerOptions: resolvedModel.providerOptions
        })

        for await (const part of result.stream) {
            if (stream.aborted) break

            if (part.type === "reasoning-delta") {
                const last = parts.at(-1)
                if (last && last.type === "reasoning") {
                    last.text += part.text
                } else {
                    parts.push({
                        type: "reasoning",
                        text: part.text
                    })
                }
                const event: ChatStreamEvent = {
                    type: "reasoning-delta",
                    text: part.text
                }
                await stream.writeSSE({
                    event: "reasoning-delta",
                    data: JSON.stringify(event)
                })
            }

            if (part.type === "text-delta") {
                const last = parts.at(-1)
                if (last && last.type === "text") {
                    last.text += part.text
                } else {
                    parts.push({
                        type: "text",
                        text: part.text
                    })
                }
                const event: ChatStreamEvent = {
                    type: "text-delta",
                    text: part.text
                }
                await stream.writeSSE({
                    event: "text-delta",
                    data: JSON.stringify(event)
                })
            }

            if (part.type === "tool-call") {
                const args = toolCallArgsSchema.parse(part.input)
                parts.push({
                    type: "tool-call",
                    id: part.toolCallId,
                    name: part.toolName,
                    args
                })

                const event: ChatStreamEvent = {
                    type: "tool-call",
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    args
                }
                await stream.writeSSE({
                    event: "tool-call",
                    data: JSON.stringify(event)
                })
            }

            if (part.type === "tool-result") {
                const resultStr =
                    typeof part.output === "string" ? part.output : JSON.stringify(part.output)

                const tcPart = parts.find(
                    (p): p is Extract<MessagePart, { type: "tool-call" }> =>
                        p.type === "tool-call" && p.id === part.toolCallId
                )

                if (tcPart) {
                    tcPart.result = resultStr
                }

                const event: ChatStreamEvent = {
                    type: "tool-result",
                    toolCallId: part.toolCallId,
                    result: resultStr
                }
                await stream.writeSSE({
                    event: "tool-result",
                    data: JSON.stringify(event)
                })
            }

            if (part.type === "error") {
                throw part.error
            }
        }

        if (stream.aborted || abortController.signal.aborted) {
            await persistInterruptedMessage()
            return
        }

        const elapsedMs = Date.now() - startTime
        const fullText = parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("")

        const validatedParts: Prisma.InputJsonValue | undefined =
            parts.length > 0 ? messagePartsSchema.parse(parts) : undefined

        const assistantMessage = await db.message.create({
            data: {
                sessionId,
                role: "ASSISTANT",
                status: MessageStatus.COMPLETE,
                model,
                content: fullText,
                parts: validatedParts,
                mode,
                duration: Math.round(elapsedMs / 1000)
            }
        })

        const doneEvent: ChatStreamEvent = {
            type: "done",
            messageId: assistantMessage.id,
            durationMs: elapsedMs
        }
        await stream.writeSSE({
            event: "done",
            data: JSON.stringify(doneEvent)
        })
    } catch (error) {
        if (abortController.signal.aborted) {
            await persistInterruptedMessage()
            return
        }

        const message = error instanceof Error ? error.message : String(error)

        await db.message.create({
            data: {
                sessionId,
                role: "ERROR",
                status: MessageStatus.COMPLETE,
                model,
                content: message,
                mode
            }
        })

        const errorEvent: ChatStreamEvent = {
            type: "error",
            message
        }
        await stream.writeSSE({
            event: "error",
            data: JSON.stringify(errorEvent)
        })
    }
}

const app = new Hono()
    .post("/:sessionId/resume", async (c) => {
        const sessionId = c.req.param("sessionId")

        // Implement the resume logic here
        const session = await db.session.findUnique({
            where: {
                id: sessionId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        })

        if (!session) {
            return c.json({ error: "Session not found" }, 404)
        }

        const resumableMessage = getResumeableUserMessage(session.messages)
        if (!resumableMessage) {
            return c.json({ error: "No messages found in session" }, 404)
        }

        if (!isSupportedChatModel(resumableMessage.model)) {
            return c.json(
                { error: `Session uses unsupported chat model: ${resumableMessage.model}` },
                409
            )
        }

        if (activeResumeSessionIds.has(sessionId)) {
            return c.json({ error: "A resume session is already active for this session" }, 409)
        }

        activeResumeSessionIds.add(sessionId)

        const history = buildConversationHistory(session.messages)
        const abortController = new AbortController()
        try {
            return streamSSE(
                c,
                async (stream) => {
                    stream.onAbort(() => {
                        abortController.abort()
                    })

                    try {
                        await streamAIResponse(stream, {
                            sessionId,
                            model: resumableMessage.model,
                            history,
                            mode: resumableMessage.mode,
                            abortController
                        })
                    } finally {
                        activeResumeSessionIds.delete(sessionId)
                    }
                },
                async (error, stream) => {
                    activeResumeSessionIds.delete(sessionId)
                    const message = error instanceof Error ? error.message : String(error)

                    const errorEvent: ChatStreamEvent = {
                        type: "error",
                        message
                    }
                    await stream.writeSSE({
                        event: "error",
                        data: JSON.stringify(errorEvent)
                    })
                }
            )
        } catch (error) {
            activeResumeSessionIds.delete(sessionId)
            throw error
        }
    })
    .post("/:sessionId", submitValidator, async (c) => {
        const sessionId = c.req.param("sessionId")

        const session = await db.session.findUnique({
            where: {
                id: sessionId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        })

        if (!session) {
            return c.json({ error: "Session not found" }, 404)
        }

        const data = c.req.valid("json")

        await db.message.create({
            data: {
                sessionId,
                role: "USER",
                status: MessageStatus.COMPLETE,
                model: data.model,
                content: data.content,
                mode: data.mode
            }
        })

        const history = buildConversationHistory([
            ...session.messages,
            {
                role: "USER" as const,
                content: data.content,
                status: MessageStatus.COMPLETE
            }
        ])

        const abortController = new AbortController()

        return streamSSE(
            c,
            async (stream) => {
                stream.onAbort(() => {
                    abortController.abort()
                })

                await streamAIResponse(stream, {
                    sessionId,
                    model: data.model,
                    history,
                    mode: data.mode,
                    abortController
                })
            },
            async (error, stream) => {
                if (abortController.signal.aborted) return

                const message = error instanceof Error ? error.message : String(error)

                const errorEvent: ChatStreamEvent = {
                    type: "error",
                    message
                }
                await stream.writeSSE({
                    event: "error",
                    data: JSON.stringify(errorEvent)
                })
            }
        )
    })

export default app
