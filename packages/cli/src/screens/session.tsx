import { BotMessage, ErrorMessage, UserMessage } from "@/components/messages"
import { SessionShell } from "@/components/messages/session-shell"
import { apiClient } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/http-error"
import { useToast } from "@/providers/toast"
import type { InferResponseType } from "hono"
import { useEffect, useMemo, useState } from "react"
import { useParams, useLocation, useNavigate } from "react-router"
import z from "zod"

type SessionData = InferResponseType<(typeof apiClient.session)[":id"]["$get"], 200>

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val !== null && typeof val === "object" && "id" in val)
})

const ChatMessage = ({ message }: { message: SessionData["messages"][number] }) => {
    if (message.role === "USER") {
        return <UserMessage message={message.content} />
    }
    if (message.role === "ERROR") {
        return <ErrorMessage message={message.content} />
    }
    return <BotMessage content={message.content} model={message.model} />
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

    return (
        <SessionShell onSubmit={() => {}} inputDisabled>
            {session.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
            ))}
        </SessionShell>
    )
}
