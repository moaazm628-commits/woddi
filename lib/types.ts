export type GameId = "spy" | "headsup" | "password";

export interface Game {
  id: GameId;
  titleEn: string;
  titleAr: string;
  icon: string;
  players: string;
  accentColor: string;
  badgeLabel: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  nameAr?: string;
  isHost?: boolean;
  isReady?: boolean;
  color: string;
}

export const GAMES: Game[] = [
  {
    id: "spy",
    titleEn: "Spy Game",
    titleAr: "لعبة الجاسوس",
    icon: "🕵️",
    players: "3–8",
    accentColor: "var(--blue)",
    badgeLabel: "3–8",
    description: "Find the spy before they fool everyone",
  },
  {
    id: "headsup",
    titleEn: "Heads Up",
    titleAr: "هيدز أب",
    icon: "🙌",
    players: "2+",
    accentColor: "var(--gold)",
    badgeLabel: "2+",
    description: "Guess the word before time runs out",
  },
  {
    id: "password",
    titleEn: "Password",
    titleAr: "الكلمة السرية",
    icon: "🔐",
    players: "4+",
    accentColor: "var(--green)",
    badgeLabel: "⚽",
    description: "One clue at a time — football edition",
  },
];

export const AVATAR_COLORS = [
  { bg: "rgba(245,200,66,0.15)", fg: "var(--gold)" },
  { bg: "rgba(79,142,247,0.15)", fg: "var(--blue)" },
  { bg: "rgba(61,214,140,0.15)", fg: "var(--green)" },
  { bg: "rgba(247,79,106,0.15)", fg: "var(--red)" },
];
