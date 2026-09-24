import { SplitBorder } from "@/components/border"
import { Box, Text } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"

type Props = {
    message: string
    model: string
}

export const BotMessage = ({ message, model }: Props) => {
    const { colors } = useTheme()

    return (
        <Box width="100%" alignItems="center">
            <Box paddingY={1} width="100%" backgroundColor={colors.surface}>
                <Box paddingX={3} width="100%">
                    <Text>{message}</Text>
                </Box>
            </Box>

            <Box paddingY={3} paddingBottom={1} gap={1} width="100%">
                <Box flexDirection="row" gap={2}>
                    <Text fg={colors.primary}>◉</Text>
                    <Text>{model}</Text>
                </Box>
            </Box>
        </Box>
    )
}
