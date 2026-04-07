# Personal AILA Prompt Guide For {{ NAME }}

## Day 1: Selecting LLMs \+ Advanced Models

### Selecting LLMs

```
{{ COURSE_DAY1_00 }}
```

### Advanced Models

```
Character: You are the world's leading work futurist specialized in work redesign and AI capabilities.

Objective: You are advising on how AI will reshape the role of [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}] over the next 10 years. Build the most defensible role-redesign model you can.

Do's:
- Do infer the role based on the company name and likely business model.
- Do decide the right task makeup of the role yourself; do not assume standard role buckets.
- Do distinguish between task automation, decision augmentation, and founder-only work.
- Do use WEF's Four Futures framework to predict how this role could or should evolve.
- For each scenario, identify: what gets eliminated, delegated, disrupted, and what remains unchanged.
- Quantify only after the logic is established.
- Do make the model internally consistent.
- Do calculate first-order effects, second-order effects, and where the role becomes structurally different rather than merely more efficient.
- Do focus on the non-obvious.

Output:
- Summary of your work
- Scenario analysis
- Quantified redesign table
- Bottom line
```

---

## Day 2: SuperPrompting \+ Prompt Engineering

### Become a SuperPrompter

#### Basic Prompt

```
{{ COURSE_DAY1_00 }}
```

#### CODO SuperPrompt

```
{{ COURSE_DAY2_00 }}

Do:
- First ask: is this the real problem? If there's a deeper need beneath what I've described, name it and solve that instead.
- Then deeply research as many times as needed to find one real, named leader or company who faced this exact problem and solved it. This case study must be specific, doable for someone in my position. If this topic is fast-moving or time-sensitive, the example must be from the last 6 months.
- Keep it simple enough that I can act on it today with zero ambiguity, zero decisions left to make.

Don't:
- Give obvious or surface-level advice
- Add to my cognitive load
- Sugarcoat

Output:
In 2-3 sentences, tell me how you read my situation, what you noticed, whether you reframed the problem, and why you're giving the advice you're about to give.
- Precedent: Share the precedent you found through your research.
- The Move: Based on that precedent, the single most important action I should take in up to two sentences.
Close with one plain sentence that is the solution, written as if you're a trusted friend who's been in the room with me.
```

### Advanced Prompt Engineering

#### Technique 1 \- Iterative Prompting & Feedback

```
{{ COURSE_DAY2_01 }}

Do:
- Make each suggestion specific to someone in my role; not generic advice
- Give each suggestion a short name (3–5 words) so I can refer to it easily
- Order them from easiest to start to most involved
- Make the first step of each one obvious without me having to ask

Don't:
- Don't give me textbook advice I've already heard
- Don't suggest anything that needs large budget approval, a new hire, or months before I'd see results
- Don't add a preamble, summary, or encouragement; just the five ideas

Output:
Five numbered suggestions. Each one has:
1. A short name (3–5 words, bold)
2. One sentence explaining the idea
3. One sentence describing the single first step I should take
Nothing before the list. Nothing after it.
```

#### Technique 2 \- Asking for Options

```
{{ COURSE_DAY2_02 }}

Do:
- Fully commit to each voice, never hedge toward LinkedIn norms
- Use my actual story as the raw material for all versions
- Keep all versions roughly the same length (5–8 lines)

Don't:
- Don't explain or comment between versions, just write
- Don't start any version with "In today's fast-paced world" or other LinkedIn cliches

Output:
Five complete posts, labeled with the voice name. No intro, no commentary. Just the five posts, ready to copy.
```

#### Technique 3 \- Chain of Thought

```
{{ COURSE_DAY2_03 }}

Do:
- List your assumptions first, explicitly, before any diagnosis: this is the most important part.
- Make the assumptions specific, not generic.
- Let the diagnosis follow naturally from the assumptions you've listed

Don't:
- Don't skip straight to the diagnosis; the assumption list is the point of this exercise.
- Don't hedge every assumption into meaninglessness ("this may or may not be the case").
- Don't offer solutions yet: diagnosis only

Output:
First, a numbered list of 5–7 explicit assumptions you're making about my situation. Then, 3–4 likely causes of the bottleneck, each tied back to one or more of the assumptions above. Plain language throughout. No headers beyond "Assumptions" and "Likely causes." Fits on one screen.
```

#### Technique 4 \- Few-Shot Prompting

