import { Box, Text } from "@/components/ui/primitives"
import type { DialogConfig } from "@/providers/dialog/types"
import { useKeyboardLayer } from "@/providers/keyboard-layer"
import { RGBA, TextAttributes } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type DialogContextValue = {
    open: (config: DialogConfig) => void
    close: () => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export const useDialog = (): DialogContextValue => {
    const context = useContext(DialogContext)
    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider")
    }
    return context
}

type DialogProviderProps = {
    children: React.ReactNode
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
    const [currentDialog, setCurrentDialog] = useState<DialogConfig | null>(null)
    const { pop, push } = useKeyboardLayer()

    const close = useCallback(() => {
        setCurrentDialog(null)
        pop("dialog")
    }, [pop])

    const open = useCallback(
        (config: DialogConfig) => {
            setCurrentDialog(config)
            push("dialog", () => {
                close()
                return true
            })
        },
        [close, push]
    )

    const value = useMemo(() => ({ open, close }), [open, close])

    return (
        <DialogContext.Provider value={value}>
            {children}
            <Dialog currentDialog={currentDialog} close={close} />
        </DialogContext.Provider>
    )
}

type DialogProps = {
    currentDialog: DialogConfig | null
    close: () => void
}

const Dialog = ({ currentDialog, close }: DialogProps) => {
    const { isTopLayer } = useKeyboardLayer()
    const dimensions = useTerminalDimensions()

    useKeyboard((key) => {
        if (!currentDialog || !isTopLayer("dialog")) return

        if (key.name === "escape") {
            close()
        }
    })

    if (!currentDialog) return null

    const { title, children } = currentDialog
    return (
        <Box
            position="absolute"
            left={0}
            top={0}
            width={dimensions.width}
            height={dimensions.height}
            justifyContent="center"
            alignItems="center"
            backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
            zIndex={100}
            onMouseDown={() => close()}
        >
            <Box
                width={Math.min(dimensions.width - 4, 60)}
                height="auto"
                backgroundColor="#1A1A24"
                paddingX={4}
                paddingY={1}
                flexDirection="column"
                gap={1}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Box
                    paddingBottom={1}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Text attributes={TextAttributes.BOLD}>{title}</Text>
                    <Text attributes={TextAttributes.DIM} onMouseDown={() => close()}>
                        esc
                    </Text>
                </Box>
                <Box flexGrow={1}>{children}</Box>
            </Box>
        </Box>
    )
}
