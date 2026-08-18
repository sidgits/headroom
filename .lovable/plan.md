# Add "AI Load" as a fourth assessment dimension

Add one new question about how AI changes a person's work, score it as its own dimension alongside Core, Toxic and Growth Load, and feed it into the paid calendar analysis and Heady.

## The new question (Q7)

Asked after the six existing questions, before the Sprinter check:

**How does AI impact your work?**
- A. Makes you think more
- B. Makes you judge and interpret more
- C. Both of the above
- D. Makes you execute more

## What it produces: AI Load

A fourth dimension shown next to Core Load, Toxic Load and Growth Load, scored 0–10 with its own band and interpretation.

| Answer | AI Load | Meaning shown to the user |
| --- | --- | --- |
| Think more | Moderate | AI expands the problem space. Load shifts to framing and choosing. |
| Judge and interpret more | High | Verification and trust overhead — the heaviest AI pattern for depletion. |
| Both | Highest | Thinking and judging stack; the most exposed profile. |
| Execute more | Low | AI absorbs production work; load stays in delivery volume, not judgment. |

**No new archetypes.** The existing eight stay exactly as they are — same classification rules, same names, same burnout thresholds. AI Load is blended into each existing archetype's narrative rather than sitting apart from it:

- Each archetype gets AI-mode-specific lines woven into its mirror copy and dimension interpretations, so an Architect who mostly judges and interprets reads differently from an Architect who mostly executes — but both remain Architects.
- The shadow archetype and "pattern you haven't noticed" paragraphs pick up the AI angle where relevant.
- A burnout-risk nudge: when AI Load is high/highest **and** Growth Load is low, the results page adds an explicit "verification overhead with no capability payoff" warning line inside the existing risk block. Risk level is unchanged unless that combination fires, in which case moderate escalates to high.


## Free vs paid

- Free: the AI Load band and its plain-language meaning are shown (it becomes another reason to subscribe).
- Paid: AI Load is factored into the calendar analysis and Heady.

## Calendar and Heady link

- The answer is stored with the assessment result and read by the calendar analysis.
- High/highest AI Load raises the weight of fragmented, back-to-back and review-type blocks in Toxic Load, and makes protected deep-work defense a higher-priority intervention.
- Heady's system prompt receives the user's AI mode so its coaching is phrased around verification overhead, judgment fatigue or execution volume as appropriate.

## Technical notes

- `src/data/quizQuestions.ts`: add Q7 (id 7).
- `src/lib/scoring.ts`: add an `A` dimension computed from Q7 alone via a small lookup — deliberately outside `SCORING_MATRIX`, so E/I/G totals, `classify()` and the existing burnout rules are untouched. Extend `ScoringResult.dimensionScores` with the AI Load entry and add the overlay/nudge copy.
- `src/pages/Index.tsx`: Q7 flows through the existing `answers` record; the Sprinter branch condition is unchanged.
- `src/components/results/ResultsScreen.tsx`: render AI Load as a fourth dimension card (free-visible band, paid-visible detail).
- `log-assessment` already persists the whole `result_data`, so AI Load is stored with no schema change; `analyze-clt` and `coach-chat` read it from the latest assessment.
- Archetype `dimensionInterpretations` gain an `A` entry per archetype.
