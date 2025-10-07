
import { defineConfig } from "cypress";
import { exec } from "child_process";

export default defineConfig({
  e2e: {
    video: true,
    experimentalStudio: true,
    setupNodeEvents(on, config) {
      on('before:run', (details) => {
        console.log('Override before:run');
        return new Promise((resolve, reject) => {
          exec('node ../backend/prisma/reset-db.test.ts', (err: any, stdout: any, stderr: any) => {
            if (err) {
              console.error(stderr);
              return reject(err);
            }
            console.log(stdout);
            resolve();
          });
        });
      });
    },
    baseUrl: process.env.FRONTEND_URL || "http://localhost:6284",
    specPattern: "cypress/e2e/**/*.cy.{js,ts}",
    supportFile: "cypress/support/e2e.ts",
  }
});
