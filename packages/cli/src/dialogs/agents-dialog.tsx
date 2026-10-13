import { DialogSearchList } from "@/components/dialog-search-list"
import { Text } from "@/components/ui/primitives"
import { useDialog } from "@/providers/dialog"
import { Mode } from "@nicecode/database/enums"
import { useCallback } from "react"

const AVAILABLE_MODES: Mode[] = [Mode.BUILD, Mode.PLAN]

type AgentsDialogContentProps = {
    currentMode: Mode
    onSelectMode: (mode: Mode) => void
}

const getModeLabel = (mode: Mode) => {
    return mode === Mode.BUILD ? "Build" : "Plan"
}

export const AgentsDialogContent = ({ currentMode, onSelectMode }: AgentsDialogContentProps) => {
    const dialog = useDialog()

    const handleSelect = useCallback(
        (nextMode: Mode) => {
            onSelectMode(nextMode)
            dialog.close()
        },
        [dialog, onSelectMode]
    )

    return (
        <DialogSearchList
            items={AVAILABLE_MODES}
            onSelect={handleSelect}
            filterFn={(item, query) =>
                getModeLabel(item).toLowerCase().includes(query.toLowerCase())
            }
            renderItem={(item, isSelected) => {
                return (
                    <Text selectable={false} fg={isSelected ? "black" : "white"}>
                        {item === currentMode ? "  • " : ""}
                        {getModeLabel(item)}
                    </Text>
                )
            }}
            getKey={(item) => item}
            placeholder="Search modes..."
            emptyText="No modes found"
        />
    )
}
