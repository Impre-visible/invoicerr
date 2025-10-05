import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import waitOn from "wait-on";

function loadEnv(envPath: string) {
    if (fs.existsSync(envPath)) {
        const env = dotenv.parse(fs.readFileSync(envPath));
        return { ...process.env, ...env };
    } else return { ...process.env };
}

// Backend
const backendEnv = loadEnv(path.resolve(__dirname, "../backend/.env.test"));
const backend = spawn("npm", ["run", "start"], {
    cwd: path.resolve(__dirname, "../backend"),
    stdio: "inherit",
    env: { ...backendEnv, NODE_ENV: "test" },
});

// Frontend
const frontendEnv = loadEnv(path.resolve(__dirname, "../frontend/.env.test"));
const frontend = spawn("npm", ["run", "dev"], {
    cwd: path.resolve(__dirname, "../frontend"),
    stdio: "inherit",
    env: { ...frontendEnv, NODE_ENV: "test" },
});

// Attendre que le frontend soit prêt
waitOn({ resources: [`http://localhost:${frontendEnv.VITE_PORT}`], timeout: 20000 })
    .then(() => {
        console.log("Frontend is ready, launching Cypress...");
        const cypress = spawn("npx", ["cypress", "open"], { stdio: "inherit" });

        cypress.on("close", (code) => {
            backend.kill();
            frontend.kill();
            process.exit(code ?? 0);
        });
    })
    .catch((err: Error) => {
        console.error("Error waiting for frontend:", err);
        backend.kill();
        frontend.kill();
        process.exit(1);
    });
