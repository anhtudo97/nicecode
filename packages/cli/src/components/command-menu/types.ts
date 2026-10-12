import type { ToastContextValue } from "@/providers/toast"
import type { DialogContextValue } from "@/providers/dialog"
import type { Mode } from "@nicecode/database/enums"
import type { SupportedChatModelId } from "@nicecode/shared"

export type CommandContext = {
    exit: () => void
    toast: ToastContextValue
    dialog: DialogContextValue
    navigate: (path: string) => void
    mode: Mode
    setMode: (mode: Mode) => void
    setModel: (model: SupportedChatModelId) => void
}

export type Command = {
    name: string
    description: string
    value: string
    action?: (ctx: CommandContext) => void
}
