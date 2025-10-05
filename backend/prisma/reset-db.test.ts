import { config } from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../.env.test");

config({ path: envPath });

import { execSync } from "child_process";

const schemaPath = path.resolve(__dirname, "./schema.prisma");

execSync(`npx prisma migrate reset --force --skip-seed --schema=${schemaPath}`, { stdio: "inherit" });