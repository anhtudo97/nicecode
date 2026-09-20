import { DEFAULT_THEME, THEMES, type Theme, type ThemeColors } from "@/theme"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { createContext, useContext, useState, useCallback, useMemo } from "react"

const CONFIG_DIR = join(homedir(), ".nicecode")
const THEME_PREFERENCE_PATH = join(CONFIG_DIR, "preferences.json")

type ThemePreferences = {
    themeName: string
}

const getInitialTheme = (): Theme => {
    try {
        const preferences = JSON.parse(
            readFileSync(THEME_PREFERENCE_PATH, "utf-8")
        ) as Partial<ThemePreferences>

        const savedTheme = THEMES.find((theme) => theme.name === preferences.themeName)

        return savedTheme ?? DEFAULT_THEME
    } catch (error) {
        return DEFAULT_THEME
    }
}

const persistTheme = (theme: Theme): void => {
    try {
        mkdirSync(CONFIG_DIR, { recursive: true })
        writeFileSync(
            THEME_PREFERENCE_PATH,
            JSON.stringify({ themeName: theme.name } satisfies ThemePreferences, null, 2)
        )
    } catch {
        // Ignore errors while persisting theme preference
    }
}

type ThemeContextValue = {
    colors: ThemeColors
    currentTheme: Theme
    setTheme: (theme: Theme) => void
    previewTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

type ThemeProviderProps = {
    children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(getInitialTheme)

    // Live preview while navigating: apply colors instantly, skip the blocking disk write
    const previewTheme = useCallback((newTheme: Theme) => {
        setCurrentTheme(newTheme)
    }, [])

    const setTheme = useCallback((newTheme: Theme) => {
        setCurrentTheme(newTheme)
        persistTheme(newTheme)
    }, [])

    const value: ThemeContextValue = useMemo(
        () => ({
            colors: currentTheme.colors,
            currentTheme,
            setTheme,
            previewTheme
        }),
        [currentTheme, setTheme, previewTheme]
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
