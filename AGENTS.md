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
