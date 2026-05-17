# HabitFlow Privacy Policy

**Effective date:** 2026-05-17
**Last updated:** 2026-05-17

HabitFlow ("the app", "we") is a habit tracker built for individuals. We want you to know exactly what data the app collects, where it lives, and who can see it. This policy is written in plain English on purpose.

## TL;DR

- We collect your email (for sign-in), your habits, your completions, your day notes, and your settings. That is the whole list.
- Your data is stored in Supabase (Postgres in `eu-west-1`) and is only accessible by you. Row-Level Security enforces this at the database level.
- We do not sell your data, run ads, embed analytics, or use third-party trackers.
- We send your habit data (no email, no name) to Anthropic's Claude API to generate your AI Coach nudges and weekly summaries. Anthropic does not train on this data per their API policy.
- You can delete your entire account from Settings at any time. It is immediate and irreversible.

## 1. What we collect

| Category | Field | Why |
|---|---|---|
| Account | Email address, hashed password | Sign-in, password reset, account recovery |
| Habits | Name, emoji, type, target count, reminder time, streak shields, pause ranges, created-at timestamp | Render and sync your habit list |
| Completions | (habit id, date, count) | Track which habits you completed on which days |
| Day notes | (date, free-text note up to 500 chars) | Optional context you add to a day |
| Challenges | Title, duration, start date, member habits, completion state | Multi-day challenge feature |
| Settings | Theme mode, vacation date range, onboarding flag, dismissed-nudge flag | Personal preferences |
| AI insights | Generated nudges and weekly/monthly summaries | Cached AI Coach output |

We do **not** collect:
- Your name, phone number, address, payment info
- Your location, contacts, calendar, photos, microphone, or camera
- Any advertising identifier (IDFA, AAID, GAID)
- Any device-level telemetry beyond what Apple and Google provide by default to crash reporters
- Any third-party analytics

## 2. Where your data is stored

- **On your device:** A local cache (AsyncStorage) so the app works offline and feels fast. Cleared automatically when you sign out or uninstall.
- **In the cloud:** Supabase (Postgres) in the EU `eu-west-1` region, project ref `fprkutorlwuzpaydcgdj`. Every table has Row-Level Security enabled, scoped to `auth.uid() = user_id`, so the database itself rejects any query that does not come from your authenticated session.

## 3. Who can access your data

- **You**, through the app.
- **Our Edge Functions**, only when generating an AI nudge, generating a reflection summary, or deleting your account on your request. These functions use a service-role key that is never sent to your device.
- **Anthropic**, when generating AI Coach output. The data sent is your habit names, emojis, types, completion counts, day notes, and computed stats for the relevant period. Your email, user ID, or any other account identifier is **not** sent. Per the Anthropic API terms, Anthropic does not use API inputs or outputs to train their models.
- **Apple and Google**, when delivering scheduled local push notifications. The notification payload contains only the habit name you chose; no other data is transmitted.

We do not share your data with anyone else, ever. We do not sell it. We do not use it for advertising.

## 4. How long we keep your data

Indefinitely while your account exists. When you delete your account from Settings, every row owned by you across all public tables (`completions`, `challenges`, `habits`, `day_notes`, `ai_insights`, `user_settings`) is deleted, and your authentication record is removed from `auth.users` immediately afterward. There is no waiting period or grace period.

## 5. Your rights

- **Access:** All your data is visible in-app. You can see every habit, every completion, and every note you have ever recorded.
- **Correction:** Edit any habit, completion, or note at any time from inside the app.
- **Deletion:** Use Settings → Account → Delete account. This permanently removes everything.
- **Portability:** If you want a JSON export of your data, email us using the contact below and we'll send it within 30 days.

If you are in the EU, you have additional rights under GDPR including the right to lodge a complaint with your local data protection authority.

## 6. Children

HabitFlow is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has signed up, contact us and we will delete the account.

## 7. Changes to this policy

If we change this policy materially, we'll update the "Last updated" date at the top and notify you in-app the next time you open it. Continued use of the app after a change constitutes acceptance.

## 8. Contact

Questions or requests: **vowusu032@st.ug.edu.gh**

> Note: replace this email with whichever public address you want to use for support before publishing.
