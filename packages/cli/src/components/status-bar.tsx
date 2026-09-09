import { TextAttributes } from "@opentui/core"
import { Box, Text } from "./ui/primitives"

export function StatusBar() {
  return (
    <Box flexDirection="row" gap={1}>
      <Text fg="cyan">Build</Text>
      <Text attributes={TextAttributes.DIM} fg="gray">
        {"›"}
      </Text>
      <Text>opus-4-6</Text>
    </Box>
  )
}
