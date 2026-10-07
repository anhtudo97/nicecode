import { Box, Text } from "@/components/ui/primitives"
import type { ClientMessagePart } from "@/hooks/use-chat"
import { useTheme } from "@/providers/theme"
import { Mode } from "@nicecode/database"
import { TextAttributes } from "@opentui/core"

type Props = {
    parts: ClientMessagePart[]
    model: string
    mode: Mode
    duration?: string
    streaming?: boolean
}

export const BotMessage = ({ parts, model, mode, duration, streaming }: Props) => {
    const { colors } = useTheme()
    const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("")

    return (
        <Box width="100%" alignItems="center">
            <Box paddingY={1} width="100%">
                <Box paddingX={3} width="100%">
                    <Text>{text}</Text>
                </Box>
            </Box>

            <Box paddingX={3} paddingBottom={1} gap={1} width="100%">
                <Box flexDirection="row" gap={2}>
                    <Text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>◉</Text>
                    <Box flexDirection="row" gap={1}>
                        <Text>{mode === Mode.PLAN ? "Plan" : "Build"}</Text>
                        <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                            ›
                        </Text>
                        <Text attributes={TextAttributes.DIM}>{model}</Text>
                        {duration && (
                            <>
                                <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                                    ›
                                </Text>
                                <Text attributes={TextAttributes.DIM}>{duration}</Text>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
