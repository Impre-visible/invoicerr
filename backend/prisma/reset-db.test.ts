import { config } from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../.env.test");

config({ path: envPath });

import { execSync } from "child_process";

const schemaPath = path.resolve(__dirname, "./schema.prisma");

execSync(`node ../node_modules/.bin/prisma migrate reset --force --schema=${schemaPath}`, { stdio: "inherit" });