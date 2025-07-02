# Invoicerr

Invoicerr is a simple, open-source invoicing application designed to help freelancers manage their quotes and invoices efficiently. It provides a clean interface for creating, sending, and tracking quotes and invoices — so you get paid faster, with less hassle.

![Dashboard Page](https://github.com/user-attachments/assets/18e8af88-cf02-4e35-975a-d57f58d062c6)

## ✨ Features

- 🧾 Create and manage invoices  
- 📄 Create and manage quotes (convertible to invoices)  
- 👥 Manage clients and their contact details  
- 📊 Track status of quotes and invoices (signed, paid, unread, etc.)  
- 🖋️ Built-in quote signing system with secure tokens  
- 📬 Generate and send quote/invoice emails directly from the app
- 🖨️ Generate clean PDF documents (quotes and invoices)  
- 🎨 Custom brand identity: logo, company name, VAT, and more  
- 🔐 Authentication via JWT (stored in local storage)  
- 🧭 International-friendly: Default English UI, customizable currencies  
- 📁 SQLite database for quick local setup  
- 🐳 Docker & docker-compose ready for self-hosting  
- 🧱 Built with modern stack: React, NestJS, Prisma, SQLite/PostgreSQL  
- 🔧 REST API backend, ready for future integrations

---

## 🐳 Docker Installation (Recommended)

The fastest way to run Invoicerr is using Docker Compose. A prebuilt image is available at [ghcr.io/impre-visible/invoicerr](https://ghcr.io/impre-visible/invoicerr).

### 🚀 Quick Start

1. Clone the repository:  
   ```bash
   git clone https://github.com/Impre-visible/invoicerr.git
   cd invoicerr
   ```

2. Edit the `docker-compose.yml` to set your environment variables.

3. Run the app:  
   ```bash
   docker compose up -d
   ```

4. Open your browser at:  
   ```
   http://localhost
   ```

---

### 🔧 Environment Variables

These environment variables are defined in `docker-compose.yml` under the `invoicerr` service:

- `DATABASE_URL`  
  PostgreSQL connection string. Example:  
  `postgresql://invoicerr:invoicerr@invoicerr_db:5432/invoicerr_db`

- `APP_URL`  
  Full public URL of the frontend (e.g., `https://invoicerr.example.com`).  
  This is required for email templates and links.

- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`  
  Credentials and server used for sending emails (quotes, invoices, etc.)

- `SMTP_FROM`  
  Optional — address used as the sender for emails. If omitted, defaults to `SMTP_USER`.

- `JWT_SECRET`  
  Optional but recommended for JWT authentication. Can be any random string.  
  If not set, a default secret will be used. But it can have issues with docker deployments.

Make sure port 80 is available on your host machine, or change the mapping.

---

## 💻 Manual Installation (Local Development)

### Prerequisites

- Node.js v20+  
- SQLite (or configure another `DATABASE_URL`)  
- PNPM or NPM

### Steps

1. Clone the project:  
   ```bash
   git clone https://github.com/Impre-visible/invoicerr.git
   cd invoicerr
   ```

2. Backend setup:  
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```

3. Frontend setup (in a new terminal):  
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open in your browser:  
   - Frontend: `http://localhost:5173`  
   - API: `http://localhost:3000`

---

## 📸 Screenshots

<details>
<summary>Dashboard</summary>
  
![Dashboard Page](https://github.com/user-attachments/assets/18e8af88-cf02-4e35-975a-d57f58d062c6)
  
</details>

<details>
<summary>Quotes</summary>

![Quotes Page](https://github.com/user-attachments/assets/588d5cd2-6af3-4cb9-81d3-8faa9f3d30f4)

</details>

<details>
<summary>Invoices</summary>
  
![Invoices Page](https://github.com/user-attachments/assets/8e5134b7-c401-4ff6-bdb9-cfe54b532b29)

</details>

<details>
<summary>Clients</summary>

![Clients Page](https://github.com/user-attachments/assets/1e9e42be-8c21-4c84-96dd-ce8dca17c32e)

</details>

<details>
<summary>Settings</summary>
  
![Settings Page](https://github.com/user-attachments/assets/b8913f41-109a-4e31-a1b8-3c46a1039414)

</details>
