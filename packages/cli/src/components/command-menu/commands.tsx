import { Text } from "@/components/ui/primitives"
import type { Command } from "./types"

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx) => {
            ctx.toast.show({ message: "Starting a new conversation ...", variant: "info" })
        }
    },
    {
        name: "agents",
        description: "Manage your agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Manage Agents",
                children: <Text>Manage your agents here</Text>
            })
        }
    },
    {
        name: "models",
        description: "Manage your models",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Manage Models",
                children: <Text>Manage your models here</Text>
            })
        }
    },
    {
        name: "sessions",
        description: "Manage your sessions",
        value: "/sessions",
        action: (ctx) => {
            ctx.toast.show({ message: "Managing your sessions ...", variant: "info" })
        }
    },
    {
        name: "theme",
        description: "Change the application theme",
        value: "/theme",
        action: (ctx) => {
            ctx.toast.show({ message: "Changing the application theme ...", variant: "info" })
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
