# Cross-review log

- 2026-11-03 claude: codex review 1 (`reviews/2026-11-03-1816-codex.md`). Fixed all three: new traveller
  learned by id not name; departure-only fix measures from the arrival date on the form; emptied answers
  are forgotten (blank clicks are not).
- 2026-11-03 claude: codex review 2 (`reviews/2026-11-03-1819-codex.md`).
  - P1 fixed: Fill keeps the traveller picked when it was pressed.
  - P2 disputed for now: two form tabs open while teaching can overwrite each other's draft answers, last
    active tab wins. Only touches the teaching draft, needs a rare setup, and the panel shows what was
    captured before saving. Revisit before a store release if testers hit it.
