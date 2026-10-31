import { mkdir, readFile, readdir, realpath, stat, writeFile } from "fs/promises"
import { dirname, isAbsolute, join, relative, resolve } from "path"
import { toolInputSchemas, Mode, type ModeType } from "@nicecode/shared"

const MAX_FILE_SIZE = 10_000
const MAX_RESULTS = 200
const MAX_MATCHES = 50
const MAX_OUTPUT = 20_000
const DEFAULT_TIMEOUT = 30_000

const SENSITIVE_ENV_PATTERN = /key|token|secret|password|credential|database_url|^clerk_|^polar_/i

// The model controls the command, so don't hand it the CLI's own credentials.
function getSafeEnv() {
    const env: Record<string, string | undefined> = { TERM: "dumb" }

    for (const [name, value] of Object.entries(process.env)) {
        if (!SENSITIVE_ENV_PATTERN.test(name)) env[name] = value
    }

    env.TERM = "dumb"
    return env
}

function isInside(cwd: string, target: string) {
    const rel = relative(cwd, target)
    return !(rel.startsWith("..") || isAbsolute(rel))
}

// Real path of the nearest existing ancestor, so symlinks can't point outside the project
// (the target itself may not exist yet, e.g. writeFile).
async function realpathOfExistingAncestor(target: string): Promise<string> {
    try {
        return await realpath(target)
    } catch {
        const parent = dirname(target)
        if (parent === target) return target
        return join(await realpathOfExistingAncestor(parent), relative(parent, target))
    }
}

async function resolveInsideCwd(path: string) {
    const cwd = process.cwd()
    const resolved = resolve(cwd, path)

    if (
        !isInside(cwd, resolved) ||
        !isInside(await realpath(cwd), await realpathOfExistingAncestor(resolved))
    ) {
        throw new Error("Path is outside the project directory")
    }

    return { cwd, resolved }
}

function truncate(value: string, limit: number) {
    return value.length > limit
        ? `${value.slice(0, limit)}\n... (truncated, ${value.length} total chars)`
        : value
}

export async function executeLocalTool(toolName: string, input: unknown, mode: ModeType) {
    if (mode === Mode.PLAN && !["readFile", "listDirectory", "glob", "grep"].includes(toolName)) {
        throw new Error(`Tool ${toolName} is not available in PLAN mode`)
    }

    switch (toolName) {
        case "readFile": {
            const { path } = toolInputSchemas.readFile.parse(input)
            const { resolved } = await resolveInsideCwd(path)
            const content = await readFile(resolved, "utf-8")
            return content.length > MAX_FILE_SIZE
                ? {
                      content: content.slice(0, MAX_FILE_SIZE),
                      truncated: true,
                      totalLength: content.length
                  }
                : { content }
        }
        case "listDirectory": {
            const { path } = toolInputSchemas.listDirectory.parse(input)
            const { cwd, resolved } = await resolveInsideCwd(path)
            const entries = await readdir(resolved)
            const results: { name: string; type: "file" | "directory" }[] = []

            for (const entry of entries) {
                if (entry.startsWith(".") || entry === "node_modules") continue
                const info = await stat(join(resolved, entry))
                results.push({ name: entry, type: info.isDirectory() ? "directory" : "file" })
            }

            results.sort((a, b) =>
                a.type !== b.type ? (a.type === "directory" ? -1 : 1) : a.name.localeCompare(b.name)
            )
            return { path: relative(cwd, resolved) || ".", entries: results }
        }
        case "glob": {
            const { pattern, path } = toolInputSchemas.glob.parse(input)
            const { cwd, resolved } = await resolveInsideCwd(path)
            const glob = new Bun.Glob(pattern)
            const files: string[] = []
            let truncated = false

            for await (const match of glob.scan({ cwd: resolved, dot: false, onlyFiles: true })) {
                if (match.includes("node_modules")) continue
                if (files.length >= MAX_RESULTS) {
                    truncated = true
                    break
                }
                files.push(relative(cwd, resolve(resolved, match)))
            }

            files.sort()
            return { files, ...(truncated ? { truncated: true } : {}) }
        }
        case "grep": {
            const { pattern, path, include } = toolInputSchemas.grep.parse(input)
            const { cwd, resolved } = await resolveInsideCwd(path)
            const args = [
                "-rn",
                "--color=never",
                "--exclude-dir=node_modules",
                "--exclude-dir=.git",
                "-E"
            ]
            if (include) args.push(`--include=${include}`)
            // -e/-- keep a model-supplied pattern or path from being parsed as an option
            args.push("-e", pattern, "--", resolved)

            const proc = Bun.spawn(["grep", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
            const [stdout, stderr] = await Promise.all([
                new Response(proc.stdout).text(),
                new Response(proc.stderr).text()
            ])
            const exitCode = await proc.exited

            if (exitCode !== 0 && exitCode !== 1) throw new Error(`grep failed: ${stderr.trim()}`)
            if (!stdout.trim()) return { matches: [], message: "No matches found" }

            const lines = stdout.trim().split("\n")
            const matches: { file: string; line: number; content: string }[] = []
            let truncated = false

            for (const line of lines) {
                if (matches.length >= MAX_MATCHES) {
                    truncated = true
                    break
                }
                const match = line.match(/^(.+?):(\d+):(.*)$/)
                if (match) {
                    matches.push({
                        file: relative(cwd, match[1]!),
                        line: Number(match[2]),
                        content: match[3]!
                    })
                }
            }

            return {
                matches,
                ...(truncated ? { truncated: true, totalMatches: lines.length } : {})
            }
        }
        case "writeFile": {
            const { path, content } = toolInputSchemas.writeFile.parse(input)
            const { cwd, resolved } = await resolveInsideCwd(path)
            await mkdir(dirname(resolved), { recursive: true })
            await writeFile(resolved, content, "utf-8")
            return {
                success: true as const,
                path: relative(cwd, resolved),
                bytesWritten: Buffer.byteLength(content, "utf-8")
            }
        }
        case "editFile": {
            const { path, oldString, newString } = toolInputSchemas.editFile.parse(input)
            const { cwd, resolved } = await resolveInsideCwd(path)
            const content = await readFile(resolved, "utf-8")
            const occurrences = content.split(oldString).length - 1

            if (occurrences === 0) throw new Error("oldString not found in file")
            if (occurrences > 1)
                throw new Error(`oldString is ambiguous; found ${occurrences} matches`)

            await writeFile(resolved, content.replace(oldString, newString), "utf-8")
            return { success: true as const, path: relative(cwd, resolved) }
        }
        case "bash": {
            const { command, timeout = DEFAULT_TIMEOUT } = toolInputSchemas.bash.parse(input)
            const proc = Bun.spawn(["bash", "-c", command], {
                cwd: (await resolveInsideCwd(".")).resolved,
                stdout: "pipe",
                stderr: "pipe",
                env: getSafeEnv()
            })
            const timer = setTimeout(() => proc.kill(), timeout)
            const [stdout, stderr] = await Promise.all([
                new Response(proc.stdout).text(),
                new Response(proc.stderr).text()
            ])
            const exitCode = await proc.exited
            clearTimeout(timer)
            return {
                stdout: truncate(stdout, MAX_OUTPUT),
                stderr: truncate(stderr, MAX_OUTPUT),
                exitCode
            }
        }
        default:
            throw new Error(`Unknown tool: ${toolName}`)
    }
}
