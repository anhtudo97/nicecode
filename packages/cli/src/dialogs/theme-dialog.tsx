import { DialogSearchList } from "@/components/dialog-search-list"
import { Text } from "@/components/ui/primitives"
import { useDialog } from "@/providers/dialog"
import { useTheme } from "@/providers/theme"
import { THEMES, type Theme } from "@/theme"
import { useCallback, useEffect, useRef } from "react"

// Full-app recolor is expensive to repaint on a terminal; debouncing it keeps
// rapid Up/Down navigation smooth since only the settled selection repaints
const PREVIEW_DEBOUNCE_MS = 50

export const ThemeDialogContent = () => {
    const dialog = useDialog()
    const { setTheme, previewTheme, currentTheme } = useTheme()
    const originalThemeRef = useRef(currentTheme)
    const confirmRef = useRef(false)
    const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearPendingPreview = useCallback(() => {
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current)
            previewTimeoutRef.current = null
        }
    }, [])

    // Revert to the original theme if the dialog is canceled
    useEffect(() => {
        const originalTheme = originalThemeRef.current
        return () => {
            clearPendingPreview()
            // Read the ref at unmount time; a mount-time snapshot is always false
            if (!confirmRef.current) {
                setTheme(originalTheme)
            }
        }
    }, [setTheme, clearPendingPreview])

    const handleSelect = useCallback(
        (theme: Theme) => {
            confirmRef.current = true
            clearPendingPreview()
            setTheme(theme)
            dialog.close()
        },
        [dialog, setTheme, clearPendingPreview]
    )

    const handleHighlight = useCallback(
        (theme: Theme) => {
            clearPendingPreview()
            previewTimeoutRef.current = setTimeout(() => {
                previewTheme(theme)
            }, PREVIEW_DEBOUNCE_MS)
        },
        [previewTheme, clearPendingPreview]
    )

    return (
        <DialogSearchList
            items={THEMES}
            onSelect={handleSelect}
            onHighlight={handleHighlight}
            filterFn={(t, query) => t.name.toLowerCase().includes(query.toLowerCase())}
            renderItem={(theme, isSelected) => {
                return (
                    <Text selectable={false} fg={isSelected ? "black" : "white"}>
                        {"  • " + theme.name}
                    </Text>
                )
            }}
            getKey={(theme) => theme.name}
            placeholder="Search themes..."
            emptyText="No themes found"
        />
    )
}
