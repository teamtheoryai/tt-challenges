# ACCEPTANCE.md — the definition of done

This is the end-user script. **The incident is resolved when every item below passes, exactly as written, from the browser.** No interpretation needed — if you can run this script top to bottom and everything holds, Part 1 is done.

Run it with fresh eyes after every fix — symptoms move when root causes change, and the checklist is how you notice.

> `make checklist` automates items 1, 2, 4 and 5 and prints a per-item verdict. Items 3 and 6 need human judgment — do those by hand.

## The checklist

**1. Log in and see the portfolio.**
Open http://localhost:5173 and sign in as **Alex Rivera** (Talent Partner, DAW Capital). The dashboard loads with all three portfolio companies — Vantage Managed Services (PC1), Cascade Care Group (PC2), Ridgeline Freight & Logistics (PC3) — and their document counts.

**2. Upload → Processed, hands-off.**
As Alex, upload any markdown document from `data/portcos/PC2/inbox/markdown/` to **Cascade Care Group (PC2)**. Within ~2 minutes its status reads **Processed** — without a hard refresh and without touching anything else.

**3. Ask, get a grounded answer with a real citation.**
Still as Alex, ask the brain a question that is only answerable from the document you just uploaded (pick a specific fact from it). The answer must (a) use the document's content, and (b) carry a **citation that traces to a real passage** — open the cited source and find the line. An answer that sounds right but cites nothing, or cites something that doesn't contain the claim, fails this item.

**4. Isolation holds.**
Sign in as **Priya Sharma** (HR Director, Vantage / PC1). She must **not** be able to see, retrieve, or get answers from any PC2 content — not in the document list, not on the dashboard, and not through the brain (ask it about the PC2 document from item 3; it must come back empty-handed). Fund-level users see everything; portco users see only their company. No exceptions.

**5. The talent review renders.**
As Alex, open the Talent Review. Every executive across all three portcos renders with scores on every dimension, and each executive's detail view opens with its underlying sources.

**6. The scores reconcile with the sources.**
Spot-check the talent review against the underlying record — as a partner would before quoting a score at IC:

- Pick **two executives per portco** (include at least one from Ridgeline).
- For each: open the score's source list and check that (a) every cited source really exists in `data/` or the uploaded set, (b) the sources are **independent** — watch for the same underlying document or person counted twice under different names, and (c) the score is defensible from those sources — a score should not lean on evidence supplied by the person being scored as if it were independent verification.
- If a score doesn't reconcile, the item fails **even if the page renders perfectly.**

Items 1–5 are "the app works." Item 6 is "the app tells the truth." Both are the product.

## When an item won't pass

Don't burn the whole timebox on one item. Write it up in [FINDINGS.md](FINDINGS.md) — the symptom, what you ruled out (and how), your best hypothesis, and where you'd look next — and move on. A specific, honest map of a fault you didn't fix counts as real progress; we score it that way.

---

# Part 2 — The Feature (required)

**A sketch counts as much as a build.**

Something we actually want to solve: our fund's partners tell us they don't fully trust a talent-review score they can't interrogate.

> **Make the talent review something a partner could defend at their investment committee.**

That's the whole spec — where you take it is the point. A feature, a view, a capability, a redesign; built into the box you just repaired, or sketched on paper. Who the user is, what earns the screen, and what you cut is your call to make — and to defend.

**Spend about an hour on it, no more.** Put whatever you produce in the repo (code, or `PART2.md` with your sketch/write-up — photos of paper are fine). In the review you'll walk us through what you'd build and why: who exactly is the user, what decision are they making, what did you cut to keep it shippable, and what you'd ship first with a week.

If you want to understand who "a partner" is and what an IC actually decides, [context-brain/05-talent-review.md](context-brain/05-talent-review.md) is written for exactly that.
