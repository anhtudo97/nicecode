import { ThemedRoot } from "@/layouts/theme-root"
import { DialogProvider } from "@/providers/dialog"
import { KeyboardLayerProvider } from "@/providers/keyboard-layer"
import { PromptConfigProvider } from "@/providers/prompt-config"
import { ThemeProvider } from "@/providers/theme"
import { ToastProvider } from "@/providers/toast"
import { Outlet } from "react-router"

export const RootLayout = () => {
    return (
        <KeyboardLayerProvider>
            <ThemeProvider>
                <ToastProvider>
                    <DialogProvider>
                        <PromptConfigProvider>
                            <ThemedRoot>
                                <Outlet />
                            </ThemedRoot>
                        </PromptConfigProvider>
                    </DialogProvider>
                </ToastProvider>
            </ThemeProvider>
        </KeyboardLayerProvider>
    )
}
