import type { KeyBinding } from "@opentui/core"
import { EmptyBorder, SplitBorder } from "./border"
import { StatusBar } from "./status-bar"

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
    <box width="100%" alignItems="center">
      <box {...SplitBorder} border={["left"]} borderColor="cyan">
        <box
          position="relative"
          justifyContent="center"
          paddingX={2}
          paddingY={1}
          backgroundColor="#1A1A24"
          width="100%"
          gap={1}
        >
          <textarea
            focused={!disabled}
            placeholder={`Ask a question... "Fix a bug in the frontend side"`}
            keyBindings={TEXTAREA_KEY_BINDINGS}
          />
          <StatusBar />
        </box>
      </box>
    </box>
  )
}
