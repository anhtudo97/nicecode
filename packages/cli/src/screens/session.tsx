import { Box, Text } from "@/components/ui/primitives"
import { useParams } from "react-router"

export const Session = () => {
    const { id } = useParams()
    return (
        <Box flexGrow={1} padding={2} flexDirection="column" gap={1}>
            <Text>Session {id} </Text>
        </Box>
    )
}
