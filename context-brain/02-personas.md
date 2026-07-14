# User personas

*Fictional. The people who touch the Second Brain, and what they need from it.*

## 1. The Talent Partner — primary user & buyer

**Example: Dana Whitfield, Operating Partner for Talent, DAW Capital.**

Owns leadership hiring and talent health across the whole portfolio. Sat in an operating role before this; is not a recruiter and not an engineer. Runs 6–10 senior searches a year across ~14 portcos, and is accountable for the outcome of every one.

- **What she wants from the product:** leverage. She can't personally run every search, but she's on the hook for all of them. She wants the fund's judgment encoded once and applied consistently — and she wants to walk into an investment committee able to defend any hire on evidence.
- **What she fears:** a confident wrong answer she repeats to a deal partner. A score she can't back up when a GP pushes on it. A mis-hire she signed off on.
- **How she uses it:** reviews scorecards and assessments before they go to deal partners; pulls the talent review before board meetings; asks cross-portfolio questions ("which of our operators have turned around a struggling P&L before?").
- **She is the person the talent review has to satisfy.** If she can't defend it, the product failed.

## 2. The Portco HR Leader — secondary user (Portco Workspace)

**Example: Marcus Boone, VP People, Cascade Health.**

Runs people operations at a single portfolio company. Gets a *scoped* view — only Cascade's data — through the Portco Workspace. Cares about his own hires and his own team's health; does not (and must not) see other portcos.

- **What he wants:** help running searches for his own leadership roles without reinventing the fund's process each time; a clean handoff with the fund's talent partner.
- **What he fears:** the fund seeing a half-finished, messy assessment before he's ready; his data leaking to a peer company in the portfolio.
- **Why he matters to an engineer:** he is the reason **isolation is non-negotiable**. The whole expansion motion depends on a portco trusting that its data stays its own. One cross-portco leak and the Workspace product is dead.

## 3. The Deal Partner / GP — the IC audience

**Example: Priya Anand, Partner, DAW Capital.**

Sponsors deals; sits on portco boards; votes at the investment committee. Rarely logs in. Encounters the product's output *secondhand* — in the assessment the talent partner brings to a hiring decision, and in the talent review at a board meeting.

- **What she wants:** a decision she can trust in about ten minutes, and evidence she can point to if it goes wrong.
- **What she fears:** being embarrassed at IC by a number she can't source. Approving a hire on a score that turns out to be built on sand.
- **Why she matters to an engineer:** she is who "**defensible at IC**" is about. She is the reader of the talent review who never touches the UI — so the *output* has to carry its own credibility. When Part 2 asks you to make the talent review defensible, **she is the person you're designing for.**

## 4. The Talent Associate — the power user

**Example: Sam Okonkwo, Talent Associate, DAW Capital.**

Dana's leverage. Does the day-to-day: sets up searches, uploads documents, chases references, drafts the first pass of scorecards and assessments. In the product every day.

- **What they want:** speed and no dropped context. Upload a reference call and have it processed and searchable now, not after a refresh-and-pray. Never re-key something the system already knows.
- **What they fear:** silent failures — a document that "uploaded" but never got processed, so an assessment is missing a reference nobody noticed was gone.
- **Why they matter to an engineer:** they feel every pipeline glitch first. An upload stuck at "Processing" and a status that only moves on a hard refresh are *their* daily pain. When you fix the ingestion path, you're fixing Sam's job.

## How the personas map to the challenge

- **Part 1 triage** — the personas tell you *severity*. Something that makes the app unusable for Dana and Sam is loud and urgent. Something that quietly corrupts what Priya reads at IC has no one complaining at all — and costs the most, in the highest-stakes room. Severity is about who is hurt and what they decide, not about noise volume.
- **Part 2 "defensible at IC"** — you're designing for **Priya** (the reader who must trust it) by way of **Dana** (who has to defend it in the room). If your feature helps them interrogate and stand behind a score, it works. If it just adds polish, it doesn't.
