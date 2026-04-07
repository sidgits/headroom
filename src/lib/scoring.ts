// Headroom Scoring Engine — deterministic, no AI
// Based on Sweller's Cognitive Load Theory
// Three dimensions: Friction (E), Complexity (I), Growth (G)

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  archetype: Archetype;
  burnoutRisk: BurnoutRisk;
  dimensionScores: DimensionScore[];
  recommendations: string[];
  mirror: MirrorContent;
  shadowArchetype: ShadowArchetype;
}

export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  description: string;
}

export interface MirrorContent {
  atYourBest: string;
  workingAgainstYou: string;
  patternNotNoticed: string;
}

export interface ShadowArchetype {
  name: string;
  description: string;
}

export interface BurnoutRisk {
  level: "low" | "moderate" | "high";
  label: string;
  signal: string;
  description: string;
  earlyIntervention: string;
}

export interface DimensionScore {
  name: string;
  code: string;
  plainLanguage: string;
  score: number;
  maxScore: number;
  interpretation: string;
}

// Scoring matrix from spec — each question contributes to all 3 dimensions
const SCORING_MATRIX: Record<string, Record<string, { E: number; I: number; G: number }>> = {
  Q1: { A: { E: 1, I: 2, G: 3 }, B: { E: 3, I: 2, G: 1 }, C: { E: 1, I: 1, G: 1 }, D: { E: 2, I: 2, G: 2 } },
  Q2: { A: { E: 1, I: 3, G: 3 }, B: { E: 3, I: 2, G: 2 }, C: { E: 2, I: 2, G: 1 }, D: { E: 2, I: 1, G: 1 } },
  Q3: { A: { E: 1, I: 3, G: 3 }, B: { E: 2, I: 2, G: 3 }, C: { E: 1, I: 1, G: 2 }, D: { E: 2, I: 2, G: 2 } },
  Q4: { A: { E: 1, I: 3, G: 3 }, B: { E: 3, I: 3, G: 2 }, C: { E: 2, I: 2, G: 3 }, D: { E: 2, I: 1, G: 1 } },
  Q5: { A: { E: 1, I: 2, G: 3 }, B: { E: 2, I: 1, G: 1 }, C: { E: 1, I: 2, G: 3 }, D: { E: 3, I: 2, G: 2 } },
  Q6: { A: { E: 3, I: 2, G: 1 }, B: { E: 1, I: 1, G: 1 }, C: { E: 3, I: 3, G: 2 }, D: { E: 2, I: 1, G: 1 } },
};

// Normalise raw score (6-18) to 1-10 scale
function normalise(raw: number): number {
  return Math.round(((raw - 6) / 12) * 10 * 10) / 10;
}

function getScoreLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}

// Classification rules from spec (evaluated in order)
function classify(
  E: number, I: number, G: number,
  answers: Record<number, string>,
  sprinterAnswer: string | null
): string {
  // Rule 1+2: Sprinter check
  if (answers[4] === "B" && answers[6] === "A" && sprinterAnswer === "A") return "sprinter";
  // Rule 3: Dominant dimension 8+ or 2-
  // Rule 5: Architect
  if (I >= 7 && G >= 7 && E <= 3) return "architect";
  // Rule 6: Firefighter
  if (E >= 7 && I <= 6 && G <= 3) return "firefighter";
  // Rule 7: Ghost
  if (I <= 3 && G <= 3) return "ghost";
  // Rule 4: Accumulator
  if (E >= 7 && I >= 7) {
    if (G >= 7) return "architect"; // architect in bad conditions
    return "accumulator";
  }
  // Rule 8: Connector
  if (G >= 7 && E <= 6 && I <= 6) return "connector";
  // Rule 9: Steady Hand
  if (E <= 3 && I <= 3 && G <= 3) return "steady_hand";
  // Rule 10: Conductor (all scores 4-6)
  if (E >= 4 && E <= 6 && I >= 4 && I <= 6 && G >= 4 && G <= 6) return "conductor";
  // Rule 11: Default fallback
  return "conductor";
}

