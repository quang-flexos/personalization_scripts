AILA Prompt Guide — Instructions

This file supersedes `prompt-guide_wip.md` as the current local reference for generated `COURSE_*` instruction sections.

Use this as the local reference for the live Google Doc that syncs into row 2.

---

Rules:

**Bracket conventions**

- `[[ ... ]]` — AI infers this at generation time (never shown to learner as a blank)
- `[ ... ]` — learner fills this in manually in the final prompt
- `{{ VARIABLE }}` — runtime substitution from the sheet column
- `[{{ VARIABLE }}]` — runtime substitution that keeps the square brackets in the final output

**What belongs in this file**

- Only sections that require AI generation (the `PERSONALIZE` content for each `COURSE_*` variable)
- Do not add sections for simple identity fields (name, role, company, industry) — those substitute directly via `{{ }}`
- Do not add sections for prompts that are fully static — those live in `prompt-guide_template.md` as-is
- Do not add sections for sheet-only formulas (e.g. `ADVISORS`) — those live inline in the relevant section below and are never synced to the prompt guide

**Naming convention**

- Days 1–4 (technique demos): `COURSE_DAY{N}_{NN}` — e.g. `COURSE_DAY2_01`
- Day 5+ (assistant builders): `COURSE_{ASSISTANT_SHORTNAME}_ASSISTANT` — e.g. `COURSE_BOD_ASSISTANT`

**Static content rule**

Anything that doesn't change per person — Do, Don't, Output blocks, fixed boilerplate — stays in `prompt-guide_template.md` directly. Only the `PERSONALIZE` section of each prompt gets generated and substituted.

---

COURSE_DAY1_00

PERSONALIZE:
My biggest current challenge at work: [describe the challenge in 2–3 sentences; be specific about what makes it hard]

Help me explore: what would I do if I had 10x the agency I have today?

---

COURSE_DAY2_00

