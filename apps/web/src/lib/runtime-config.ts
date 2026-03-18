const DEFAULT_API_PORT = "5000";

export function getApiBaseUrl(): string {
    const configured = readEnv("VITE_API_BASE_URL");
    if (configured) {
        return stripTrailingSlash(configured);
    }

    if (isBrowser()) {
        const { protocol, hostname, port } = window.location;
        const resolvedPort = port === "5173" ? DEFAULT_API_PORT : (port || DEFAULT_API_PORT);
        return `${protocol}//${hostname}:${resolvedPort}`;
    }

    return `http://127.0.0.1:${DEFAULT_API_PORT}`;
}

export function getWebsocketBaseUrl(): string {
    const configured = readEnv("VITE_WS_BASE_URL");
    if (configured) {
        return stripTrailingSlash(configured);
    }

    return getApiBaseUrl();
}

function readEnv(name: "VITE_API_BASE_URL" | "VITE_WS_BASE_URL"): string | undefined {
    const value = import.meta.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}
