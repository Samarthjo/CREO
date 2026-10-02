import type { Variant } from "./bus";

/** Stage sizes. The poster, the canvas and the chips all share one box with this aspect ratio, so a chip placed at a
 * percentage lines up with the same point in the poster and in the live scene. Poster pixel sizes: wide 1600x1000, tall 900x1200. */
export const STAGE_ASPECT: Record<Variant, number> = { wide: 1.6, tall: 0.75 };

export { ANCHORS } from "./anchors.generated";