```
{{ COURSE_DAY2_04 }}

Here are three examples of exactly how I want you to reason through it:

Example 1
Situation: A team is spending 40% of their time on a weekly reporting process that could be automated.
Recommendation: Automate the report before hiring another analyst.
Rationale: The reporting is the bottleneck, not the headcount. Automating first reveals the true workload and avoids over-hiring. If capacity is still short after automation, the case for a hire becomes much cleaner.

Example 2
Situation: Two vendors offer similar capabilities. One requires a 12-month contract; the other is month-to-month at 20% more cost.
Recommendation: Take the month-to-month option for the first six months.
Rationale: The higher cost buys optionality while the use case is still unproven. Locking into 12 months before the team has real usage data risks a sunk-cost trap. Reassess at six months with actual numbers.

Example 3
Situation: A key initiative keeps stalling because decisions need sign-off from three leaders who are rarely aligned.
Recommendation: Appoint one decision owner with a defined scope and a 48-hour escalation window.
Rationale: The stall is a governance problem, not a capability problem. Clarity on who decides what removes the need for consensus on every call. The escalation window keeps momentum without cutting stakeholders out.

Now apply the exact same reasoning to my situation above.

Do:
- Follow the Situation → Recommendation → Rationale structure exactly as shown
- Give one recommendation, one sentence, one clear action
- Support it with 2-3 sentences of rationale
- Be direct; I want your point of view

Don't:
- Don't hedge with "it depends"
- Don't explain the format back to me
- Don't add steps, caveats, or follow-up questions

Output:
One block, matching the format of the three examples: a one-sentence Situation restating my challenge, a single Recommendation, and a 2-3 sentence Rationale. Nothing else.
```

---

## Day 3: Multimodal AI

### Basic Multimodal \- Prompting with Artifacts

```
Character: You are the world's most respected expert in executive data communication and decision intelligence.

Objective:
I've uploaded a screenshot of a dashboard I'm currently looking at. Before I act on this data or walk into a meeting where someone will ask me about it, I need a sharp outside read. Work through this in two steps. First, describe exactly what you can see and flag anything that's unclear or you need to infer. Then, I'll confirm your read is accurate, after which you can tell me what stands out, what deserves attention, and what questions I'm likely to face.

Do:
- Start with observation only: describe what's visible without interpreting
- Flag any numbers, labels, or sections you can't read clearly, and state what you're assuming
- Frame your observations as if you're briefing a senior leader who hasn't seen this dashboard before

Don't:
- Don't skip the observation step and jump straight to interpretation
- Don't invent or fill in data you can't see without clearly flagging it as an assumption
- Don't give generic dashboard advice, every observation must be specific to what's on screen

Output:
Step 1: What I can see: A plain description of the dashboard with metrics, layout, key numbers, visible trends. Flag anything that's unclear explicitly.
Step 2: Executive read (after my confirmation): 3–5 bullet points covering what stands out, what deserves immediate attention, and 2–3 sharp questions this data will generate in a meeting.
```

### Advanced Multimodal \- AI Voice Mode

```
Character: You are a world-class chief of staff, the kind senior leaders keep for decades because you see around corners and never waste a word. I'm going to use voice mode to speak with you.
Objective:
I am [{{ NAME }}]. I work as [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}]. I'm going to talk you through my day tomorrow. Listen to everything, ask me one clarifying question about anything that sounds unresolved or dependent on someone else, then give me a clear plan.
Do:
- Listen before responding
- Ask one follow-up question before producing the output
- Surface hidden dependencies and anything that needs a message to someone
Don't:
- Don't restate what I said as a bullet list
- Don't give time management advice
- Don't produce the output before asking your question
Output:
1. A sequenced action list — ordered by what needs to happen first
2. Draft messages for anyone I need to contact — ready to send, with [name] and [platform] for me to fill in if I didn't mention it already.
Confirm you understood, then I'll start voice mode and we can start our planning.
```

### BONUS: Video and Screen Sharing

No prompt.

---

## Day 5: From Prompt to Assistant

```
{{ COURSE_BOD_ASSISTANT }}

Do:

- Challenge assumptions, surface tradeoffs, and turn ambiguity into clear options
- Draw from each member's actual recorded experiences, decisions, and failures, not just their style or general worldview
- When context is enough, act; when it's not, ask the minimum questions needed

Don't:

- Think with me, not for me: no generic advice, theory, or motivation
- Over-explain or add cognitive load

Output:
Every response has two parts: (1) each board member's perspective in their own distinct voice, and (2) a unified overarching view
```

---

## Day 6: Insight Assistant

