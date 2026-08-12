// Deterministic demo dataset for the Behavioral OS mockup at /evolution/demo.
// Nothing here is user-editable — the page replays a scripted ingestion so the
// flow (sources -> risk logic -> commercials -> leading indicators -> equation)
// can be read end to end.

export const money = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export const pct = (n: number, d = 0) => `${n.toFixed(d)}%`;

export interface SourceField {
  label: string;
  value: string;
  hint?: string;
}

export interface SourceSystem {
  id: string;
  name: string;
  kind: string;
  fields: SourceField[];
}

export const SOURCES: SourceSystem[] = [
  {
    id: "erp",
    name: "SAP / ERP",
    kind: "Financial system of record",
    fields: [
      { label: "Annual contract value", value: "$2,400,000" },
      { label: "Baseline cost (loaded)", value: "$1,610,000", hint: "C_baseline" },
      { label: "Sales commission", value: "6.0% · $144,000" },
      { label: "Monthly retainer", value: "$150,000" },
      { label: "Outcome-based fees at risk", value: "15% of fees" },
      { label: "Portfolio value (ecosystem)", value: "$3,870,000", hint: "W_scope denominator" },
    ],
  },
  {
    id: "excel",
    name: "Excel / Rate card",
    kind: "Commercial modeling",
    fields: [
      { label: "Card-rate ideal revenue", value: "$2,950,000", hint: "R_ideal" },
      { label: "Realized vs card rate", value: "0.81" },
      { label: "Blended cost rate", value: "$62 / hour" },
      { label: "Replacement cost per exit", value: "$48,000" },
      { label: "Delivery headcount", value: "34 FTE" },
      { label: "Senior mix", value: "21% of FTE" },
    ],
  },
  {
    id: "workday",
    name: "Workfront / Workday",
    kind: "Effort & workforce telemetry",
    fields: [
      { label: "Planned hours", value: "41,200" },
      { label: "Actual hours logged", value: "46,900" },
      { label: "On-scope hours", value: "39,400" },
      { label: "Coordination / meeting hours", value: "11,260" },
      { label: "Senior hours on delivery", value: "7,980" },
      { label: "Rework / iteration cycles", value: "4.2 avg per deliverable" },
    ],
  },
  {
    id: "headroom",
    name: "Headroom + MarginMix",
    kind: "Behavioral telemetry",
    fields: [
      { label: "Calendar events analyzed", value: "3,418 (90-day window)" },
      { label: "Core load (avg)", value: "58 / 100" },
      { label: "Toxic load (avg)", value: "71 / 100" },
      { label: "Growth load (avg)", value: "22 / 100" },
      { label: "MarginMix assessments", value: "27 questions × 9 leads" },
      { label: "Confidence signal", value: "Neutral" },
    ],
  },
];

export interface Dimension {
  name: string;
  weight: number;
  score: number;
  questions: string;
  rationale: string;
}

// MarginMix weighted scoring model (30/25/20/15/10).
export const DIMENSIONS: Dimension[] = [
  { name: "Workforce Intensity", weight: 0.3, score: 78, questions: "Q13 Q15 Q16 Q20 Q21", rationale: "Most direct driver of margin erosion" },
  { name: "Coordination Entropy", weight: 0.25, score: 72, questions: "Q14 Q18 Q22", rationale: "Compounding overhead across delivery layers" },
  { name: "Commercial Exposure", weight: 0.2, score: 55, questions: "Q7 Q9 Q10 Q17", rationale: "Pricing and scope risk" },
  { name: "Volatility Control", weight: 0.15, score: 60, questions: "Q11 Q12", rationale: "Client-side unpredictability" },
  { name: "Measurement Maturity", weight: 0.1, score: 45, questions: "Q19 Q24 Q25 Q26", rationale: "AI substitution and oversight risk" },
];

export const compositeRisk = Math.round(
  DIMENSIONS.reduce((s, d) => s + d.weight * d.score, 0),
);

export const verdict = (score: number) =>
  score >= 80 ? "Do Not Proceed Without Repricing"
  : score >= 60 ? "Structurally Fragile"
  : score >= 40 ? "Price Sensitive"
  : score >= 20 ? "Execution Heavy"
  : "Structurally Safe";

