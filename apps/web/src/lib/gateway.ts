export interface GatewayTaskResponse {
    task?: {
        id: string;
        status: string;
    };
}

export interface GatewayTaskStatus {
    taskId: string;
    status: string;
    updatedAt: string;
    result?: {
        content?: string;
        model?: string;
        error?: string;
    };
}

export function getGatewayAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('andromeda_token') || 'andromeda_dev_web_token';
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export async function createGatewayTask(payload: unknown): Promise<GatewayTaskResponse> {
    const response = await fetch('/gateway/message', {
        method: 'POST',
        headers: getGatewayAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errorBody?.error?.message || 'Erro ao enviar o teste para o gateway.');
    }

    return response.json() as Promise<GatewayTaskResponse>;
}

export async function pollGatewayTask(taskId: string, attempts = 25, delayMs = 800): Promise<GatewayTaskStatus> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const response = await fetch(`/gateway/tasks/${taskId}/status`);
        if (!response.ok) {
            throw new Error('Falha ao consultar status da task.');
        }

        const status = await response.json() as GatewayTaskStatus;
        if (status.result) {
            return status;
        }
        if (status.status === 'failed' || status.status === 'completed') {
            return status;
        }

        await sleep(delayMs);
    }

    throw new Error('Timeout aguardando resposta da task.');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}
