import { IProviderAdapter, Provider, ProviderHealth } from "@andromeda/core";

export class OllamaProviderAdapter implements IProviderAdapter {
    async healthCheck(provider: Provider): Promise<ProviderHealth> {
        try {
            const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
            const response = await fetch(`${baseUrl}/api/version`);
            if (response.ok) {
                return { status: "ok" };
            }
            return { status: "error", message: `Ollama returned ${response.status}` };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }

    async listModels(provider: Provider): Promise<any[]> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
        const data = await response.json();
        return (data.models || []).map((m: any) => ({
            externalModelId: m.name,
            displayName: m.name,
            locality: "local",
            family: m.details?.family,
            parameterSize: m.details?.parameter_size,
            quantization: m.details?.quantization_level,
            capabilities: this.inferCapabilities(m.name)
        }));
    }

    private inferCapabilities(name: string): string[] {
        const caps = ["chat"];
        const low = name.toLowerCase();

        // Reasoning / Thinking models
        if (low.includes("coder") || low.includes("code")) caps.push("coding");
        if (low.includes("vision") || low.includes("vl") || low.includes("llava") || low.includes("moondream")) caps.push("vision");
        if (low.includes("math") || low.includes("reason") || low.includes("deepseek-r") || low.includes("thought") || low.includes("instruct")) caps.push("reasoning");

        // Tool use detection (Ollama 0.3+ supports tools for many models)
        if (low.includes("llama3") || low.includes("mistral") || low.includes("qwen") || low.includes("command-r")) caps.push("tool_use");

        return caps;
    }

    async pullModel(provider: Provider, modelName: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/pull", { name: modelName }, onProgress);
    }

    async pushModel(provider: Provider, modelName: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/push", { name: modelName }, onProgress);
    }

    async createModel(provider: Provider, name: string, modelfile: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/create", { name, modelfile }, onProgress);
    }

    async deleteModel(provider: Provider, modelName: string): Promise<void> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/delete`, {
            method: 'DELETE',
            body: JSON.stringify({ name: modelName })
        });
        if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
    }

    async copyModel(provider: Provider, source: string, destination: string): Promise<void> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/copy`, {
            method: 'POST',
            body: JSON.stringify({ source, destination })
        });
        if (!response.ok) throw new Error(`Copy failed: ${response.statusText}`);
    }

    async showModelInfo(provider: Provider, modelName: string): Promise<any> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/show`, {
            method: 'POST',
            body: JSON.stringify({ name: modelName })
        });
        if (!response.ok) throw new Error(`Show failed: ${response.statusText}`);
        return response.json();
    }

    async listRunningModels(provider: Provider): Promise<any[]> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/ps`);
        if (!response.ok) throw new Error(`PS failed: ${response.statusText}`);
        const data = await response.json();
        return data.models || [];
    }

    async generate(provider: Provider, params: any): Promise<any> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async chat(provider: Provider, params: any): Promise<any> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async embed(provider: Provider, params: any): Promise<any> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/embed`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async getVersion(provider: Provider): Promise<string> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/version`);
        const data = await response.json();
        return data.version;
    }

    private async postStream(provider: Provider, path: string, body: any, onProgress?: (p: any) => void): Promise<void> {
        const baseUrl = provider.getBaseUrl() || "http://localhost:11434";
        const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`Stream request failed: ${response.statusText}`);

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (onProgress) {
                try {
                    const lines = chunk.split('\n').filter(l => l.trim());
                    for (const line of lines) {
                        onProgress(JSON.parse(line));
                    }
                } catch (e) { /* ignore partial json */ }
            }
        }
    }
}

