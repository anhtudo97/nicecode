import { useLocation, useNavigate } from "react-router"
import { useTheme } from "@/providers/theme"
import { useEffect } from "react"
import { Box, Text } from "@/components/ui/primitives"
import { ErrorMessage } from "@/components/messages"

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
        <Box flexGrow={1} padding={2} flexDirection="column" gap={1}>
            <Text>Create a new session</Text>
            <Text>{state.message}</Text>
            <ErrorMessage message={state.message} />
        </Box>
    )
}
