-- Seed: the DAW Capital world. Orgs, users, and the current talent review.
-- Document rows are NOT seeded here — the seeder service pushes the data/
-- corpus through the real pipeline on first boot, so ingestion state is earned,
-- not faked.

insert into orgs (slug, name, kind, parent_org_id) values
  ('daw', 'DAW Capital',                    'fund',   null),
  ('pc1', 'Vantage Managed Services',       'portco', 1),
  ('pc2', 'Cascade Care Group',             'portco', 1),
  ('pc3', 'Ridgeline Freight & Logistics',  'portco', 1);

insert into users (email, name, role, org_id) values
  ('alex.rivera@dawcapital.com',   'Alex Rivera',   'Talent Partner, DAW Capital', 1),
  ('dana.kim@dawcapital.com',      'Dana Kim',      'Talent Associate, DAW Capital', 1),
  ('priya.sharma@vantagems.com',   'Priya Sharma',  'HR Director, Vantage (PC1)', 2),
  ('jordan.ellis@cascadecare.com', 'Jordan Ellis',  'HR Lead, Cascade (PC2)', 3);

-- ── Executives ─────────────────────────────────────────────────────────────
insert into executives (org_id, name, title) values
  (2, 'Marcus Reuben',      'CEO'),                 -- 1
  (2, 'Priya Balakrishnan', 'CFO'),                 -- 2
  (2, 'Anika Sørensen',     'CTO'),                 -- 3
  (2, 'Brad Halvorsen',     'CRO'),                 -- 4
  (3, 'Naomi Okonkwo',      'CFO'),                 -- 5
  (3, 'Priya Nair',         'COO'),                 -- 6
  (3, 'Trevor Hale',        'CMO'),                 -- 7
  (4, 'Hank Dreyer',        'CEO'),                 -- 8
  (4, 'Tom Whitman',        'COO'),                 -- 9
  (4, 'Walter Ngiraingas',  'CFO'),                 -- 10
  (4, 'Lena Osei',          'VP Sales');            -- 11

-- ── Scores (performance / risk_of_loss / succession_readiness) ─────────────
insert into scores (executive_id, org_id, dimension, score, rationale) values
  (1,  2, 'performance',          4.0, 'Delivered the MRR plan two quarters running; NPS recovering.'),
  (1,  2, 'risk_of_loss',         2.5, 'Engaged; equity refresh closed in Q1.'),
  (1,  2, 'succession_readiness', 3.0, 'COO could hold the seat for a transition period.'),
  (2,  2, 'performance',          4.5, 'Clean audit, working-capital discipline ahead of plan.'),
  (2,  2, 'risk_of_loss',         3.5, 'Recruiter contact noted in 360 cycle; watch.'),
  (2,  2, 'succession_readiness', 2.0, 'No internal bench for the seat.'),
  (3,  2, 'performance',          3.5, 'Platform consolidation on track; delivery friction with sales.'),
  (3,  2, 'risk_of_loss',         3.0, 'Stable; values the platform mandate.'),
  (3,  2, 'succession_readiness', 2.5, 'Principal engineer is 18 months out.'),
  (4,  2, 'performance',          2.5, 'Pipeline coverage below target two quarters; new-logo motion stalled.'),
  (4,  2, 'risk_of_loss',         2.0, 'Low flight risk; comp above market.'),
  (4,  2, 'succession_readiness', 3.5, 'VP Sales East ready with coaching.'),
  (5,  3, 'performance',          4.0, 'RCM backlog down 40% since arrival; board credibility earned fast.'),
  (5,  3, 'risk_of_loss',         3.0, 'New hire; ramp risk more than flight risk.'),
  (5,  3, 'succession_readiness', 2.0, 'Too early; no bench behind her.'),
  (6,  3, 'performance',          3.5, 'Clinic ops stabilizing; integration of the two add-ons still rough.'),
  (6,  3, 'risk_of_loss',         3.5, 'Carried interim-CEO load for two quarters; fatigue flagged in 360.'),
  (6,  3, 'succession_readiness', 3.0, 'Regional director pool maturing.'),
  (7,  3, 'performance',          3.0, 'Referral growth solid; payer-mix shift behind plan.'),
  (7,  3, 'risk_of_loss',         2.5, 'Settled; family relocated last year.'),
  (7,  3, 'succession_readiness', 2.5, 'No clear successor.'),
  (8,  4, 'performance',          3.5, 'Founder discipline improving under board cadence; on-time delivery record strong.'),
  (8,  4, 'risk_of_loss',         2.0, 'Founder; economically and personally committed.'),
  (8,  4, 'succession_readiness', 2.0, 'Succession is the fund''s known long-pole at Ridgeline.'),
  (9,  4, 'performance',          4.0, 'Terminal network redesign landed; OR improved 3 points.'),
  (9,  4, 'risk_of_loss',         3.0, 'Approached twice this year; retention plan in place.'),
  (9,  4, 'succession_readiness', 3.5, 'Two terminal GMs viable inside 12 months.'),
  (10, 4, 'performance',          4.5, 'Refinancing executed well; reporting package now board-grade.'),
  (10, 4, 'risk_of_loss',         2.5, 'Stable.'),
  (10, 4, 'succession_readiness', 2.5, 'Controller promotable in 18–24 months.'),
  (11, 4, 'performance',          4.0, 'National-account wins ahead of plan; pricing discipline holding.'),
  (11, 4, 'risk_of_loss',         3.5, 'Visible in the market after the Q2 wins.'),
  (11, 4, 'succession_readiness', 2.0, 'Thin bench under the seat.');

