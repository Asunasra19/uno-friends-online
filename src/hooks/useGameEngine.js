import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createDeck, shuffleDeck, dealCards,
  getPlayableIndices, cpuPickCard, cpuChooseColor, getNextIndex,
} from '../data/deck';

const CPU_NAMES = ['Nova', 'Blaze', 'Frost'];

/* ─── Initial state builder ──────────────────────────────────────── */
function buildInitialState(config) {
  const { humanName, humanCharacter, cpuCount } = config;

  const players = [
    { id: 'human', name: humanName || 'You', character: humanCharacter, hand: [], isHuman: true },
    ...Array.from({ length: cpuCount }, (_, i) => ({
      id: `cpu_${i}`,
      name: CPU_NAMES[i],
      character: null,
      hand: [],
      isHuman: false,
    })),
  ];

  let deck = shuffleDeck(createDeck());
  const { hands, remaining } = dealCards(deck, players.length, 7);
  players.forEach((p, i) => { p.hand = [...hands[i]]; });
  deck = remaining;

  // Flip start card — skip wilds
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

  const phase = players[currentPlayerIndex].isHuman ? 'player_turn' : 'cpu_thinking';

  return {
    deck,
    discardPile: [startCard],
    currentColor: startCard.color,
    currentValue: startCard.value,
    players,
    currentPlayerIndex,
    direction,
    pendingDraw,
    pendingDrawType,   // 'plus2' | 'wild_plus4' | null — what caused the pending draw
    phase,             // 'player_turn'|'player_drawn'|'color_pick'|'cpu_thinking'|'challenge_pending'|'game_over'
    winner: null,
    drawnCard: null,
    unoCallPending: null,     // player INDEX who has 1 card and hasn't called UNO yet
    humanCalledUnoEarly: false, // true if human clicked UNO while holding 2 cards
    challengePending: null,   // { challengedIdx, challengedHand, prevColor } for wild+4 bluff
    turnId: 0,                // increments every action — ensures CPU effect re-fires even when same player goes again
    message: phase === 'cpu_thinking'
      ? `First card: ${startCard.value}! CPU goes first.`
      : 'Your turn!',
    config,
  };
}

/* ─── Utility: ensure draw pile has cards ───────────────────────── */
function ensureDeck(state) {
  if (state.deck.length > 1) return state;
  const [top, ...rest] = [...state.discardPile].reverse();
  const newDeck = shuffleDeck(rest.map(c =>
    c.type === 'wild' ? { ...c, color: null } : c
  ));
  return { ...state, deck: newDeck, discardPile: [top] };
}

/* ─── Utility: draw N cards from deck ──────────────────────────── */
function drawFromDeck(state, count = 1) {
  let s = ensureDeck(state);
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) break;
    drawn.push(s.deck[0]);
    s = { ...s, deck: s.deck.slice(1) };
  }
  return { newState: s, drawn };
}

