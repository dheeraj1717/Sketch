# Deployment Guide

This guide covers the deployment of the Sketch monorepo, which consists of a Next.js frontend, two Express-based backends (HTTP and WS), and a PostgreSQL database.

## Architecture Overview
- **Frontend**: [apps/sketch-frontend](file:///c:/projects/Sketch/apps/sketch-frontend) (Next.js)
- **HTTP Backend**: [apps/http-backend](file:///c:/projects/Sketch/apps/http-backend) (Express)
- **WS Backend**: [apps/ws-backend](file:///c:/projects/Sketch/apps/ws-backend) (WebSocket)
- **Database**: PostgreSQL (Prisma)

---

## 1. Prerequisites
- A GitHub repository for your code.
- Accounts on:
  - **Vercel**: For the frontend.
  - **Railway** or **Render**: For the backends and database.
  - **Supabase** (Optional): If you prefer a dedicated managed database.

---

## 2. Database Setup (Supabase / Railway)
1. Create a new PostgreSQL database.
2. Get your `DATABASE_URL` (e.g., `postgresql://user:pass@host:port/db`).
3. Set this URL in your `.env` file at the root.

---

## 3. Backend Deployment (Railway/Render)
Since we have two backends, you should deploy them as separate services.

### HTTP Backend
1. **Root Directory**: `apps/http-backend`
2. **Install Command**: `pnpm install`
3. **Build Command**: `pnpm run build`
4. **Start Command**: `pnpm run start` (or `node dist/index.js`)
5. **Environment Variables**:
   - `DATABASE_URL`: Your Postgres URL.
   - `JWT_SECRET`: A long random string.
   - `REFRESH_JWT_SECRET`: Another long random string.
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://sketch-app.vercel.app`).

### WS Backend
1. **Root Directory**: `apps/ws-backend`
2. **Install/Build/Start**: Same as HTTP Backend.
3. **Environment Variables**:
   - `DATABASE_URL`: Your Postgres URL.
   - `JWT_SECRET`: Same as HTTP Backend.

---

## 4. Frontend Deployment (Vercel)
1. Create a new project in Vercel and point it to your repo.
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/sketch-frontend`
4. **Build Settings**:
   - **Build Command**: `cd ../.. && pnpm build --filter=sketch-frontend`
   - **Install Command**: `pnpm install`
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE`: URL of your deployed HTTP backend.
   - `NEXT_PUBLIC_WS_BASE`: URL of your deployed WS backend (use `wss://`).

---

## 5. CI/CD with GitHub Actions
I have created a `.github/workflows/ci.yml` file to handle automated tests. Every time you push to `main` or open a PR, it will:
1. Install dependencies.
2. Run Linting.
3. Check Types.
4. Attempt a full Build.

> [!TIP]
> Use Turborepo's **Remote Caching** for even faster builds in CI. You can set this up with a Vercel account.

---

## 6. Local to Production Check
- Ensure `CORS` is correctly configured in `http-backend/src/index.ts` to allow your production frontend domain.
- Verify that your WebSocket connections use `wss://` in production.
