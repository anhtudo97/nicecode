import { Box, Text } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"

type Props = {
    content: string
    model: string
}

export const BotMessage = ({ content, model }: Props) => {
    const { colors } = useTheme()

    return (
        <Box width="100%" alignItems="center">
            <Box paddingY={1} width="100%">
                <Box paddingX={3} width="100%">
                    <Text>{content}</Text>
                </Box>
            </Box>

            <Box paddingX={3} paddingBottom={1} gap={1} width="100%">
                <Box flexDirection="row" gap={2}>
                    <Text fg={colors.primary}>◉</Text>
                    <Text>{model}</Text>
                </Box>
            </Box>
        </Box>
    )
}
