import { spawn } from "node:child_process";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = resolve(ROOT, "packages", "api");
const WEB_DIR = resolve(ROOT, "apps", "web");
const PYTHON_DIR = resolve(ROOT, "services", "cognitive-python");
const isWindows = process.platform === "win32";
const skipInfra = process.argv.includes("--skip-infra");

const children = [];
let shuttingDown = false;

function resolveCommand(command) {
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

function createSpawnArgs(command, args) {
    if (!isWindows) {
        return {
            file: resolveCommand(command),
            args,
        };
    }

    const cmdline = [resolveCommand(command), ...args.map(quoteWindowsArg)].join(" ");
    return {
        file: "cmd.exe",
        args: ["/d", "/s", "/c", cmdline],
    };
}

function spawnProcess(name, command, args, cwd = ROOT) {
    console.log(`[dev] starting ${name}...`);

    const processSpec = createSpawnArgs(command, args);

    const child = spawn(processSpec.file, processSpec.args, {
        cwd,
        stdio: "inherit",
        env: process.env,
    });

    children.push(child);

    child.on("exit", (code, signal) => {
        if (shuttingDown) {
            return;
        }

        const status = signal ? `signal ${signal}` : `code ${code ?? 0}`;
        console.error(`[dev] ${name} exited with ${status}`);

        if ((code ?? 0) !== 0) {
            shutdown(code ?? 1);
        }
    });

    child.on("error", (error) => {
        if (shuttingDown) {
            return;
        }

        console.error(`[dev] failed to start ${name}:`, error);
        shutdown(1);
    });

    return child;
}

function runCommand(name, command, args, cwd = ROOT) {
    return new Promise((resolvePromise, rejectPromise) => {
        console.log(`[dev] running ${name}...`);

        const processSpec = createSpawnArgs(command, args);

        const child = spawn(processSpec.file, processSpec.args, {
            cwd,
            stdio: "inherit",
            env: process.env,
        });

        child.on("exit", (code) => {
            if (code === 0) {
                resolvePromise();
                return;
            }

            rejectPromise(new Error(`${name} exited with code ${code ?? 1}`));
        });

        child.on("error", rejectPromise);
    });
}

function terminateChild(child) {
    if (!child.pid) {
        return Promise.resolve();
    }

    if (isWindows) {
        return new Promise((resolvePromise) => {
            const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
                stdio: "ignore",
            });

            killer.on("exit", () => resolvePromise());
            killer.on("error", () => resolvePromise());
        });
    }

    child.kill("SIGTERM");
    return Promise.resolve();
}

function isPortOpenOnHost(port, host) {
    return new Promise((resolvePromise) => {
        const socket = new net.Socket();

        const finish = (result) => {
            socket.destroy();
            resolvePromise(result);
        };

        socket.setTimeout(1000);
        socket.once("connect", () => finish(true));
        socket.once("timeout", () => finish(false));
        socket.once("error", () => finish(false));
        socket.connect(port, host);
    });
}

async function isPortOpen(port) {
    for (const host of ["127.0.0.1", "::1", "localhost"]) {
        if (await isPortOpenOnHost(port, host)) {
            return true;
        }
    }

    return false;
}

async function shutdown(exitCode = 0) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    await Promise.all(children.map((child) => terminateChild(child)));
    process.exit(exitCode);
}

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));

try {
    if (!skipInfra) {
        await runCommand("docker infra", "docker", ["compose", "up", "-d", "postgres", "redis"]);
    }

    await runCommand("prisma sync", "npm", ["run", "prisma:sync", "--", "--skip-generate"], API_DIR);

    if (await isPortOpen(5000)) {
        console.log("[dev] api already running on http://127.0.0.1:5000, skipping startup");
    } else {
        spawnProcess("api", "npm", ["run", "dev"], API_DIR);
    }

    if (await isPortOpen(5173)) {
        console.log("[dev] web already running on http://127.0.0.1:5173, skipping startup");
    } else {
        spawnProcess("web", "npm", ["run", "dev"], WEB_DIR);
    }

    if (await isPortOpen(8008)) {
        console.log("[dev] cognitive-python already running on http://127.0.0.1:8008, skipping startup");
    } else {
        spawnProcess(
            "cognitive-python",
            "python",
            ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8008", "--reload"],
            PYTHON_DIR,
        );
    }

    console.log("[dev] stack ready: API http://127.0.0.1:5000 | Web http://127.0.0.1:5173 | Python http://127.0.0.1:8008");
} catch (error) {
    console.error("[dev] startup failed:", error);
    await shutdown(1);
}
