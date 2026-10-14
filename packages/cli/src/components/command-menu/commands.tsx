import { Text } from "@/components/ui/primitives"
import {
    SessionDialogContent,
    ThemeDialogContent,
    AgentsDialogContent,
    ModelsDialogContent
} from "@/dialogs"
import type { Command } from "./types"
import { Mode } from "@nicecode/database"
import { SUPPORTED_CHAT_MODELS } from "@nicecode/shared"

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx) => {
            ctx.navigate("/")
        }
    },
    {
        name: "agents",
        description: "Manage your agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Agents",
                children: <AgentsDialogContent currentMode={ctx.mode} onSelectMode={ctx.setMode} />
            })
        }
    },
    {
        name: "models",
        description: "Manage your models",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Models",
                children: (
                    <ModelsDialogContent
                        models={SUPPORTED_CHAT_MODELS.map((m) => m.id)}
                        onSelectModel={ctx.setModel}
                    />
                )
            })
        }
    },
    {
        name: "sessions",
        description: "Manage your sessions",
        value: "/sessions",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Sessions",
                children: <SessionDialogContent />
            })
        }
    },
    {
        name: "theme",
        description: "Change the application theme",
        value: "/theme",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Change Theme",
                children: <ThemeDialogContent />
            })
        }
    },
    {
        name: "login",
        description: "Log in to the application",
        value: "/login",
        action: (ctx) => {
            ctx.toast.show({ message: "Logging in ...", variant: "info" })
        }
    },
    {
        name: "logout",
        description: "Log out of the application",
        value: "/logout",
        action: (ctx) => {
            ctx.toast.show({ message: "Logging out ...", variant: "info" })
        }
    },
    {
        name: "upgrade",
        description: "Upgrade the application",
        value: "/upgrade",
        action: (ctx) => {
            ctx.toast.show({ message: "Upgrading the application ...", variant: "info" })
        }
    },
    {
        name: "usage",
        description: "Show usage information",
        value: "/usage",
        action: (ctx) => {
            ctx.toast.show({ message: "Showing usage information ...", variant: "info" })
        }
    },
    {
        name: "exit",
        description: "Exit the application",
        value: "/exit",
        action: (ctx) => {
            ctx.exit()
        }
    }
]
