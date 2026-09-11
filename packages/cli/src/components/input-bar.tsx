import type { KeyBinding, TextareaRenderable } from "@opentui/core"
import { useRenderer } from "@opentui/react"
import { useCallback, useEffect, useRef } from "react"
import { SplitBorder } from "./border"
import { StatusBar } from "./status-bar"
import { Box, Textarea } from "./ui/primitives"
import { useCommandMenu } from "../hooks/use-command-menu"
import type { Command } from "./command-menu/types"
import { CommandMenu } from "./command-menu"

type InputBarProps = {
    onSubmit: (value: string) => void
    disabled?: boolean
}

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
    { name: "return", action: "submit" },
    { name: "enter", action: "submit" },
    { name: "return", shift: true, action: "newline" },
    { name: "enter", shift: true, action: "newline" }
]

export function InputBar({ onSubmit, disabled }: InputBarProps) {
    const textareaRef = useRef<TextareaRenderable>(null)
    const onSubmitRef = useRef<() => void>(() => {})
    const renderer = useRenderer()

    const {
        showCommandMenu,
        selectedIndex,
        resolveCommand,
        handleContentChange,
        commandQuery,
        scrollRef,
        setSelectedIndex
    } = useCommandMenu()

    const handleTextareaContentChange = useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        handleContentChange(textarea.plainText)
    }, [])

    const handleCommand = useCallback(
        (command: Command | undefined) => {
            const textarea = textareaRef.current
            if (!textarea || !command) return

            textarea.setText("")

            if (command.action) {
                command.action({
                    exit: () => renderer.destroy()
                })
            } else {
                textarea.insertText(command.value + " ")
            }
        },
        [renderer]
    )

    const handleSubmit = useCallback(() => {
        if (disabled) return

        const textarea = textareaRef.current
        if (!textarea) return

        const value = textarea.plainText.trim()
        if (value.length === 0) return

        onSubmit(value)
        textarea.setText("")
    }, [onSubmit, disabled])

    onSubmitRef.current = () => {
        if (disabled) return

        if (showCommandMenu) {
            const command = resolveCommand(selectedIndex)
            handleCommand(command)
            return
        }

        handleSubmit()
    }

    const handleCommandExecute = useCallback(
        (index: number) => {
            const command = resolveCommand(index)
            handleCommand(command)
        },
        [handleCommand, resolveCommand]
    )

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        textarea.onSubmit = () => {
            onSubmitRef.current()
        }
    }, [])

    return (
        <Box width="100%" alignItems="center">
            <Box {...SplitBorder} border={["left"]} borderColor="cyan">
                <Box
                    position="relative"
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor="#1A1A24"
                    width="100%"
                    minWidth={78}
                    gap={1}
                >
                    {showCommandMenu && (
                        <Box
                            position="absolute"
                            bottom="100%"
                            left={0}
                            width="100%"
                            backgroundColor="#1A1A24"
                            zIndex={10}
                        >
                            <CommandMenu
                                query={commandQuery}
                                selectedIndex={selectedIndex}
                                scrollRef={scrollRef}
                                onSelect={setSelectedIndex}
                                onExecute={handleCommandExecute}
                            />
                        </Box>
                    )}
                    <Textarea
                        ref={textareaRef}
                        focused={!disabled}
                        placeholder={`Ask a question... "Fix a bug in the frontend side"`}
                        keyBindings={TEXTAREA_KEY_BINDINGS}
                        onContentChange={handleTextareaContentChange}
                    />
                    <StatusBar />
                </Box>
            </Box>
        </Box>
    )
}
