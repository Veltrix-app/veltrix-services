import type { LiveProject } from "../../types/live";

export type ProjectWorldThemeTone =
  | "aurora"
  | "violet"
  | "cyan"
  | "lime"
  | "amber"
  | "rose";

export type ProjectWorldTheme = {
  tone: ProjectWorldThemeTone;
  mood: string;
  label: string;
  signature: string;
  hasCustomMedia: boolean;
  cssVars: {
    "--project-world-primary": string;
    "--project-world-secondary": string;
    "--project-world-tertiary": string;
    "--project-world-ink": string;
    "--project-world-muted": string;
    "--project-world-border": string;
    "--project-world-glow": string;
    "--project-world-panel": string;
    "--project-world-hero": string;
    "--project-world-radial": string;
    "--project-world-line": string;
  };
  tokens: {
    primary: string;
    secondary: string;
    tertiary: string;
    glow: string;
    panel: string;
    heroOverlay: string;
    radialOverlay: string;
    lineGradient: string;
  };
};

type ThemeSeed = {
  tone: ProjectWorldThemeTone;
  primary: string;
  secondary: string;
  tertiary: string;
  glow: string;
  panel: string;
  heroOverlay: string;
  radialOverlay: string;
  lineGradient: string;
};

const THEME_SEEDS: Record<ProjectWorldThemeTone, ThemeSeed> = {
  aurora: {
    tone: "aurora",
    primary: "190 255 74",
    secondary: "34 211 238",
    tertiary: "196 181 253",
    glow: "rgba(190,255,74,0.26)",
    panel: "linear-gradient(145deg,rgba(12,16,18,0.96),rgba(5,7,11,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_58%_26%,rgba(34,211,238,0.14),transparent_31%),radial-gradient(circle_at_14%_28%,rgba(190,255,74,0.1),transparent_23%),linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.52)_34%,rgba(0,0,0,0.16)_62%,rgba(0,0,0,0.46)),linear-gradient(180deg,rgba(4,7,10,0.02),rgba(3,5,8,0.68))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(190,255,74,0.1),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(190,255,74,0.52),rgba(34,211,238,0.26),transparent)",
  },
  violet: {
    tone: "violet",
    primary: "196 181 253",
    secondary: "34 211 238",
    tertiary: "244 114 182",
    glow: "rgba(196,181,253,0.28)",
    panel: "linear-gradient(145deg,rgba(16,12,27,0.96),rgba(5,7,13,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_58%_22%,rgba(196,181,253,0.2),transparent_30%),radial-gradient(circle_at_16%_28%,rgba(34,211,238,0.1),transparent_24%),linear-gradient(90deg,rgba(5,3,15,0.82),rgba(5,3,15,0.56)_36%,rgba(5,3,15,0.18)_64%,rgba(5,3,15,0.5)),linear-gradient(180deg,rgba(4,5,12,0.02),rgba(5,3,12,0.72))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(196,181,253,0.17),transparent_31%),radial-gradient(circle_at_94%_18%,rgba(34,211,238,0.1),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(196,181,253,0.56),rgba(34,211,238,0.25),transparent)",
  },
  cyan: {
    tone: "cyan",
    primary: "103 232 249",
    secondary: "190 255 74",
    tertiary: "96 165 250",
    glow: "rgba(103,232,249,0.26)",
    panel: "linear-gradient(145deg,rgba(7,18,22,0.96),rgba(4,7,12,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_60%_24%,rgba(103,232,249,0.2),transparent_31%),radial-gradient(circle_at_15%_28%,rgba(96,165,250,0.12),transparent_25%),linear-gradient(90deg,rgba(1,8,13,0.82),rgba(1,8,13,0.55)_34%,rgba(1,8,13,0.16)_62%,rgba(1,8,13,0.48)),linear-gradient(180deg,rgba(3,8,12,0.02),rgba(2,7,11,0.7))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(103,232,249,0.17),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(96,165,250,0.12),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(103,232,249,0.56),rgba(190,255,74,0.24),transparent)",
  },
  lime: {
    tone: "lime",
    primary: "190 255 74",
    secondary: "52 211 153",
    tertiary: "34 211 238",
    glow: "rgba(190,255,74,0.28)",
    panel: "linear-gradient(145deg,rgba(12,18,12,0.96),rgba(4,8,8,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_58%_24%,rgba(190,255,74,0.18),transparent_31%),radial-gradient(circle_at_16%_28%,rgba(52,211,153,0.12),transparent_24%),linear-gradient(90deg,rgba(4,10,6,0.82),rgba(4,10,6,0.55)_34%,rgba(4,10,6,0.16)_62%,rgba(4,10,6,0.48)),linear-gradient(180deg,rgba(4,8,7,0.02),rgba(3,8,6,0.72))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(190,255,74,0.16),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(52,211,153,0.12),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(190,255,74,0.56),rgba(52,211,153,0.25),transparent)",
  },
  amber: {
    tone: "amber",
    primary: "251 191 36",
    secondary: "244 114 182",
    tertiary: "190 255 74",
    glow: "rgba(251,191,36,0.28)",
    panel: "linear-gradient(145deg,rgba(22,14,8,0.96),rgba(8,6,8,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_58%_22%,rgba(251,191,36,0.2),transparent_31%),radial-gradient(circle_at_16%_28%,rgba(244,114,182,0.1),transparent_24%),linear-gradient(90deg,rgba(14,7,2,0.84),rgba(14,7,2,0.57)_34%,rgba(14,7,2,0.18)_62%,rgba(14,7,2,0.5)),linear-gradient(180deg,rgba(9,6,4,0.02),rgba(11,6,3,0.72))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(251,191,36,0.17),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(244,114,182,0.1),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(251,191,36,0.58),rgba(244,114,182,0.22),transparent)",
  },
  rose: {
    tone: "rose",
    primary: "251 113 133",
    secondary: "196 181 253",
    tertiary: "251 191 36",
    glow: "rgba(251,113,133,0.27)",
    panel: "linear-gradient(145deg,rgba(24,10,15,0.96),rgba(8,5,10,0.985))",
    heroOverlay:
      "radial-gradient(circle_at_58%_22%,rgba(251,113,133,0.19),transparent_31%),radial-gradient(circle_at_16%_28%,rgba(196,181,253,0.11),transparent_24%),linear-gradient(90deg,rgba(15,4,9,0.84),rgba(15,4,9,0.57)_34%,rgba(15,4,9,0.18)_62%,rgba(15,4,9,0.5)),linear-gradient(180deg,rgba(10,4,7,0.02),rgba(12,4,8,0.72))",
    radialOverlay:
      "radial-gradient(circle_at_6%_0%,rgba(251,113,133,0.16),transparent_30%),radial-gradient(circle_at_94%_18%,rgba(196,181,253,0.11),transparent_28%)",
    lineGradient: "linear-gradient(90deg,rgba(251,113,133,0.56),rgba(196,181,253,0.24),transparent)",
  },
};

