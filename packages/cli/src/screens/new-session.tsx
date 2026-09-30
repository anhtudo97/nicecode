import { UserMessage } from "@/components/messages"
import { SessionShell } from "@/components/messages/session-shell"
import { apiClient } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/http-error"
import { useToast } from "@/providers/toast"
import { DEFAULT_CHAT_MODEL_ID } from "@nicecode/shared"
import { useEffect, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"
import { z } from "zod"

const newSessionStateSchema = z.object({
    message: z.string()
})

export const NewSession = () => {
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const hasStartedRef = useRef(false)

    const state = useMemo(() => {
        const parsed = newSessionStateSchema.safeParse(location.state)
        return parsed.success ? parsed.data : null
    }, [location.state])

    useEffect(() => {
        if (!state || hasStartedRef.current) return

        hasStartedRef.current = true

        let ignore = false
        const createSession = async () => {
            if (ignore) return
            try {
                const response = await apiClient.session.$post({
                    json: {
                        title: state.message.slice(0, 100),
                        cwd: process.cwd(),
                        initialMessage: {
                            role: "USER",
                            content: state.message,
                            mode: "BUILD",
                            model: DEFAULT_CHAT_MODEL_ID
                        }
                    }
                })

                if (ignore) return
                if (!response.ok) {
                    throw new Error(await getErrorMessage(response))
                }

                const session = await response.json()
                navigate(`/session/${session.id}`, { replace: true, state: { session } })
            } catch (error) {
                if (ignore) return
                toast.show({
                    variant: "error",
                    message:
                        error instanceof Error ? error.message : "Error when creating a new session"
                })

                navigate("/", { replace: true })
            }
        }
        createSession()
        return () => {
            ignore = true
        }
    }, [navigate, state, toast])

    useEffect(() => {
        if (!state) {
            navigate("/", { replace: true })
        }
    }, [state, navigate])

    if (!state) {
        return null
    }

    return (
        <SessionShell onSubmit={() => {}} inputDisabled loading>
            <UserMessage message={state.message} />
        </SessionShell>
    )
}
