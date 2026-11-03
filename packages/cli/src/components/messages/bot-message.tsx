import { Box, Text } from "@/components/ui/primitives"
import { Mode, type ModeType } from "@nicecode/shared"
import { TextAttributes } from "@opentui/core"
import prettyMs from "pretty-ms"
import type { Message } from "../../hooks/use-chat"
import { useTheme } from "../../providers/theme"
import { EmptyBorder } from "../border"

type ClientMessagePart = Message["parts"][number]
type ToolPart = Extract<ClientMessagePart, { type: `tool-${string}` | "dynamic-tool" }>

type Props = {
    parts: ClientMessagePart[]
    model: string
    mode: ModeType
    durationMs?: number
    streaming?: boolean
}

function formatToolName(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
}

function isToolPart(part: ClientMessagePart): part is ToolPart {
    return part.type === "dynamic-tool" || part.type.startsWith("tool-")
}

function formatToolArgs(tc: ToolPart): string {
    if (!("input" in tc) || tc.input == null) return ""
    if (typeof tc.input !== "object") return String(tc.input)
    return Object.values(tc.input).map(String).join(" ")
}

type PartGroup = {
    type: ClientMessagePart["type"]
    parts: ClientMessagePart[]
    key: string
}

function groupConsecutiveParts(parts: ClientMessagePart[]): PartGroup[] {
    const groups: PartGroup[] = []

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        const lastGroup = groups[groups.length - 1]

        if (lastGroup && lastGroup.type === part.type) {
            lastGroup.parts.push(part)
        } else {
            const key = isToolPart(part) ? `group-tc-${part.toolCallId}` : `group-${part.type}-${i}`
            groups.push({ type: part.type, parts: [part], key })
        }
    }

    return groups
}

export const BotMessage = ({ parts, model, mode, durationMs }: Props) => {
    const { colors } = useTheme()
    return (
        <Box width="100%" alignItems="center">
            {groupConsecutiveParts(parts).map((group, i) => (
                <Box key={group.key} width="100%" paddingTop={i === 0 ? 0 : 1}>
                    {group.parts.map((part, j) => {
                        if (part.type === "reasoning") {
                            return (
                                <Box
                                    key={`reasoning-${j}`}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{
                                        ...EmptyBorder,
                                        vertical: "│"
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

                        if (isToolPart(part)) {
                            const toolName =
                                part.type === "dynamic-tool"
                                    ? part.toolName
                                    : part.type.slice("tool-".length)

                            return (
                                <Box
                                    key={part.toolCallId}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{
                                        ...EmptyBorder,
                                        vertical: "│"
                                    }}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <Text attributes={TextAttributes.DIM}>
                                        <em fg={colors.info}>{formatToolName(toolName)}:</em>{" "}
                                        {formatToolArgs(part)}
                                        {part.state !== "output-available" &&
                                        part.state !== "output-error"
                                            ? " …"
                                            : ""}
                                        {part.state === "output-error" ? ` ${part.errorText}` : ""}
                                    </Text>
                                </Box>
                            )
                        }

                        if (part.type === "text") {
                            return (
                                <Box key={`text-${j}`} paddingX={3} width="100%">
                                    <Text>{part.text}</Text>
                                </Box>
                            )
                        }

                        return null
                    })}
                </Box>
            ))}

            <Box paddingX={3} paddingY={1} gap={1} width="100%">
                <Box flexDirection="row" gap={2}>
                    <Text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>◉</Text>
                    <Box flexDirection="row" gap={1}>
                        <Text>{mode === Mode.PLAN ? "Plan" : "Build"}</Text>
                        <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                            ›
                        </Text>
                        <Text attributes={TextAttributes.DIM}>{model}</Text>
                        {durationMs != null && (
                            <>
                                <Text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                                    ›
                                </Text>
                                <Text attributes={TextAttributes.DIM}>{prettyMs(durationMs)}</Text>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
