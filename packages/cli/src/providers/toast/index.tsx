import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { DEFAULT_DURATION, type ToastOptions, type ToastVariant } from "./types"
import { useTerminalDimensions } from "@opentui/react"
import { Box, Text } from "@/components/ui/primitives"

export type ToastContextValue = {
    show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}

type ToastProviderProps = {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null)
    const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null)

    const clearCurrentTimeout = useCallback(() => {
        if (timeoutHandleRef.current) {
            clearTimeout(timeoutHandleRef.current)
            timeoutHandleRef.current = null
        }
    }, [])

    const show = useCallback(
        (options: ToastOptions) => {
            const duration = options.duration ?? DEFAULT_DURATION

            clearCurrentTimeout()

            setCurrentToast({
                variant: options.variant ?? "info",
                ...options,
                duration
            })

            timeoutHandleRef.current = setTimeout(() => {
                setCurrentToast(null)
            }, duration).unref()
        },
        [clearCurrentTimeout]
    )

    const value: ToastContextValue = { show }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast currentToast={currentToast} />
        </ToastContext.Provider>
    )
}

type ToastProps = {
    currentToast: ToastOptions | null
}

function Toast({ currentToast }: ToastProps) {
    const { width } = useTerminalDimensions()

    if (!currentToast) return null

    const variantColors: Record<ToastVariant, string> = {
        success: "#82E0AA",
        error: "#E74C5E",
        info: "#56D6D2"
    }

    const borderColor = currentToast.variant
        ? variantColors[currentToast.variant]
        : variantColors.info

    return (
        <Box
            position="absolute"
            justifyContent="center"
            alignItems="center"
            top={2}
            right={2}
            width={Math.max(1, Math.min(width - 6, 60))}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
            backgroundColor="#1A1A24"
            borderColor={borderColor}
            border={["right", "left"]}
        >
            <Box flexDirection="column" gap={1} width="100%">
                <Text fg="#E1E1E1" wrapMode="word" width="100%">
                    {currentToast.message}
                </Text>
            </Box>
        </Box>
    )
}
