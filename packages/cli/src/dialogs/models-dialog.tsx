import { DialogSearchList } from "@/components/dialog-search-list"
import { Text } from "@/components/ui/primitives"
import { useDialog } from "@/providers/dialog"
import type { SupportedChatModelId } from "@nicecode/shared"
import { useCallback } from "react"

type ModelsDialogContentProps = {
    models: SupportedChatModelId[]
    onSelectModel: (model: SupportedChatModelId) => void
}

export const ModelsDialogContent = ({ models, onSelectModel }: ModelsDialogContentProps) => {
    const dialog = useDialog()

    const handleSelect = useCallback(
        (modelId: SupportedChatModelId) => {
            onSelectModel(modelId)
            dialog.close()
        },
        [dialog, onSelectModel]
    )

    return (
        <DialogSearchList
            items={models}
            onSelect={handleSelect}
            filterFn={(modelId, query) => modelId.toLowerCase().includes(query.toLowerCase())}
            renderItem={(modelId, isSelected) => {
                return (
                    <Text selectable={false} fg={isSelected ? "black" : "white"}>
                        {modelId}
                    </Text>
                )
            }}
            getKey={(modelId) => modelId}
            placeholder="Search models..."
            emptyText="No models found"
        />
    )
}