// --- Layer 1: commercials & resource allocation -------------------------
export const COMMERCIALS = [
  { label: "Contract value", value: 2_400_000, note: "Annual, signed" },
  { label: "Retainer (annualised)", value: 1_800_000, note: "$150k / month" },
  { label: "Commissions", value: 144_000, note: "6% of ACV" },
  { label: "Outcome-based at risk", value: 360_000, note: "15% of fees" },
];

export const ALLOCATION = [
  { account: "Northwind — Brand Platform", fte: 12.4, hours: 17_100, seniorPct: 26, util: 94 },
  { account: "Northwind — Always-on Ops", fte: 9.8, hours: 13_600, seniorPct: 14, util: 88 },
  { account: "Northwind — Performance", fte: 6.6, hours: 9_450, seniorPct: 19, util: 91 },
  { account: "Shared / unbilled pool", fte: 5.2, hours: 6_750, seniorPct: 28, util: 61 },
];

// --- Layer 2: leading indicators ---------------------------------------
export interface Indicator {
  name: string;
  value: number;
  unit: string;
  band: "low" | "moderate" | "high";
  derivation: string;
}

export const INDICATORS: Indicator[] = [
  { name: "Workforce Intensity", value: 78, unit: "/100", band: "high", derivation: "Senior dependency + thinking-heavy mix + 4.2 iteration cycles" },
  { name: "Coordination Drag", value: 24, unit: "% of hours", band: "high", derivation: "11,260 coordination hours ÷ 46,900 actual hours" },
  { name: "Senior Involvement", value: 17, unit: "% of hours", band: "moderate", derivation: "7,980 senior hours on delivery vs 21% senior FTE" },
  { name: "Scope Slippage", value: 16, unit: "% of hours", band: "high", derivation: "(46,900 actual − 39,400 on-scope) ÷ 46,900" },
  { name: "Cognitive Load Index", value: 63, unit: "/100", band: "high", derivation: "Core 58 × 0.5 + Toxic 71 × 0.7 − Growth 22 × 0.25 + 10" },
  { name: "Burnout Risk", value: 68, unit: "/100", band: "high", derivation: "Load 63 × 0.7 + Toxic 71 × 0.3" },
];

export const TEAM_RISK = [
  { team: "Creative & Strategy", people: 11, core: 61, toxic: 79, growth: 16, load: 71, risk: "high" },
  { team: "Delivery / PMO", people: 8, core: 55, toxic: 74, growth: 18, load: 66, risk: "high" },
  { team: "Performance & Analytics", people: 9, core: 57, toxic: 62, growth: 29, load: 55, risk: "moderate" },
  { team: "Client Partnership", people: 6, core: 60, toxic: 66, growth: 27, load: 59, risk: "moderate" },
];

// --- Layer 3: the Behavioral Equation of Profit -------------------------
const scopeAdherence = 39_400 / 46_900; // 0.840
const pricingIntegrity = 0.81;
const boundaryHolding = 0.76;

export const M_discipline = Math.cbrt(scopeAdherence * pricingIntegrity * boundaryHolding);
export const M_PARTS = [
  { label: "Scope adherence", value: scopeAdherence, note: "On-scope ÷ actual hours" },
  { label: "Pricing integrity", value: pricingIntegrity, note: "Invoiced ÷ card rate" },
  { label: "Boundary holding", value: boundaryHolding, note: "Planned ÷ actual hours, off-hours adjusted" },
];

export const R_ideal = 2_950_000;
export const C_baseline = 1_610_000;

export const shadowHours = 46_900 - 39_400;
export const L_shadow = shadowHours * 62; // 465,000

const velocityLoss = 0.178; // toxic load 71 × 0.25
const velocityCost = 39_400 * 62 * velocityLoss;
const churnProb = 0.12; // burnout risk 68 band
const churnCost = churnProb * 34 * 48_000;
export const H_drag = velocityCost + churnCost;
export const H_PARTS = [
  { label: "Velocity degradation", value: velocityCost, note: "17.8% capacity loss on $2.44M of on-scope effort" },
  { label: "Burnout-driven churn", value: churnCost, note: "12% exit probability × 34 FTE × $48k replacement" },
];

