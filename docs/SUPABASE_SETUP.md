# Supabase setup (Auth, Database, Google SSO)

## 1. SQL: Create `reports` table and RLS

In **Supabase Dashboard** go to **SQL Editor** and run:

```sql
-- Reports table for storing product analyses per user
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

You can copy the same from `supabase/migrations/001_reports_table.sql`.

---

## 2. Google Client ID and Client Secret

Google SSO is configured **in the Supabase Dashboard** using Google OAuth credentials.

### Get credentials from Google

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** → **Credentials**.
4. Click **Create credentials** → **OAuth client ID**.
5. If prompted, configure the **OAuth consent screen** (external user type is fine).
6. Application type: **Web application**.
7. Add **Authorized redirect URIs**:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Example: `https://aazkbdipwronndtcwjsp.supabase.co/auth/v1/callback`
8. Create and copy the **Client ID** and **Client Secret**.

### Configure Supabase

1. In **Supabase Dashboard** go to **Authentication** → **Providers** → **Google**.
2. Enable Google.
3. Paste **Client ID** and **Client Secret**.
4. Save.

You do **not** need to put `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in your app’s `.env` for the built-in Supabase Google SSO; the app only needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on the client, and `SUPABASE_URL` and `SUPABASE_ANON_KEY` on the server.

### Optional: use env vars for Google

If you ever need the Google credentials in your own code (e.g. a custom backend flow), add to `.env`:

- `GOOGLE_CLIENT_ID` – from the Google OAuth client.
- `GOOGLE_CLIENT_SECRET` – from the Google OAuth client.

The current app does not read these; Supabase Auth uses the values you set in the Dashboard.

---

## 3. App environment variables

- **Client** (`client/.env`):  
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_API_URL`.
- **Server** (`server/.env`):  
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the rest (OpenAI, Rainforest, etc.).

Use `server/.env.example` and `client/.env.example` as templates.
