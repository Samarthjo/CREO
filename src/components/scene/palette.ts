export type Time = "dawn" | "day" | "dusk" | "night";

export interface Palette {
  skyTop: string; skyMid: string; skyLow: string;
  glow: string; glowOpacity: number; sunX: number; moon: boolean;
  farShade: string; farLit: string; farSnow: string;
  midShade: string; midLit: string; haze: string;
  lakeTop: string; lakeLow: string; glint: string;
  shore: string; shoreLit: string;
  bankLit: string; bankShade: string; bankDab: string;
  rock: string; rockLit: string;
  pine: string; pineLit: string; flower: string;
  cloudTop: string; cloudBottom: string; cloudLight: string;
  /** Rounded broadleaf crowns, and the darker side of every tree (the side away from the light). Calm look only. */
  crown?: string; crownLit?: string; treeShade?: string;
}

/** Original palettes for the four times of day. The page walks dawn, day, dusk, night as you scroll. */
export const PALETTES: Record<Time, Palette> = {
  dawn: {
    skyTop: "#dbe3f6", skyMid: "#f1e5f0", skyLow: "#fbe2d2",
    glow: "#fff0d2", glowOpacity: 0.95, sunX: 0.3, moon: false,
    farShade: "#98a3d9", farLit: "#dfb7cb", farSnow: "#fff4f1",
    midShade: "#6f7ac0", midLit: "#c18fb4", haze: "#f8e6e6",
    lakeTop: "#f2cbc4", lakeLow: "#6f87cc", glint: "#fff6e6",
    shore: "#3b6a68", shoreLit: "#5f8f76",
    bankLit: "#97bf4d", bankShade: "#3d6b2e", bankDab: "#b8d86a",
    rock: "#7a819b", rockLit: "#a9afc6",
    pine: "#1f4a3b", pineLit: "#33704f", flower: "#fbf7ff",
    cloudTop: "#fbd7b9", cloudBottom: "#b6aee6", cloudLight: "#fff0df",
  },
  day: {
    skyTop: "#93c4ee", skyMid: "#c6e2f6", skyLow: "#eef6f1",
    glow: "#ffffff", glowOpacity: 0.7, sunX: 0.72, moon: false,
    farShade: "#7f9ccd", farLit: "#c9dcef", farSnow: "#ffffff",
    midShade: "#587aaf", midLit: "#9fbcdc", haze: "#eaf3f6",
    lakeTop: "#b4daec", lakeLow: "#4a82b6", glint: "#ffffff",
    shore: "#2f6a5a", shoreLit: "#58a070",
    bankLit: "#8fc04c", bankShade: "#3b7430", bankDab: "#b4dc6c",
    rock: "#7a8aa5", rockLit: "#b4c1d6",
    pine: "#1d4d3a", pineLit: "#36784f", flower: "#ffffff",
    cloudTop: "#ffffff", cloudBottom: "#cfe2f3", cloudLight: "#ffffff",
  },
  dusk: {
    skyTop: "#454596", skyMid: "#a06bb0", skyLow: "#f6a77c",
    glow: "#ffd699", glowOpacity: 0.95, sunX: 0.62, moon: false,
    farShade: "#5e55a0", farLit: "#d98aa2", farSnow: "#ffd9d4",
    midShade: "#443d8c", midLit: "#b0618d", haze: "#e9a0a0",
    lakeTop: "#f0a283", lakeLow: "#353f88", glint: "#ffe3b8",
    shore: "#263e5c", shoreLit: "#3f5f78",
    bankLit: "#58823e", bankShade: "#223f2e", bankDab: "#78a255",
    rock: "#4d5388", rockLit: "#8b86b3",
    pine: "#15302c", pineLit: "#27483f", flower: "#ffe5ee",
    cloudTop: "#ffc89a", cloudBottom: "#8e6cc0", cloudLight: "#ffe8c8",
  },
  night: {
    skyTop: "#0e1340", skyMid: "#1a2152", skyLow: "#2f3d8f",
    glow: "#cdd7ff", glowOpacity: 0.55, sunX: 0.74, moon: true,
    farShade: "#232d80", farLit: "#4658b3", farSnow: "#aab6ee",
    midShade: "#18205f", midLit: "#34439a", haze: "#2b3886",
    lakeTop: "#3c4ea8", lakeLow: "#0d1442", glint: "#dfe6ff",
    shore: "#0e2230", shoreLit: "#183a45",
    bankLit: "#1f4048", bankShade: "#0b1d24", bankDab: "#2c5658",
    rock: "#323f86", rockLit: "#5663ab",
    pine: "#08181f", pineLit: "#102a33", flower: "#aeb9f2",
    cloudTop: "#4a5bb0", cloudBottom: "#1c2465", cloudLight: "#7686d4",
  },
};

/**
 * The calm look: muted slate, forest and cream, with one light direction per scene (from the side the sun or moon is on).
 * Pastel pinks and lavenders are gone; the page's lime accent carries the colour. Only the times of day the site uses are
 * defined here; the others fall back to PALETTES.
 */
export const CALM_PALETTES: Partial<Record<Time, Palette>> = {
  dawn: {
    skyTop: "#dde4e4", skyMid: "#ecefe6", skyLow: "#f6f0df",
    glow: "#fff3d6", glowOpacity: 0.9, sunX: 0.28, moon: false,
    farShade: "#b3c0c3", farLit: "#d6dedb", farSnow: "#f8f6ee",
    midShade: "#8a9ca1", midLit: "#b4c2bd", haze: "#eef0e5",
    lakeTop: "#dfe6e0", lakeLow: "#7f9a9c", glint: "#fbf8ee",
    shore: "#44604f", shoreLit: "#628069",
    bankLit: "#86a35a", bankShade: "#3b5532", bankDab: "#a3bd6d",
    rock: "#78838a", rockLit: "#aab3b6",
    pine: "#244538", pineLit: "#3b6a50", flower: "#f7f4e8",
    cloudTop: "#f7f1e4", cloudBottom: "#c3ced1", cloudLight: "#fffbf1",
    crown: "#3f6247", crownLit: "#6a8c62", treeShade: "#10241c",
  },
  night: {
    skyTop: "#0d1130", skyMid: "#151b43", skyLow: "#222c63",
    glow: "#d7ddf2", glowOpacity: 0.5, sunX: 0.74, moon: true,
    farShade: "#1f2862", farLit: "#37458a", farSnow: "#aeb9e0",
    midShade: "#161d52", midLit: "#2d3a84", haze: "#27327a",
    lakeTop: "#34439a", lakeLow: "#0c1240", glint: "#dde3f8",
    shore: "#0d1f2b", shoreLit: "#16343d",
    bankLit: "#1c3b44", bankShade: "#0a1b22", bankDab: "#2a4f52",
    rock: "#2e3a7c", rockLit: "#4f5ca0",
    pine: "#07161c", pineLit: "#0f2a31", flower: "#9fabdc",
    cloudTop: "#424f9e", cloudBottom: "#1a2260", cloudLight: "#6a79c6",
    crown: "#0b1f27", crownLit: "#16343d", treeShade: "#030b0f",
  },
};

export type Look = "calm" | "classic";
export const paletteFor = (time: Time, look: Look): Palette => (look === "calm" ? CALM_PALETTES[time] ?? PALETTES[time] : PALETTES[time]);
