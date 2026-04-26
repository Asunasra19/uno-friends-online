/** Creates a full 108-card UNO deck */
export function createDeck() {
  const cards = [];
  let id = 0;
  const colors = ['red', 'yellow', 'green', 'blue'];

  for (const color of colors) {
    // One 0
    cards.push({ id: id++, color, type: 'number', value: '0' });
    // Two each of 1–9
    for (let n = 1; n <= 9; n++) {
      cards.push({ id: id++, color, type: 'number', value: String(n) });
      cards.push({ id: id++, color, type: 'number', value: String(n) });
    }
    // Two each of Skip, Reverse, Draw Two
    for (const v of ['skip', 'reverse', 'plus2']) {
      cards.push({ id: id++, color, type: 'action', value: v });
      cards.push({ id: id++, color, type: 'action', value: v });
    }
  }
  // 4 Wilds + 4 Wild Draw Fours
  for (let i = 0; i < 4; i++) {
    cards.push({ id: id++, color: null, type: 'wild', value: 'wild' });
    cards.push({ id: id++, color: null, type: 'wild', value: 'wild_plus4' });
  }
  return cards; // 108 cards
}

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deal `count` cards to each of `playerCount` players from the top of deck */
export function dealCards(deck, playerCount, count = 7) {
  const hands = Array.from({ length: playerCount }, () => []);
  const remaining = [...deck];
  for (let c = 0; c < count; c++) {
    for (let p = 0; p < playerCount; p++) {
      hands[p].push(remaining.shift());
    }
  }
  return { hands, remaining };
}

/**
 * True if card can be played given the current game state.
 * pendingDrawType: 'plus2' | 'wild_plus4' | null — enables stacking rule.
 */
export function isCardPlayable(card, currentColor, currentValue, pendingDraw, pendingDrawType) {
  if (pendingDraw > 0) {
    // Only matching draw-card type can be stacked
    if (pendingDrawType === 'plus2') return card.value === 'plus2';
    if (pendingDrawType === 'wild_plus4') return card.value === 'wild_plus4';
    return false;
  }
  if (card.type === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === currentValue) return true;
  return false;
}

export function getPlayableIndices(hand, currentColor, currentValue, pendingDraw, pendingDrawType) {
  return hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isCardPlayable(card, currentColor, currentValue, pendingDraw, pendingDrawType))
    .map(({ i }) => i);
}

/** CPU picks best card index from hand */
export function cpuPickCard(hand, currentColor, currentValue, pendingDraw, pendingDrawType) {
  const playable = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isCardPlayable(card, currentColor, currentValue, pendingDraw, pendingDrawType));

  if (playable.length === 0) return null;

  // If stacking is required, play the stacking card immediately
  if (pendingDraw > 0) return playable[0].i;

  // Priority: action > number > wild > wild+4
  for (const type of ['action', 'number']) {
    const found = playable.find(({ card }) => card.type === type);
    if (found) return found.i;
  }
  const wild = playable.find(({ card }) => card.value === 'wild');
  if (wild) return wild.i;
  return playable[0].i;
}

/** CPU chooses best color for a wild card */
export function cpuChooseColor(hand) {
  const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const card of hand) {
    if (card.color) counts[card.color]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function getNextIndex(current, direction, total) {
  return ((current + direction) + total) % total;
}
