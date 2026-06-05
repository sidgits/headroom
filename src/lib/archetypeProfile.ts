// Lightweight archetype lookup for the returning-user profile view.
// We only have archetype_id stored in `assessment_completions`, not the raw E/I/G scores.
// These mappings reflect each archetype's default/typical burnout signature per scoring.ts spec.

export type BurnoutLevel = "low" | "moderate" | "high";

export interface ArchetypeProfileMeta {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  atYourBest: string;
  workingAgainstYou: string;
  patternNotNoticed: string;
  unlock: string;
  shadowName: string;
  defaultBurnout: {
    level: BurnoutLevel;
    label: string;
    signal: string;
    description: string;
    earlyIntervention: string;
  };
}

export const ARCHETYPE_META: Record<string, ArchetypeProfileMeta> = {
  architect: {
    id: "architect",
    name: "The Architect",
    emoji: "🏗️",
    headline: "You don't have a productivity problem. You have a headroom problem.",
    atYourBest: "You produce work that other people genuinely can't. Depth, quality, the ability to reframe problems — it's categorically different when you have the conditions you need.",
    workingAgainstYou: "Your environment keeps fragmenting your day. Each interruption is small, but together they consume the headroom where your best work lives.",
    patternNotNoticed: "Your most frustrating days aren't your busiest — they're the days you almost got into deep focus and kept getting pulled out. Near-misses drain more than chaos.",
    unlock: "Block the first 90 minutes of every day as non-negotiable deep work. One protected window changes everything for your archetype.",
    shadowName: "The Firefighter",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Latent Risk",
      signal: "Environment fragmentation slowly erodes deep-work capacity.",
      description: "Your growth orientation protects you from acute burnout — for now. But sustained fragmentation of deep work creates slow accumulation of extraneous load that eventually overrides your germane capacity. Burnout arrives quietly, as disengagement disguised as busyness.",
      earlyIntervention: "Protect the first 90 minutes daily as deep work. When that window starts shrinking consistently, risk escalates from moderate to high within weeks.",
    },
  },
  firefighter: {
    id: "firefighter",
    name: "The Firefighter",
    emoji: "🚒",
    headline: "You're most alive when everything is on fire. That's the problem.",
    atYourBest: "Exceptional under pressure. Decisive, energetic, effective when stakes are high. People trust you in a crisis because you've earned it — repeatedly.",
    workingAgainstYou: "Urgency has become your default mode, not your emergency mode. A calm week doesn't feel productive — it feels wrong. You're unconsciously creating the conditions for fires.",
    patternNotNoticed: "Your growth has slowed significantly. You're highly skilled at execution under pressure, but you're not building new capability.",
    unlock: "Schedule one two-hour block per week with no deliverable. The discomfort is the signal that you need it most.",
    shadowName: "The Accumulator",
    defaultBurnout: {
      level: "high",
      label: "High — Active Risk",
      signal: "Chronic urgency mode without germane recovery.",
      description: "This is the highest burnout risk profile in the Headroom system. High extraneous load with near-zero germane load is the precise signature of chronic occupational stress. You're consuming capability, not building it. Without intervention the trajectory leads to exhaustion and sudden collapse of the high-performance identity you've built.",
      earlyIntervention: "One protected non-urgent block per week is the minimum viable intervention — not because it solves the problem, but because it breaks the urgency-only pattern long enough for you to see it.",
    },
  },
  conductor: {
    id: "conductor",
    name: "The Conductor",
    emoji: "🎼",
    headline: "Your job is to make everyone else's job possible. Nobody sees the cost.",
    atYourBest: "You hold more threads simultaneously than almost anyone around you. The team moves faster because of you, even when they can't articulate why.",
    workingAgainstYou: "Your contribution is almost entirely invisible. In environments that measure output over orchestration, your value is chronically underrecognised.",
    patternNotNoticed: "You've become so good at managing everyone else's cognitive load that you've stopped prioritising your own. When did you last do work that was purely yours?",
    unlock: "Carve out four hours per week that are yours alone — no coordination, no facilitation. The Conductor who never composes eventually stops conducting.",
    shadowName: "The Ghost",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Latent Risk",
      signal: "High coordination load with under-recognised contribution.",
      description: "Distinct and underdiagnosed. It doesn't come from overwork — it comes from chronic underrecognition of invisible contribution and the gradual disappearance of personally meaningful work. The risk isn't exhaustion — it's the slow dimming of professional identity.",
      earlyIntervention: "Four hours per week of protected personal creation time — not coordination, not facilitation. That window keeps the Conductor's own professional identity alive.",
    },
  },
  sprinter: {
    id: "sprinter",
    name: "The Sprinter",
    emoji: "⚡",
    headline: "You do a week's work in two days. Then you need two days to recover.",
    atYourBest: "When you're on, you're exceptional. You can compress enormous amounts of work into a short window when conditions and energy align.",
    workingAgainstYou: "Your rhythm is cyclical, and linear environments punish that. Recovery periods read as laziness to people who don't understand your pattern.",
    patternNotNoticed: "You spend enormous energy managing others' perception of your recovery phases rather than actually recovering — extending recovery and shortening sprints.",
    unlock: "Name your recovery periods as deliberately as your sprint goals. 'I'm in a consolidation phase this week' legitimises the rhythm.",
    shadowName: "The Burnout State",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Cycle Collapse Risk",
      signal: "Risk spikes when recovery phases get compressed or skipped.",
      description: "Not chronic — acute and sudden. When external pressure compresses the recovery window consistently, the system loses its reset mechanism entirely. This is the burnout pattern that arrives with no warning.",
      earlyIntervention: "Treat recovery as non-negotiable as sprint commitments. One skipped recovery is manageable. Three consecutive skipped recoveries is a clinical risk.",
    },
  },
  steady_hand: {
    id: "steady_hand",
    name: "The Steady Hand",
    emoji: "🤝",
    headline: "You could do this in your sleep. That might be the problem.",
    atYourBest: "Reliable, consistent, low-drama, high-trust. When something needs to land without fanfare, it lands with you.",
    workingAgainstYou: "You're running well below your actual capacity. No friction left — and no friction means no growth signal.",
    patternNotNoticed: "Quiet disengagement has been building longer than you think. You're still delivering, but the energy behind the delivery is declining.",
    unlock: "Take on one project in the next 30 days that you're not sure you can do. The discomfort of uncertainty is the growth signal you're missing.",
    shadowName: "The Ghost",
    defaultBurnout: {
      level: "low",
      label: "Low — Disengagement Risk",
      signal: "Under-challenge, not overload.",
      description: "The least visible and most misdiagnosed profile. It's not driven by overload — it's driven by under-challenge. Workers who are engaged but unstretched drift into quiet disengagement that is functionally indistinguishable from burnout.",
      earlyIntervention: "The intervention is not rest — it's challenge. One genuinely uncertain project in the next 30 days is the minimum viable stimulus.",
    },
  },
  accumulator: {
    id: "accumulator",
    name: "The Accumulator",
    emoji: "📦",
    headline: "The reward for good work is more work. You've been rewarded a lot.",
    atYourBest: "One of the most capable people in any room. High complexity doesn't intimidate you; high stakes don't rattle you.",
    workingAgainstYou: "Your capacity has become a liability. Your plate isn't full by accident — it's full because the system has learned you'll absorb what others won't.",
    patternNotNoticed: "Quality of your output has been declining slowly. Work that used to energise you now just gets done. That shift is the signal.",
    unlock: "Say no to one commitment this week you'd normally say yes to. A real one. That single no shows you exactly how much load is optional.",
    shadowName: "The Firefighter",
    defaultBurnout: {
      level: "high",
      label: "High — Active Risk",
      signal: "Max extraneous + intrinsic load with no growth offset.",
      description: "Carries the highest objective burnout risk in the system alongside the Firefighter. Environmental noise and intrinsic complexity are at maximum simultaneously. Near-zero germane load means no growth signal to offset depletion. Not a future risk — a present condition that has not yet produced visible symptoms.",
      earlyIntervention: "One real no this week. Not a small one. The clarity that single act produces about what is optional versus mandatory is worth more than the commitment being declined.",
    },
  },
  ghost: {
    id: "ghost",
    name: "The Ghost",
    emoji: "👻",
    headline: "Still present in every meeting. Diminishing in every room.",
    atYourBest: "Observant, politically aware, safe to have in any room. You remember things others miss.",
    workingAgainstYou: "Drift has become your default state. Present everywhere, accountable to nothing specific.",
    patternNotNoticed: "You've quietly stopped expecting work to be meaningful — and stopped looking for the work that would actually engage you.",
    unlock: "Identify one thing you want to be known for that you're not known for yet. Write it down. Tell one person.",
    shadowName: "The Steady Hand",
    defaultBurnout: {
      level: "high",
      label: "High — Silent Burnout Risk",
      signal: "Germane load near zero — work no longer provides meaning signal.",
      description: "The most dangerous profile precisely because it is invisible. No performance flags, no complaints, no obvious distress. But near-zero germane load means the work has stopped providing intrinsic reward. This is the pattern behind unexpected resignations that surprise managers.",
      earlyIntervention: "One specific visible contribution goal, named and shared with one person. Accountability to something specific is the only intervention that works.",
    },
  },
  connector: {
    id: "connector",
    name: "The Connector",
    emoji: "🔗",
    headline: "You think out loud. Alone you just think in circles.",
    atYourBest: "Your best ideas emerge in conversation. You make other people sharper and find connections across domains that others miss.",
    workingAgainstYou: "Async work and solo deliverables are quietly depleting you. Same hours, but in conditions that don't activate your best thinking.",
    patternNotNoticed: "You're judging your solo output against your collaborative output and finding yourself lacking — but that's an environment mismatch, not a capability gap.",
    unlock: "Restructure solo work to include a thinking partner — even asynchronously. A weekly 30-minute call activates your best cognitive mode.",
    shadowName: "The Ghost",
    defaultBurnout: {
      level: "low",
      label: "Low — Environment Mismatch Risk",
      signal: "Risk escalates rapidly in isolated, async-heavy environments.",
      description: "The most context-dependent burnout risk in the system. In a collaborative, dialogue-rich environment the risk is genuinely low. But in remote-first, async-heavy, or solo-intensive environments the risk escalates rapidly.",
      earlyIntervention: "Audit your environment before your workload. If collaborative time has dropped below 40% of your week, that is the risk factor to address.",
    },
  },
};

