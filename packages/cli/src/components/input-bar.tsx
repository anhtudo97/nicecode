import type { KeyBinding } from "@opentui/core"
import { SplitBorder } from "./border"
import { StatusBar } from "./status-bar"
import { Box, Textarea } from "./ui/primitives"
import { CommandMenu } from "./command-menu"

type InputBarProps = {
  onSubmit: (value: string) => void
  disabled?: boolean
}

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
  { name: "return", action: "submit" },
  { name: "enter", action: "submit" },
  { name: "return", shift: true, action: "newline" },
  { name: "enter", shift: true, action: "newline" }
]

export function InputBar({ onSubmit, disabled }: InputBarProps) {
  return (
    <Box width="100%" alignItems="center">
      <Box {...SplitBorder} border={["left"]} borderColor="cyan">
        <Box
          position="relative"
          justifyContent="center"
          paddingX={2}
          paddingY={1}
          backgroundColor="#1A1A24"
          width="100%"
          gap={1}
        >
          <Textarea
            focused={!disabled}
            placeholder={`Ask a question... "Fix a bug in the frontend side"`}
            keyBindings={TEXTAREA_KEY_BINDINGS}
          />
          <StatusBar />
        </Box>
      </Box>
    </Box>
  )
}
