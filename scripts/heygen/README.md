# HeyGen local video generator (The Jag / Mr. Jag)

Local developer utility that generates a library of HeyGen videos from a structured manifest. It does **not** change The Jag application runtime and must not be used to modify production configuration.

## Approved setup (do not invent alternatives)

| Setting | Value |
|--------|--------|
| Avatar (display) | Mr. Jag |
| Avatar model | Avatar IV (`engine.type = avatar_iv`) |
| Motion | Enabled via Avatar IV setup (do not recreate avatar from PNG) |
| Voice (display) | Sawyer |
| Resolution | 1080p |

Avatar and voice **IDs** come from your existing HeyGen account. Do not invent IDs. Do not upload or regenerate the approved avatar asset (`Mr-JAG-approved-avatar-source.png`) from this tool.

## Brand / pronunciation

- Written brand: **Mr. Jag** / **The Jag**
- Spoken in HeyGen scripts: **Mr. Jag** / **The Jag** (approved production pronunciation)
- Voice speed: **1.07** (`voice_settings.speed`)

Never write `MR. JAG` or `Mr. JAG` in product copy. Do **not** use `Mr. J-A-G` in spoken scripts.

## Environment

Copy placeholders into `.env.local` (never commit real secrets):

```bash
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=
HEYGEN_VOICE_ID=
# optional:
# HEYGEN_API_BASE_URL=https://api.heygen.com
```

Find IDs with HeyGen’s API (authenticated; do not paste keys into tickets/chats):

- Avatar look ID: `GET /v3/avatars/looks?avatar_type=digital_twin&ownership=private`
- Voice ID: `GET /v3/voices` (locate Sawyer)

## Commands

Discover existing Mr. Jag / Sawyer IDs (READ-ONLY GET lists; never creates a video):

```bash
npm run heygen:videos -- --discover-assets
```

Requires `HEYGEN_API_KEY` only. Prints IDs to the console — does **not** write `.env.local`.

Dry-run (no API calls):

```bash
npm run heygen:videos -- --dry-run
```

Generate one video:

```bash
npm run heygen:videos -- --id jag-001
```

Generate all `enabled: true` videos:

```bash
npm run heygen:videos
```

Force regenerate even if already completed:

```bash
npm run heygen:videos -- --force --id jag-001
```

Create without polling to completion:

```bash
npm run heygen:videos -- --no-poll --id jag-001
```

## Manifest

`videos/jag-video-library.json`

Each entry:

```json
{
  "id": "jag-003",
  "title": "What The Jag Does",
  "script": "Hello, I'm Mr. Jag....",
  "enabled": true
}
```

To add a video: append an entry with an approved spoken script, set `enabled: true` when ready, and use spoken **Mr. Jag** / **The Jag** (never `Mr. J-A-G`).

## Results

Local metadata (no API keys):

`artifacts/heygen/generation-state.json`

Tracks manifest id, title, HeyGen video id, timestamps, status, final URL (when available), and failure reason.

## Secret safety

- Never commit `.env` / `.env.local`
- Never put the real key in source, tests, docs, logs, or committed JSON
- Logs redact `x-api-key` / Authorization-like values
- Tests mock HeyGen and never call the live API

## Idempotency

Rerunning the command skips videos already recorded as `completed` unless you pass `--force`.
