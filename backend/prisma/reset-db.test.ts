import { config } from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../.env.test");

config({ path: envPath });

import { execSync } from "child_process";

const schemaPath = path.resolve(__dirname, "./schema.prisma");
const prismaPath = path.resolve(__dirname, "../node_modules/.bin/prisma");

execSync(`node ${prismaPath} migrate reset --force --schema=${schemaPath}`, { stdio: "inherit" });