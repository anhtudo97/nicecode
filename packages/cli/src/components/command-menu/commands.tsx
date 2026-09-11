import type { Command } from "./types"

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new"
    },
    {
        name: "agents",
        description: "Manage your agents",
        value: "/agents"
    },
    {
        name: "models",
        description: "Manage your models",
        value: "/models"
    },
    {
        name: "sessions",
        description: "Manage your sessions",
        value: "/sessions"
    },
    {
        name: "theme",
        description: "Change the application theme",
        value: "/theme"
    },
    {
        name: "login",
        description: "Log in to the application",
        value: "/login"
    },
    {
        name: "logout",
        description: "Log out of the application",
        value: "/logout"
    },
    {
        name: "upgrade",
        description: "Upgrade the application",
        value: "/upgrade"
    },
    {
        name: "usage",
        description: "Show usage information",
        value: "/usage"
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
