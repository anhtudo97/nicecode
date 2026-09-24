import { SplitBorder } from "@/components/border"
import { Box, Text } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"

type Props = {
    message: string
}

export const UserMessage = ({ message }: Props) => {
    const { colors } = useTheme()

    return (
        <Box width="100%" alignItems="center">
            <Box backgroundColor={colors.primary} width="100%" {...SplitBorder} border={["left"]}>
                <Box
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <Text>{message}</Text>
                </Box>
            </Box>
        </Box>
    )
}
