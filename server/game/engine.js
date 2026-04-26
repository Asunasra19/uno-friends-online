import { createDeck, shuffleDeck, dealCards, getNextIndex } from './deck.js';

export function buildInitialState(playersConfig) {
  // playersConfig is an array of { id: socket.id, name, character }
  const players = playersConfig.map(p => ({
    ...p,
    hand: [],
    isHuman: true, // all are human over network
  }));

  let deck = shuffleDeck(createDeck());
  const { hands, remaining } = dealCards(deck, players.length, 7);
  players.forEach((p, i) => { p.hand = [...hands[i]]; });
  deck = remaining;

  let startIdx = deck.findIndex(c => c.type !== 'wild');
  if (startIdx < 0) startIdx = 0;
  const [startCard] = deck.splice(startIdx, 1);

  let direction = 1;
  let pendingDraw = 0;
  let pendingDrawType = null;
  let skipFirst = false;

  if (startCard.value === 'reverse') direction = -1;
  if (startCard.value === 'skip') skipFirst = true;
  if (startCard.value === 'plus2') { pendingDraw = 2; pendingDrawType = 'plus2'; }

  let currentPlayerIndex = 0;
  if (skipFirst || startCard.value === 'reverse') {
    currentPlayerIndex = getNextIndex(0, direction, players.length);
  }

  return {
    deck,
    discardPile: [startCard],
    currentColor: startCard.color,
    currentValue: startCard.value,
    players,
    currentPlayerIndex,
    direction,
    pendingDraw,
    pendingDrawType,
    phase: 'player_turn',
    winner: null,
    drawnCard: null,
    unoCallPending: null,
    challengePending: null,
    turnId: 0,
    message: `${players[currentPlayerIndex].name}'s turn!`,
  };
}

export function ensureDeck(state) {
  if (state.deck.length > 1) return state;
  const [top, ...rest] = [...state.discardPile].reverse();
  const newDeck = shuffleDeck(rest.map(c =>
    c.type === 'wild' ? { ...c, color: null } : c
  ));
  return { ...state, deck: newDeck, discardPile: [top] };
}

export function drawFromDeck(state, count = 1) {
  let s = ensureDeck(state);
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) break;
    drawn.push(s.deck[0]);
    s = { ...s, deck: s.deck.slice(1) };
  }
  return { newState: s, drawn };
}

export function checkUnoPenalty(state) {
  const { unoCallPending, currentPlayerIndex } = state;
  if (unoCallPending === null || unoCallPending === currentPlayerIndex) return state;
  const { newState, drawn } = drawFromDeck(state, 2);
  const players = newState.players.map((p, i) =>
    i === unoCallPending ? { ...p, hand: [...p.hand, ...drawn] } : p
  );
  return {
    ...newState,
    players,
    unoCallPending: null,
    message: `${players[unoCallPending].name} forgot to call UNO! Drew 2 penalty cards.`,
  };
}

export function applyCardPlay(state, playerIndex, cardIndex) {
  const players = state.players.map(p => ({ ...p, hand: [...p.hand] }));
  const card = players[playerIndex].hand[cardIndex];

  const fullHandSnapshot = [...players[playerIndex].hand];
  players[playerIndex].hand.splice(cardIndex, 1);

  const discardPile = [card, ...state.discardPile];
  let { direction } = state;
  let pendingDraw = state.pendingDraw;
  let pendingDrawType = state.pendingDrawType;
  const prevColor = state.currentColor;
  let nextColor = card.color ?? state.currentColor;
  let skipNext = false;

  if (card.value === 'reverse') {
    direction = -direction;
    if (players.length === 2) skipNext = true;
  }
  if (card.value === 'skip') skipNext = true;
  if (card.value === 'plus2') {
    pendingDraw += 2;
    pendingDrawType = 'plus2';
  }
  if (card.value === 'wild_plus4') {
    pendingDraw += 4;
    pendingDrawType = 'wild_plus4';
  }
  if (card.value !== 'plus2' && card.value !== 'wild_plus4') {
    pendingDrawType = null;
    pendingDraw = 0;
  }

  if (players[playerIndex].hand.length === 0) {
    const finalColor = card.type === 'wild' ? 'red' : nextColor;
    return {
      ...state, players, discardPile,
      currentColor: finalColor,
      currentValue: card.value,
      direction, pendingDraw: 0, pendingDrawType: null,
      phase: 'game_over',
      winner: players[playerIndex],
      unoCallPending: null,
      challengePending: null,
      message: `🎉 ${players[playerIndex].name} wins!`,
    };
  }

  let unoCallPending = state.unoCallPending;
  // Note: For multiplayer we will just rely on standard UNO logic. 
  // For simplicity, we drop humanCalledUnoEarly here and just set it to pending.
  // The client must emit a "call_uno" event right before or after playing.
  if (players[playerIndex].hand.length === 1) {
    if (players[playerIndex].unoProtected) {
      unoCallPending = null;
      players[playerIndex].unoProtected = false;
    } else {
      unoCallPending = playerIndex;
    }
  } else if (unoCallPending === playerIndex) {
    unoCallPending = null;
  }
  players[playerIndex].unoProtected = false; // Reset protection

  const { length } = players;
  let nextIdx = getNextIndex(playerIndex, direction, length);
  if (skipNext) nextIdx = getNextIndex(nextIdx, direction, length);

  const isWild = card.type === 'wild';
  let challengePending = null;
  if (card.value === 'wild_plus4') {
    const challengedHand = fullHandSnapshot.filter((_, i) => i !== cardIndex);
    challengePending = { challengedIdx: playerIndex, challengedHand, prevColor };
  }

  const nextPhase = (() => {
    if (isWild) return 'color_pick';
    if (challengePending) return 'challenge_pending';
    return 'player_turn';
  })();

  const nextMessage = (() => {
    if (isWild) return `${players[playerIndex].name} is choosing a color...`;
    if (challengePending) return `Wild +4 played! ${players[nextIdx].name}, challenge or accept?`;
    return `${players[nextIdx].name}'s turn!`;
  })();

  return {
    ...state, players, discardPile,
    currentColor: nextColor,
    currentValue: card.value,
    direction, pendingDraw, pendingDrawType,
    currentPlayerIndex: isWild ? playerIndex : nextIdx,
    phase: nextPhase,
    drawnCard: null,
    unoCallPending,
    challengePending,
    turnId: (state.turnId ?? 0) + 1,
    message: nextMessage,
    _nextIdx: nextIdx,
  };
}
