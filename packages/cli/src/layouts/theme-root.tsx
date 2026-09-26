import { Box } from "@/components/ui/primitives"
import { useTheme } from "@/providers/theme"
import type { PropsWithChildren } from "react"

export const ThemedRoot = (props: PropsWithChildren) => {
    const { colors } = useTheme()

    return (
        <Box backgroundColor={colors.background} width="100%" height="100%" flexGrow={1}>
            {props.children}
        </Box>
    )
}
