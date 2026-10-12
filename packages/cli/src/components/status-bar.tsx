import { TextAttributes } from "@opentui/core"
import { Box, Text } from "./ui/primitives"
import { useTheme } from "@/providers/theme"
import { usePromptConfig } from "@/providers/prompt-config"
import { Mode } from "@nicecode/database/enums"

export function StatusBar() {
    const { colors } = useTheme()
    const { mode, model } = usePromptConfig()
    return (
        <Box flexDirection="row" gap={1}>
            <Text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
                {mode === "BUILD" ? "Build" : "Plan"}
            </Text>
            <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                {"›"}
            </Text>
            <Text>{model}</Text>
        </Box>
    )
}
