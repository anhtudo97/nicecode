import { SessionShell } from "@/components/messages/session-shell"
import { getErrorMessage } from "@/lib/http-error"
import { MessageStatus } from "@nicecode/database/enums"
import { messagePartsSchema, type SupportedChatModelId } from "@nicecode/shared"
import { useKeyboard } from "@opentui/react"
import type { InferResponseType } from "hono/client"
import prettyMs from "pretty-ms"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { z } from "zod"
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages"
import type { ClientMessagePart, Message } from "../hooks/use-chat"
import { useChat } from "../hooks/use-chat"
import { apiClient } from "../lib/api-client"
import { useKeyboardLayer } from "../providers/keyboard-layer"
import { usePromptConfig } from "../providers/prompt-config"
import { useToast } from "../providers/toast"

type SessionData = InferResponseType<(typeof apiClient.session)[":id"]["$get"], 200>

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val)
})

function mapDbMessages(dbMessages: SessionData["messages"]): Message[] {
    return dbMessages.map((m): Message => {
        if (m.role === "ERROR") {
            return { id: m.id, role: "error", content: m.content }
        }

        if (m.role === "USER") {
            return {
                id: m.id,
                role: "user",
                content: m.content,
                mode: m.mode,
                model: m.model as SupportedChatModelId
            }
        }

        const parsedParts = m.parts == null ? null : messagePartsSchema.safeParse(m.parts)
        const parts: ClientMessagePart[] = parsedParts?.success
            ? parsedParts.data.map((p) =>
                  p.type === "tool-call" ? { ...p, status: "done" as const } : p
              )
            : []

        return {
            id: m.id,
            role: "assistant",
            content: m.content,
            model: m.model as SupportedChatModelId,
            mode: m.mode,
            parts,
            ...(m.duration != null ? { duration: prettyMs(m.duration * 1000) } : {}),
            interrupted: m.status === MessageStatus.INTERRUPTED
        }
    })
}

function ChatMessage({ msg }: { msg: Message }) {
    if (msg.role === "user") {
        return <UserMessage message={msg.content} mode={msg.mode} />
    }

    if (msg.role === "error") {
        return <ErrorMessage message={msg.content} />
    }

    return (
        <BotMessage
            parts={msg.parts}
            model={msg.model}
            mode={msg.mode}
            duration={msg.duration}
            streaming={false}
            interrupted={msg.interrupted}
        />
    )
}

function SessionChat({ session }: { session: SessionData }) {
    const [initialMessages] = useState(() => mapDbMessages(session.messages))
    const { mode, model } = usePromptConfig()
    const { isTopLayer } = useKeyboardLayer()
    const { messages, streaming, submit, abort, interrupt } = useChat(session.id, initialMessages)

    // Stop the pending reply when the user leaves this session.
    useEffect(() => {
        return () => abort()
    }, [abort])

    // Let the user cancel a reply even before the first streamed chunk arrives.
    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && streaming.status === "streaming") {
            key.preventDefault()
            interrupt()
        }
    })

    return (
        <SessionShell
            onSubmit={(text) => submit({ userText: text, mode, model })}
            loading={streaming.status === "streaming"}
            interruptible={streaming.status === "streaming"}
        >
            {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
            ))}
            {streaming.status === "streaming" && streaming.parts.length > 0 && (
                <BotMessage
                    parts={streaming.parts}
                    model={streaming.model}
                    mode={streaming.mode}
                    streaming
                />
            )}
        </SessionShell>
    )
}

export function Session() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const toast = useToast()

    const prefetched = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state)
        return parsed.success ? parsed.data.session : null
    }, [location.state])

    const [fetched, setFetched] = useState<SessionData | null>(null)

    // Prefer the session passed via location state; otherwise use the fetched one only if it
    // matches the current route id (avoids showing a stale session without resetting state).
    const session = prefetched ?? (fetched?.id === id ? fetched : null)

    useEffect(() => {
        // Skip fetch if session was passed via location state
        if (prefetched || !id) return

        let ignore = false
        const fetchSession = async () => {
            try {
                const res = await apiClient.session[":id"].$get({
                    param: { id }
                })
                if (ignore) return
                if (!res.ok) throw new Error(await getErrorMessage(res))
                const resolved = await res.json()
                setFetched(resolved)
            } catch (err) {
                if (ignore) return
                toast.show({
                    variant: "error",
                    message: err instanceof Error ? err.message : "Failed to load session"
                })
                navigate("/", { replace: true })
            }
        }

        fetchSession()
        return () => {
            ignore = true
        }
    }, [id, prefetched, toast, navigate])

    if (!session) {
        return <SessionShell onSubmit={() => {}} inputDisabled loading />
    }

    return <SessionChat key={session.id} session={session} />
}
