# AB Platform — A/B Script Injection Platform

A web editor to create, edit, and publish JavaScript snippets that can be injected into any external webpage via a `<script>` tag.

---

## Tools and AI usage

During the development of this project I used **Claude** and **ChatGPT** as a starting point to explore possible architectural approaches based on the brief. I prompted both tools with the technical requirements and used their output to evaluate different options — monorepo vs separated backend, different database access patterns, folder structures, and API design alternatives.

After analysing the proposals in the context of the brief — a focused technical test with a clear and bounded scope — I made my own architectural decisions, favouring the simplest and cleanest solution over more elaborate ones. The reasoning behind each decision (why no separate backend, why no repository pattern, why Monaco Editor) is documented throughout this README.

## Stack

| Layer | Technology | Decision |
|---|---|---|
| Framework | Next.js 14 (App Router) | Frontend + API Routes in a single project and deployment |
| Database | Supabase (PostgreSQL) | Required by the brief. Free plan is sufficient |
| Editor | Monaco Editor (`@monaco-editor/react`) | Same engine as VS Code, native JS support, easy to integrate |
| Language | TypeScript | Shared types between frontend and backend with no overhead |
| Deploy | Vercel | Zero-config for Next.js |

**Why not separate frontend and backend?**
For this scope, a Next.js monorepo is the right call: one repository, one deployment, and the API Routes share TypeScript types with the frontend without needing an external contract. If the business logic grew significantly or the API needed to be consumed by multiple clients (mobile, other services), the backend would be extracted into an independent service.

**Why no `services/` or `repositories/` layers?**
There is a single table and a single data source. All data access logic lives in `lib/db/scripts.ts`. API Routes only parse request/response. Adding extra layers would be over-engineering with no real benefit at this scope.

---

## Project structure

```
ab-platform/
├── app/
│   ├── page.tsx                           # Home — script list
│   ├── layout.tsx
│   ├── globals.css
│   ├── editor/[id]/page.tsx               # Script editor page
│   ├── p/[id]/route.ts                    # GET → returns raw public JS (injected in external sites)
│   └── api/
│       ├── scripts/route.ts               # GET (list) / POST (create)
│       ├── scripts/[id]/route.ts          # GET / PUT (save draft)
│       └── scripts/[id]/publish/route.ts  # POST (publish)
├── components/
│   ├── ScriptEditor.tsx                   # Monaco wrapper
│   ├── ScriptList.tsx                     # Script list with status badges
│   └── PublishDialog.tsx                  # Modal with copyable public URL
└── lib/
    ├── supabase.ts                        # Supabase clients (anon + service role)
    ├── types.ts                           # Shared types and interfaces
    └── db/
        └── scripts.ts                     # All Supabase queries
```

Note: the public endpoint lives at `app/p/[id]/route.ts` (not under `app/api/`) so that the public URL is `/p/:id.js` — clean and suitable for injection into external sites via a `<script>` tag.

---

## Database schema

Run this in the Supabase SQL Editor:

```sql
create table scripts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default 'Untitled',
  code         text not null default '',
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

-- Index to speed up lookups on the public endpoint /p/:id.js
create index scripts_status_idx on scripts (id, status);
```

---

## Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/ab-platform.git
cd ab-platform
npm install
```

**2. Environment variables**

Create `.env.local` from the example file:
```bash
cp .env.local.example .env.local
```

Fill in the values from your Supabase project (Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` is only used in API Routes (server-side). It is never exposed to the browser.

**3. Create the table in Supabase**

Go to your Supabase dashboard → SQL Editor and run the schema above.

