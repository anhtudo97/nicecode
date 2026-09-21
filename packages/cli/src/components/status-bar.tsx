import { TextAttributes } from "@opentui/core"
import { Box, Text } from "./ui/primitives"
import { useTheme } from "@/providers/theme"

export function StatusBar() {
    const { colors } = useTheme()
    return (
        <Box flexDirection="row" gap={1}>
            <Text fg={colors.primary}>Build</Text>
            <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                {"›"}
            </Text>
            <Text>opus-4-6</Text>
        </Box>
    )
}
