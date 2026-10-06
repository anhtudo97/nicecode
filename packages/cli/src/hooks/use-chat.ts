import { apiClient } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/http-error"
import type { Mode } from "@nicecode/database/enums"
import { chatStreamEventSchema, type SupportedChatModel } from "@nicecode/shared"
import { EventSourceParserStream } from "eventsource-parser/stream"
import type { ClientResponse } from "hono/client"
import prettyMs from "pretty-ms"
import { useCallback, useRef, useState } from "react"

export type ClientMessagePart = {
    type: "text"
    text: string
}

export type Message =
    | {
          id: string
          role: "user"
          content: string
          mode: Mode
          model: SupportedChatModel
      }
    | {
          id: string
          role: "assistant"
          content: string
          mode: Mode
          model: SupportedChatModel
          parts: ClientMessagePart[]
          duration?: string
      }
    | {
          id: string
          role: "error"
          content: string
      }

type StreamingState =
    | {
          status: "idle"
      }
    | {
          status: "streaming"
          parts: ClientMessagePart[]
          mode: Mode
          model: SupportedChatModel
      }

type ActiveStream = {
    requestId: string
    controller: AbortController
    mode: Mode
    model: SupportedChatModel
    parts: ClientMessagePart[]
}

type SubmitParams = {
    userText: string
    mode: Mode
    model: SupportedChatModel
}

type RunStreamParams = {
    mode: Mode
    model: SupportedChatModel
    request: (controller: AbortController) => Promise<ClientResponse<unknown>>
}

export const useChat = (sessionId: string, initialMessages: Message[]) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [streaming, setStreaming] = useState<StreamingState>({
        status: "idle"
    })

    const activeStreamRef = useRef<ActiveStream | null>(null)

    const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
        setMessages((prev) => updater(prev))
    }, [])

    const isActiveRequest = useCallback((requestId: string) => {
        return activeStreamRef.current?.requestId === requestId
    }, [])

    const emitParts = useCallback(
        (requestId: string, parts: ClientMessagePart[]) => {
            if (!isActiveRequest(requestId)) return

            const snapshot = [...parts]
            const activeStream = activeStreamRef.current
            if (!activeStream) return

            activeStream.parts = snapshot
            setStreaming({
                status: "streaming",
                parts: snapshot,
                mode: activeStream.mode,
                model: activeStream.model
            })
        },
        [isActiveRequest]
    )

    const clearStream = useCallback(
        (requestId: string) => {
            if (!isActiveRequest(requestId)) return

            activeStreamRef.current = null
            setStreaming({
                status: "idle"
            })
        },
        [isActiveRequest]
    )

    const handleStream = useCallback(
        async (response: ClientResponse<unknown>, activeStream: ActiveStream) => {
            if (!isActiveRequest(activeStream.requestId)) return

            if (!response.ok) {
                const message = await getErrorMessage(response)

                updateMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "error",
                        content: message
                    }
                ])
                return
            }

            const parts: ClientMessagePart[] = []

            const stream = response
                .body!.pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream())

            for await (const { data } of stream) {
                if (!isActiveRequest(activeStream.requestId)) return

                let event

                try {
                    event = chatStreamEventSchema.parse(JSON.parse(data))
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Invalid event data"
                    updateMessages((prev) => [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            role: "error",
                            content: message
                        }
                    ])
                    break
                }
                switch (event.type) {
                    case "text-delta": {
                        const last = parts.at(-1)
                        if (last && last.type === "text") {
                            parts[parts.length - 1] = { ...last, text: last.text + event.text }
                        } else {
                            parts.push({
                                type: "text",
                                text: event.text
                            })
                        }
                        emitParts(activeStream.requestId, parts)
                        break
                    }
                    case "done": {
                        if (!isActiveRequest(activeStream.requestId)) return

                        const fullText = parts
                            .filter((p) => p.type === "text")
                            .map((p) => p.text)
                            .join("")

                        updateMessages((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                role: "assistant",
                                content: fullText,
                                mode: activeStream.mode,
                                model: activeStream.model,
                                duration: prettyMs(event.durationMs),
                                parts: [...parts]
                            }
                        ])

                        break
                    }
                    case "error": {
                        updateMessages((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                role: "error",
                                content: event.message
                            }
                        ])
                        break
                    }
                }
            }
        },
        [emitParts, isActiveRequest, updateMessages]
    )

    const runStream = useCallback(
        async ({ mode, model, request }: RunStreamParams) => {
            const controller = new AbortController()
            const activeStream: ActiveStream = {
                requestId: crypto.randomUUID(),
                controller,
                mode,
                model,
                parts: []
            }

            activeStreamRef.current = activeStream
            setStreaming({
                status: "streaming",
                parts: [],
                mode,
                model
            })

            try {
                const response = await request(controller)
                await handleStream(response, activeStream)
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }

                if (!isActiveRequest(activeStream.requestId)) return

                const message = error instanceof Error ? error.message : String(error)
                updateMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "error",
                        content: message
                    }
                ])
            } finally {
                clearStream(activeStream.requestId)
            }
        },
        [clearStream, handleStream, isActiveRequest, updateMessages]
    )

    const resume = useCallback(
        async ({ mode, model }: Omit<SubmitParams, "userText">) => {
            await runStream({
                mode,
                model,
                request: async (controller) => {
                    return apiClient.chat[":sessionId"].resume.$post(
                        { param: { sessionId } },
                        { init: { signal: controller.signal } }
                    )
                }
            })
        },
        [runStream, sessionId]
    )

    return {
        runStream,
        resume
    }
}
