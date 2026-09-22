import { Box, Text } from "@/components/ui/primitives"
import { RootLayout } from "@/layouts/root-layout"
import { Home } from "@/screens/home"
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { createMemoryRouter, RouterProvider } from "react-router"

const router = createMemoryRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "sessions/new",
                element: (
                    <Box>
                        <Text>session/new</Text>
                    </Box>
                )
            },
            {
                path: "sessions/:id",
                element: (
                    <Box>
                        <Text>session/:id</Text>
                    </Box>
                )
            }
        ]
    }
])

function App() {
    return <RouterProvider router={router} />
}

const renderer = await createCliRenderer({
    targetFps: 60,
    exitOnCtrlC: false
})
createRoot(renderer).render(<App />)
