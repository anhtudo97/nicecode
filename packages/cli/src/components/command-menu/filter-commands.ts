import { COMMANDS } from "./commands"
import type { Command } from "./types"

export const getFilteredCommands = (query: string): Command[] => {
  if (query.length === 0) {
    return COMMANDS
  }
  return COMMANDS.filter(
    (command) => command.name.includes(query) || command.description.includes(query)
  )
}