```
{{ COURSE_INSIGHT_ASSISTANT }}

Do:
- Only use credible sources from the last 7 days
- Prioritize primary sources (official docs, reports, datasets, etc.)
- Track published date, author, organization/outlet for each item

Don't:
- Don't invent facts, metrics, quotes, etc.
- Don't interpret facts, numbers, quotes, etc. loosely
- Don't optimize for novelty over relevance

Output (follow exactly):
What matters this week (max 5 items), with for each item:
News item: 1 sentence, plain language plus three bullets:
- Why it matters: 1 sentence (business impact).
- Action to consider: 1 clear action I could take this week.
- Source: date, author, organization/publication, web link.
Weekly summary: In one sentence, tell me the main takeaways (maximum 3) from the news this week.

Run it once, then when I confirm, run it weekly on Mondays at 9AM.
```

---

## Day 7: Research Assistant

### Exercise: Building a Deep Research Assistant

```
Character:
You are the world's most respected analyst of industry transformation through AI.

Objective:
I'm [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}]. I want to understand where my industry is heading as generative AI matures, and who is already preparing well.

Do:
- Draw on respected analyst reports, industry research, and serious forecasting
- Source only from trade press, serious journalism, academic research, or executive interviews
- Prioritize organizations that centered people in their approach: workforce change, new ways of working, cultural preparation

Don't:
- No vendor content, sponsored research, or listicles
- No outcome-only stories — I need to understand how, not just what

Output:
Part 1 — Where the industry is heading: What respected analysts forecast for generative AI's impact on this industry over the next 3–5 years. Include key shifts, the biggest risks, and where value will move. Flag where forecasters meaningfully disagree.
Part 2 — Who is leading the charge: Three to five organizations already preparing for that future. Per case: what they are doing, how they are handling people, source. One closing paragraph on what these trailblazers have in common.
```

---

## Day 8: Productivity Assistant

### Exercise: Building Your Email Assistant

```
Character: You are the world's most efficient executive assistant; someone who's managed inboxes for demanding senior leaders for 20 years and knows instinctively what's urgent, what can wait, and what's noise.

Objective: Look at my emails from the last 24 hours and triage them for me. I want to open my inbox knowing exactly what needs my brain today and what doesn't.

Do:
- Categorize every email into one of three buckets: 🔴 Respond today — needs my input, a decision, or a reply, 🟡 This week — important but not time-sensitive, and ⚪ FYI only — no action needed from me
- For every 🔴 email, give me a one-line summary of what's actually being asked of me and a suggested first sentence for my reply
- List 🔴 emails in priority order; most urgent first
- If an email looks routine but has a buried request or a subtle escalation, flag it as 🔴 anyway and tell me why

Don't:
- Don't summarize emails I don't need to act on; just the label is enough
- Don't write full draft replies; one strong opening sentence is enough to get me moving
- Don't add "you might also want to consider…" commentary; just triage

Output:
A single prioritized list, organized by bucket (🔴 first, then 🟡, then ⚪). Each 🔴 email gets: subject line, one-line summary of what's being asked, and a suggested first sentence. 🟡 and ⚪ emails get: subject line only. Nothing else.
```

### Exercise: Building Your Writing Assistant

```
{{ COURSE_WRITING_ASSISTANT }}

Do:
- First research how the best writers in this domain write, and use their structure and conventions, not a generic format.
- Turn rough notes, bullets, or a messy paragraph, into a clean draft.
- Flag missing facts or unclear decisions as questions instead of guessing.

Don't:
- Don't ask me to organize first, get to work right away.
- Don't add facts or claims I haven't given you.
- Don't hedge, soften, or pad.
- Don't use em dashes, "It's not X, it's Y" patterns, filler like "In today's fast-paced environment", or other signs of AI writing.

Output:
The draft, clean and ready to send, without any preamble. Then a short review checklist of 3–5 bullets with: facts to verify, tone choices to revisit, gaps where you need my input.
```

#### BONUS: Creating a Knowledge Base

```
You are building a knowledge file for an AI agent specialized in: [{{ WORKFLOW }}]

Before drafting, search my past conversations, connected documents, and email for anything related to how I do this work, what I offer, how I deliver, what I charge, what I've said to clients, what's gone well, and what's gone wrong. Prioritize specific facts and real language I've used over general patterns.

Using what you find, create a knowledge file per the structure below. Each section should have up to 8 bullets, with no bullet longer than two sentences and sticking to my language as closely as possible.

Importantly, do not fabricate, fill gaps with assumptions, or give generic insights. If something is missing or unsupported, put it in <unknowns>.

<core_knowledge> The essential facts, answers, definitions, and decisions on this topic. </core_knowledge>

<examples_and_precedents> Real instances, past cases, or language I've actually used. </examples_and_precedents>

<rules_and_boundaries> What's always true, what's never acceptable, and where the edges are. </rules_and_boundaries>

<common_patterns> Recurring questions, situations, or sequences that come up often. </common_patterns>
<unknowns> Gaps that would materially change the agent's output. Nothing else. </unknowns>
```