**4. Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/scripts` | List all scripts |
| `POST` | `/api/scripts` | Create a new empty script |
| `GET` | `/api/scripts/:id` | Get a script by id |
| `PUT` | `/api/scripts/:id` | Save draft `{ code, title? }` |
| `POST` | `/api/scripts/:id/publish` | Publish the script |
| `GET` | `/p/:id.js` | **Public endpoint** — returns raw JavaScript |

The public endpoint returns:
- `Content-Type: application/javascript`
- `Access-Control-Allow-Origin: *` — works from any domain
- The user code wrapped in an IIFE with `try/catch`

---

## Known gotchas

**Next.js 14 fetch cache**
Next.js 14 App Router automatically caches all `fetch` calls at the framework level, including the internal HTTP requests made by the Supabase SDK. Without intervention, API Routes would return stale data after the first request. Fixed by passing a custom `fetch` with `cache: 'no-store'` to the Supabase client, and adding `export const dynamic = 'force-dynamic'` to every API Route:

```ts
// lib/supabase.ts
export function getServiceClient() {
  return createClient(supabaseUrl, serviceKey, {
    global: {
      fetch: (url, options = {}) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  })
}
```

**Public endpoint location**
The public JS endpoint must live at `app/p/[id]/route.ts`, not under `app/api/`. Routes under `app/api/` are served at `/api/...`, which would make the public URL `/api/p/:id.js` instead of the clean `/p/:id.js`.

**React StrictMode double render**
In development, Next.js 14 enables React StrictMode by default, which intentionally mounts components twice to detect side effects. This causes `useEffect` to fire twice in the editor page — this is expected behaviour and does not happen in production.

---

## Technical decisions

### How would you scale the application for multiple users?

**Authentication:** Add Supabase Auth (email/password or OAuth). Login is a single configuration step in Supabase and the SDK already handles session management.

**Data isolation with RLS:** Add a `user_id` column to the `scripts` table and enable Row Level Security:

```sql
alter table scripts add column user_id uuid references auth.users not null;
alter table scripts enable row level security;

create policy "Users see own scripts"
  on scripts for all
  using (auth.uid() = user_id);
```

With this in place, each user only sees and modifies their own scripts with no changes needed in the application logic.

**Infrastructure scalability:**
- The `/p/:id.js` endpoint is the most critical one in production because it receives external traffic from third-party websites. It is already cached with `Cache-Control: public, max-age=60`. To scale further, place this endpoint behind a CDN (Cloudflare, Vercel Edge) to serve from the edge without hitting the database.
- The Supabase database scales vertically with the plan tier. For high load, add indexes on `(id, status)` and `(user_id, created_at)`.

---

### How would you prevent the injected script from negatively affecting the host page?

The public endpoint already applies the first line of defense: wrapping the user code in an **IIFE with `try/catch` and `'use strict'`**:

```javascript
(function() {
  'use strict';
  try {
    // user code
  } catch (e) {
    console.error('[AB Platform] Script error:', e);
  }
})();
```

This guarantees:
- **Scope isolation**: local variables inside the script do not leak into `window`.
- **Error containment**: if the script throws an exception, the `catch` block logs it without breaking the rest of the host page.
- **`'use strict'`**: prevents silent bugs such as accidental assignments to global variables.

**Additional production hardening:**

- **iframe sandbox**: inject the script inside an isolated iframe (`sandbox="allow-scripts"`) to fully separate the DOM and events. More secure, but limits access to the host page DOM — which is often not viable for A/B use cases that need to modify the UI.
- **CSP on the platform itself**: the editor app enforces a strict Content Security Policy to protect its own surface.
- **Pre-publish validation**: run the user code in a Web Worker with a timeout before publishing to catch infinite loops or obviously malicious code.

---

### How would you implement versioning?

Create a `script_versions` table that snapshots the code on every publish:

```sql
create table script_versions (
  id          uuid primary key default gen_random_uuid(),
  script_id   uuid not null references scripts(id) on delete cascade,
  version     integer not null,
  code        text not null,
  created_at  timestamptz not null default now(),
  unique(script_id, version)
);
```

In the publish endpoint, insert a new version before updating the main script record:

```typescript
// Inside publishScript():

// 1. Get the latest version number
const { data: lastVersion } = await db
  .from('script_versions')
  .select('version')
  .eq('script_id', id)
  .order('version', { ascending: false })
  .limit(1)
  .single()

const nextVersion = (lastVersion?.version ?? 0) + 1

// 2. Snapshot the current code
await db.from('script_versions').insert({
  script_id: id,
  version: nextVersion,
  code: currentCode,
})

// 3. Update the main script record
await db.from('scripts').update({ status: 'published', ... }).eq('id', id)
```

The `/p/:id.js` endpoint continues serving the latest published version. To serve a specific version, a variant route like `/p/:id@v2.js` can be added.

The editor panel would display the version history and allow rollback by updating the `code` field in `scripts` with the code from any previous version.

---

### How would you add real A/B segmentation and event tracking?

**Data model for A/B:**

```sql
-- Add variant info to scripts
alter table scripts add column variant text check (variant in ('A', 'B'));
alter table scripts add column experiment_id uuid;

-- Events table
create table events (
  id            uuid primary key default gen_random_uuid(),
  script_id     uuid not null references scripts(id),
  experiment_id uuid not null,
  variant       text not null,
  event_type    text not null,  -- 'impression', 'click', 'conversion', or custom
  session_id    text not null,  -- generated on the client, persisted in sessionStorage
  properties    jsonb,          -- additional event data
  created_at    timestamptz not null default now()
);

create index on events (experiment_id, variant, event_type);
```

**Tracking SDK injected automatically:**

The `/p/:id.js` endpoint would prepend a small SDK before the user code:

```javascript
(function() {
  'use strict';

  window.__ab = {
    scriptId: '{{scriptId}}',
    experimentId: '{{experimentId}}',
    variant: '{{variant}}',
    sessionId: sessionStorage.getItem('__ab_sid') || (function() {
      var id = Math.random().toString(36).slice(2);
      sessionStorage.setItem('__ab_sid', id);
      return id;
    })(),

    track: function(eventType, properties) {
      fetch('https://your-domain.com/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: this.scriptId,
          experiment_id: this.experimentId,
          variant: this.variant,
          session_id: this.sessionId,
          event_type: eventType,
          properties: properties || {}
        }),
        keepalive: true
      });
    }
  };

  window.__ab.track('impression');

  try {
    {{userCode}}
  } catch(e) {
    console.error('[AB Platform] Script error:', e);
  }
})();
```

**Variant assignment:** assign a variant deterministically on the client based on a hash of the `session_id`, so the same user always sees the same variant.

**Analysis:** with events stored in Supabase, compute conversion rates per variant with a single query:

```sql
select
  variant,
  count(distinct session_id) filter (where event_type = 'impression') as impressions,
  count(distinct session_id) filter (where event_type = 'conversion') as conversions,
  round(
    count(distinct session_id) filter (where event_type = 'conversion')::numeric /
    nullif(count(distinct session_id) filter (where event_type = 'impression'), 0) * 100,
    2
  ) as conversion_rate
from events
where experiment_id = '{{id}}'
group by variant;
```

---

## Future improvements

- Integration tests for API Routes with `vitest`
- Rate limiting on `/p/:id.js` to prevent abuse
- Code validation before publishing (sandboxed execution with timeout)
- Real-time A/B metrics dashboard using Supabase Realtime
- Authentication with Supabase Auth
- Version history in the editor with visual diff