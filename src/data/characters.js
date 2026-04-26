export const characters = [
  { id: 1, name: "Blaze", emoji: "🔥", color: "#ff4e4e" },
  { id: 2, name: "Storm", emoji: "⚡", color: "#ffe04e" },
  { id: 3, name: "Frost", emoji: "❄️", color: "#4ec8ff" },
  { id: 4, name: "Viper", emoji: "🐍", color: "#4eff91" },
  { id: 5, name: "Nova", emoji: "🌟", color: "#c44eff" },
  { id: 6, name: "Titan", emoji: "🦁", color: "#ff914e" },
  { id: 7, name: "Shadow", emoji: "🦇", color: "#a0a0c0" },
  { id: 8, name: "Echo", emoji: "🎭", color: "#ff4eb8" },
];

export const randomNames = [
  "CardShark", "UnoKing", "DrawFour", "WildCard", "SkipMaster",
  "ReverseAce", "ColorBomb", "DeckSlayer", "UnoLord", "StackAttack",
  "ComboBreaker", "CardFlinger", "SwiftDraw", "NeonDealer", "UnoStrike",
];

export const getRandomName = () =>
  randomNames[Math.floor(Math.random() * randomNames.length)];

export const getRandomCharacter = () =>
  characters[Math.floor(Math.random() * characters.length)];

export const generateJoinCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();
