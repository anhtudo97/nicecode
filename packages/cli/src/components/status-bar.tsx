import { TextAttributes } from "@opentui/core"
import { useTheme } from "../providers/theme"
import { usePromptConfig } from "../providers/prompt-config"
import { Mode } from "@nicecode/shared"
import { Box, Text } from "@/components/ui/primitives"

export const StatusBar = () => {
    const { mode, model } = usePromptConfig()
    const { colors } = useTheme()

    return (
        <Box flexDirection="row" gap={1}>
            <Text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
                {mode === Mode.PLAN ? "Plan" : "Build"}
            </Text>

            <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                ›
            </Text>
            <text>{model}</text>
        </Box>
    )
}
