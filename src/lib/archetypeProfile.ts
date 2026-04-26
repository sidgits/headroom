// Lightweight archetype lookup for the returning-user profile view.
// We only have archetype_id stored in `assessment_completions`, not the raw E/I/G scores.
// These mappings reflect each archetype's default/typical burnout signature per scoring.ts spec.

export type BurnoutLevel = "low" | "moderate" | "high";

export interface ArchetypeProfileMeta {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  defaultBurnout: {
    level: BurnoutLevel;
    label: string;
    signal: string;
  };
}

export const ARCHETYPE_META: Record<string, ArchetypeProfileMeta> = {
  architect: {
    id: "architect",
    name: "The Architect",
    emoji: "🏗️",
    headline: "You don't have a productivity problem. You have a headroom problem.",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Latent Risk",
      signal: "Environment fragmentation slowly erodes deep-work capacity",
    },
  },
  firefighter: {
    id: "firefighter",
    name: "The Firefighter",
    emoji: "🚒",
    headline: "You're most alive when everything is on fire. That's the problem.",
    defaultBurnout: {
      level: "high",
      label: "High — Active Risk",
      signal: "Chronic urgency mode without germane recovery",
    },
  },
  conductor: {
    id: "conductor",
    name: "The Conductor",
    emoji: "🎼",
    headline: "Your job is to make everyone else's job possible. Nobody sees the cost.",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Latent Risk",
      signal: "High coordination load with under-recognised contribution",
    },
  },
  sprinter: {
    id: "sprinter",
    name: "The Sprinter",
    emoji: "⚡",
    headline: "You do a week's work in two days. Then you need two days to recover.",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate — Cycle Collapse Risk",
      signal: "Risk spikes when recovery phases get compressed",
    },
  },
  steady_hand: {
    id: "steady_hand",
    name: "The Steady Hand",
    emoji: "🤝",
    headline: "You could do this in your sleep. That might be the problem.",
    defaultBurnout: {
      level: "low",
      label: "Low — Disengagement Risk",
      signal: "Under-challenge, not overload",
    },
  },
  accumulator: {
    id: "accumulator",
    name: "The Accumulator",
    emoji: "📚",
    headline: "You keep saying yes. The pile keeps growing. Something has to give.",
    defaultBurnout: {
      level: "high",
      label: "High — Active Risk",
      signal: "Maximum extraneous + intrinsic load with no growth offset",
    },
  },
  ghost: {
    id: "ghost",
    name: "The Ghost",
    emoji: "👻",
    headline: "Still present in every meeting. Diminishing in every room.",
    defaultBurnout: {
      level: "high",
      label: "High — Silent Burnout Risk",
      signal: "Germane load near zero — work no longer provides meaning signal",
    },
  },
  connector: {
    id: "connector",
    name: "The Connector",
    emoji: "🔗",
    headline: "Your growth lives in dialogue. Isolation is the hidden risk.",
    defaultBurnout: {
      level: "low",
      label: "Low — Environment Mismatch Risk",
      signal: "Risk escalates rapidly in isolated, async-heavy environments",
    },
  },
};

export const burnoutLevelStyles: Record<BurnoutLevel, { text: string; bg: string }> = {
  low: { text: "text-golden", bg: "from-golden/20 to-golden/5" },
  moderate: { text: "text-primary", bg: "from-primary/20 to-primary/5" },
  high: { text: "text-deep-orange", bg: "from-deep-orange/20 to-deep-orange/5" },
};

export const getArchetypeMeta = (id: string, fallbackName?: string): ArchetypeProfileMeta => {
  const meta = ARCHETYPE_META[id];
  if (meta) return meta;
  return {
    id,
    name: fallbackName ?? "Your Archetype",
    emoji: "✨",
    headline: "Your headroom pattern is unique.",
    defaultBurnout: {
      level: "moderate",
      label: "Moderate Risk",
      signal: "Mixed dimension profile",
    },
  };
};
