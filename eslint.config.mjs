import js from "@eslint/js"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import prettierConfig from "eslint-config-prettier"
import globals from "globals"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig(
    globalIgnores(["**/node_modules/**", "**/dist/**", "**/build/**", "**/out/**", "bun.lock"]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser }
        },
        plugins: {
            react,
            "react-hooks": reactHooks
        },
        settings: {
            react: { version: "detect" }
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules,
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
            ]
        }
    },
    prettierConfig
)
