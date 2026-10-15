import { tool } from "ai"
import z from "zod"

const MAX_OUTPUT = 20_000
const DEFAULT_TIMEOUT = 30_000

export const createBashTool = (cwd: string) => {
    return tool({
        description: "Execute bash commands within the specified working directory.",
        inputSchema: z.object({
            command: z.string().describe("The bash command to execute."),
            timeout: z
                .number()
                .describe("The maximum time (in milliseconds) to allow the command to run.")
                .default(DEFAULT_TIMEOUT)
        }),
        execute: async ({ command, timeout }) => {
            try {
                const proc = Bun.spawn({
                    cmd: ["bash", "-c", command],
                    cwd,
                    stdout: "pipe",
                    stderr: "pipe",
                    env: { ...process.env, TERM: "dumb" }
                })

                const timer = setTimeout(() => {
                    proc.kill("SIGTERM")
                }, timeout)

                const [stdout, stderr] = await Promise.all([
                    new Response(proc.stdout).text(),
                    new Response(proc.stderr).text()
                ])

                const exitCode = await proc.exited
                clearTimeout(timer)

                const truncate = (str: string) =>
                    str.length > MAX_OUTPUT ? str.slice(0, MAX_OUTPUT) + "\n...[truncated]" : str

                return {
                    stdout: truncate(stdout),
                    stderr: truncate(stderr),
                    exitCode
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                return {
                    error: `Failed to execute command: ${message}`
                }
            }
        }
    })
}
