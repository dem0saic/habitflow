# Store Listing Copy — HabitFlow

Source of truth for App Store Connect and Google Play Console metadata. Update this file when you change copy, then sync the change in the consoles.

## Positioning

**HabitFlow is the calm habit tracker that respects the fact you're human.** Other apps break your streak the moment life gets in the way. HabitFlow gives you 2 forgiven misses a month, lets you pause for vacation, and uses AI to spot the days you actually struggle — without ever shaming you.

---

## iOS App Store

### App identity
- **App name:** HabitFlow *(11 / 30 chars)*
- **Subtitle:** Build habits that stick *(22 / 30 chars)*
- **Primary category:** Health & Fitness
- **Secondary category:** Productivity
- **Age rating:** 4+
- **Copyright:** © 2026 [Your Legal Name]
- **Bundle ID:** `com.dem0saic.habitflow` *(must match `app.json` and CANNOT change after first release)*

### Promotional text *(170 chars, can change between releases)*
> New: Vacation mode and an AI Coach that spots your weak weekday. Streak shields forgive 2 missed days a month so a bad week doesn't reset your progress.

### Description *(4000 chars)*
> HabitFlow is a calm, research-backed habit tracker for people who are tired of being punished by their tools. Streaks are great, but real life happens — and most apps treat a single missed day like you've failed. We don't.
>
> **Streak shields**
> Every habit gets 2 forgiven misses per calendar month. You don't have to do anything; if you miss a day, the shield bridges it automatically and your streak keeps going. Run out of shields and you'll know — until then, breathe.
>
> **Vacation mode**
> Going on a trip? Sick for a week? Tap one button. Every habit pauses, every streak survives, and your AI Coach knows not to nudge you about it. Resume whenever you're back.
>
> **An AI Coach that actually learns you**
> Most "AI" habit apps just generate vague motivation. Ours reads your last 28 days, finds your real patterns, and asks the right question: "you miss meditation on Wednesdays more than any other day — what's different about Wednesdays?" Weekly and monthly summaries even reference the day notes you write, so the feedback feels personal, not generic.
>
> **Four habit types**
> Track simple yes/no habits, count reps (push-ups, glasses of water), time activities (meditation, deep work), or build avoidance habits (no scrolling, no junk food). Each one with its own tile, optimized for the action.
>
> **Day notes**
> Tap any past day to add a quick note — "travel", "sick", "first day of new job". Your notes show up as small dots on the calendar and feed into your AI reflection so the feedback understands your context.
>
> **What you won't find here**
> No ads. No paywalls on basic features. No gamification clutter. No tracking. No third-party analytics. No selling your data. Your habits sync securely to your account and are visible only to you.
>
> **Built with care**
> Cloud sync across devices, dark and light themes, per-habit reminders with custom times, monthly history calendar, contribution graph, full account deletion in-app, and a clean indigo palette designed for WCAG AA contrast.
>
> Start with 1 to 3 habits — research shows that's 3× more likely to stick than starting with 10. HabitFlow will even gently remind you of this the first time you try to add a fourth.

### Keywords *(100 chars, comma-separated)*
> habit,tracker,streak,routine,daily,goal,reminder,productivity,wellness,journal,discipline,planner

### Support URL
> `https://github.com/dem0saic/habitflow` *(or replace with a dedicated support page)*

### Marketing URL *(optional)*
> *(leave blank or add a landing page later)*

### Privacy Policy URL *(REQUIRED)*
> `https://raw.githubusercontent.com/dem0saic/habitflow/master/PRIVACY.md`
>
> Better: enable GitHub Pages and host the rendered version at `https://dem0saic.github.io/habitflow/PRIVACY.html`. Apple sometimes flags raw markdown.

### What's New (version 1.0.0)
> First release. Build habits that stick with streak shields, vacation mode, day notes, and a pattern-aware AI coach. No ads, no paywalls.

---

## Google Play Store

