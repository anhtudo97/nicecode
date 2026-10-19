import { Box, Text } from "@/components/ui/primitives"
import { Mode } from "@nicecode/database/enums"
import { useTheme } from "../../providers/theme"
import { EmptyBorder } from "../border"

type Props = {
    message: string
    mode: Mode
}

export function UserMessage({ message, mode }: Props) {
    const { colors } = useTheme()

    return (
        <Box width="100%" alignItems="center">
            <Box
                border={["left"]}
                borderColor={mode === Mode.PLAN ? colors.planMode : colors.primary}
                width="100%"
                customBorderChars={{
                    ...EmptyBorder,
                    vertical: "┃",
                    bottomLeft: "╹"
                }}
            >
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
