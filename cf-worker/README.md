# Avatar Stylization Proxy (Cloudflare Worker)

A tiny Worker that lets the public GitHub Pages site call OpenAI Images
without ever exposing the OpenAI API key.

```
Browser (GitHub Pages)
        │  POST multipart  +  Authorization: Bearer <password>
        ▼
   Cloudflare Worker  ──► OpenAI /v1/images/edits  (with the real key)
        │
        ▼
   image/png back to the browser
```

The frontend's "Unlock AI" card collects the password, stores it in
`sessionStorage` (cleared on tab close), and re-prompts on `401`.

---

## One-time setup (about 3 minutes)

> Run everything below from the `cf-worker/` directory.

### 1. Get a free Cloudflare account

Sign up at <https://dash.cloudflare.com/sign-up>. Free tier is plenty
(100k Worker requests/day).

### 2. Install deps and log in

```bash
cd cf-worker
npm install
npx wrangler login          # opens a browser tab to authorize
```

### 3. Set the two secrets

`wrangler` will prompt you to paste each value (it never lands in any file):

```bash
npx wrangler secret put OPENAI_API_KEY
# paste your sk-... key, hit enter

npx wrangler secret put UNLOCK_PASSWORD
# paste any password, hit enter — this is what users type into the Unlock card
```

> Make the password something only you (and people you trust) will know.
> If it ever leaks, run the same command again to rotate it.

### 4. Deploy

```bash
npm run deploy
```

You'll see something like:

```
Published tinsleytoolbox-avatar-proxy
  https://tinsleytoolbox-avatar-proxy.<your-account>.workers.dev
```

Copy that URL — that's your endpoint.

### 5. Tell the frontend where the proxy lives

From the project root:

```bash
echo 'VITE_AVATAR_GEN_ENDPOINT=https://tinsleytoolbox-avatar-proxy.<your-account>.workers.dev' \
  > .env.production.local
```

(`.env.production.local` is gitignored, but the URL itself isn't a secret —
it's protected by the password.)

### 6. Re-deploy the site

```bash
cd ..
npm run deploy
```

Open <https://tinsleyfok.github.io/TinsleyToolbox/app/system/avatar>
→ "Unlock AI" → password → Upload Image → Generate.

---

## Updating later

- **Change the password**: `npx wrangler secret put UNLOCK_PASSWORD`
  (no redeploy needed; takes effect immediately).
- **Rotate the OpenAI key**: `npx wrangler secret put OPENAI_API_KEY`.
- **Add another allowed origin** (e.g. a staging URL): edit
  `ALLOWED_ORIGINS` in `wrangler.toml` and run `npm run deploy`.
- **Tail live logs while debugging**: `npm run tail`.

## Allowed origins

`wrangler.toml` ships with:

```
ALLOWED_ORIGINS = "https://tinsleyfok.github.io,http://localhost:5173"
```

The Worker only sets CORS headers for those origins. If you fork this
project, edit the list before deploying.

## What this Worker does NOT do

- No rate limiting beyond Cloudflare's default per-IP throttling. If abuse
  becomes a problem, add a `@cloudflare/workers-types` Durable Object or KV
  counter keyed on `cf-connecting-ip`.
- No request logging. `npm run tail` streams live logs to your terminal,
  but nothing is persisted.
