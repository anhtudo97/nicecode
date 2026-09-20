import { Box, Input, Scrollbox, Text } from "@/components/ui/primitives"
import { useKeyboardLayer } from "@/providers/keyboard-layer"
import { TextAttributes, type InputRenderable, type ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"

const MAX_VISIBLE_ITEMS = 6

type DialogSearchListProps<T> = {
    items: T[]
    onSelect: (item: T) => void
    onHighlight: (item: T) => void
    filterFn: (item: T, query: string) => boolean
    renderItem: (item: T, isSelected: boolean) => ReactNode
    getKey: (item: T) => string
    placeholder?: string
    emptyText?: string
}

export const DialogSearchList = <T,>({
    items,
    onSelect,
    onHighlight,
    filterFn,
    renderItem,
    getKey,
    placeholder,
    emptyText
}: DialogSearchListProps<T>) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [searchValue, setSearchValue] = useState("")
    const inputRef = useRef<InputRenderable>(null)
    const scrollRef = useRef<ScrollBoxRenderable>(null)
    const { isTopLayer } = useKeyboardLayer()
    // const { colors } = useTheme()

    const handleContentChange = useCallback(() => {
        const text = inputRef.current?.value ?? ""
        setSearchValue(text)
        setSelectedIndex(0)
    }, [])

    const filtered = useMemo(() => {
        if (!searchValue) {
            return items
        }
        return items.filter((item) => filterFn(item, searchValue))
    }, [filterFn, items, searchValue])

    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_ITEMS)

    // Follow the selected row in the same commit as the highlight move, instead of
    // calling scrollTo() imperatively before selectedIndex is even set (which could
    // paint the scroll shift a step ahead of the highlight and read as jank)
    useLayoutEffect(() => {
        const sb = scrollRef.current
        if (!sb) return
        if (selectedIndex < sb.scrollTop) {
            sb.scrollTo(selectedIndex)
            return
        }
        const viewportHeight = sb.viewport.height
        const visibleEnd = sb.scrollTop + viewportHeight - 1
        if (selectedIndex > visibleEnd) {
            sb.scrollTo(selectedIndex - viewportHeight + 1)
        }
    }, [selectedIndex])

    useKeyboard((key) => {
        if (!isTopLayer("dialog")) return

        if (key.name === "return" || key.name === "enter") {
            const selectedItem = filtered[selectedIndex]
            if (selectedItem) {
                onSelect(selectedItem)
            }
        } else if (key.name === "up") {
            const nextIndex = Math.max(selectedIndex - 1, 0)
            setSelectedIndex(nextIndex)
            const item = filtered[nextIndex]
            if (item && onHighlight) {
                onHighlight(item)
            }
        } else if (key.name === "down") {
            const nextIndex = Math.min(selectedIndex + 1, filtered.length - 1)
            setSelectedIndex(nextIndex)
            const item = filtered[nextIndex]
            if (item && onHighlight) {
                onHighlight(item)
            }
        }
    })

    return (
        <Box flexDirection="column" gap={1}>
            <Input
                ref={inputRef}
                placeholder={placeholder}
                focused
                onChange={handleContentChange}
            />
            {filtered.length === 0 ? (
                <Text attributes={TextAttributes.DIM}>{emptyText}</Text>
            ) : (
                <Scrollbox ref={scrollRef} height={visibleHeight}>
                    {filtered.map((item, index) => {
                        const isSeclected = index === selectedIndex
                        return (
                            <Box
                                key={getKey(item)}
                                flexDirection="row"
                                height={1}
                                overflow="hidden"
                                backgroundColor={isSeclected ? "#89B4FA" : undefined}
                                onMouseMove={() => {
                                    setSelectedIndex(index)
                                    if (onHighlight) {
                                        onHighlight(item)
                                    }
                                }}
                                onMouseDown={() => onSelect(item)}
                            >
                                {renderItem(item, isSeclected)}
                            </Box>
                        )
                    })}
                </Scrollbox>
            )}
        </Box>
    )
}
