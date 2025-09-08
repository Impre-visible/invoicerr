import path from 'node:path';
import { defineConfig } from 'prisma/config';

import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // Point to your schema file
  schema: path.join('prisma', 'schema'),

  // Where migrations live + how to seed
  migrations: {
    path: path.join('prisma', 'migrations'),
  },

  // Optional: if you store SQL view definitions
  //   views: { path: path.join('prisma', 'views') },

  // Optional/advanced: exclude externally managed tables from Migrate
  // tables: { external: ["users"] }
});