// Burnout risk rules from spec
function getBurnoutRiskFromScores(archetypeId: string, E: number, I: number, G: number, sprinterAnswer: string | null): BurnoutRisk {
  // BR-1: High — Active
  if (E >= 7 && G <= 3) {
    return {
      level: "high",
      label: "High — Active Risk",
      signal: `E very high, G very low — chronic extraneous load with no germane recovery`,
      description: archetypeId === "accumulator"
        ? "The Accumulator carries the highest objective burnout risk in the Headroom system alongside the Firefighter. Both environmental noise and intrinsic task complexity are at maximum simultaneously. Near-zero germane load means there is no growth signal to offset the depletion. This is not a future risk. It is a present condition that has not yet produced visible symptoms."
        : "This is the highest burnout risk profile in the Headroom system. High extraneous load combined with near-zero germane load is the precise signature of chronic occupational stress as defined by the WHO's burnout classification. You are not building capability. You are consuming it. Without deliberate intervention, the trajectory leads to exhaustion, cynicism, and sudden collapse of the high-performance identity you've built.",
      earlyIntervention: archetypeId === "accumulator"
        ? "One real no this week. Not a small no — a real one. The clarity that single act produces about what is optional versus mandatory is worth more than the commitment being declined."
        : "One protected non-urgent block per week is the minimum viable intervention. Not because it solves the problem — but because it breaks the urgency-only pattern long enough for you to see what the pattern is doing.",
    };
  }
  // BR-2: High — Silent
  if (G <= 2 && I <= 3) {
    return {
      level: "high",
      label: "High — Silent Burnout Risk",
      signal: "G at minimum, I low — germane load effectively zero, meaning work provides no growth or meaning signal",
      description: "The Ghost's burnout is the most dangerous profile precisely because it is invisible. There are no performance flags, no complaints, no obvious distress signals. But near-zero germane load means the work has stopped providing the intrinsic reward that sustains engagement. This is the pattern behind unexpected resignations that surprise managers.",
      earlyIntervention: "One specific visible contribution goal, named and shared with one person. Accountability to something specific is the only intervention that works for this profile.",
    };
  }
  // BR-3: Moderate — Cycle Collapse
  if (sprinterAnswer === "A") {
    return {
      level: "moderate",
      label: "Moderate — Cycle Collapse Risk",
      signal: "Cyclical E and G — burnout risk spikes when recovery phases are compressed or skipped",
      description: "The Sprinter's burnout is not chronic — it is acute and sudden. The risk is not gradual depletion but cycle collapse: when external pressure compresses the recovery window consistently, the system loses its reset mechanism entirely. This is the burnout pattern that arrives with no warning.",
      earlyIntervention: "Treat recovery phases as non-negotiable as sprint commitments. One skipped recovery is manageable. Three consecutive skipped recoveries is a clinical risk.",
    };
  }
  // BR-4/5: Moderate — Latent
  if ((E >= 5 && E <= 7 && G >= 4 && G <= 6) || (E <= 3 && I >= 7 && G >= 7)) {
    return {
      level: "moderate",
      label: "Moderate — Latent Risk",
      signal: archetypeId === "conductor"
        ? "E high, G medium — high coordination load with insufficient personal growth signal"
        : "E low, I high, G high — environment working against natural pattern",
      description: archetypeId === "conductor"
        ? "The Conductor's burnout path is distinct and underdiagnosed. It doesn't come from overwork — it comes from chronic underrecognition of invisible contribution combined with the gradual disappearance of personally meaningful work. The risk isn't exhaustion — it's the slow dimming of professional identity."
        : "Your growth orientation and complexity appetite protect you from acute burnout — for now. But sustained fragmentation of your deep work environment creates slow accumulation of extraneous load that eventually overrides your germane load capacity. You won't see burnout coming. It arrives quietly, as disengagement disguised as busyness.",
      earlyIntervention: archetypeId === "conductor"
        ? "Four hours per week of protected personal creation time — not coordination, not facilitation, not other people's work. That window is what keeps the Conductor's own professional identity alive."
        : "Protect your first 90 minutes daily as deep work. The moment that window starts shrinking consistently, burnout risk escalates from moderate to high within weeks.",
    };
  }
  // BR-6: Low — Disengagement
  if (E <= 3 && I <= 3 && G <= 3) {
    return {
      level: "low",
      label: "Low — Disengagement Risk",
      signal: "All dimensions low — burnout risk is disengagement-type, not exhaustion-type",
      description: "The Steady Hand's burnout profile is the least visible and most misdiagnosed. It is not driven by overload — it is driven by under-challenge. Workers who are engaged but unstretched drift into quiet disengagement that is functionally indistinguishable from burnout in its outcomes.",
      earlyIntervention: "The intervention is not rest — it's challenge. One genuinely uncertain project in the next 30 days is the minimum viable stimulus.",
    };
  }
  // BR-7: Low — Environment mismatch
  if (G >= 7 && E >= 4 && E <= 6) {
    return {
      level: "low",
      label: "Low — Environment Mismatch Risk",
      signal: "G high, E medium — strong growth orientation but environment-dependent; risk escalates in isolation",
      description: "The Connector's burnout risk is the most context-dependent in the system. In a collaborative, dialogue-rich environment the risk is genuinely low. But in remote-first, async-heavy, or solo-intensive environments the risk escalates rapidly.",
      earlyIntervention: "Audit your environment before your workload. If collaborative time has dropped below 40% of your week, that is the risk factor to address.",
    };
  }
  // Default moderate
  return {
    level: "moderate",
    label: "Moderate Risk",
    signal: "Mixed dimension profile",
    description: "Your cognitive load pattern shows moderate risk factors. Monitor your dimensions and make adjustments to protect your headroom.",
    earlyIntervention: "Track your energy levels daily for two weeks to identify which dimension is most affecting you.",
  };
}

