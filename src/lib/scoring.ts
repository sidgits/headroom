export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  archetype: Archetype;
  burnoutRisk: BurnoutRisk;
  dimensionScores: DimensionScore[];
  recommendations: string[];
}

export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  description: string;
}

export interface BurnoutRisk {
  level: "low" | "moderate" | "high" | "critical";
  label: string;
  description: string;
}

export interface DimensionScore {
  name: string;
  score: number;
  maxScore: number;
  questionIds: number[];
}

// Answer weights: A=1 (healthy), B=2, C=3, D=4 (overloaded)
const ANSWER_WEIGHTS: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

// Dimensions group questions into meaningful categories
const DIMENSIONS: { name: string; questionIds: number[] }[] = [
  { name: "Focus & Clarity", questionIds: [1, 3] },
  { name: "Load Management", questionIds: [2, 4] },
  { name: "Growth & Energy", questionIds: [5, 6] },
];

const ARCHETYPES: Archetype[] = [
  {
    id: "architect",
    name: "The Architect",
    emoji: "🏗️",
    headline: "I'm building with intention",
    description:
      "You have a clear sense of your priorities and protect your mental space. Your cognitive load is well-managed, giving you room to think strategically and grow. The challenge ahead is maintaining this — and helping others find the same clarity.",
  },
  {
    id: "juggler",
    name: "The Juggler",
    emoji: "🤹",
    headline: "I'm keeping it all in the air — barely",
    description:
      "You're competent and capable, but you're managing more than you should be. Things are working, but there's no margin. One unexpected demand could tip you from coping to overwhelmed. You need to create boundaries before the load creates them for you.",
  },
  {
    id: "absorber",
    name: "The Absorber",
    emoji: "🧽",
    headline: "I take on everything — and it's taking a toll",
    description:
      "You say yes when you should say no. You carry other people's problems alongside your own. Your cognitive load isn't just about your work — it's about everyone else's too. The first step is recognising that absorption isn't the same as leadership.",
  },
  {
    id: "survivor",
    name: "The Survivor",
    emoji: "🔥",
    headline: "I'm running on fumes",
    description:
      "Your brain is full. Growth has stopped. Deep thinking is a memory. You're in survival mode — getting through each day but not building anything meaningful. This isn't sustainable, and the longer it continues the harder recovery becomes. Something has to change.",
  },
  {
    id: "sprinter",
    name: "The Sprinter",
    emoji: "⚡",
    headline: "I'm fast — but I can't maintain this pace",
    description:
      "You thrive under pressure and move quickly. But your pattern shows signs of chronic sprinting — high energy with no recovery. Sprint mode works for weeks, not months. Without deliberate rest, you'll cross from high-performance into burnout territory.",
  },
];

function getArchetype(
  totalScore: number,
  answers: Record<number, string>,
  sprinterAnswer: string | null
): Archetype {
  // Sprinter: triggered by specific pattern + confirmation
  if (answers[4] === "B" && answers[6] === "A" && sprinterAnswer === "A") {
    return ARCHETYPES.find((a) => a.id === "sprinter")!;
  }

  // Score-based classification
  if (totalScore <= 9) return ARCHETYPES.find((a) => a.id === "architect")!;
  if (totalScore <= 14) return ARCHETYPES.find((a) => a.id === "juggler")!;
  if (totalScore <= 19) return ARCHETYPES.find((a) => a.id === "absorber")!;
  return ARCHETYPES.find((a) => a.id === "survivor")!;
}

function getBurnoutRisk(totalScore: number, sprinterAnswer: string | null): BurnoutRisk {
  if (totalScore <= 9) {
    return {
      level: "low",
      label: "Low Risk",
      description: "Your cognitive load is manageable. Keep protecting your headroom.",
    };
  }
  if (totalScore <= 14) {
    return {
      level: "moderate",
      label: "Moderate Risk",
      description:
        "You're managing, but cracks are forming. Without changes, the load will increase.",
    };
  }
  if (totalScore <= 19 || sprinterAnswer === "A") {
    return {
      level: "high",
      label: "High Risk",
      description:
        "Your brain is consistently overloaded. Burnout isn't a possibility — it's a trajectory.",
    };
  }
  return {
    level: "critical",
    label: "Critical Risk",
    description:
      "You are at or near burnout. Immediate action is needed to protect your wellbeing and performance.",
  };
}

function getRecommendations(archetype: Archetype, burnoutRisk: BurnoutRisk): string[] {
  const recs: string[] = [];

  switch (archetype.id) {
    case "architect":
      recs.push("Mentor others on how you manage your cognitive load");
      recs.push("Schedule quarterly headroom audits to stay on track");
      recs.push("Invest your spare capacity in strategic thinking time");
      break;
    case "juggler":
      recs.push("Audit your commitments — identify two things to drop or delegate this week");
      recs.push("Block 90 minutes daily for your highest-priority deep work");
      recs.push("Practice saying 'not right now' to new requests");
      break;
    case "absorber":
      recs.push("Track every request you absorb for one week — notice the pattern");
      recs.push("Set explicit boundaries with at least one person this week");
      recs.push("Distinguish between helping and carrying — they're not the same");
      break;
    case "survivor":
      recs.push("Have an honest conversation with your manager about your load");
      recs.push("Identify the single biggest drain and address it first");
      recs.push("Consider professional support — this isn't a willpower problem");
      break;
    case "sprinter":
      recs.push("Schedule deliberate recovery time after each intense sprint");
      recs.push("Track your energy levels daily for the next two weeks");
      recs.push("Build in buffer days between major deliverables");
      break;
  }

  if (burnoutRisk.level === "critical") {
    recs.push("Speak to someone you trust about how you're feeling — today");
  }

  return recs;
}

export function calculateResults(
  answers: Record<number, string>,
  sprinterAnswer: string | null
): ScoringResult {
  // Calculate total score
  let totalScore = 0;
  for (const questionId of [1, 2, 3, 4, 5, 6]) {
    const answer = answers[questionId];
    totalScore += ANSWER_WEIGHTS[answer] ?? 2; // default to 2 if missing
  }

  const maxScore = 24;
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Dimension scores
  const dimensionScores: DimensionScore[] = DIMENSIONS.map((dim) => {
    let dimScore = 0;
    for (const qId of dim.questionIds) {
      dimScore += ANSWER_WEIGHTS[answers[qId]] ?? 2;
    }
    return {
      name: dim.name,
      score: dimScore,
      maxScore: dim.questionIds.length * 4,
      questionIds: dim.questionIds,
    };
  });

  const archetype = getArchetype(totalScore, answers, sprinterAnswer);
  const burnoutRisk = getBurnoutRisk(totalScore, sprinterAnswer);
  const recommendations = getRecommendations(archetype, burnoutRisk);

  return {
    totalScore,
    maxScore,
    percentage,
    archetype,
    burnoutRisk,
    dimensionScores,
    recommendations,
  };
}
