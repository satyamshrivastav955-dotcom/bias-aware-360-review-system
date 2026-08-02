import type { Severity } from "./types";

// A deterministic, local re-check of an amended claim's wording. The model's
// audit judges the draft once; this is a second, independent instrument that
// judges an edit. No model, no network — so a flagged claim that is edited
// back into biased wording cannot silently launder its flag past these checks.
// Same discipline as bias-precheck: the lists and threshold below are
// heuristics, not science, and they are stated in the open so a reviewer can
// read them and disagree.
const T = {
  // A claim must carry at least one concrete anchor (a number, a date, or a
  // named artifact) or it is treated as an unverifiable generalization. One
  // anchor is enough to rescue the claim; zero is a flag.
  minAnchors: 1,
  // Absolutes sweep the whole range of behaviour and are a bias tell on their
  // own, even when the claim is otherwise anchored. Deliberately not exhaustive.
  absoluteWords: [
    "always",
    "never",
    "constantly",
    "every single time",
    "all the time",
    "every time",
    "no one",
    "everyone",
  ],
  // Personality words describe who the person is instead of what they did —
  // the classic 360-review tell. Membership is stated so it can be argued with.
  personalityWords: [
    "abrasive",
    "bossy",
    "aggressive",
    "emotional",
    "arrogant",
    "lazy",
    "toxic",
    "dramatic",
    "unprofessional",
    "rude",
    "pushy",
    "tone-deaf",
    "difficult to work with",
    "selfish",
    "stubborn",
    "entitled",
  ],
  // Appearance and demographic descriptors have no place in a performance
  // review. Age and gender terms live here as well as looks.
  appearanceWords: [
    "attractive",
    "handsome",
    "pretty",
    "well-groomed",
    "well dressed",
    "immature",
    "young",
    "younger",
    "youngest",
    "older",
    "oldest",
    "charming",
    "female",
    "male",
    "gender",
    "appearance",
  ],
  // A named deliverable counts as a concrete anchor: if the claim names one of
  // these, a reader can go look at it. A bare superlative is not evidence.
  artifactNouns:
    /\b(?:dashboard|component\s+library|release|sprint|bundle|codebase|repository|repo|pipeline|workflow|module|prototype|launch|rollout|migration|refactor|endpoint|document|presentation|deck|design\s+system|API|PR)\b/i,
  // Date references pin the claim to a moment. Month names are required to be
  // capitalized so the modal verb "may" and the verb "march" are not read as
  // dates. Abbreviations (Jun, Q3) and years (2026) are counted too.
  // No /i flag: it would defeat the capitalization rule this comment states.
  dateToken:
    /\b(?:20\d{2}|Q[1-4])\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)day\b|\b(?:[Ll]ast|[Tt]his)\s+(?:week|month|quarter|year)\b/,
};

export type ReauditSignal = {
  id: "personality" | "absolute" | "appearance" | "anchor";
  label: string;
  detail: string;
  refs: string[]; // matched terms, so the detector is inspectable
  raised: boolean;
};

const findMatches = (text: string, words: string[]) =>
  words.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));

const hasAnchor = (text: string) =>
  /\d/.test(text) || T.dateToken.test(text) || T.artifactNouns.test(text);

export function reauditClaim(text: string): ReauditSignal[] {
  const personality = findMatches(text, T.personalityWords);
  const absolutes = findMatches(text, T.absoluteWords);
  const appearance = findMatches(text, T.appearanceWords);
  const anchored = hasAnchor(text);

  return [
    {
      id: "personality",
      label: "Personality, not behaviour",
      raised: personality.length > 0,
      detail: personality.length
        ? `Describes who the person is rather than what they did: ${personality.join(", ")}. Rewrite it as a behaviour with an example.`
        : "Describes behaviour, not the person.",
      refs: personality,
    },
    {
      id: "absolute",
      label: "Absolute language",
      raised: absolutes.length > 0,
      detail: absolutes.length
        ? `Sweeps the whole range: ${absolutes.join(", ")}. An absolute is a bias tell even when the claim is otherwise anchored.`
        : "No absolute quantifiers.",
      refs: absolutes,
    },
    {
      id: "appearance",
      label: "Appearance / demographic descriptor",
      raised: appearance.length > 0,
      detail: appearance.length
        ? `Refers to appearance or demographics: ${appearance.join(", ")}. Not a performance signal.`
        : "No appearance or demographic descriptors.",
      refs: appearance,
    },
    {
      id: "anchor",
      label: "Evidence anchor",
      raised: !anchored,
      detail: anchored
        ? "Names a number, date, or artifact a reader could verify."
        : `No number, date, or artifact reference — a reader cannot verify this against anything. Add one concrete anchor (${T.minAnchors} required).`,
      refs: [],
    },
  ];
}

export const raisedCount = (s: ReauditSignal[]) => s.filter((x) => x.raised).length;

// Severity mapping for a raised re-audit signal, so the row can color the
// check the way it colors model flags. Stated in the open: a personality or
// appearance tell reads as high, an absolute sweep as medium, and a missing
// evidence anchor as low.
const SEVERITY: Record<ReauditSignal["id"], Severity> = {
  personality: "high",
  appearance: "high",
  absolute: "medium",
  anchor: "low",
};

const RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export const reauditRaised = (s: ReauditSignal[]) => s.filter((x) => x.raised);

export const reauditSeverity = (s: ReauditSignal[]): Severity | null => {
  let worst: Severity | null = null;
  for (const x of s) {
    if (!x.raised) continue;
    const sev = SEVERITY[x.id];
    if (!worst || RANK[sev] > RANK[worst]) worst = sev;
  }
  return worst;
};
