import { Header } from "@/components/header"
import { InputBar } from "@/components/input-bar"
import { useCallback } from "react"
import { Box } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"
import { useNavigate } from "react-router"

export const Home = () => {
    const { colors } = useTheme()

    const navigate = useNavigate()

    const handleSubmit = useCallback(
        (value: string) => {
            navigate("/session/new", { state: { message: value } })
        },
        [navigate]
    )

    return (
        <Box
            position="relative"
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.background}
            width="100%"
            height="100%"
            gap={2}
            flexGrow={1}
        >
            <Header />
            <Box width="100%" maxWidth={78} paddingX={2}>
                <InputBar onSubmit={handleSubmit} />
            </Box>
        </Box>
    )
}