/* ─── Utility: check & apply UNO penalty ───────────────────────── */
function checkUnoPenalty(state) {
  const { unoCallPending, currentPlayerIndex } = state;
  // If a DIFFERENT player forgot to call UNO before this player acts, penalise them
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

/* ─── Core: apply a played card to state ───────────────────────── */
function applyCardPlay(state, playerIndex, cardIndex) {
  const players = state.players.map(p => ({ ...p, hand: [...p.hand] }));
  const card = players[playerIndex].hand[cardIndex];

  // Snapshot hand BEFORE removing card (for Wild+4 challenge validation)
  const fullHandSnapshot = [...players[playerIndex].hand];
  players[playerIndex].hand.splice(cardIndex, 1);

  const discardPile = [card, ...state.discardPile];
  let { direction } = state;
  let pendingDraw = state.pendingDraw;
  let pendingDrawType = state.pendingDrawType;
  const prevColor = state.currentColor; // colour before this play
  let nextColor = card.color ?? state.currentColor;
  let skipNext = false;

  if (card.value === 'reverse') {
    direction = -direction;
    if (players.length === 2) skipNext = true; // reverse = skip in 2-player
  }
  if (card.value === 'skip') skipNext = true;
  if (card.value === 'plus2') {
    pendingDraw += 2; // stacks on existing pendingDraw
    pendingDrawType = 'plus2';
  }
  if (card.value === 'wild_plus4') {
    pendingDraw += 4;
    pendingDrawType = 'wild_plus4';
  }
  // Non-draw card resets draw type
  if (card.value !== 'plus2' && card.value !== 'wild_plus4') {
    pendingDrawType = null;
    pendingDraw = 0;
  }

  // ── Win check ──────────────────────────────────────────────────
  if (players[playerIndex].hand.length === 0) {
    // Wild as last card → auto-select red (no color picker needed)
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

  // ── UNO detection ──────────────────────────────────────────────
  // Human must manually call; CPU auto-calls
  let unoCallPending = state.unoCallPending;
  let humanCalledUnoEarly = state.humanCalledUnoEarly;

  if (players[playerIndex].hand.length === 1) {
    if (players[playerIndex].isHuman) {
      if (humanCalledUnoEarly) {
        unoCallPending = null; // Protected!
        humanCalledUnoEarly = false;
      } else {
        unoCallPending = playerIndex; // Vulnerable to penalty!
      }
    }
    // CPU auto-calls UNO — no penalty
  } else if (unoCallPending === playerIndex) {
    // Player now has != 1 card (drew more), clear pending
    unoCallPending = null;
  }

  if (players[playerIndex].isHuman && players[playerIndex].hand.length > 1) {
    humanCalledUnoEarly = false;
  }

  // ── Advance turn ───────────────────────────────────────────────
  const { length } = players;
  let nextIdx = getNextIndex(playerIndex, direction, length);
  if (skipNext) nextIdx = getNextIndex(nextIdx, direction, length);

  const isWild = card.type === 'wild';

  // ── Wild+4 Bluff Challenge setup ───────────────────────────────
  // Only offer challenge when next player is human and a CPU played wild+4
  let challengePending = null;
  if (card.value === 'wild_plus4' && players[nextIdx].isHuman && !players[playerIndex].isHuman) {
    // Store remaining hand (without the +4 just played) + previous colour for validation
    const challengedHand = fullHandSnapshot.filter((_, i) => i !== cardIndex);
    challengePending = { challengedIdx: playerIndex, challengedHand, prevColor };
  }

  // ── Determine next phase ───────────────────────────────────────
  const nextPhase = (() => {
    if (isWild && players[playerIndex].isHuman) return 'color_pick';
    if (challengePending) return 'challenge_pending';
    if (players[nextIdx].isHuman) return 'player_turn';
    return 'cpu_thinking';
  })();

  const nextMessage = (() => {
    if (isWild && players[playerIndex].isHuman) return 'Choose a color!';
    if (challengePending) return `${players[playerIndex].name} played Wild +4! Challenge or accept?`;
    if (players[nextIdx].isHuman) return 'Your turn!';
    return `${players[nextIdx].name} is thinking…`;
  })();

  return {
    ...state, players, discardPile,
    currentColor: nextColor,
    currentValue: card.value,
    direction, pendingDraw, pendingDrawType,
    currentPlayerIndex: isWild && players[playerIndex].isHuman ? playerIndex : nextIdx,
    phase: nextPhase,
    drawnCard: null,
    unoCallPending,
    humanCalledUnoEarly,
    challengePending,
    turnId: (state.turnId ?? 0) + 1,
    message: nextMessage,
    _nextIdx: nextIdx,
  };
}

/* ─── Hook ───────────────────────────────────────────────────────── */
export function useGameEngine(config) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('uno_save_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.state) return parsed.state;
      } catch (e) {
        console.error('Failed to restore game state', e);
      }
    }
    return buildInitialState(config);
  });

  const cpuTimer = useRef(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('uno_save_state', JSON.stringify({ config, state }));
  }, [state, config]);

  // ── Human: call UNO ─────────────────────────────────────────────
  const callUno = useCallback(() => {
    setState(s => {
      // If already vulnerable (1 card left), clear the penalty
      if (s.unoCallPending === 0) return { ...s, unoCallPending: null };
      
      // If human has exactly 2 cards, they can call it early to protect themselves
      if (s.players[0].hand.length === 2 && (s.phase === 'player_turn' || s.phase === 'player_drawn')) {
        return { ...s, humanCalledUnoEarly: true };
      }

      return s;
    });
  }, []);

  // ── Human: play a card ──────────────────────────────────────────
  const playCard = useCallback((cardIndex) => {
    setState(s => {
      if (s.phase !== 'player_turn' && s.phase !== 'player_drawn') return s;
      const { currentPlayerIndex, currentColor } = s;
      if (!s.players[currentPlayerIndex].isHuman) return s;

      const card = s.players[currentPlayerIndex].hand[cardIndex];

      // Wild+4 restriction: cannot play if a matching-colour card exists
      if (card.value === 'wild_plus4') {
        const hasMatch = s.players[currentPlayerIndex].hand
          .some((c, i) => i !== cardIndex && c.color === currentColor);
        if (hasMatch) {
          return {
            ...s,
            message: "❌ You can't play Wild +4 — you have a matching colour card!",
          };
        }
      }

      // Apply UNO penalty to anyone who forgot before this action
      const penalised = checkUnoPenalty(s);
      return applyCardPlay(penalised, currentPlayerIndex, cardIndex);
    });
  }, []);

  // ── Human: draw a card ──────────────────────────────────────────
  const drawCard = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player_turn') return s;
      const { currentPlayerIndex, pendingDraw, pendingDrawType } = s;

      // Apply UNO penalty first
      let cur = checkUnoPenalty(s);

      if (pendingDraw > 0) {
        // Must draw all pending cards + skip turn
        const { newState, drawn } = drawFromDeck(cur, pendingDraw);
        const players = newState.players.map((p, i) =>
          i === currentPlayerIndex ? { ...p, hand: [...p.hand, ...drawn] } : p
        );
        const nextIdx = getNextIndex(currentPlayerIndex, newState.direction, players.length);
        const nextPhase = players[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
        return {
          ...newState, players, pendingDraw: 0, pendingDrawType: null,
          currentPlayerIndex: nextIdx, phase: nextPhase,
          drawnCard: null,
          humanCalledUnoEarly: currentPlayerIndex === 0 ? false : cur.humanCalledUnoEarly,
          turnId: (s.turnId ?? 0) + 1,
          message: `You drew ${pendingDraw} cards! ${players[nextIdx].isHuman ? 'Your turn!' : `${players[nextIdx].name} is thinking…`}`,
        };
      }

      // Normal draw 1
      const { newState, drawn } = drawFromDeck(cur, 1);
      if (drawn.length === 0) return cur;
      const card = drawn[0];
      const players = newState.players.map((p, i) =>
        i === currentPlayerIndex ? { ...p, hand: [...p.hand, card] } : p
      );

      // Check if drawn card is playable
      const isPlayable = getPlayableIndices(
        [card], cur.currentColor, cur.currentValue, 0, null
      ).length > 0;

      if (!isPlayable) {
        // Not playable → end turn immediately (no option shown)
        const nextIdx = getNextIndex(currentPlayerIndex, newState.direction, players.length);
        const nextPhase = players[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
        return {
          ...newState, players, drawnCard: null,
          currentPlayerIndex: nextIdx, phase: nextPhase,
          humanCalledUnoEarly: currentPlayerIndex === 0 ? false : cur.humanCalledUnoEarly,
          turnId: (s.turnId ?? 0) + 1,
          message: `Drew a card — not playable. ${players[nextIdx].isHuman ? 'Your turn!' : `${players[nextIdx].name} is thinking…`}`,
        };
      }

      // Playable (including wild/+4) → give option to play or keep
      const drawMsg = card.type === 'wild'
        ? `You drew a ${card.value === 'wild_plus4' ? 'Wild +4' : 'Wild'}! Play it or end your turn.`
        : 'You drew a playable card! Play it or end your turn.';
      return {
        ...newState, players, drawnCard: card,
        phase: 'player_drawn',
        humanCalledUnoEarly: currentPlayerIndex === 0 ? false : cur.humanCalledUnoEarly,
        turnId: (s.turnId ?? 0) + 1,
        message: drawMsg,
      };
    });
  }, []);

  // ── Human: end turn after drawing ──────────────────────────────
  const endTurn = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player_drawn') return s;
      const { currentPlayerIndex, direction, players } = s;
      const nextIdx = getNextIndex(currentPlayerIndex, direction, players.length);
      const nextPhase = players[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
      return {
        ...s, drawnCard: null,
        currentPlayerIndex: nextIdx, phase: nextPhase,
        turnId: (s.turnId ?? 0) + 1,
        message: players[nextIdx].isHuman ? 'Your turn!' : `${players[nextIdx].name} is thinking…`,
      };
    });
  }, []);

  // ── Human: choose wild color ────────────────────────────────────
  const chooseColor = useCallback((color) => {
    setState(s => {
      if (s.phase !== 'color_pick') return s;
      const { players, direction, currentPlayerIndex, _nextIdx } = s;
      const nextIdx = _nextIdx ?? getNextIndex(currentPlayerIndex, direction, players.length);
      const nextPhase = players[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
      return {
        ...s, currentColor: color,
        currentPlayerIndex: nextIdx, phase: nextPhase,
        turnId: (s.turnId ?? 0) + 1,
        message: players[nextIdx].isHuman ? 'Your turn!' : `${players[nextIdx].name} is thinking…`,
      };
    });
  }, []);

  // ── Human: challenge Wild +4 ────────────────────────────────────
  const challengeWildFour = useCallback((doChallenge) => {
    setState(s => {
      if (s.phase !== 'challenge_pending' || !s.challengePending) return s;
      const { challengedIdx, challengedHand, prevColor } = s.challengePending;
      const { players, direction, currentPlayerIndex } = s;
      const challengerIdx = currentPlayerIndex;

      if (doChallenge) {
        const wasBluff = challengedHand.some(c => c.color === prevColor);

        if (wasBluff) {
          // BLUFF — challenger draws 0, challenged player draws 4
          const { newState, drawn } = drawFromDeck(s, 4);
          const updPlayers = newState.players.map((p, i) =>
            i === challengedIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
          );
          const nextPhase = updPlayers[challengerIdx].isHuman ? 'player_turn' : 'cpu_thinking';
          return {
            ...newState, players: updPlayers,
            pendingDraw: 0, pendingDrawType: null,
            currentPlayerIndex: challengerIdx,
            phase: nextPhase,
            challengePending: null,
            turnId: (s.turnId ?? 0) + 1,
            message: `✅ Challenge successful! ${players[challengedIdx].name} draws 4 cards! Your turn!`,
          };
        } else {
          // VALID — challenger draws 6 (4 + 2 penalty) and loses turn
          const { newState, drawn } = drawFromDeck(s, 6);
          const updPlayers = newState.players.map((p, i) =>
            i === challengerIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
          );
          const nextIdx = getNextIndex(challengerIdx, direction, updPlayers.length);
          const nextPhase = updPlayers[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
          return {
            ...newState, players: updPlayers,
            pendingDraw: 0, pendingDrawType: null,
            currentPlayerIndex: nextIdx,
            phase: nextPhase,
            challengePending: null,
            turnId: (s.turnId ?? 0) + 1,
            message: `❌ Challenge failed! You draw 6 cards! ${updPlayers[nextIdx].isHuman ? 'Your turn!' : `${updPlayers[nextIdx].name} is thinking…`}`,
          };
        }
      } else {
        // ACCEPT — draw pendingDraw cards and skip turn
        const drawCount = s.pendingDraw;
        const { newState, drawn } = drawFromDeck(s, drawCount);
        const updPlayers = newState.players.map((p, i) =>
          i === challengerIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
        );
        const nextIdx = getNextIndex(challengerIdx, direction, updPlayers.length);
        const nextPhase = updPlayers[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
        return {
          ...newState, players: updPlayers,
          pendingDraw: 0, pendingDrawType: null,
          currentPlayerIndex: nextIdx,
          phase: nextPhase,
          challengePending: null,
          turnId: (s.turnId ?? 0) + 1,
          message: `You drew ${drawCount} cards. ${updPlayers[nextIdx].isHuman ? 'Your turn!' : `${updPlayers[nextIdx].name} is thinking…`}`,
        };
      }
    });
  }, []);

  // ── CPU turn effect ─────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'cpu_thinking') return;

    const delay = 900 + Math.random() * 500;
    cpuTimer.current = setTimeout(() => {
      setState(s => {
        if (s.phase !== 'cpu_thinking') return s;
        const { currentPlayerIndex, players, currentColor, currentValue, pendingDraw, pendingDrawType, direction } = s;
        const cpu = players[currentPlayerIndex];

        // Apply UNO penalty if a human forgot before CPU acts
        let cur = checkUnoPenalty(s);
        // Re-read after penalty in case state changed
        const effPendingDraw = cur.pendingDraw;
        const effPendingDrawType = cur.pendingDrawType;

        // Must draw penalty cards?
        if (effPendingDraw > 0) {
          const { newState, drawn } = drawFromDeck(cur, effPendingDraw);
          const updPlayers = newState.players.map((p, i) =>
            i === currentPlayerIndex ? { ...p, hand: [...p.hand, ...drawn] } : p
          );
          const nextIdx = getNextIndex(currentPlayerIndex, cur.direction, updPlayers.length);
          const nextPhase = updPlayers[nextIdx].isHuman ? 'player_turn' : 'cpu_thinking';
          return {
            ...newState, players: updPlayers, pendingDraw: 0, pendingDrawType: null,
            currentPlayerIndex: nextIdx, phase: nextPhase,
            message: `${cpu.name} drew ${effPendingDraw} cards! ${updPlayers[nextIdx].isHuman ? 'Your turn!' : `${updPlayers[nextIdx].name} is thinking…`}`,
          };
        }

        // Try to play a card (Wild+4 restriction: prefer not playing +4 if matching colour exists)
        const allPlayable = s.players[currentPlayerIndex].hand
          .map((card, i) => ({ card, i }))
          .filter(({ card }) => {
            if (card.value === 'wild_plus4') {
              // Enforce restriction: only if no matching colour in hand
              return !cur.players[currentPlayerIndex].hand
                .some((c, j) => j !== /* index after potential removal */ card.id && c.color === cur.currentColor && c.value !== 'wild_plus4');
            }
            return true;
          });

        const cardIdx = cpuPickCard(cur.players[currentPlayerIndex].hand, cur.currentColor, cur.currentValue, effPendingDraw, effPendingDrawType);

        if (cardIdx !== null) {
          const nextS = applyCardPlay(cur, currentPlayerIndex, cardIdx);

          // If CPU played wild → auto-choose best colour
          if (cur.players[currentPlayerIndex].hand[cardIdx]?.type === 'wild') {
            // Guard: if wild was last card, game_over is already set — don't overwrite
            if (nextS.phase === 'game_over') return nextS;

            const chosenColor = cpuChooseColor(
              nextS.players[currentPlayerIndex]?.hand ?? cur.players[currentPlayerIndex].hand
            );
            const { players: np, direction: nd, _nextIdx, currentPlayerIndex: cpi } = nextS;
            const nextIdx2 = _nextIdx ?? getNextIndex(cpi, nd, np.length);
            const nextPhase2 = nextS.challengePending
              ? 'challenge_pending'
              : (np[nextIdx2].isHuman ? 'player_turn' : 'cpu_thinking');

            return {
              ...nextS,
              currentColor: chosenColor,
              currentPlayerIndex: nextIdx2,
              phase: nextPhase2,
              message: nextS.challengePending
                ? `${cpu.name} played Wild +4 and chose ${chosenColor}! Challenge or accept?`
                : `${cpu.name} played Wild and chose ${chosenColor}! ${np[nextIdx2].isHuman ? 'Your turn!' : `${np[nextIdx2].name} is thinking…`}`,
            };
          }
          return nextS;
        }

        // No playable card — draw 1
        const { newState: ns2, drawn: dr2 } = drawFromDeck(cur, 1);
        if (dr2.length === 0) {
          const nextIdx3 = getNextIndex(currentPlayerIndex, cur.direction, players.length);
          return {
            ...ns2, currentPlayerIndex: nextIdx3,
            phase: players[nextIdx3].isHuman ? 'player_turn' : 'cpu_thinking',
            message: players[nextIdx3].isHuman ? 'Your turn!' : `${players[nextIdx3].name} is thinking…`,
          };
        }

        const drawnCard = dr2[0];
        const updPlayers2 = ns2.players.map((p, i) =>
          i === currentPlayerIndex ? { ...p, hand: [...p.hand, drawnCard] } : p
        );

        // Can drawn card be played immediately?
        const canPlay = getPlayableIndices(
          [drawnCard], cur.currentColor, cur.currentValue, effPendingDraw, effPendingDrawType
        ).length > 0;

        if (canPlay) {
          const newHandIdx = updPlayers2[currentPlayerIndex].hand.length - 1;
          const nextS2 = applyCardPlay(
            { ...ns2, players: updPlayers2 },
            currentPlayerIndex, newHandIdx
          );
          if (drawnCard.type === 'wild') {
            const chosenColor2 = cpuChooseColor(updPlayers2[currentPlayerIndex].hand);
            const { players: np2, direction: nd2, _nextIdx: ni2, currentPlayerIndex: cpi2 } = nextS2;
            const nextIdx4 = ni2 ?? getNextIndex(cpi2, nd2, np2.length);
            const nextPhase4 = nextS2.challengePending
              ? 'challenge_pending'
              : (np2[nextIdx4].isHuman ? 'player_turn' : 'cpu_thinking');
            return {
              ...nextS2, currentColor: chosenColor2,
              currentPlayerIndex: nextIdx4,
              phase: nextPhase4,
              message: nextS2.challengePending
                ? `${cpu.name} drew & played Wild +4 and chose ${chosenColor2}! Challenge or accept?`
                : `${cpu.name} drew and played ${drawnCard.value}! ${np2[nextIdx4].isHuman ? 'Your turn!' : `${np2[nextIdx4].name} is thinking…`}`,
            };
          }
          return { ...nextS2, message: `${cpu.name} drew and played a card!` };
        }

        // Cannot play drawn card — end turn
        const nextIdx5 = getNextIndex(currentPlayerIndex, cur.direction, updPlayers2.length);
        const nextPhase5 = updPlayers2[nextIdx5].isHuman ? 'player_turn' : 'cpu_thinking';
        return {
          ...ns2, players: updPlayers2,
          currentPlayerIndex: nextIdx5, phase: nextPhase5,
          message: `${cpu.name} drew a card. ${updPlayers2[nextIdx5].isHuman ? 'Your turn!' : `${updPlayers2[nextIdx5].name} is thinking…`}`,
        };
      });
    }, delay);

    return () => clearTimeout(cpuTimer.current);
  }, [state.phase, state.currentPlayerIndex, state.turnId]);

  // ── Restart ─────────────────────────────────────────────────────
  const restartGame = useCallback(() => {
    const newState = buildInitialState(config);
    setState(newState);
    localStorage.setItem('uno_save_state', JSON.stringify({ config, state: newState }));
  }, [config]);

  return { state, playCard, drawCard, endTurn, chooseColor, callUno, challengeWildFour, restartGame };
}
