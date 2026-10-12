import type { KeyBinding, TextareaRenderable } from "@opentui/core"
import { useTheme } from "@/providers/theme"
import { useDialog } from "@/providers/dialog"
import { usePromptConfig } from "@/providers/prompt-config"
import { useKeyboard, useRenderer } from "@opentui/react"
import { useCallback, useEffect, useRef } from "react"
import { SplitBorder } from "./border"
import { StatusBar } from "./status-bar"
import { Box, Textarea } from "./ui/primitives"
import { useCommandMenu } from "../hooks/use-command-menu"
import type { Command } from "./command-menu/types"
import { CommandMenu } from "./command-menu"
import { useToast } from "@/providers/toast"
import { useKeyboardLayer } from "@/providers/keyboard-layer"
import { useNavigate } from "react-router"
import { Mode } from "@nicecode/database/enums"

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
    const { mode, model, setMode, setModel, toggleMode } = usePromptConfig()
    const textareaRef = useRef<TextareaRenderable>(null)
    const onSubmitRef = useRef<() => void>(() => {})
    const renderer = useRenderer()
    const toast = useToast()
    const dialog = useDialog()
    const { colors } = useTheme()
    const navigate = useNavigate()

    const { isTopLayer, setResponder } = useKeyboardLayer()

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
    }, [handleContentChange])

    const handleCommand = useCallback(
        (command: Command | undefined) => {
            const textarea = textareaRef.current
            if (!textarea || !command) return

            textarea.setText("")

            if (command.action) {
                command.action({
                    exit: () => renderer.destroy(),
                    toast,
                    dialog,
                    navigate,
                    mode,
                    setMode,
                    setModel
                })
            } else {
                textarea.insertText(command.value + " ")
            }
        },
        [toast, dialog, navigate, mode, setMode, setModel, renderer]
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

    useKeyboard((key) => {
        if (disabled) return
        if (isTopLayer("base")) return
        if (key.name === "tab") {
            key.preventDefault()
            toggleMode()
        }
    })

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        textarea.onSubmit = () => {
            onSubmitRef.current()
        }
    }, [])

    // Register the base layer responder for ctrl+c
    useEffect(() => {
        setResponder("base", () => {
            if (disabled) return false

            const textarea = textareaRef.current
            if (textarea && textarea.plainText.length > 0) {
                textarea.setText("")
                return true
            }
            return false
        })

        return () => setResponder("base", null)
    }, [disabled, setResponder])

    return (
        <Box width="100%" alignItems="center">
            <Box
                {...SplitBorder}
                border={["left"]}
                borderColor={mode === Mode.PLAN ? colors.planMode : colors.primary}
                width="100%"
            >
                <Box
                    position="relative"
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
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
                            backgroundColor={colors.surface}
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
                        focused={!disabled && (isTopLayer("base") || isTopLayer("command"))}
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
