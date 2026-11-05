# AGENTS.md

## Agent handoff
- Follow `~/.config/agent-handoff/PROTOCOL.md` (handoff + cross-review, for any coding agent).
- Handoffs live in `docs/handoff/`. At session start run `handoff list` and pick up open ones addressed to you.
- Cross-review is opt-in. Suggest `xreview` (`handoff review <other-agent>`) in one line. Run it only if the user asks or the handoff says `review: required`.
- Never put secrets in handoffs. Outward-facing actions need founder approval written in the handoff.

## Rules for this project
- Never press Submit, and never submit test data to a government form.
- Never automate or work around the Cloudflare check on Thailand's site. Live testing is done by a human in their own browser.
- Tests use fake data only ("Alex Tan", K0000000X).

## Moat HQ (do not remove)
Venture slug: `arrivalfiller`. Read `~/Downloads/Antigravity/moat-playbooks/catalog.md` for what HQ provides; it is deliberately not copied here because this repo is public.
- Start of session: `moat hq forme arrivalfiller`, then read `moat/from-holdco/`.
- All HQ issues and requests go through `moat hq open arrivalfiller "..." "..."`, never relayed through the founder.
- Keys come from `moat env arrivalfiller`, into the gitignored `.env.local`. Never commit them.
- Run `npm run pages` in `site/` after editing the guides. It rebuilds the pages and fails on thin or duplicate content.
