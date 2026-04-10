This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Queue-based Scan Flow

`/api/scan` now enqueues scan jobs and returns `202` with a `jobId`.
The actual Playwright scan runs in the queue callback route and the client polls `/api/scan/[jobId]` until the job is done.

### Required setup (Vercel)

1. Add an Upstash Redis integration (or compatible Redis with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars).
2. Enable Vercel Queues for this project.
3. Ensure `vercel.json` is deployed with the queue trigger for topic `scan-jobs`.
4. Pull env vars locally before `next dev`:

```bash
vc link
vc env pull
```

### Optional env vars

- `SCAN_JOB_TTL_SECONDS` (default: `1800`)
- `SCAN_LOW_RESOURCE_MODE` (`1`/`true` recommended in low-memory serverless)
- `PLAYWRIGHT_TMP_CLEANUP` (default: enabled, cleans stale Playwright temp profiles in `/tmp`)
- `PLAYWRIGHT_RESET_BROWSER_AFTER_SCAN` (default: enabled when `SCAN_LOW_RESOURCE_MODE=1`; trades latency for stability)
- Queue worker uses lock-wait (~55s) + short busy retry (~6s), so the next job starts soon after current one finishes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
