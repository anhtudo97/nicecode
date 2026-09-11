import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { Header } from "./components/header"
import { InputBar } from "./components/input-bar"
import { Box } from "./components/ui/primitives"

function App() {
    return (
        <Box
            alignItems="center"
            justifyContent="center"
            backgroundColor="#0D0D12"
            width="100%"
            height="100%"
            gap={2}
        >
            <Header />
            <Box width="100%" maxWidth={78} paddingX={2}>
                <InputBar onSubmit={() => {}} />
            </Box>
        </Box>
    )
}

const renderer = await createCliRenderer({
    targetFps: 60,
    exitOnCtrlC: false
})
createRoot(renderer).render(<App />)