export const W_scope = 2_400_000 / 3_870_000; // 0.620

export const behavioralCost = C_baseline + L_shadow + H_drag * W_scope;
export const disciplinedRevenue = M_discipline * R_ideal;
export const PI = disciplinedRevenue - behavioralCost;

export const reportedProfit = 2_400_000 - C_baseline;
export const reportedMargin = (reportedProfit / 2_400_000) * 100;
export const behavioralMargin = (PI / 2_400_000) * 100;

export const INSIGHTS = [
  {
    tag: "Root cause",
    title: "Toxic load, not headcount, is eating the margin",
    body:
      "Toxic load averages 71/100 across delivery — 24% of all logged hours are coordination, and no 90-minute deep-work window survives on 6 of 10 weekdays. That converts to $434,818 of velocity degradation before a single hour is written off.",
  },
  {
    tag: "Commercial",
    title: "Pricing integrity at 0.81 caps the ceiling",
    body:
      "The engagement is invoiced at 81% of card rate while delivering 116% of planned hours. Repricing to 0.92 on renewal recovers roughly $325,000 of ideal revenue without touching effort.",
  },
  {
    tag: "Concentration",
    title: "Creative & Strategy carries the burnout risk",
    body:
      "11 people sit at 71 daily load with 16 growth load. At a 12% exit probability this pod alone represents $63,360 of amortised replacement cost — and it holds the senior dependency the whole account runs on.",
  },
];

export const RECOMMENDATIONS = [
  { action: "Reprice at renewal", impact: 325_000, detail: "Move realized rate from 0.81 to 0.92 of card rate; MarginMix verdict is Structurally Fragile, which is a repricing trigger." },
  { action: "Cap coordination at 15% of hours", impact: 186_000, detail: "Convert 3 of 7 recurring status forums to async; releases ~4,220 hours back to on-scope delivery." },
  { action: "Protect 2 deep-work blocks / week", impact: 148_000, detail: "Cuts toxic load from 71 to an estimated 58, reducing velocity degradation by roughly 3.3 points." },
  { action: "Redistribute senior dependency", impact: 96_000, detail: "Shift 1,400 senior hours to mid-level with a review gate; lowers Workforce Intensity from 78 to ~66." },
];

// --- Early warning layer -------------------------------------------------
// The product surface: the warning comes first, Π is the proof underneath.
export const WARNING = {
  engagement: "Engagement #4471",
  account: "Northwind Group",
  headline: "Elevated slippage risk",
  window: "Next 90 days",
  recommendation:
    "Reprice or restaff before the Q3 review.",
  confidence: "High — 3 of 3 leading signals moving in the same direction",
};

export interface WarningSignal {
  text: string;
  source: string;
  term: string;
}

export const WARNING_SIGNALS: WarningSignal[] = [
  {
    text: "Senior allocation drifted 35% → 51% over six weeks",
    source: "MarginMix effort bands (Senior / Mid / Execution split)",
    term: "M_discipline · H_drag",
  },
  {
    text: "2 of 3 engagement leads trending into red-zone load",
    source: "Headroom Core / Toxic / Growth load + burnout risk band",
    term: "H_drag",
  },
  {
    text: "3 deliverables shipped outside contracted scope this month",
    source: "L_shadow drivers (unscoped deliverables × baseline hours)",
    term: "L_shadow",
  },
];

// Π today vs Π forecast at the end of the warning window, decomposed by term.
export const PI_TODAY = PI;
export const PI_FORECAST_DELTAS = [
  {
    term: "M_discipline",
    label: "Pricing integrity slips 0.81 → 0.76 as scope drifts",
    delta: -0.049 * R_ideal,
  },
  {
    term: "L_shadow",
    label: "Unscoped deliverables add ~1,900 unbilled hours",
    delta: -1_900 * 62,
  },
  {
    term: "H_drag × W_scope",
    label: "Senior concentration lifts churn probability 12% → 17%",
    delta: -0.05 * 34 * 48_000 * W_scope,
  },
];

export const PI_FORECAST =
  PI_TODAY + PI_FORECAST_DELTAS.reduce((s, d) => s + d.delta, 0);
