import type { ScoringResult } from "@/lib/scoring";
import type { ArchetypeProfileMeta } from "@/lib/archetypeProfile";

// Construct a ScoringResult-shaped object from archetype metadata.
// Used by the Dashboard "Download profile" button when raw E/I/G scores
// are not available (only archetype_id is persisted per assessment).
export function buildResultFromMeta(meta: ArchetypeProfileMeta): ScoringResult {
  return {
    totalScore: 0,
    maxScore: 54,
    percentage: 0,
    archetype: {
      id: meta.id,
      name: meta.name,
      emoji: meta.emoji,
      headline: meta.headline,
      description: "",
    },
    burnoutRisk: {
      level: meta.defaultBurnout.level,
      label: meta.defaultBurnout.label,
      signal: meta.defaultBurnout.signal,
      description: meta.defaultBurnout.description,
      earlyIntervention: meta.defaultBurnout.earlyIntervention,
    },
    dimensionScores: [],
    recommendations: [meta.unlock],
    mirror: {
      atYourBest: meta.atYourBest,
      workingAgainstYou: meta.workingAgainstYou,
      patternNotNoticed: meta.patternNotNoticed,
    },
    shadowArchetype: {
      name: meta.shadowName,
      description: "",
    },
  };
}
