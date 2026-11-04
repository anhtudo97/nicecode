import type { ReactNode } from "react"

export type DialogConfig = {
    title: string
    children: ReactNode
    /** Called whenever the dialog goes away (selection, escape, backdrop click, or replaced). */
    onClose?: () => void
}
