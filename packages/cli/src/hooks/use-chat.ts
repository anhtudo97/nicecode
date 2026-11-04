import { useCallback, useMemo, useRef } from "react"
import { useChat as useAiChat } from "@ai-sdk/react"
import {
    DefaultChatTransport,
    type InferUITools,
    lastAssistantMessageIsCompleteWithToolCalls,
    type LanguageModelUsage,
    type UIMessage
} from "ai"
import { type ModeType, type SupportedChatModelId, type ToolContracts } from "@nicecode/shared"
import { apiClient } from "../lib/api-client"
import { getAuth } from "../lib/auth"
import { TOOLS_REQUIRING_APPROVAL, executeLocalTool } from "../lib/local-tools"
import { useToolApproval } from "./use-tool-approval"

export type ChatMessageMetadata = {
    mode?: ModeType
    model?: SupportedChatModelId | string
    durationMs?: number
    usage?: LanguageModelUsage
}

type ChatTools = {
    [Name in keyof InferUITools<ToolContracts>]: {
        input: InferUITools<ToolContracts>[Name]["input"]
        output: unknown
    }
}

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>

export function useChat(sessionId: string, initialMessages: Message[]) {
    // Aborted when the user interrupts, so running tools stop and never resume the chat
    const toolAbortRef = useRef(new AbortController())
    const requestApproval = useToolApproval()

    const transport = useMemo(() => {
        return new DefaultChatTransport<Message>({
            api: apiClient.chat.$url().toString(),
            headers() {
                const auth = getAuth()
                return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers()
            },
            prepareSendMessagesRequest({ messages }) {
                const message = messages[messages.length - 1]
                if (!message) throw new Error("No message to send")

                const metadata = messages.findLast(
                    (m) => m.metadata?.mode && m.metadata?.model
                )?.metadata
                const previousMessage = messages[messages.length - 2]
                const requestMessages =
                    message.role === "assistant" && previousMessage?.role === "user"
                        ? [previousMessage, message]
                        : [message]

                return {
                    body: {
                        id: sessionId,
                        messages: requestMessages,
                        mode: message.metadata?.mode ?? metadata?.mode,
                        model: message.metadata?.model ?? metadata?.model
                    }
                }
            }
        })
    }, [sessionId])

    const chat = useAiChat<Message>({
        id: sessionId,
        messages: initialMessages,
        transport,
        onToolCall({ toolCall }) {
            // Fail closed: an unknown mode must not unlock write/shell tools
            const mode = chat.messages.at(-1)?.metadata?.mode ?? "PLAN"
            const signal = toolAbortRef.current.signal
            const tool = toolCall.toolName as keyof ChatTools

            void (async () => {
                if (mode === "BUILD" && TOOLS_REQUIRING_APPROVAL.includes(toolCall.toolName)) {
                    const choice = await requestApproval(toolCall.toolName, toolCall.input)
                    if (choice === "deny") {
                        throw new Error("The user denied permission for this tool call")
                    }
                }
                signal.throwIfAborted()
                return executeLocalTool(toolCall.toolName, toolCall.input, mode, signal)
            })()
                .then((output) => {
                    // Interrupted: don't report the result, or auto-send would resume the chat
                    if (signal.aborted) return
                    return chat.addToolOutput({ tool, toolCallId: toolCall.toolCallId, output })
                })
                .catch((error) => {
                    if (signal.aborted) return
                    return chat.addToolOutput({
                        tool,
                        toolCallId: toolCall.toolCallId,
                        state: "output-error",
                        errorText: error instanceof Error ? error.message : String(error)
                    })
                })
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls
    })

    const { stop } = chat
    // Stable identity: the session screen aborts from an effect cleanup keyed on this
    const interrupt = useCallback(() => {
        toolAbortRef.current.abort()
        toolAbortRef.current = new AbortController()
        return stop()
    }, [stop])

    return {
        messages: chat.messages,
        status: chat.status,
        error: chat.error,
        submit: (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
            return chat.sendMessage({
                text: params.userText,
                metadata: {
                    mode: params.mode,
                    model: params.model
                }
            })
        },
        abort: interrupt,
        interrupt
    }
}