// Full archetype data from spec
interface ArchetypeData {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  mirror: MirrorContent;
  shadow: ShadowArchetype;
  unlock: string;
  dimensionInterpretations: Record<string, (score: number) => string>;
}

const ARCHETYPES: Record<string, ArchetypeData> = {
  architect: {
    id: "architect",
    name: "The Architect",
    emoji: "🏗️",
    headline: "You don't have a productivity problem. You have a headroom problem.",
    mirror: {
      atYourBest: "At your best you produce work that other people genuinely can't. The depth of thinking, the quality of output — it's categorically different when you have the conditions you need. You don't just solve problems, you reframe them. That's rare.",
      workingAgainstYou: "But your environment keeps fragmenting your day. Interruptions, context switching, reactive demands — each one is smaller than it seems, but together they're consuming the headroom where your best work lives. You're not underperforming. Your conditions are.",
      patternNotNoticed: "Here's what you probably haven't noticed: your most frustrating days aren't your busiest days. They're the days where you almost got into deep focus — and kept getting pulled out. The near-misses are more draining than the chaos.",
    },
    shadow: {
      name: "The Firefighter",
      description: "When your headroom collapses — too many demands, too little space — you stop architecting and start reacting. You know this version of yourself. It feels busy but hollow. Recognising that shift early is the move.",
    },
    unlock: "Block the first 90 minutes of your day as non-negotiable deep work. No meetings, no messages, no exceptions. One protected window changes everything for your archetype.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: You're highly sensitive to interruptions. That's not a weakness — it means you're wired for depth.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: You're drawn to hard problems. This is your core engine.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: When you have headroom, you grow.`,
    },
  },
  firefighter: {
    id: "firefighter",
    name: "The Firefighter",
    emoji: "🚒",
    headline: "You're most alive when everything is on fire. That's the problem.",
    mirror: {
      atYourBest: "You're exceptional under pressure. When the stakes are high and the clock is running, you shift into a gear that most people don't have. Decisive, energetic, effective. People trust you in a crisis because you've earned it — repeatedly.",
      workingAgainstYou: "But urgency has become your default operating mode, not your emergency mode. You're not just responding to fires anymore — you're unconsciously creating the conditions for them. A calm week doesn't feel productive. It feels wrong. And that's the pattern worth examining.",
      patternNotNoticed: "Here's what you probably haven't noticed: your growth has slowed significantly. You're highly skilled at execution under pressure, but you're not building new capability. The Firefighter archetype is one of the most capable in the short term and one of the most stagnant over time.",
    },
    shadow: {
      name: "The Accumulator",
      description: "When the fires stop coming, you fill the void by taking on more. More projects, more responsibilities, more commitments. It looks like ambition. It's actually the same urgency addiction in a different form.",
    },
    unlock: "Schedule one two-hour block per week with no deliverable. No output expected. Just strategic thinking time. It will feel uncomfortable at first — that discomfort is the signal you need it most.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: You don't just tolerate chaos — you run on it. The question is whether it's serving you.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: You engage complexity when it arrives urgently, not by design.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Reactive work rarely builds new capability.`,
    },
  },
  conductor: {
    id: "conductor",
    name: "The Conductor",
    emoji: "🎼",
    headline: "Your job is to make everyone else's job possible. Nobody sees the cost of that.",
    mirror: {
      atYourBest: "You hold more threads simultaneously than almost anyone around you. Projects, people, priorities, politics — you track all of it and nothing falls through. The team moves faster because of you, even when they can't articulate why. That's a rare and genuinely valuable skill.",
      workingAgainstYou: "But your contribution is almost entirely invisible. You don't produce the deck, ship the code, or close the deal — you make all of that possible. In environments that measure output over orchestration, your value is chronically underrecognised. That's not a you problem. It's a measurement problem.",
      patternNotNoticed: "Here's what you probably haven't noticed: you've become so good at managing everyone else's cognitive load that you've stopped prioritising your own. Your day is a series of other people's priorities. You're excellent at it. But when did you last do work that was purely yours?",
    },
    shadow: {
      name: "The Ghost",
      description: "When the coordination demand gets too high and the recognition too low, you start to disengage quietly. Still present in every meeting. Diminishing in every room. It happens slowly and then suddenly.",
    },
    unlock: "Carve out four hours per week that are yours alone — no coordination, no facilitation, no other people's problems. Use it for something you want to build. The Conductor who never composes eventually stops conducting.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: You operate in high-friction environments by design. You just absorb it better than most.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: Your complexity is relational, not technical. That's a different kind of hard.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Your growth happens through other people. That's valid — but it needs to be supplemented.`,
    },
  },
  sprinter: {
    id: "sprinter",
    name: "The Sprinter",
    emoji: "⚡",
    headline: "You do a week's work in two days. Then you need two days to recover. Most tools aren't built for you.",
    mirror: {
      atYourBest: "When you're on, you're exceptional. The output quality, the pace, the intensity — it's genuinely impressive. You can compress enormous amounts of work into a short window when the conditions and energy align. People around you sometimes can't keep up.",
      workingAgainstYou: "But your rhythm is cyclical by nature, and linear work environments punish that. You're expected to produce consistently when your biology runs in waves. The recovery periods — which you actually need — read as laziness or inconsistency to people who don't understand your pattern.",
      patternNotNoticed: "Here's what you probably haven't noticed: you spend enormous energy managing other people's perception of your recovery phases rather than actually recovering. That friction is extending your recovery time and shortening your sprint windows.",
    },
    shadow: {
      name: "The Burnout State",
      description: "When sprint cycles shorten and recovery is skipped or cut short — usually because of external pressure — the system breaks down. Not gradually. Suddenly. The Sprinter who ignores recovery signals doesn't slow down. They stop.",
    },
    unlock: "Name your recovery periods as deliberately as you name your sprint goals. Tell your team: 'I'm in a consolidation phase this week.' Language legitimises the rhythm and removes the perception management overhead that's draining you.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: You can absorb friction during sprint phases. In recovery phases it hits much harder.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: Hard problems are what trigger your best sprint states. Routine work doesn't activate you.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Your growth happens in bursts. That's valid — but it needs protected recovery.`,
    },
  },
  steady_hand: {
    id: "steady_hand",
    name: "The Steady Hand",
    emoji: "🤝",
    headline: "You could do this in your sleep. That might be the problem.",
    mirror: {
      atYourBest: "You're the person everyone counts on. Reliable, consistent, low-drama, high-trust. When something needs to get done without fanfare, it lands with you. That dependability is genuinely valuable — more valuable than most organisations admit.",
      workingAgainstYou: "But you're running well below your actual capacity. The work isn't challenging you anymore. You've mastered your environment so thoroughly that there's no friction left — and no friction means no growth signal. The comfort is real. So is the cost.",
      patternNotNoticed: "Here's what you probably haven't noticed: the quiet disengagement has been building for longer than you think. You're still delivering. But the energy behind the delivery has been declining steadily.",
    },
    shadow: {
      name: "The Ghost",
      description: "When disengagement extends long enough, presence becomes performance. Still in every meeting. Still delivering. But the light behind it has dimmed. The Steady Hand who isn't challenged enough drifts toward the Ghost without realising it.",
    },
    unlock: "Deliberately take on one project in the next 30 days that you're not sure you can do. The discomfort of genuine uncertainty is the growth signal your system is missing.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: Your environment is calm and well-managed. That's earned. It may also be limiting.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: You're not seeking harder problems. That might be a choice worth revisiting.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Growth has stalled — not from overload, but from under-challenge.`,
    },
  },
  ghost: {
    id: "ghost",
    name: "The Ghost",
    emoji: "👻",
    headline: "You're in every room but nowhere at once.",
    mirror: {
      atYourBest: "You're observant, politically aware, and safe to have in any room. You don't create friction, you don't make enemies, and you remember things that others miss. People like having you around even if they can't always articulate your contribution. That's not nothing.",
      workingAgainstYou: "But drift has become your default state. The days pass — full of meetings, conversations, and small tasks — without a clear sense of what you're actually building or moving forward. You're present everywhere and accountable to nothing specific.",
      patternNotNoticed: "Here's what you probably haven't noticed: you've stopped expecting work to be meaningful. Not consciously. But the expectation has quietly lowered to the point where you're no longer looking for the work that would actually engage you.",
    },
    shadow: {
      name: "The Steady Hand",
      description: "On good weeks you stabilise into Steady Hand territory — consistent, reliable, calm. But without deliberate intervention, the drift pulls you back. The difference between Ghost and Steady Hand is intentionality, not capability.",
    },
    unlock: "Identify one thing you want to be known for in your current role that you're not known for yet. Write it down. Tell one person. Accountability to a specific contribution pulls you out of drift faster than any productivity system.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: You're not overwhelmed — you're underleveraged. Different problem, often mistaken for the same one.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: You've stopped reaching for harder problems. The reach needs to come back.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Near-zero growth signal. The work has stopped building anything.`,
    },
  },
  connector: {
    id: "connector",
    name: "The Connector",
    emoji: "🔗",
    headline: "You think out loud. Alone you just think in circles.",
    mirror: {
      atYourBest: "Your best ideas emerge in conversation. You make other people sharper, you find connections across domains that others miss, and you bring energy to collaborative work that's genuinely contagious. The relationships you build are real assets — for you and for the people around you.",
      workingAgainstYou: "But async work environments, solo deliverables, and remote setups are quietly depleting you. You're doing the same hours but in conditions that don't activate your best thinking. The output is fine. The experience is draining in a way that's hard to explain to colleagues who thrive in solitude.",
      patternNotNoticed: "Here's what you probably haven't noticed: you're judging your solo output against your collaborative output and finding yourself lacking. But that's not a capability gap — it's an environment mismatch.",
    },
    shadow: {
      name: "The Ghost",
      description: "Extended periods of isolated work don't just drain you — they disengage you. When the social signal disappears for long enough, motivation follows. The Connector in a solo environment for too long becomes the Ghost.",
    },
    unlock: "Restructure your solo work to include a thinking partner — even asynchronously. A weekly 30-minute call where you talk through your work in progress activates the cognitive mode where you do your best thinking.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: Social interaction is signal for you, not noise. The friction comes from isolation, not stimulation.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: Your complexity threshold rises in collaborative settings and drops in isolation.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: Your growth is dialogue-dependent. That's a strength in the right environment.`,
    },
  },
  accumulator: {
    id: "accumulator",
    name: "The Accumulator",
    emoji: "📦",
    headline: "The reward for good work is more work. You've been rewarded a lot.",
    mirror: {
      atYourBest: "You're one of the most capable people in any room you enter. High complexity doesn't intimidate you, high stakes don't rattle you, and people trust you with the work that matters precisely because you've always come through. That track record is real and it's earned.",
      workingAgainstYou: "But your capacity for high-quality work has become a liability. The more you deliver, the more arrives. Your plate isn't full by accident — it's full because you're competent and because the system has learned that you'll absorb what others won't. You're being quietly exploited by your own reputation.",
      patternNotNoticed: "Here's what you probably haven't noticed: the quality of your output has been declining slowly for longer than you've admitted. The work that used to energise you now just gets done. That shift — from energised to functional — is the signal that the accumulation has crossed a line.",
    },
    shadow: {
      name: "The Firefighter",
      description: "When the accumulation peaks, everything becomes urgent by default. You shift from strategic overload to reactive chaos — not because you've lost capability but because the system has exceeded its capacity. The Accumulator in crisis looks exactly like a Firefighter.",
    },
    unlock: "Say no to one commitment this week that you would normally say yes to. Not a small one. A real one. The discomfort of that single no will show you exactly how much of your load is optional versus mandatory.",
    dimensionInterpretations: {
      E: (s) => `${getScoreLabel(s)} — ${s}/10: Environmental noise is constant and high. You've normalised it — that's not the same as managing it.`,
      I: (s) => `${getScoreLabel(s)} — ${s}/10: You handle high complexity — but at the cost of everything else.`,
      G: (s) => `${getScoreLabel(s)} — ${s}/10: No recovery signal. You're consuming capability, not building it.`,
    },
  },
};