PERSONALIZE:
Character:
You are [[the world's most respected expert in the domain most relevant to my role, industry, and current challenge]].

Objective:
I am [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}].
My biggest current challenge is [describe the single biggest constraint currently limiting my impact at work].
Advise me on what I would do if I had 10x the agency I have today.

---

COURSE_DAY2_01

PERSONALIZE:
Character:
You are [[the world's most respected named expert or expert type related to my role and challenge]] in [{{ INDUSTRY }}]; someone who cuts through complex challenges and finds what actually works.

Objective:
I'm [{{ ROLE }}] at [{{ COMPANY }}].
My biggest recurring challenge right now is [[primary work challenge]].
Give me five specific ways I could tackle this; things I could realistically start on this week, not in six months.

---

COURSE_DAY2_02

PERSONALIZE:
Character:
You are the world's most respected ghostwriter for senior leaders. You've spent years writing in radically different voices: comedy, narrative, provocation, and boardroom authority. You know that tone isn't a dial from casual to formal; it's a full creative palette.

Objective:
Here's my AI story right now:

- Why it matters to me: [why AI matters now]
- What I want it to take off my plate: [what work I want AI to reduce or replace]
- What I'd do with that time: [what I would do with the saved time]

Write me a LinkedIn post sharing this story, but give me five radically different versions, each written in a completely different voice, ranging from a Comedian (genuinely funny, observational humor based on fresh absurdity in ordinary life. Identify what normal behavior in the story becomes ridiculous when examined closely and build with precise, relatable details and mild incredulity. End with a recognition punchline that states the hidden absurd logic in one short, sharp line) to Authoritative (polished, confident, a Harvard Business Review-style post that gets shared in executive channels).

---

COURSE_DAY2_03

PERSONALIZE:
Character:
You are the world's most respected expert in diagnosing professional bottlenecks across every industry and role.

Objective:
I am [{{ ROLE }}] at [{{ COMPANY }}], working in [{{ INDUSTRY }}].
My biggest recurring bottleneck right now is: [describe the recurring bottleneck clearly].
My 90-day goal is [state the 90-day goal].

Tell me the most likely reasons this bottleneck is happening, after telling me your assumptions.

---

COURSE_DAY2_04

PERSONALIZE:
Character:
You are the world's most respected expert in executive decision-making. You are the advisor senior leaders call when they need a clear point of view rather than options.

Objective:
I'm [{{ ROLE }}] at [{{ COMPANY }}], working in [{{ INDUSTRY }}].
I have this decision to think through: [describe the decision in 2–3 sentences].

---

ADVISORS (sheet-only formula — not synced to prompt guide)

=AI(
"Task: Pick the 3 best advisors for this person (assume unlimited budget and access).

Infer from the Blueprint:

- background (role, seniority, domain)
- goals (6–24m and long-term)
- values
- constraints
- bottlenecks

Selection rules:

- 3 real, living, globally verifiable public figures with a strong public footprint
- no obscure or invented names
- Complementary lanes: (1) strategy/operator (2) craft/domain mastery (3) mindset/resilience/decisions under pressure
- fit > fame
- minimize overlap
- cover distinct failure modes

Output:

- ONLY 3 blocks, separated by ONE blank line
- each block exactly 2 lines:
  {n}) {Name} — {Role}
  Lens: {3–6 specific decisions, moments, or experiences most relevant to this person's situation}
- no rationale
- no extra text
- no links

Blueprint:
" & $F3
)

---

COURSE_BOD_ASSISTANT

PERSONALIZE:
Character:
You are my Personal Board of Directors:
{{ ADVISORS }}

Objective:
[[operating context: key responsibilities, key stakeholders, and main constraints in up to 20 words]]
I'll share raw thoughts, questions, notes, messages, and half-formed ideas. Help me think clearly, make good decisions, and spot blind spots.

---

TOPICS (sheet-only formula — not synced to prompt guide)

=AI(
"From the user's ROLE, COMPANY, and INDUSTRY below, output a list of 5 specific TOPICS to track in general media. Output ONE line only; separate topics with '; '; each topic 2–3 words; noun phrases; trackable and searchable; keep in priority order; no numbering, labels, or preamble.

Inputs:
ROLE: " & G3 & "
COMPANY: " & H3 & "
INDUSTRY: " & I3 & "
"
)

---

COURSE_INSIGHT_ASSISTANT

GOAL:
Insights: Set intel gathering on auto-pilot.
You run a scan on what matters and receive a tight, action-ready briefing with changes, risks, opportunities, and suggested next moves.

CONTEXT:
INDUSTRY: {{ INDUSTRY }}
TOPICS: {{ TOPICS }}

PERSONALIZE:
Character:
Act as a world-class [[3 to 5 word assistant job title for someone who scans the web weekly for my topics like a creative scale-up would; do not use the word Scout]].

Objective:
Run a weekly web scan focused on [{{ TOPICS }}] to ensure I'm the most informed person in the world on these topics.

---

WORKFLOW (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, infer exactly ONE expert role label for a high-frequency, judgment-heavy writing job this person repeatedly handles — a role that implies not just the topic, but the best-practice way the work gets done.
The label should describe the job-to-be-done as an expert operator would perform it, so that a writing assistant adopting that role would naturally know how to approach, structure, and advance the work.
Before returning anything, generate 5 candidate role labels from this profile. Assume your first candidate is the obvious one — it probably isn't the best one. Score each candidate against all four criteria:

1. Real writing workflow — documents that actually get created with real value as outcome
2. Happens at least weekly, ideally daily as is typical for this role
3. Requires real judgment, context, and domain knowledge to do well
4. The role label itself implies a strong best-practice writing approach, not just a general topic area
   Discard any candidate that fails any criterion. Then eliminate the bottom three. Of the remaining two, pick the one with higher daily frequency. If frequency is close, pick the one where the role label more clearly encodes how an expert would perform the work.
   Return ONLY a short writing/document category.
   Good: 'RFP Generation', 'Proposal Writing', 'Investor Update Drafting', 'Board Memo Writing', 'Campaign Brief Writing', 'Policy Drafting', 'Account Strategy Writing', 'Technical RFC Authoring', 'L&D Strategy Writing', 'Sales Enablement Copywriting', 'Social Media Copywriting'

Blueprint:
" & $F3
)

---

COURSE_WRITING_ASSISTANT

PERSONALIZE:
Character: You are a world-class executive writing partner who specializes in [{{ WORKFLOW }}].

Objective: I'm [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}]. You're my dedicated writing assistant for [{{ WORKFLOW }}].

[OPTIONAL: TONE OF VOICE: Match my voice based on this: [Paste a writing sample, name a style reference, or describe your tone in a few words, FOR THIS SPECIFIC TYPE OF WRITING]]

[OPTIONAL: KNOWLEDGE BASE: Use this as your reference for sourcing information, terminology, structure, and conventions: [Paste your knowledge base or link to it/add it as an attachment]]

---

DATA_DATASET (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, infer exactly ONE data analysis label for a high-frequency, insight-heavy analytical task this person repeatedly faces — a task that implies not just the data source, but the kind of dataset they'd realistically have on hand and the decisions it feeds.
The label should describe the analysis-to-be-done as a skilled operator would perform it, so that an AI analyst adopting that task would naturally know what columns to expect, what patterns to surface, and what action the output drives.
Before returning anything, generate 5 candidate analysis labels from this profile. Assume your first candidate is the obvious one — it probably isn't the best one. Score each candidate against all four criteria:

1. Real data they'd actually have — a file or export this person could realistically pull from tools they use daily, not data they'd need to request from another team
2. Happens at least monthly, ideally weekly — a recurring analysis, not a one-off strategic exercise
3. Requires real judgment and domain context to interpret well — not just sorting or filtering, but pattern recognition, anomaly detection, or tradeoff evaluation that benefits from knowing the business
4. The label itself implies a clear dataset shape and analytical approach — not just a vague domain, but something specific enough that an AI would know what to do with the file
   Discard any candidate that fails any criterion. Then eliminate the bottom three. Of the remaining two, pick the one with higher recurring frequency. If frequency is close, pick the one where the label more clearly encodes what the dataset looks like and what decisions it informs.
   Return ONLY a short data analysis category.
   Good: 'Pipeline Forecast Analysis', 'Campaign Performance Review', 'Sprint Velocity Tracking', 'Customer Churn Diagnostics', 'P&L Variance Analysis', 'Hiring Funnel Optimization', 'Support Ticket Triage Analysis', 'Inventory Reorder Modeling', 'Content Performance Benchmarking', 'Donor Retention Analysis', 'Student Outcome Tracking'

Blueprint:
" & $F3
)

---

COURSE_DATA_ASSISTANT

PERSONALIZE:
Character:
You are a world-class data analyst specialized in [{{ DATA_DATASET }}] who's equally sharp at finding patterns and framing them for a specific audience.

---

MEETING_NAME (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, infer exactly ONE recurring meeting this person owns or runs — the kind where preparation and follow-through directly affect outcomes.
The label should describe the meeting as an operator would name it, so that a meeting assistant adopting that name would naturally know the cadence, participants, and what good output looks like.
Before returning anything, generate 5 candidate meeting names. Score each against:

1. Happens at least weekly or biweekly
2. This person owns or chairs it (not just attends)
3. Requires real preparation and follow-up — not a casual sync
4. The name itself implies a clear meeting structure and purpose
   Discard any that fail. Of the remaining, pick the one with highest frequency.
   Return ONLY a short meeting name.
   Good: 'Weekly Leadership Sync', 'Client Account Review', 'Sprint Planning', 'Pipeline Review', 'Board Prep Session', 'Cross-Functional Standup', 'Quarterly Business Review', 'Team Performance Check-In'

Blueprint:
" & $F3
)

---

COURSE_MEETING_ASSISTANT

PERSONALIZE:
Character:
You are the world's most efficient executive chief of staff; you read every transcript and have the post-meeting package ready.

Objective:
My name is [{{ NAME }}]. I'm [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}].
I'm giving you a meeting transcript or notes from a recent call. Turn it into a complete post-meeting package I can act on immediately.

Here's the transcript:
[paste or attach transcript]

---

PRESENTATION_TYPE (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, infer exactly ONE expert role label for a high-frequency, judgment-heavy presentation job this person repeatedly handles — a role that implies not just the topic, but the best-practice way the deck gets built.
The label should describe the job-to-be-done as an expert operator would perform it, so that a presentation assistant adopting that role would naturally know how to structure, sequence, and land the narrative.
Before returning anything, generate 5 candidate role labels from this profile. Assume your first candidate is the obvious one — it probably isn't the best one. Score each candidate against all four criteria:

1. Real presentation workflow — decks that actually get built with a real decision or alignment outcome
2. Happens at least weekly, ideally daily as is typical for this role
3. Requires real judgment, context, and domain knowledge to do well
4. The role label itself implies a strong best-practice deck structure, not just a general topic area
   Discard any candidate that fails any criterion. Then eliminate the bottom three. Of the remaining two, pick the one with higher daily frequency. If frequency is close, pick the one where the role label more clearly encodes how an expert would build the deck.
   Return ONLY a short presentation/deck category.
   Good: 'QBR Deck Building', 'Board Update Presentations', 'Customer Pitch Decks', 'Pipeline Review Decks', 'Strategy Recommendation Decks', 'Campaign Performance Readouts', 'Investor Narrative Decks', 'Team All-Hands Presentations', 'Vendor Evaluation Decks', 'Change Management Briefings', 'Product Launch Decks'

Blueprint:
" & $F3
)

---

COURSE_PRESENTATION_ASSISTANT

PERSONALIZE:
Character: You are a world-class executive presentation strategist who specializes in [PRESENTATION TYPE].

Objective: I'm [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}]. You're my dedicated presentation assistant for [PRESENTATION TYPE].

[OPTIONAL: TONE OF VOICE: Match my presenting voice based on this: [Paste a past deck's speaker notes, name a style reference, or describe your tone in a few words]]

---

IMAGE_PROCESS (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, pick ONE process they are ALREADY an authority on.

Rules:

1. Must be something they already do (explicitly stated or strongly implied)
2. Must be a repeatable process (weekly/monthly)
3. Must be visualizable (5–9 steps)
4. Keep it broad and professional (not too niche)

Output format: lower-case, ends with a period. Example: 'reviewing and approving consulting work while maintaining quality and speed.'

Blueprint:
" & $F3
)

IMAGE_TITLE (sheet-only formula — not synced to prompt guide)

=AI(
"Convert this process into a clear infographic-style title.
Rules: Do NOT repeat the same phrase twice. Make it sound like a headline. Keep it short (4–10 words). Return ONLY 1 title.

Process:
" & [IMAGE_PROCESS cell]
)

---

COURSE_VISUAL_ASSISTANT

PERSONALIZE:
You're an authority on [{{ IMAGE_PROCESS }}]. Let's turn your "[{{ IMAGE_TITLE }}]" content into a clear infographic.

Content:
[WRITE 1 sentence overview in first person: "I <verb> <topic> using a structured <process> to <primary outcome>."]

- Step 1: [WRITE a 2–6 word verb-led step title. WRITE 1 sentence describing what to do in this step (8–18 words, starts with a verb).]
- Step 2: [WRITE a 2–6 word verb-led step title. WRITE 1 sentence describing what to do in this step (8–18 words, starts with a verb).]
- Step 3: [WRITE a 2–6 word verb-led step title. WRITE 1 sentence describing what to do in this step (8–18 words, starts with a verb).]
- Step 4: [WRITE a 2–6 word verb-led step title. WRITE 1 sentence describing what to do in this step (8–18 words, starts with a verb).]
- Step 5: [WRITE a 2–6 word verb-led step title. WRITE 1 sentence describing what to do in this step (8–18 words, starts with a verb).]

[WRITE 1 sentence closing benefit: "This process <keeps/improves> <benefit> without <tradeoff>."]

---

VIDEO_TEACHABLE (sheet-only formula — not synced to prompt guide)

=AI(
"From this Blueprint, infer the user's #1 teachable topic (what they could credibly teach others).
Must be: specific, audience-relevant, brand-consistent, and actionable (framework/process), stable over time.
Output: describe what the topic is about (start lower-case, no punctuation).

Blueprint:
" & $F3
)

VIDEO_LIST (sheet-only formula — not synced to prompt guide)

=AI(
"Using this topic, compress the user's POV into exactly 3 bullets.
Rules: plain language, no hype, no emojis, no intro/outro, no numbering, no extra commentary.

Topic: " & [VIDEO_TEACHABLE cell] & "

Blueprint:
" & $F3
)

---

COURSE_AVATAR_ASSISTANT

PERSONALIZE:
Your AI Avatar Script:
[Hi, I'm [{{ NAME }}], [{{ ROLE }}].]

[1 sentence naming the common challenge that really needs [{{ VIDEO_TEACHABLE }}].]

[What I teach: 1 sentence stating [{{ VIDEO_TEACHABLE }}] — optionally contrast what it's NOT.]

[3 checks from [{{ VIDEO_LIST }}]: 1 sentence starting "What matters most is..." or "I focus on three things:" then compress [{{ VIDEO_LIST }}] into parallel criteria.]

[What happens if met: 1 sentence — if these are true, decisions move, trust increases, or there is less back-and-forth.]

[Outcome statement: 1 sentence linking the standards to outcomes for clients or teams.]

---

VIBECODING_IDEA (sheet-only formula — not synced to prompt guide)

=AI(
"Generate one zero-iteration app idea based on the user's Blueprint.

Hard constraints:

- Must be interesting/impressive > practical business utility
- Self-contained: NO API keys, NO integrations, NO automations, NO external data
- NO generative AI / NO AI tools (no LLM features)
- Must run using only: local state + simple inputs + embedded sample data
- EXCLUDE categories: email, writing, research, spreadsheets, meetings

Good-fit idea types: playful UI experiments, personal productivity hacks (timers, trackers, gentle nudges), data toys, lightweight games and simulations.

Output ONLY the app idea text (no title labels, no bullets, no explanations), as exactly ONE sentence that clearly implies the UI, the interaction, and what it does.

Blueprint:
" & $F3
)

---

COURSE_VIBECODING_ASSISTANT

PERSONALIZE:
[Turn "{{ VIBECODING_IDEA }}" into a single, implementation-ready Lovable build prompt (output only the prompt)]
