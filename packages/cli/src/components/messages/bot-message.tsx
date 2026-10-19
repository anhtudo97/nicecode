import { EmptyBorder } from "@/components/border"
import { Box, Text } from "@/components/ui/primitives"
import type { ClientMessagePart, ClientToolCallPart } from "@/hooks/use-chat"
import { useTheme } from "@/providers/theme"
import { Mode } from "@nicecode/database/enums"
import { TextAttributes } from "@opentui/core"

type Props = {
    parts: ClientMessagePart[]
    model: string
    mode: Mode
    duration?: string
    streaming?: boolean
    interrupted?: boolean
}

const formatToolName = (name: string) => {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (str) => str.toUpperCase())
}

const formatToolArgs = (tc: ClientToolCallPart) => {
    return Object.values(tc.args).map(String).join(" ")
}

type PartGroup = {
    type: ClientMessagePart["type"]
    parts: ClientMessagePart[]
    key: string
}

const groupConsencutiveParts = (parts: ClientMessagePart[]): PartGroup[] => {
    const groups: PartGroup[] = []

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        const lastGroup = groups.at(-1)

        if (lastGroup && lastGroup.type === part.type) {
            lastGroup.parts.push(part)
        } else {
            const key =
                part.type === "tool-call" ? `group-tc-${part.id}` : `group-${part.type}-${i}`
            groups.push({
                type: part.type,
                parts: [part],
                key
            })
        }
    }

    return groups
}

export const BotMessage = ({ parts, model, mode, duration, interrupted = false }: Props) => {
    const { colors } = useTheme()
    const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("")

    return (
        <Box width="100%" alignItems="center">
            {groupConsencutiveParts(parts).map((group) => (
                <Box key={group.key} width="100%" paddingY={1}>
                    {group.parts.map((part, j) => {
                        if (part.type === "reasoning") {
                            return (
                                <Box
                                    key={`reasoning-${j}`}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{
                                        ...EmptyBorder,
                                        vertical: "|"
                                    }}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <Text attributes={TextAttributes.DIM}>
                                        <em fg={colors.thinking}>Thinking:</em> {part.text}
                                    </Text>
                                </Box>
                            )
                        }
                        if (part.type === "tool-call") {
                            return (
                                <Box
                                    key={part.id}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{
                                        ...EmptyBorder,
                                        vertical: "|"
                                    }}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <Text attributes={TextAttributes.DIM}>
                                        <em fg={colors.info}>{formatToolName(part.name)}</em>
                                        {formatToolArgs(part)}
                                        {part.status === "calling" ? " ..." : ""}
                                    </Text>
                                </Box>
                            )
                        }

                        if (part.type === "text") {
                            return (
                                <Box key={`text-${j}`} width="100%" paddingX={3}>
                                    <Text>{part.text}</Text>
                                </Box>
                            )
                        }

                        return null
                    })}
                </Box>
            ))}

            <Box paddingX={3} paddingBottom={1} gap={1} width="100%">
                <Box flexDirection="row" gap={2}>
                    <Text
                        attributes={interrupted ? TextAttributes.DIM : 0}
                        fg={
                            interrupted
                                ? undefined
                                : mode === Mode.PLAN
                                  ? colors.planMode
                                  : colors.primary
                        }
                    >
                        ◉
                    </Text>
                    <Box flexDirection="row" gap={1}>
                        <Text attributes={interrupted ? TextAttributes.DIM : 0}>
                            {mode === Mode.PLAN ? "Plan" : "Build"}
                        </Text>
                        <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                            ›
                        </Text>
                        <Text attributes={TextAttributes.DIM}>{model}</Text>
                        {(duration || interrupted) && (
                            <>
                                <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                                    ›
                                </Text>
                                <Text attributes={TextAttributes.DIM}>
                                    {interrupted ? "interrupted" : duration}
                                </Text>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