### App identity
- **App name:** HabitFlow *(11 / 30 chars)*
- **Default language:** English (United States)
- **Application type:** App
- **Category:** Health & Fitness
- **Tags:** habits, productivity, wellness
- **Content rating:** Everyone *(complete the IARC questionnaire — declare no violence, sex, profanity, gambling)*
- **Package name:** `com.dem0saic.habitflow` *(matches `app.json`; cannot change after first release)*

### Short description *(80 chars)*
> The calm habit tracker that gives you space to be human, with an AI Coach.

### Full description *(4000 chars)*
> Same long description as iOS above. Google Play allows light formatting (bold, lists) which iOS does not — feel free to add `**bold**` or bullet lists when pasting.

### Data safety section
Fill in the Play Console Data Safety form using `PRIVACY.md` section 1 as the source of truth. Key answers:
- **Data collected:** Email, app activity (your in-app habits and completions), user-generated content (day notes).
- **Shared with third parties:** Yes — Anthropic, for AI Coach generation only. No advertising or analytics partners.
- **Encrypted in transit:** Yes.
- **Can users request data deletion?** Yes, from within the app.

### Privacy Policy URL *(REQUIRED)*
> Same as iOS.

---

## Asset checklist *(not in this file — capture separately)*

| Asset | Spec | Status |
|---|---|---|
| App icon (iOS) | 1024 × 1024 PNG, no alpha | ⚠️ currently default Expo placeholder |
| App icon (Android adaptive) | 432 × 432 foreground + background | ⚠️ default placeholder |
| iOS screenshots (6.7" iPhone) | 1290 × 2796, 3-10 images | not captured |
| iOS screenshots (6.5" iPhone) | 1242 × 2688 or 1284 × 2778 | not captured |
| iOS screenshots (12.9" iPad) | 2048 × 2732 | not captured |
| Android screenshots (phone) | min 320 px short edge, 16:9 or 9:16 | not captured |
| Android feature graphic | 1024 × 500 PNG, no transparency | not designed |

Recommended capture set (apply to both iOS and Android):
1. Today screen with 3 habits, one fully completed (shows tiles, stat strip, AI coach hook)
2. Stats screen with the streak + trajectory % + contribution graph + AI nudge with a weekday pattern
3. History screen with the month calendar and a few dotted note days
4. HabitOptionsSheet open showing pause + reminder rows
5. Vacation mode banner on Today

---

## EAS Build environment variables

EAS runs in a clean environment, so `.env` is not available at build time. Push these to EAS once with:

```bash
eas env:create --scope project --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://fprkutorlwuzpaydcgdj.supabase.co
eas env:create --scope project --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value sb_publishable_...
```

(Repeat with `--environment preview` if you want preview builds to also hit production data, or use a separate Supabase project for preview.)

Both are public-by-design (anon keys are safe to bake into client bundles), but keeping them as EAS env vars makes rotation simpler.

---

## Pre-submission checklist

- [ ] **Chopera commercial license purchased** *(blocker — current FSLA is non-commercial only, see `assets/FSLA_NonCommercial_License.html`)*
- [ ] Apple Developer Program enrollment ($99/year)
- [ ] Google Play Console registration ($25 one-time)
- [ ] `eas.json` placeholders (appleId, ascAppId, appleTeamId) filled in
- [ ] `play-service-account.json` created in Play Console and saved at project root (gitignored)
- [ ] App icon replaced with brand mark (current is Expo placeholder)
- [ ] Splash screen branded
- [ ] Screenshots captured (see asset checklist)
- [ ] `PRIVACY.md` hosted publicly and URL added to both consoles
- [ ] `STORE_LISTING.md` copy pasted into both consoles
- [ ] Email in `PRIVACY.md` changed to a public support address (if you don't want to use your personal one)
- [ ] Bundle ID confirmed before first build (`com.dem0saic.habitflow` — change if you have a domain)
- [ ] Test on a real device end-to-end: sign up, add habits, log a few days, set a vacation, dismiss the pushback, delete account