export const burnoutLevelStyles: Record<BurnoutLevel, { text: string; bg: string; border: string; tile: string }> = {
  low: {
    text: "text-golden",
    bg: "from-golden/20 to-golden/5",
    border: "border-[hsl(var(--golden)/0.4)]",
    tile: "bg-[hsl(var(--golden)/0.12)] border-[hsl(var(--golden)/0.4)] text-[hsl(var(--golden))]",
  },
  moderate: {
    text: "text-primary",
    bg: "from-primary/20 to-primary/5",
    border: "border-primary/40",
    tile: "bg-primary/10 border-primary/30 text-primary",
  },
  high: {
    text: "text-deep-orange",
    bg: "from-deep-orange/20 to-deep-orange/5",
    border: "border-[hsl(var(--warm-red)/0.4)]",
    tile: "bg-[hsl(var(--warm-red)/0.12)] border-[hsl(var(--warm-red)/0.4)] text-[hsl(var(--warm-red))]",
  },
};

export const getArchetypeMeta = (id: string, fallbackName?: string): ArchetypeProfileMeta => {
  const meta = ARCHETYPE_META[id];
  if (meta) return meta;
  return {
    id,
    name: fallbackName ?? "Your Archetype",
    emoji: "✨",
    headline: "Your headroom pattern is unique.",
    atYourBest: "Complete an assessment to see your full profile.",
    workingAgainstYou: "—",
    patternNotNoticed: "—",
    unlock: "—",
    shadowName: "—",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate Risk",
      signal: "Mixed dimension profile",
      description: "Take the assessment to receive a detailed burnout risk read.",
      earlyIntervention: "—",
    },
  };
};
