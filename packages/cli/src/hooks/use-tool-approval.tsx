import { useCallback, useRef } from "react"
import { useDialog } from "@/providers/dialog"
import { ToolApprovalDialogContent, type ToolApprovalChoice } from "@/dialogs/tool-approval-dialog"

function describeToolCall(toolName: string, input: unknown) {
    const args = (input ?? {}) as Record<string, unknown>
    if (toolName === "bash") return `Run command:\n${String(args.command ?? "")}`
    if (toolName === "writeFile") return `Write file: ${String(args.path ?? "")}`
    if (toolName === "editFile") return `Edit file: ${String(args.path ?? "")}`
    return `Run ${toolName}`
}

/** Returns a function that asks the user to approve a tool call; resolves to their choice. */
export function useToolApproval() {
    const dialog = useDialog()
    const allowAllRef = useRef(false)
    // Parallel tool calls share one dialog slot, so ask one at a time
    const queueRef = useRef<Promise<unknown>>(Promise.resolve())

    return useCallback(
        (toolName: string, input: unknown) => {
            const ask = () =>
                new Promise<ToolApprovalChoice>((resolve) => {
                    if (allowAllRef.current) return resolve("session")

                    // The first resolve wins, so the onClose that follows a choice is harmless
                    dialog.open({
                        title: "Allow tool call?",
                        children: (
                            <ToolApprovalDialogContent
                                summary={describeToolCall(toolName, input)}
                                onChoose={(choice) => {
                                    if (choice === "session") allowAllRef.current = true
                                    resolve(choice)
                                    dialog.close()
                                }}
                            />
                        ),
                        onClose: () => resolve("deny")
                    })
                })

            const next = queueRef.current.then(ask, ask)
            queueRef.current = next
            return next
        },
        [dialog]
    )
}
