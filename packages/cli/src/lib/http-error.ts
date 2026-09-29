type ErrorResponse = {
    json: () => Promise<unknown>
    status: number
    statusText: string
}

export const getErrorMessage = async (errorResponse: ErrorResponse): Promise<string> => {
    try {
        const data = (await errorResponse.json()) as { error?: string }
        if (typeof data.error === "string" && data.error.length > 0) {
            return data.error
        }
    } catch {
        // Ignore JSON parsing errors
    }

    return errorResponse.statusText || `HTTP error ${errorResponse.status}`
}
