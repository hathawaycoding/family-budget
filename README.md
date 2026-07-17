# Family Budget

Local-first Next.js MVP for the July 2026 through December 2026 household budget worksheet.

## Run Locally

1. Copy `.env.example` to `.env` and change secrets/password hash before real use.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3200`.

Local fallback login password: `budget2026`. Choose actor `CS` or `TCH`.

## Docker

Run the app, PostgreSQL, and Adminer:

```sh
docker compose up --build
```

Expected URLs:

- App: `http://localhost:3200`
- Adminer: `http://localhost:8080`

## Database

Generate Prisma client:

```sh
npm run prisma:generate
```

Create/run development migrations:

```sh
npm run prisma:migrate
```

Seed sample household rows:

```sh
npm run prisma:seed
```

## Verification

```sh
npm run test
npm run build
```
