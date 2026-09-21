import { useKeyboard, useRenderer } from "@opentui/react"
import {
    createContext,
    useCallback,
    useRef,
    useState,
    type PropsWithChildren,
    useContext
} from "react"

type Responder = () => boolean

type KeyboardLayerContextValue = {
    push: (id: string, responder?: Responder) => void
    pop: (id: string) => void
    isTopLayer: (id: string) => boolean
    setResponder: (id: string, responder: Responder | null) => void
}

const KeyboardLayerContext = createContext<KeyboardLayerContextValue | null>(null)

export const KeyboardLayerProvider = ({ children }: PropsWithChildren) => {
    const [stack, setStack] = useState<string[]>(["base"])
    const stackRef = useRef(stack)
    stackRef.current = stack

    const responders = useRef<Map<string, Responder>>(new Map())
    const renderer = useRenderer()

    const push = useCallback((id: string, responder?: Responder) => {
        if (responder) {
            responders.current.set(id, responder)
        }

        setStack((prev) => {
            if (prev.includes(id)) {
                return prev
            }
            return [...prev, id]
        })
    }, [])

    const pop = useCallback((id: string) => {
        responders.current.delete(id)
        setStack((prev) => prev.filter((item) => item !== id))
    }, [])

    const isTopLayer = useCallback((id: string) => {
        return stackRef.current.length === 0 || stackRef.current.at(-1) === id
    }, [])

    const setResponder = useCallback((id: string, responder: Responder | null) => {
        if (responder) {
            responders.current.set(id, responder)
        } else {
            responders.current.delete(id)
        }
    }, [])

    useKeyboard((key) => {
        if (!key.ctrl || key.name !== "c") {
            return
        }

        const currentStack = stackRef.current
        for (let i = currentStack.length - 1; i >= 0; i--) {
            const layerId = currentStack[i]!
            const responder = responders.current.get(layerId)
            if (responder && responder?.()) {
                return
            }
        }

        renderer.destroy()
    })

    return (
        <KeyboardLayerContext.Provider value={{ push, pop, isTopLayer, setResponder }}>
            {children}
        </KeyboardLayerContext.Provider>
    )
}

export const useKeyboardLayer = () => {
    const context = useContext(KeyboardLayerContext)
    if (!context) {
        throw new Error("useKeyboardLayer must be used within a KeyboardLayerProvider")
    }
    return context
}
