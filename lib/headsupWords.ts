import { HEADSUP_CATEGORIES as OLD, HeadsUpCategory } from "./gameData";
import { PART1 } from "./headsupPart1";

const replaced = PART1.map((c) => c.id);

export const HEADSUP_CATEGORIES: HeadsUpCategory[] = [
  ...PART1,
  ...OLD.filter((c) => !replaced.includes(c.id)),
];