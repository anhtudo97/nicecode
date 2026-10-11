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
                <ToastProvider>
                    <DialogProvider>
                        <ThemedRoot>
                            <Outlet />
                        </ThemedRoot>
                    </DialogProvider>
                </ToastProvider>
            </ThemeProvider>
        </KeyboardLayerProvider>
    )
}