const ACCENT_ALIASES: Record<string, ProjectWorldThemeTone> = {
  blue: "cyan",
  base: "cyan",
  aqua: "cyan",
  cyan: "cyan",
  teal: "cyan",
  green: "lime",
  lime: "lime",
  emerald: "lime",
  purple: "violet",
  violet: "violet",
  indigo: "violet",
  pink: "rose",
  rose: "rose",
  red: "rose",
  orange: "amber",
  yellow: "amber",
  gold: "amber",
  amber: "amber",
};

export function buildProjectWorldTheme(project: Pick<
  LiveProject,
  "brandAccent" | "brandMood" | "logo" | "bannerUrl" | "category" | "chain" | "isFeatured"
>): ProjectWorldTheme {
  const tone = resolveTone(project);
  const seed = THEME_SEEDS[tone];
  const mood = clean(project.brandMood) ?? (project.isFeatured ? "featured" : "world");
  const hasCustomMedia = Boolean(clean(project.logo) || clean(project.bannerUrl));
  const moodLabel = mood
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    tone,
    mood,
    label: `${moodLabel || "World"} theme`,
    signature: hasCustomMedia ? "Logo and banner powered" : "Accent generated",
    hasCustomMedia,
    cssVars: {
      "--project-world-primary": seed.primary,
      "--project-world-secondary": seed.secondary,
      "--project-world-tertiary": seed.tertiary,
      "--project-world-ink": "255 255 255",
      "--project-world-muted": "148 163 184",
      "--project-world-border": `rgba(${seed.primary},0.1)`,
      "--project-world-glow": seed.glow,
      "--project-world-panel": seed.panel,
      "--project-world-hero": seed.heroOverlay,
      "--project-world-radial": seed.radialOverlay,
      "--project-world-line": seed.lineGradient,
    },
    tokens: {
      primary: seed.primary,
      secondary: seed.secondary,
      tertiary: seed.tertiary,
      glow: seed.glow,
      panel: seed.panel,
      heroOverlay: seed.heroOverlay,
      radialOverlay: seed.radialOverlay,
      lineGradient: seed.lineGradient,
    },
  };
}

function resolveTone(project: Pick<
  LiveProject,
  "brandAccent" | "brandMood" | "category" | "chain" | "isFeatured"
>): ProjectWorldThemeTone {
  const direct = normalizeTone(project.brandAccent);
  if (direct) return direct;

  const mood = `${project.brandMood ?? ""} ${project.category ?? ""} ${project.chain ?? ""}`.toLowerCase();
  if (/game|raid|arena|social|creator|community/.test(mood)) return "violet";
  if (/defi|base|swap|finance|market|token|chain/.test(mood)) return "cyan";
  if (/eco|growth|quest|earn|reward/.test(mood)) return "lime";
  if (/lux|premium|gold|launch|genesis/.test(mood)) return "amber";
  if (/art|culture|fashion|music/.test(mood)) return "rose";

  return project.isFeatured ? "aurora" : "cyan";
}

function normalizeTone(value: string | null | undefined) {
  const normalized = clean(value)?.toLowerCase();
  if (!normalized) return null;

  return ACCENT_ALIASES[normalized] ?? null;
}

function clean(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
