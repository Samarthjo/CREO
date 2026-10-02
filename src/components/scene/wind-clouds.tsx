import type { CSSProperties } from "react";
import { Cloud } from "./cloud";
import type { Time } from "./palette";

export interface WindCloud {
  seed: number;
  /** Position and width: percentages of the scene, so a cloud keeps its place in the margin at every size. */
  cls: string;
  /** Seconds for one cycle: fade in, drift `run` vw to the right, fade out. Slower reads as farther away. */
  dur: number;
  run: number;
  delay: number;
  /** Peak opacity. Far clouds are fainter. */
  o: number;
}

/**
 * Wind blows left to right for every cloud. Clouds sit in the side margins: the left ones start partly off screen and end
 * before the headline, the right ones drift away from it. Hidden below 1024px, where the text fills the width.
 * Near clouds are larger and drift at about 3 to 4 px a second on a 1440px screen; far ones are smaller, fainter, slower.
 */
export const SIDE_CLOUDS: readonly WindCloud[] = [
  { seed: 2, cls: "-left-[20%] top-[16%] w-[22%]", dur: 50, run: 14, delay: -18, o: 0.95 },
  { seed: 7, cls: "-left-[6%] top-[6%] w-[12%]", dur: 66, run: 8, delay: -40, o: 0.7 },
  { seed: 5, cls: "-right-[6%] top-[24%] w-[22%]", dur: 54, run: 12, delay: -8, o: 0.95 },
  { seed: 9, cls: "right-[6%] top-[9%] w-[12%]", dur: 72, run: 7, delay: -50, o: 0.65 },
];

export const NIGHT_CLOUDS: readonly WindCloud[] = [{ seed: 11, cls: "-left-[4%] top-[3%] w-[20%]", dur: 64, run: 8, delay: -20, o: 0.8 }];

export function WindClouds({ time, clouds = SIDE_CLOUDS }: { time: Time; clouds?: readonly WindCloud[] }) {
  return clouds.map((c) => (
    <Cloud
      key={c.seed}
      time={time}
      seed={c.seed}
      className={`wind absolute hidden lg:block ${c.cls}`}
      style={{ "--dur": `${c.dur}s`, "--run": `${c.run}vw`, "--delay": `${c.delay}s`, "--o": c.o } as CSSProperties}
    />
  ));
}
