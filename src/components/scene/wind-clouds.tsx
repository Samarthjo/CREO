import type { CSSProperties } from "react";
import { Cloud } from "./cloud";
import type { Time } from "./palette";

export interface WindCloud {
  seed: number;
  /** Position and width: percentages of the scene, so a cloud keeps its place in the margin at every size. */
  cls: string;
  /** Seconds for one cycle: fade in, drift `run` vw to the right, fade out. Longer is slower and reads as farther away. */
  dur: number;
  run: number;
  delay: number;
  /** Peak opacity. Far clouds are fainter. */
  o: number;
}

/**
 * Wind blows left to right for every cloud. Clouds sit in the side margins, clear of headlines and buttons, and are hidden
 * below 1024px where the text fills the width. Far clouds are small, faint and slow; near clouds are larger and a little quicker.
 */
export const SIDE_CLOUDS: readonly WindCloud[] = [
  { seed: 2, cls: "-left-[5%] top-[16%] w-[25%]", dur: 280, run: 4, delay: -90, o: 0.95 },
  { seed: 7, cls: "left-[3%] top-[6%] w-[13%]", dur: 420, run: 4, delay: -200, o: 0.7 },
  { seed: 5, cls: "-right-[4%] top-[24%] w-[22%]", dur: 330, run: 6, delay: -40, o: 0.95 },
  { seed: 9, cls: "right-[6%] top-[9%] w-[12%]", dur: 460, run: 4, delay: -300, o: 0.65 },
];

export const NIGHT_CLOUDS: readonly WindCloud[] = [{ seed: 11, cls: "left-[2%] top-[5%] w-[20%]", dur: 380, run: 5, delay: -120, o: 0.8 }];

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
