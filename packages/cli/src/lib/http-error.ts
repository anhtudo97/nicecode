type ErrorResponse = {
    json: () => Promise<unknown>
    status: number
    statusText: string
}

export async function getErrorMessage(response: ErrorResponse): Promise<string> {
    try {
        const data = (await response.json()) as { error?: string }
        if (typeof data.error === "string" && data.error.length > 0) {
            return data.error
        }
    } catch {
        // Ignore JSON parsing errors
    }

    return response.statusText || `HTTP error ${response.status}`
}
