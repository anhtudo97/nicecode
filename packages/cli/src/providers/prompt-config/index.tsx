import { Mode } from "@nicecode/database/enums"
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@nicecode/shared"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type PromptConfigContextValue = {
    mode: Mode
    toggleMode: () => void
    setMode: (mode: Mode) => void
    model: SupportedChatModelId
    setModel: (model: SupportedChatModelId) => void
}

const PromptConfigContext = createContext<PromptConfigContextValue | null>(null)

export const usePromptConfig = (): PromptConfigContextValue => {
    const value = useContext(PromptConfigContext)
    if (!value) {
        throw new Error("usePromptConfig must be used within a PromptConfigProvider")
    }
    return value
}

type PromptConfigProviderProps = {
    children: ReactNode
}

export const PromptConfigProvider = ({ children }: PromptConfigProviderProps) => {
    const [mode, setMode] = useState<Mode>(Mode.BUILD)
    const [model, setModel] = useState<SupportedChatModelId>(DEFAULT_CHAT_MODEL_ID)

    const toggleMode = useCallback(() => {
        setMode((prevMode) => (prevMode === Mode.BUILD ? Mode.PLAN : Mode.BUILD))
    }, [])

    const value = useMemo(
        () => ({ mode, toggleMode, setMode, model, setModel }),
        [mode, toggleMode, setMode, model, setModel]
    )

    return <PromptConfigContext.Provider value={value}>{children}</PromptConfigContext.Provider>
}
