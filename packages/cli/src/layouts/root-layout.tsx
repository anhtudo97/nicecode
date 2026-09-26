import { ThemedRoot } from "@/layouts/theme-root"
import { DialogProvider } from "@/providers/dialog"
import { KeyboardLayerProvider } from "@/providers/keyboard-layer"
import { ThemeProvider } from "@/providers/theme"
import { ToastProvider } from "@/providers/toast"
import { Outlet } from "react-router"

export const RootLayout = () => {
    return (
        <KeyboardLayerProvider>
            <ThemeProvider>
                <DialogProvider>
                    <ToastProvider>
                        <ThemedRoot>
                            <Outlet />
                        </ThemedRoot>
                    </ToastProvider>
                </DialogProvider>
            </ThemeProvider>
        </KeyboardLayerProvider>
    )
}
