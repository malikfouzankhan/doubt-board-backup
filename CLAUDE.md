@AGENTS.md
# Doubt Board (v1)

A live, anonymous Q&A board for sessions. Attendees scan a QR code, post doubts, and upvote each other's. The host sees the top doubts on a big screen and can group similar ones with AI.

## The Canvas (why this exists)

1. **Who:** A speaker running a session for 50 to 200 people, and attendees who have doubts but won't raise their hand.
2. **Problem:** In big sessions most doubts never get asked because people are shy, and the speaker can't tell which ones matter most.
3. **Smallest version (3 features):**
   - Post a question anonymously
   - Upvote questions, list sorted by votes, updates live
   - Host view with AI grouping of similar questions (plus a hide button)
4. **Data:** One table of questions.
5. **Where:** Mobile web via QR code. No install, no signup.
6. **Success:** 20+ real questions from the room within 5 minutes of going live.

## NOT building in v1

Login, multiple rooms, replies, comments, profiles, editing or deleting by attendees, marking questions as answered. If a change isn't needed for the 3 features above, don't add it.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase: Postgres + Realtime (`@supabase/supabase-js`), using the new publishable/secret API keys (not the legacy anon/service_role keys)
- Google Gemini API (`@google/genai`), model `gemini-2.5-flash-lite`, for grouping (this backup repo uses Gemini instead of the Anthropic API used in the live build)
- Deployed on Vercel

## Data model

Table `questions`:

| column | type | notes |
|---|---|---|
| id | uuid | primary key, default `gen_random_uuid()` |
| text | text | required, 1 to 280 characters (enforce with a check constraint) |
| votes | int | default 0 |
| hidden | boolean | default false |
| created_at | timestamptz | default `now()` |

- Votes are incremented through a Postgres function `upvote(question_id uuid)` so concurrent votes don't overwrite each other. Make it `security definer` (with `set search_path = public`), only upvote rows where `hidden = false`, and grant execute to `anon`.
- Realtime must be enabled on `questions` (`alter publication supabase_realtime add table questions;`).
- Put all SQL in `supabase/schema.sql` so it can be pasted into the Supabase SQL editor.

## Security rules (keep them simple but real)

- Row Level Security ON for `questions`.
- Anonymous users may: SELECT rows where `hidden = false`, INSERT new questions, and call `upvote()`.
- The INSERT policy must check `votes = 0 and hidden = false`, so nobody can post a question that starts with 1000 votes.
- Anonymous users may NOT update or delete rows directly.
- Hiding questions and AI grouping happen in server route handlers using the Supabase secret key, and only when the request carries the correct host passcode.
- Never expose the secret key or the Gemini key to the browser.

## Pages

### `/` Audience (mobile-first)
- Text box (max 280 chars, live character count) + "Ask" button
- List of visible questions, sorted by votes (desc), then newest first
- Upvote button on each question. One vote per question per device: store voted IDs in `localStorage`, disable the button after voting
- New questions and vote changes appear live via Supabase Realtime, no refresh
- Realtime respects RLS, so audience clients never receive the event when a question becomes hidden. As a safety net, also refetch the full list every 15 seconds (this also covers missed events on flaky wifi)

### `/host` Host screen (projector-friendly)
- Passcode gate: host enters the passcode once, it's kept in `sessionStorage` and sent as a header to host-only API routes
- Large, readable list of top questions with vote counts
- "Hide" button on each question
- "Group with AI" button: sends all visible questions to Gemini, shows the returned themes, each with its questions and the total votes for that theme, themes sorted by total votes
- Grouping results are shown in the UI only, not stored

## API routes

- `POST /api/hide` body `{ id }`, requires passcode header, sets `hidden = true` using the secret key
- `POST /api/group` requires passcode header, returns `{ themes: [{ title, questionIds }] }`
  - Prompt Gemini to return ONLY JSON in that shape, with short theme titles (max 6 words), every question in exactly one theme
  - Strip code fences and parse safely; on failure return a clear error the UI can show

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_...  (safe in browser)
SUPABASE_SECRET_KEY=                    # sb_secret_...       (server only)
GEMINI_API_KEY=
HOST_PASSCODE=
```

## How to work on this project

- Show a plan before writing code, and ask if anything is unclear.
- Build one feature at a time. Keep each change small and working.
- Prefer simple, readable code over clever abstractions. No extra libraries unless necessary.
- Clean, minimal UI. Large tap targets on mobile. Large text on `/host` so it reads well on a projector.