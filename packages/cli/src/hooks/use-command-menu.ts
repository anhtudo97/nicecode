import type { ScrollBoxRenderable } from "@opentui/core"
import type { Command } from "../components/command-menu/types"
import { useMemo, useRef, useState, type RefObject } from "react"
import { getFilteredCommands } from "../components/command-menu/filter-commands"
import { useKeyboard } from "@opentui/react"

type UseCommandMenuReturn = {
    showCommandMenu: boolean
    commandQuery: string
    selectedIndex: number
    scrollRef: RefObject<ScrollBoxRenderable | null>
    handleContentChange: (content: string) => void
    resolveCommand: (index: number) => Command | undefined
    setSelectedIndex: (index: number) => void
}

export function useCommandMenu(): UseCommandMenuReturn {
    const [textValue, setTextValue] = useState("")
    const [showCommandMenu, setShowCommandMenu] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollRef = useRef<ScrollBoxRenderable | null>(null)

    const commandQuery = showCommandMenu && textValue.startsWith("/") ? textValue.slice(1) : ""

    const filteredCommands = useMemo(() => {
        return getFilteredCommands(commandQuery)
    }, [commandQuery])

    const handleContentChange = (content: string) => {
        setTextValue(content)
        setSelectedIndex(0)

        const scrollbox = scrollRef.current
        if (scrollbox) {
            scrollbox.scrollTo(0)
        }

        const prefix = content.startsWith("/") ? content.slice(1) : null

        setShowCommandMenu(prefix !== null && !prefix.includes(" "))
    }

    const resolveCommand = (index: number): Command | undefined => {
        const command = filteredCommands[index]
        if (command) {
            setShowCommandMenu(false)
        }
        return command
    }

    useKeyboard((key) => {
        if (!showCommandMenu) return

        if (key.name === "escape") {
            key.preventDefault()
            setShowCommandMenu(false)
        } else if (key.name === "up") {
            key.preventDefault()
            setSelectedIndex((prevIndex) => {
                const newIndex = Math.max(prevIndex - 1, 0)

                const sb = scrollRef.current
                if (sb && newIndex < sb.scrollTop) {
                    sb.scrollTo(newIndex)
                }
                return newIndex
            })
        } else if (key.name === "down") {
            key.preventDefault()
            setSelectedIndex((prevIndex) => {
                if (filteredCommands.length === 0) return 0

                const newIndex = Math.min(prevIndex + 1, filteredCommands.length - 1)
                const sb = scrollRef.current
                if (sb) {
                    const viewportHeight = sb.scrollTop + sb.height
                    const visibleEnd = sb.scrollTop + viewportHeight - 1

                    if (newIndex > visibleEnd) {
                        sb.scrollTo(newIndex - viewportHeight + 1)
                    }
                }
                return newIndex
            })
        }
    })

    return {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex
    }
}