-- ── Score sources ──────────────────────────────────────────────────────────
-- Independence matters: a score should rest on sources that don't share an
-- origin, and evidence supplied by the person being scored is weighted low.
insert into score_sources (score_id, org_id, source_type, document_ref, note, weight) values
  -- Marcus Reuben (PC1 CEO)
  (1,  2, 'board_deck',            'data/portcos/PC1/inbox/markdown/q2-2026-board-deck.md',            'Q2 revenue and NPS trend vs plan.', 0.60),
  (1,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'May 2026 re-assessment, CEO section.', 0.75),
  (2,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Engagement and retention read.', 0.75),
  (3,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Bench view, CEO section.', 0.75),
  -- Priya Balakrishnan (PC1 CFO)
  (4,  2, 'board_deck',            'data/portcos/PC1/inbox/markdown/q2-2026-board-deck.md',            'Working-capital bridge, Q2.', 0.60),
  (4,  2, '360_feedback',          'data/portcos/PC1/inbox/markdown/360-feedback-2026.md',             'Peer feedback on finance partnership.', 0.70),
  (5,  2, '360_feedback',          'data/portcos/PC1/inbox/markdown/360-feedback-2026.md',             'Recruiter-contact mention, 2026 cycle.', 0.70),
  (6,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Bench assessment, CFO section.', 0.75),
  -- Anika Sørensen (PC1 CTO)
  (7,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Platform consolidation read.', 0.75),
  (7,  2, '360_feedback',          'data/portcos/PC1/inbox/markdown/360-feedback-2026.md',             'Cross-functional friction with sales noted.', 0.70),
  (8,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Motivation and mandate section.', 0.75),
  (9,  2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Successor timeline, CTO section.', 0.75),
  -- Brad Halvorsen (PC1 CRO)
  (10, 2, 'board_deck',            'data/portcos/PC1/inbox/markdown/q2-2026-board-deck.md',            'Pipeline coverage vs target, Q2.', 0.60),
  (10, 2, '360_feedback',          'data/portcos/PC1/inbox/markdown/360-feedback-2026.md',             'Team feedback on new-logo motion.', 0.70),
  (11, 2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'Retention read, CRO section.', 0.75),
  (12, 2, 'leadership_assessment', 'data/portcos/PC1/inbox/markdown/leadership-assessment-2026.md',    'VP Sales East readiness.', 0.75),
  -- Naomi Okonkwo (PC2 CFO)
  (13, 3, 'board_deck',            'data/portcos/PC2/inbox/markdown/q2-2026-board-deck.md',            'RCM backlog trend, Q2.', 0.60),
  (13, 3, 'interview_notes',       'data/portcos/PC2/inbox/markdown/interview-notes-exec-panel.md',    'Panel read at hire, revisited post-ramp.', 0.50),
  (14, 3, 'leadership_assessment', 'data/portcos/PC2/inbox/markdown/leadership-assessment-2026.md',    'Ramp-risk note, CFO section.', 0.75),
  (15, 3, 'leadership_assessment', 'data/portcos/PC2/inbox/markdown/leadership-assessment-2026.md',    'Bench view, CFO section.', 0.75),
  -- Priya Nair (PC2 COO)
  (16, 3, 'leadership_assessment', 'data/portcos/PC2/inbox/markdown/leadership-assessment-2026.md',    'Ops stabilization read.', 0.75),
  (16, 3, 'board_deck',            'data/portcos/PC2/inbox/markdown/q2-2026-board-deck.md',            'Add-on integration status, Q2.', 0.60),
  (17, 3, '360_feedback',          'data/portcos/PC2/inbox/markdown/360-feedback-2026.md',             'Fatigue flags from direct reports.', 0.70),
  (18, 3, 'leadership_assessment', 'data/portcos/PC2/inbox/markdown/leadership-assessment-2026.md',    'Regional director pool view.', 0.75),
  -- Trevor Hale (PC2 CMO)
  (19, 3, 'board_deck',            'data/portcos/PC2/inbox/markdown/q2-2026-board-deck.md',            'Referral growth vs payer-mix plan.', 0.60),
  (20, 3, '360_feedback',          'data/portcos/PC2/inbox/markdown/360-feedback-2026.md',             'Stability signals, 2026 cycle.', 0.70),
  (21, 3, 'leadership_assessment', 'data/portcos/PC2/inbox/markdown/leadership-assessment-2026.md',    'Succession view, CMO section.', 0.75),
  -- Hank Dreyer (PC3 CEO)
  (22, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Founder-discipline read, May 2026.', 0.75),
  (22, 4, 'board_deck',            'data/portcos/PC3/inbox/markdown/q2-2026-board-deck.md',            'Delivery record vs plan, Q2.', 0.60),
  (23, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Commitment read, CEO section.', 0.75),
  (24, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Succession long-pole note.', 0.75),
  -- Tom Whitman (PC3 COO)
  (25, 4, 'board_deck',            'data/portcos/PC3/inbox/markdown/q2-2026-board-deck.md',            'Operating-ratio improvement, Q2.', 0.60),
  (25, 4, '360_feedback',          'data/portcos/PC3/inbox/markdown/360-feedback-2026.md',             'Terminal-manager feedback on network redesign.', 0.70),
  (26, 4, 'reference_call',        'data/portcos/PC3/inbox/markdown/interview-notes-exec-panel.md',    'Market-approach mentions, exec panel notes.', 0.80),
  (27, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'GM readiness, COO section.', 0.75),
  -- Walter Ngiraingas (PC3 CFO)
  (28, 4, 'board_deck',            'data/portcos/PC3/inbox/markdown/q2-2026-board-deck.md',            'Refinancing outcome, Q2.', 0.60),
  (28, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Reporting-quality read, CFO section.', 0.75),
  (29, 4, '360_feedback',          'data/portcos/PC3/inbox/markdown/360-feedback-2026.md',             'Stability signals, 2026 cycle.', 0.70),
  (30, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Controller trajectory.', 0.75),
  -- Lena Osei (PC3 VP Sales)
  (31, 4, 'board_deck',            'data/portcos/PC3/inbox/markdown/q2-2026-board-deck.md',            'National-account wins, Q2.', 0.60),
  (31, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Commercial-leadership read, May 2026.', 0.75),
  (32, 4, '360_feedback',          'data/portcos/PC3/inbox/markdown/360-feedback-2026.md',             'Market-visibility flags post-Q2.', 0.70),
  (33, 4, 'leadership_assessment', 'data/portcos/PC3/inbox/markdown/leadership-assessment-2026.md',    'Bench view under the seat.', 0.75);
