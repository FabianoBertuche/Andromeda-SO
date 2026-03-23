import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PYTHON_DIR = resolve(ROOT, "services", "cognitive-python");
const REQUIREMENTS_FILE = resolve(PYTHON_DIR, "requirements.txt");
const isWindows = process.platform === "win32";

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const skipNpmInstall = args.has("--skip-npm-install");
const skipPythonInstall = args.has("--skip-python-install");
const noOpen = args.has("--no-open");

function commandFor(command) {
    if (isWindows && command === "npm") {
        return "npm.cmd";
    }

    return command;
}

function quoteWindowsArg(value) {
    if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
        return value;
    }

    return `"${value.replace(/"/g, '\\"')}"`;
}

function createSpawnSpec(command, commandArgs) {
    if (!isWindows) {
        return {
            file: commandFor(command),
            args: commandArgs,
        };
    }

    const cmdline = [quoteWindowsArg(commandFor(command)), ...commandArgs.map(quoteWindowsArg)].join(" ");
    return {
        file: "cmd.exe",
        args: ["/d", "/s", "/c", cmdline],
    };
}

function run(command, commandArgs, options = {}) {
    const spec = createSpawnSpec(command, commandArgs);
    const result = spawnSync(spec.file, spec.args, {
        cwd: ROOT,
        stdio: options.capture ? "pipe" : "inherit",
        encoding: "utf8",
        ...options,
    });

    if (result.status !== 0) {
        const details = options.capture ? `\n${(result.stderr || result.stdout || "").trim()}` : "";
        throw new Error(`Command failed: ${command} ${commandArgs.join(" ")}${details}`);
    }

    return result;
}

function assertCommand(command, versionArgs = ["--version"], label = command) {
    process.stdout.write(`[start] checking ${label}... `);
    const spec = createSpawnSpec(command, versionArgs);
    const result = spawnSync(spec.file, spec.args, {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8",
    });

    if (result.status !== 0) {
        process.stdout.write("missing\n");
        throw new Error(`${label} is required but was not found in PATH.`);
    }

    const output = (result.stdout || result.stderr || "").trim().split(/\r?\n/)[0];
    process.stdout.write(`${output}\n`);
}

function hasNodeModules() {
    return existsSync(resolve(ROOT, "node_modules"));
}

function hasPythonRequirements() {
    const check = spawnSync("python", ["-c", "import fastapi, uvicorn, numpy"], {
        cwd: PYTHON_DIR,
        stdio: "ignore",
    });

    return check.status === 0;
}

function ensureDockerDaemon() {
    process.stdout.write("[start] checking docker daemon... ");
    const result = spawnSync("docker", ["info"], {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8",
    });

    if (result.status !== 0) {
        process.stdout.write("offline\n");
        throw new Error("Docker is installed but the daemon is not available. Start Docker Desktop and try again.");
    }

    process.stdout.write("ok\n");
}

function ensureNodeDependencies() {
    if (skipNpmInstall) {
        console.log("[start] skipping npm install (--skip-npm-install)");
        return;
    }

    if (hasNodeModules()) {
        console.log("[start] node dependencies already installed");
        return;
    }

    console.log("[start] installing npm dependencies...");
    run("npm", ["install"]);
}

function ensurePythonDependencies() {
    if (skipPythonInstall) {
        console.log("[start] skipping python dependency install (--skip-python-install)");
        return;
    }

    if (hasPythonRequirements()) {
        console.log("[start] python dependencies already installed");
        return;
    }

    console.log("[start] installing python dependencies...");
    run("python", ["-m", "pip", "install", "-r", REQUIREMENTS_FILE]);
}

function startStack() {
    console.log("[start] booting full development stack...");

    const child = spawn(process.execPath, [resolve(ROOT, "scripts", "dev.mjs")], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env,
    });

    child.on("exit", (code, signal) => {
        if (signal) {
            process.kill(process.pid, signal);
            return;
        }

        process.exit(code ?? 0);
    });
}

function waitForUrl(url, timeoutMs = 30000) {
    const startedAt = Date.now();

    return new Promise((resolvePromise, rejectPromise) => {
        const attempt = () => {
            const request = http.get(url, (response) => {
                response.resume();
                if ((response.statusCode || 500) < 500) {
                    resolvePromise();
                    return;
                }

                retry();
            });

            request.on("error", retry);
        };

        const retry = () => {
            if (Date.now() - startedAt >= timeoutMs) {
                rejectPromise(new Error(`Timed out waiting for ${url}`));
                return;
            }

            setTimeout(attempt, 1000);
        };

        attempt();
    });
}

function openBrowser(url) {
    if (noOpen) {
        return;
    }

    if (isWindows) {
        spawn("cmd.exe", ["/d", "/s", "/c", "start", "", url], { cwd: ROOT, detached: true, stdio: "ignore" }).unref();
        return;
    }

    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    spawn(opener, [url], { cwd: ROOT, detached: true, stdio: "ignore" }).unref();
}

async function main() {
    console.log("[start] Andromeda bootstrap");
    assertCommand("node");
    assertCommand("npm");
    assertCommand("python");
    assertCommand("docker", ["--version"], "docker");
    ensureDockerDaemon();
    ensureNodeDependencies();
    ensurePythonDependencies();

    if (checkOnly) {
        console.log("[start] environment check completed successfully");
        return;
    }

    startStack();
    await waitForUrl("http://127.0.0.1:5000/v1/health", 30000);
    await waitForUrl("http://127.0.0.1:5173", 30000);
    await waitForUrl("http://127.0.0.1:8008/health", 30000);
    if (!noOpen) {
        console.log("[start] opening http://127.0.0.1:5173");
        openBrowser("http://127.0.0.1:5173");
    }
}

main().catch((error) => {
    console.error(`[start] failed: ${error.message}`);
    process.exit(1);
});
