## Onboarding (Step-by-Step URL Spec)

Goal: Super-swift, fun, signal-dense onboarding in 4–5 small steps. Each step is a separate route for deep links and focused work.

### Routes
- `/onboarding/purpose` — purpose selection
- `/onboarding/handle` — handle (mandatory)
- `/onboarding/vibe` — identity/vibe + freeform (LLM to headline later)
- `/onboarding/stack` — stack & superpowers
- `/onboarding/expertise` — non-dev expertise (the “other” skills)
- `/onboarding/showcase` — brag a bit (skippable but recommended)
- `/onboarding/done` — hooray + redirect to directory

### UX Rules
- Mobile-first: large chips, bottom action bar (Back left, Next right), Enter submits, 1–9 selects chips.
- Always provide: prefilled options (chips) + freeform input. Multi-select where relevant.
- Auto-save after each step; show error toasts only.
- Progress indicator: dots or Step X of Y.

### Step Specs

1) Purpose
- Prompt: “PacDuck says welcome! What are you here for?”
- Options: list myself, find collaborators, get hired, I am hiring.
- Freeform: “Something else?”
- Logic: choosing “find collaborators” can fast-path to directory after minimal profile creation.

2) Handle (mandatory)
- Prompt: “Pick your handle”
- Prefill: slugify(GitHub name) → slugify(email local part) → fallback.
- Validate: lowercase letters, numbers, dashes; uniqueness.

3) Vibe
- Prompt: “What’s your vibecoder style?”
- Chips: Ship-first, Benchmarker, Agent Wrangler, Eval Enjoyer, Infra Minimalist, Paper-to-Prototype, R1 Whisperer, Realtime Wizard.
- Freeform: “In one line, how do you work?”
- Output: tags + optional freeform; later LLM turn into punchy headline + tags.

4) Stack & Superpowers
- Prompt: “What do you build with?”
- Chips: Core (Next.js, TypeScript, Python, Go, Rust, Drizzle, Postgres, pgvector, Edge). AI/Agentic (R1, GPT‑4.1, GPT‑4o, Claude, Llama, Agents, Realtime, Evals).
- Freeform: add anything else.
- Optional: short “superpower” input (e.g., “ship MVPs in 48h”).

5) Non‑dev Expertise (new)
- Prompt: “Beyond code, what are you great at?”
- Tone: fun and identity‑revealing; helps others grok your vibe.
- Chips: Musician, Producer, Teacher, Writer, Speaker, Designer, PM, Founder, Climber, Runner, Cyclist, Gamer, Photographer.
- Freeform: “Add your own”.
- Output: `expertiseOther[]` tags used in search and profile.

6) Showcase (skippable but recommended)
- Prompt: “Brag a bit: coolest thing you shipped recently?”
- Inputs: Title, Link (GitHub/Live), One‑liner summary.
- LLM later: compress summary; extract keywords.

7) Done
- “PacDuck says hooray!” + “Go co‑vibe” CTA → /directory.

### Analytics
- purpose_select {choice}
- onboarding_step_view {step}
- onboarding_answer {step, type: option|freeform, count}
- onboarding_back {step}
- onboarding_skip {step}
- onboarding_complete


