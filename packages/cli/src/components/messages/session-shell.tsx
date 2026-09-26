import { InputBar } from "@/components/input-bar"
import { Spinner } from "@/components/spinner"
import { Box, Scrollbox, Text } from "@/components/ui/primitives"
import { TextAttributes } from "@opentui/core"
import type { ReactNode } from "react"

type Props = {
    children?: ReactNode
    onSubmit: (text: string) => void
    inputDisabled?: boolean
    loading?: boolean
}

export const SessionShell = ({
    children,
    onSubmit,
    inputDisabled = false,
    loading = false
}: Props) => {
    return (
        <Box
            flexDirection="column"
            flexGrow={1}
            width="100%"
            height="100%"
            paddingY={1}
            paddingX={2}
            gap={1}
        >
            <Scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
                <Box gap={1}>{children}</Box>
            </Scrollbox>
            <Box flexShrink={0}>
                <InputBar onSubmit={onSubmit} disabled={inputDisabled} />
            </Box>
            <Box
                flexShrink={0}
                flexDirection="row"
                justifyContent="space-between"
                width="100%"
                height={1}
                gap={2}
                paddingLeft={1}
            >
                <Box flexDirection="row" alignItems="center" gap={2}>
                    {loading ? <Spinner /> : null}
                </Box>
                <Box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
                    <Text>tab</Text>
                    <Text attributes={TextAttributes.DIM}>agents</Text>
                </Box>
            </Box>
        </Box>
    )
}
