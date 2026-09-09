import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core"
import { COMMANDS } from "./commands"
import type { RefObject } from "react"
import { getFilteredCommands } from "./filter-commands"
import { Box, Scrollbox, Text } from "../ui/primitives"

const MAX_VISIBLE_COMMANDS = 8

const COMMAND_COL_WIDTH = Math.max(...COMMANDS.map((command) => command.name.length)) + 4

type CommandMenuProps = {
    query: string
    selectedIndex: number
    scrollRef: RefObject<ScrollBoxRenderable | null>
    onSelect: (index: number) => void
    onExecute: (index: number) => void
}

export const CommandMenu = ({
    query,
    selectedIndex,
    scrollRef,
    onSelect,
    onExecute
}: CommandMenuProps) => {
    const filtered = getFilteredCommands(query)
    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_COMMANDS)

    if (filtered.length === 0) {
        return (
            <Box paddingX={1}>
                <Text attributes={TextAttributes.DIM}>No commands found.</Text>
            </Box>
        )
    }

    return (
        <Scrollbox ref={scrollRef} height={visibleHeight}>
            {filtered.map((command, index) => {
                const isSelected = index === selectedIndex
                return (
                    <Box
                        key={command.value}
                        flexDirection="row"
                        paddingX={1}
                        height={1}
                        overflow="hidden"
                        backgroundColor={isSelected ? "#89B4FA" : undefined}
                        onMouseMove={() => onSelect(index)}
                        onMouseDown={() => onExecute(index)}
                    >
                        <Box width={COMMAND_COL_WIDTH} flexShrink={0}>
                            <Text selectable={false} fg={isSelected ? "black" : "white"}>
                                /{command.name}
                            </Text>
                        </Box>
                        <Box flexGrow={1} flexShrink={1} overflow="hidden">
                            <Text selectable={false} fg={isSelected ? "black" : "gray"}>
                                {command.description}
                            </Text>
                        </Box>
                    </Box>
                )
            })}
        </Scrollbox>
    )
}
