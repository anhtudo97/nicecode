import { useLocation, useNavigate } from "react-router"
import { useTheme } from "@/providers/theme"
import { useEffect } from "react"
import { BotMessage, ErrorMessage, UserMessage } from "@/components/messages"
import { SessionShell } from "@/components/messages/session-shell"

export const NewSession = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { colors } = useTheme()

    const state = location.state as { message?: string } | null

    useEffect(() => {
        if (!state?.message) {
            navigate("/", { replace: true })
        }
    }, [state, navigate])

    if (!state?.message) {
        return null
    }

    return (
        <SessionShell onSubmit={() => {}} inputDisabled loading>
            <UserMessage message={state.message} />
            <BotMessage content="This is a bot message." model="gpt-4" />
            <ErrorMessage message="This is an error message." />
        </SessionShell>
    )
}
