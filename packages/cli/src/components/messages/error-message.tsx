import { SplitBorder } from "@/components/border"
import { Box, Text } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"
import { TextAttributes } from "@opentui/core"

type Props = {
    message: string
}

export const ErrorMessage = ({ message }: Props) => {
    const { colors } = useTheme()

    return (
        <Box width="100%" alignItems="center">
            <Box backgroundColor={colors.error} width="100%" {...SplitBorder} border={["left"]}>
                <Box
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <Text attributes={TextAttributes.DIM}>{message}</Text>
                </Box>
            </Box>
        </Box>
    )
}
