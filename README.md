# 🚀 Bot Web Hosting Panel — Installation & Startup Guide

Follow these sequential command-line instructions to download dependencies, compile static assets, and boot up the Web Hosting Panel.

---

### 1. 📦 Download & Install Project Dependencies
Run this command at the root directory of the project to download all necessary libraries:
```bash
npm install
```

---

### 2. 🛠️ Build and Compile the Application
This command builds the React static files with Vite, and packs the TypeScript backend server into a production-ready bundle (`dist/server.cjs`) using `esbuild`:
```bash
npm run build
```

---

### 3. 🚦 Start the Server
You can start the server in either development mode or production mode.

#### Option A: Run in Development Mode (Live reload enabled)
```bash
npm run dev
```

#### Option B: Run in Production Mode (High performance, bundled execution)
```bash
npm run start
```

---

### 🛡️ Default Administrator Credentials
Upon first launch, the SQLite database is automatically seeded. You can access the panel using:
- **Username:** `admin`
- **Password:** `admin`
