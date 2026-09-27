# Doubt Board v1: Live Demo Script

Target: about 60 minutes, from blank idea to a live link the room is using.

---

## Tonight: pre-setup checklist

Do all of this before the event so the stage time is only about product decisions and building.

- [ ] Create a fresh Next.js app (App Router, TypeScript, Tailwind) in a new folder, e.g. `doubt-board-live`
- [ ] Install `@supabase/supabase-js` and `@anthropic-ai/sdk` so nobody watches npm install
- [ ] Create a new Supabase project for the live build (separate from the backup)
- [ ] Fill `.env.local` with all 5 variables from CLAUDE.md
- [ ] Push the empty app to GitHub and link it to a Vercel project, env variables added in Vercel too
- [ ] Optional but great: point a subdomain like `ask.fouzan.dev` to that Vercel project, then make the QR code tonight and put it in your slides
- [ ] Keep CLAUDE.md OUT of the repo for now. You add it live (it's a key moment)
- [ ] Do one full rehearsal of the prompts below in a throwaway folder. Note how long each step takes
- [ ] Deploy the backup version separately and keep its URL + QR handy
- [ ] Terminal font size large, browser preview large, split screen ready
- [ ] Mobile hotspot charged

---

## Stage flow

### 1. Canvas with the audience (10 min)
- Put the blank canvas on screen. Ask the room each question.
- Ask "what features should it have?" Let them shout. Write everything down. Then cut to 3.
- **Say:** "Every feature we cut today is a feature we can add next week. Every feature we add today is a feature that can break on stage."

### 2. Pick the stack (5 min)
- Walk through the IF/THEN guide from the handout.
- Users + data + AI feature = Next.js + Supabase + Claude API + Vercel.
- **Say:** "I'm not picking this because it's cool. I'm picking it because it's boring, popular, and AI tools know it really well."

### 3. CLAUDE.md + plan mode (5 min)
- Drop CLAUDE.md into the project. Scroll through it on screen.
- **Say:** "This file is the brain of the project. The canvas we just filled is literally at the top. The AI reads this before every change."
- Switch Claude Code to plan mode and send **Prompt 0**.
- Review the plan out loud. Cut anything extra it proposes.

### 4. Build (25 min)
Send Prompts 1, 2 and 3 one at a time. After each one, test it in the browser on screen before moving on.
- **Say:** "One feature, test, next feature. One giant prompt is one giant mess."

### 5. Deploy (5 min)
- Commit and push. Vercel deploys automatically.
- QR on screen. "Go. Ask me anything about building products."

### 6. Use it live (10 min)
- Open `/host` on the projector. Watch questions pour in.
- Hit "Group with AI". Answer the top themes.
- Hide one silly question if needed. **Say:** "Real products think about misuse from day one."

---

## The prompts

### Prompt 0: Plan (plan mode)
```
Read CLAUDE.md. Before writing any code, give me a short plan for v1:
the files you'll create, the database setup, and the order you'll build
the 3 features in. Keep it as simple as possible. Ask me if anything is unclear.
```

### Prompt 1: Database + posting questions
```
Let's build feature 1 only.

1. Write supabase/schema.sql with the questions table, the check constraint,
   the upvote() function, the RLS policies, and realtime enabled, exactly as
   described in CLAUDE.md.
2. Set up a Supabase client for the browser.
3. Build the audience page at /: a text box with a 280 character limit and
   counter, an Ask button, and the list of visible questions sorted by votes
   then newest. Mobile-first.

Don't build upvotes, realtime or the host page yet.
```
Then: copy `schema.sql` into the Supabase SQL editor and run it. Post a test question from your phone.

### Prompt 2: Upvotes + live updates
```
Now feature 2.

1. Add an upvote button on each question that calls the upvote() function.
   One vote per question per device: remember voted IDs in localStorage and
   disable the button after voting.
2. Subscribe to Supabase Realtime so new questions and vote changes appear
   instantly for everyone without refreshing. Keep the list sorted.
3. Also refetch the full list every 15 seconds as a safety net, since
   realtime won't tell audience clients when a question gets hidden.
```
Then: open the page on your phone AND laptop, vote on one, show it update on the other.

### Prompt 3: Host view + hide + AI grouping
```
Now feature 3: the host screen at /host, as described in CLAUDE.md.

1. Passcode gate using HOST_PASSCODE, kept in sessionStorage and sent as a
   header to host-only API routes.
2. Big, projector-friendly list of top questions with a Hide button
   (POST /api/hide using the Supabase secret key, passcode checked on the server).
3. A "Group with AI" button that calls POST /api/group. That route sends all
   visible questions to Claude and returns themes as JSON. Show each theme with
   its questions and total votes, sorted by total votes. Handle errors clearly.
```
Then: post 5 or 6 similar test questions, hit Group, show the themes.

---

## If something breaks

- **Build error you can't fix in 2 minutes:** "This is exactly what happens in real projects. Let me show you the version I built last night." Switch to the backup URL. No shame, it's a real lesson.
- **Wifi dies:** switch to hotspot. If that fails, run the backup on localhost and demo from your own devices.
- **AI grouping is slow or fails:** "This is why AI runs on a button in v1, not on every question. The core product still works without it."
- **Someone posts something bad:** hide it, smile, move on.

---

## Lines worth landing

- "AI wrote the code. We decided what to build. Which part was harder?"
- "No login means someone could cheat on votes. For v1, that's a trade-off I'm choosing on purpose."
- "You're all using a product that didn't exist an hour ago."
