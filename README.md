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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin and the client portal

- **Admin** (`/admin`, signed in with the admin password): **Today** gathers what needs attention across everything (client messages and estimates to confirm, new leads, outreach replies, Ask Craefto hand-offs, applications), what's coming up, and each client's hours this month. Then **Leads**, **Outreach**, **Ask Craefto** chats, **Clients** (the portal accounts), **Applications**, **Journal** and **Analytics**.
- **Client portal** (`/portal`): clients send requests, get Ask Craefto's initial estimate, approve the confirmed one, and follow their queue, hours, calendar and calls. Its tables are the `client_*` ones (see `supabase/migrations/028_client_workflow.sql`).

The April operations tools (proposals and documents, projects, finances, team), the old stakeholder portal and the journal's content agents were removed in October 2026 (`supabase/migrations/029_admin_cleanup.sql`).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
