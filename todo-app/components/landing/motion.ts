export const LANDING_HERO_STAGGER = 18
export const LANDING_HERO_CHAR_DURATION = 520

/** When the title letter wave is far enough along for body copy to appear. */
export function titleCharsEnd(delay: number, text: string) {
  return delay + text.length * LANDING_HERO_STAGGER + LANDING_HERO_CHAR_DURATION * 0.3
}
