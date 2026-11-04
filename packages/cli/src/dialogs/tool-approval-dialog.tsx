import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { Box, Text } from "@/components/ui/primitives"
import { useKeyboardLayer } from "@/providers/keyboard-layer"
import { useTheme } from "@/providers/theme"

export type ToolApprovalChoice = "once" | "session" | "deny"

const OPTIONS: { choice: ToolApprovalChoice; label: string }[] = [
    { choice: "once", label: "Allow once" },
    { choice: "session", label: "Allow for this session" },
    { choice: "deny", label: "Deny" }
]

type ToolApprovalDialogContentProps = {
    summary: string
    onChoose: (choice: ToolApprovalChoice) => void
}

/** Asks the user to approve a model-requested tool call (shell command or file change). */
export const ToolApprovalDialogContent = ({
    summary,
    onChoose
}: ToolApprovalDialogContentProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const { isTopLayer } = useKeyboardLayer()
    const { colors } = useTheme()

    useKeyboard((key) => {
        if (!isTopLayer("dialog")) return

        if (key.name === "up") {
            setSelectedIndex((index) => Math.max(index - 1, 0))
        } else if (key.name === "down") {
            setSelectedIndex((index) => Math.min(index + 1, OPTIONS.length - 1))
        } else if (key.name === "return" || key.name === "enter") {
            onChoose(OPTIONS[selectedIndex]!.choice)
        }
    })

    return (
        <Box flexDirection="column" gap={1}>
            <Text>{summary}</Text>
            <Box flexDirection="column">
                {OPTIONS.map((option, index) => (
                    <Box
                        key={option.choice}
                        height={1}
                        backgroundColor={index === selectedIndex ? colors.selection : undefined}
                        onMouseMove={() => setSelectedIndex(index)}
                        onMouseDown={() => onChoose(option.choice)}
                    >
                        <Text selectable={false} fg={index === selectedIndex ? "black" : "white"}>
                            {index === selectedIndex ? " > " : "   "}
                            {option.label}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
