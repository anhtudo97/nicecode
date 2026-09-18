import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { Header } from "@/components/header"
import { InputBar } from "@/components/input-bar"
import { Box } from "@/components/ui/primitives"
import { ToastProvider } from "@/providers/toast"
import { KeyboardLayerProvider } from "@/providers/keyboard-layer"
import { DialogProvider } from "@/providers/dialog"
import { ThemeProvider, useTheme } from "@/providers/theme"

const ThemedRoot = () => {
    const { colors } = useTheme()

    return (
        <Box
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.background}
            width="100%"
            height="100%"
            gap={2}
        >
            <Header />
            <Box width="100%" maxWidth={78} paddingX={2}>
                <InputBar onSubmit={() => {}} />
            </Box>
        </Box>
    )
}

function App() {
    return (
        <KeyboardLayerProvider>
            <ThemeProvider>
                <DialogProvider>
                    <ToastProvider>
                        <ThemedRoot />
                    </ToastProvider>
                </DialogProvider>
            </ThemeProvider>
        </KeyboardLayerProvider>
    )
}

const renderer = await createCliRenderer({
    targetFps: 60,
    exitOnCtrlC: false
})
createRoot(renderer).render(<App />)
