import { DialogSearchList } from "@/components/dialog-search-list"
import { Box, Text } from "@/components/ui/primitives"
import { apiClient } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/http-error"
import { useDialog } from "@/providers/dialog"
import { useToast } from "@/providers/toast"
import { TextAttributes } from "@opentui/core"
import { format } from "date-fns"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"

type Session = {
    id: string
    title: string
    createdAt: string
}

export const SessionDialogContent = () => {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const { close } = useDialog()
    const navigate = useNavigate()
    const { show } = useToast()

    useEffect(() => {
        let ignore = false

        const fetchSessions = async () => {
            setLoading(true)
            try {
                const response = await apiClient.session.$get()
                if (!response.ok) {
                    throw new Error(await getErrorMessage(response))
                }

                const data = await response.json()

                if (!ignore) {
                    setSessions(data)
                    setLoading(false)
                }
            } catch (error) {
                if (!ignore) {
                    show({
                        variant: "error",
                        message: error instanceof Error ? error.message : "Failed to fetch sessions"
                    })
                    close()
                }
            }
        }
        fetchSessions()

        return () => {
            ignore = true
        }
    }, [close, show])

    const handleSelect = useCallback(
        (session: Session) => {
            close()
            navigate(`/sessions/${session.id}`)
        },
        [close, navigate]
    )

    if (loading) {
        return (
            <Box flexDirection="column">
                <Text attributes={TextAttributes.DIM}>Loading sessions...</Text>
            </Box>
        )
    }

    return (
        <DialogSearchList
            items={sessions}
            onSelect={handleSelect}
            filterFn={(s, query) => s.title.toLowerCase().includes(query.toLowerCase())}
            renderItem={(session, isSelected) => {
                return (
                    <>
                        <Text selectable={false} fg={isSelected ? "black" : "white"}>
                            {session.title}
                        </Text>
                        <Box flexGrow={1} />
                        <Text
                            selectable={false}
                            fg={isSelected ? "black" : undefined}
                            attributes={TextAttributes.DIM}
                        >
                            {format(new Date(session.createdAt), "hh:mm a")}
                        </Text>
                    </>
                )
            }}
            getKey={(s) => s.id}
            placeholder="Search sessions..."
            emptyText="No sessions found"
        />
    )
}
