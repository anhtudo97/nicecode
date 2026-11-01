import { useCallback } from "react"
import { Mode, type ModeType } from "@nicecode/shared"
import { useDialog } from "@/providers/dialog"
import { DialogSearchList } from "@/components/dialog-search-list"
import { Text } from "@/components/ui/primitives"

const AVAILABLE_MODES: ModeType[] = [Mode.BUILD, Mode.PLAN]

type AgentsDialogContentProps = {
    currentMode: ModeType
    onSelectMode: (mode: ModeType) => void
}

function getModeLabel(mode: ModeType) {
    return mode === Mode.PLAN ? "Plan" : "Build"
}

export const AgentsDialogContent = ({ currentMode, onSelectMode }: AgentsDialogContentProps) => {
    const dialog = useDialog()

    const handleSelect = useCallback(
        (nextMode: ModeType) => {
            onSelectMode(nextMode)
            dialog.close()
        },
        [onSelectMode, dialog]
    )

    return (
        <DialogSearchList
            items={AVAILABLE_MODES}
            onSelect={handleSelect}
            filterFn={(item, query) =>
                getModeLabel(item).toLowerCase().includes(query.toLowerCase())
            }
            renderItem={(item, isSelected) => (
                <Text selectable={false} fg={isSelected ? "black" : "white"}>
                    {item === currentMode ? " • " : "   "}
                    {getModeLabel(item)}
                </Text>
            )}
            getKey={(item) => item}
            placeholder="Search agents"
            emptyText="No matching agents"
        />
    )
}