export function calculateResults(
  answers: Record<number, string>,
  sprinterAnswer: string | null
): ScoringResult {
  // Calculate raw E, I, G scores
  let rawE = 0, rawI = 0, rawG = 0;
  for (let q = 1; q <= 6; q++) {
    const answer = answers[q];
    const key = `Q${q}`;
    const scores = SCORING_MATRIX[key]?.[answer];
    if (scores) {
      rawE += scores.E;
      rawI += scores.I;
      rawG += scores.G;
    }
  }

  const E = normalise(rawE);
  const I = normalise(rawI);
  const G = normalise(rawG);

  const archetypeId = classify(E, I, G, answers, sprinterAnswer);
  const archetypeData = ARCHETYPES[archetypeId] || ARCHETYPES.conductor;

  const archetype: Archetype = {
    id: archetypeData.id,
    name: archetypeData.name,
    emoji: archetypeData.emoji,
    headline: archetypeData.headline,
    description: "", // Not used — mirror paragraphs replace this
  };

  const burnoutRisk = getBurnoutRiskFromScores(archetypeId, E, I, G, sprinterAnswer);

  const dimensionScores: DimensionScore[] = [
    {
      name: "Friction",
      code: "E",
      plainLanguage: "How much environmental noise affects you",
      score: E,
      maxScore: 10,
      interpretation: archetypeData.dimensionInterpretations.E(E),
    },
    {
      name: "Complexity",
      code: "I",
      plainLanguage: "How much challenge you naturally seek",
      score: I,
      maxScore: 10,
      interpretation: archetypeData.dimensionInterpretations.I(I),
    },
    {
      name: "Growth",
      code: "G",
      plainLanguage: "How much your work is building capability",
      score: G,
      maxScore: 10,
      interpretation: archetypeData.dimensionInterpretations.G(G),
    },
  ];

  const totalScore = rawE + rawI + rawG;
  const maxScore = 54; // 6 questions * 3 dims * max 3

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    archetype,
    burnoutRisk,
    dimensionScores,
    recommendations: [archetypeData.unlock],
    mirror: archetypeData.mirror,
    shadowArchetype: archetypeData.shadow,
  };
}