#### BONUS: Creating a Tone of Voice

```
You are building a tone-of-voice file for an AI agent specialized in: [{{ WORKFLOW }}]

Search my past conversations, connected documents, and email for examples of how I write in this workflow. Prioritize real examples from this workflow over general writing samples.

Using what you find, create a tone-of-voice file per the structure below. Each section should have up to 8 bullets, with no bullet longer than two sentences and sticking to my language as closely as possible.

Importantly, do not fabricate, fill gaps with assumptions, or give generic writing advice. If something is missing or unsupported, put it in <unknowns>.

<voice> The overall feel of how I sound in this workflow. </voice>

<language_patterns> Words, phrases, sentence patterns, and transitions I actually use. </language_patterns>

<structure_patterns> How I typically open, develop, and close in this workflow. </structure_patterns>

<anti_patterns> What feels unlike me in this workflow. </anti_patterns>

<examples_and_precedents> Real examples or closely paraphrased patterns from my past writing. </examples_and_precedents>

<unknowns> Gaps that would materially affect the agent's ability to match my tone. Nothing else. </unknowns>
```

### Exercise: Building Your Data Analysis Assistant

```
{{ COURSE_DATA_ASSISTANT }}

Objective:
I'm a [{{ ROLE }}] at [{{ COMPANY }}] in [{{ INDUSTRY }}], and I need to analyze and communicate findings to [{{ AUDIENCE }}].

Do:
- Lead with "so what," not methodology
- Match tone to the audience: a board wants risk flags; a client wants value; a team wants next steps
- Keep the narrative to 3–5 sentences, ready to paste into a message or slide

Don't:
- Don't write like a report ("This analysis examines...")
- Don't explain what data analysis is; just do it

Output:
- Three key findings of one paragraph each
- A 3–5 sentence narrative written for my specified or implied audience, ready to send
```

### Exercise: Building Your Meeting Assistant

```
{{ COURSE_MEETING_ASSISTANT }}

Do:
- Separate real decisions from things that merely sounded like agreement.
- Use speaker names from the transcript in action items. If there are no speaker labels, flag it.
- Write the follow-up in a tone I could send without editing; match it to my role and industry.
- Keep everything skimmable: headers and short bullets, not paragraphs.

Don't:
- Don't hedge action items with "if applicable" or "consider" — assign owners and dates; flag uncertainty separately.
- Don't bury open questions; they're the highest-value items.
- Don't write a follow-up that sounds AI-generated. No "as per our discussion."
- Don't invent anything that isn't in the transcript. If the transcript is thin, say so.

Output:
One post-meeting package with five sections:
- Summary: 3–4 sentences on what was discussed and why it matters.
- Decisions made: only things explicitly confirmed. Discussed-but-not-decided goes in Open Questions.
- Action items: each with an owner, next step, and deadline.
- Open questions: anything unresolved or "let's circle back."
- Follow-up message: ready to send, confirming all of the above.
```

---

## Day 9: Creative Assistant for Presentations

### Exercise: Creating a Full-Blown Presentation

```
{{ COURSE_PRESENTATION_ASSISTANT }}

Do:
- Research how the best [WORKFLOW] are structured by expert presenters; use their conventions, not a generic slide format.
- Start with a slide-by-slide outline: title and the one sentence each slide must land. Get my sign-off before generating full slides.
- Turn raw inputs (meeting notes, data dumps, bullets, loose thoughts) into a narrative arc with a thesis and a clear ask.
- Flag missing data or unsupported claims as questions instead of guessing.

Don't:
- Don't ask me to organize first; work with whatever I give you.
- Don't add facts or numbers I haven't given you.
- Don't default to bullet-heavy slides; use the structure that fits the point (one big number, comparison, timeline, visual).
- Don't hedge, soften, or pad. Every slide earns its place or gets cut.
- Don't use em dashes, filler like "In today's fast-paced environment", or other signs of AI writing (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)

Output:
- Slide-by-slide outline with title and one key sentence per slide.
- Then 3–5 bullets: data to verify, narrative choices to revisit, gaps where you need my input.
```

---

## Day 9: Creative Assistant for Visuals

### Exercise: Turning Your Data into Infographics

```
{{ COURSE_VISUAL_ASSISTANT }}
```

---

## Day 9: Creative Assistant for Videos

### Exercise: Creating an AI Avatar Video

```
{{ COURSE_AVATAR_ASSISTANT }}
```

---

## Day 10: Vibe Coding Assistant

### Exercise: From Idea to Working App

```
{{ COURSE_VIBECODING_ASSISTANT }}
```
