import { AsciiFont, Box } from "./ui/primitives"

export function Header() {
    return (
        <Box alignItems="center" justifyContent="center">
            <Box flexDirection="row" justifyContent="center" gap={0.5} alignItems="center">
                <AsciiFont font="tiny" text="Nice" color="gray" />
                <AsciiFont font="tiny" text="Code" />
            </Box>
        </Box>
    )
}
