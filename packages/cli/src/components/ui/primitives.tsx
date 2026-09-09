import { createElement } from "@opentui/react"
import type {
  AsciiFontProps,
  BoxProps,
  ScrollBoxProps,
  TextProps,
  TextareaProps
} from "@opentui/react"

// OpenTUI intrinsics (<box>, <text>, ...) are lowercase, so eslint-plugin-react lints
// them as react-dom tags and false-positives on every terminal/layout prop (gap,
// alignItems, focused, fg, ...). Routing them through PascalCase wrappers built with
// createElement (no lowercase JSX attributes for the rule to inspect) makes the rule
// skip them, while tsc still type-checks every prop against the OpenTUI *Props types.
export const Box = (props: BoxProps) => createElement("box", props)
export const Text = (props: TextProps) => createElement("text", props)
export const Textarea = (props: TextareaProps) => createElement("textarea", props)
export const AsciiFont = (props: AsciiFontProps) => createElement("ascii-font", props)
export const Scrollbox = (props: ScrollBoxProps) => createElement("scrollbox", props)
