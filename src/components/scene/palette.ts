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
