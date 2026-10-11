import type { ToastContextValue } from "@/providers/toast"
import type { DialogContextValue } from "@/providers/dialog"

export type CommandContext = {
    exit: () => void
    toast: ToastContextValue
    dialog: DialogContextValue
    navigate: (path: string) => void
}

export type Command = {
    name: string
    description: string
    value: string
    action?: (ctx: CommandContext) => void
}
