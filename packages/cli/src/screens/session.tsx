import { BotMessage, ErrorMessage, UserMessage } from "@/components/messages"
import { SessionShell } from "@/components/messages/session-shell"
import { useChat, type Message } from "@/hooks/use-chat"
import { apiClient } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/http-error"
import { useToast } from "@/providers/toast"
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@nicecode/shared"
import type { InferResponseType } from "hono"
import prettyMs from "pretty-ms"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import z from "zod"

type SessionData = InferResponseType<(typeof apiClient.session)[":id"]["$get"], 200>

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val !== null && typeof val === "object" && "id" in val)
})

const mapDBMessages = (dbMessages: SessionData["messages"]): Message[] => {
    return dbMessages.map((message): Message => {
        if (message.role === "ERROR") {
            return {
                id: message.id,
                role: "error",
                content: message.content
            }
        }
        if (message.role === "USER") {
            return {
                id: message.id,
                role: "user",
                content: message.content,
                mode: message.mode,
                model: message.model as SupportedChatModelId
            }
        }
        return {
            id: message.id,
            role: "assistant",
            content: message.content,
            mode: message.mode,
            model: message.model as SupportedChatModelId,
            parts: [{ type: "text", text: message.content }],
            ...(message.duration != null ? { duration: prettyMs(message.duration * 1000) } : {})
        }
    })
}

const ChatMessage = ({ message }: { message: Message }) => {
    if (message.role === "user") {
        return <UserMessage message={message.content} />
    }
    if (message.role === "error") {
        return <ErrorMessage message={message.content} />
    }
    return (
        <BotMessage
            parts={message.parts}
            model={message.model}
            mode={message.mode}
            duration={message.duration}
            streaming={false}
        />
    )
}

const SessionChat = ({ session }: { session: SessionData }) => {
    const [initalMessages] = useState(() => mapDBMessages(session.messages))
    const { messages, streaming, submit, abort } = useChat(session.id, initalMessages)

    useEffect(() => {
        return () => abort()
    }, [abort])

    return (
        <SessionShell
            onSubmit={(text) => {
                submit({
                    userText: text,
                    mode: "BUILD",
                    model: DEFAULT_CHAT_MODEL_ID
                })
            }}
            loading={streaming.status === "streaming"}
        >
            {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
            ))}
            {streaming.status === "streaming" && streaming.parts.length > 0 && (
                <BotMessage
                    parts={streaming.parts}
                    model={streaming.model}
                    mode={streaming.mode}
                    streaming={true}
                />
            )}
        </SessionShell>
    )
}

export const Session = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { show: showToast } = useToast()

    const prefetched = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state)
        return parsed.success ? parsed.data.session : null
    }, [location.state])

    const [fetched, setFetched] = useState<SessionData | null>(null)
    // Ignore a stale fetch result left over from a previous id
    const session = prefetched ?? (fetched?.id === id ? fetched : null)

    useEffect(() => {
        // Session passed via navigation state: no fetch needed
        if (prefetched || !id) return
        let ignore = false

        const fetchSession = async () => {
            try {
                const response = await apiClient.session[":id"].$get({ param: { id } })
                if (ignore) return
                if (!response.ok) throw new Error(await getErrorMessage(response))
                const data = await response.json()
                if (ignore) return
                setFetched(data)
            } catch (error) {
                if (ignore) return
                showToast({
                    variant: "error",
                    message: error instanceof Error ? error.message : "Error when fetching session"
                })
                navigate("/", { replace: true })
            }
        }
        fetchSession()
        return () => {
            ignore = true
        }
    }, [prefetched, id, navigate, showToast])

    if (!session) return <SessionShell onSubmit={() => {}} inputDisabled loading />

    return <SessionChat key={session.id} session={session} />
}
