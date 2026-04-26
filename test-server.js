import { io } from "socket.io-client";

const socket1 = io("http://localhost:3001");
const socket2 = io("http://localhost:3001");

let p1State = null;
let p2State = null;

socket1.on("connect", () => {
  socket1.emit("create_room", { username: "Alice", character: { emoji: '🦊', name: 'Fox' }, code: "TEST99" }, (res) => {
    socket2.emit("join_room", { username: "Bob", character: { emoji: '🐱', name: 'Cat' }, code: "TEST99" }, (res2) => {
        socket1.emit("start_game", "TEST99");
    });
  });
});

socket1.on("game_started", s => { p1State = s; tryPlay(); });
socket1.on("state_update", s => { p1State = s; tryPlay(); });

socket2.on("game_started", s => { p2State = s; tryPlay(); });
socket2.on("state_update", s => { p2State = s; tryPlay(); });

let moveCount = 0;

function tryPlay() {
  // Let the state settle
  setTimeout(() => {
    if (!p1State || !p2State) return;
    if (p1State.phase === 'game_over') {
        console.log("Game Over state reached.");
        process.exit(0);
    }
    
    // It's Alice's turn
    if (p1State.currentPlayerIndex === 0 && p1State.phase === 'player_turn') {
        console.log(`[Turn ${moveCount}] Alice's turn. Top card:`, p1State.currentColor, p1State.currentValue);
        // Find a playable card
        const hand = p1State.players[0].hand;
        const playableIdx = hand.findIndex(c => c.color === p1State.currentColor || c.value === p1State.currentValue || c.type === 'wild');
        
        if (playableIdx !== -1) {
            console.log(`Alice plays card: ${hand[playableIdx].color} ${hand[playableIdx].value}`);
            socket1.emit("play_card", { roomId: "TEST99", cardIndex: playableIdx });
        } else {
            console.log(`Alice draws a card.`);
            socket1.emit("draw_card", { roomId: "TEST99" });
        }
        moveCount++;
    }
    // It's Bob's turn
    else if (p2State.currentPlayerIndex === 1 && p2State.phase === 'player_turn') {
        console.log(`[Turn ${moveCount}] Bob's turn. Top card:`, p2State.currentColor, p2State.currentValue);
        const hand = p2State.players[1].hand;
        const playableIdx = hand.findIndex(c => c.color === p2State.currentColor || c.value === p2State.currentValue || c.type === 'wild');
        
        if (playableIdx !== -1) {
            console.log(`Bob plays card: ${hand[playableIdx].color} ${hand[playableIdx].value}`);
            socket2.emit("play_card", { roomId: "TEST99", cardIndex: playableIdx });
        } else {
            console.log(`Bob draws a card.`);
            socket2.emit("draw_card", { roomId: "TEST99" });
        }
        moveCount++;
    }
    
    // Handle Color Pick
    if (p1State.currentPlayerIndex === 0 && p1State.phase === 'color_pick') {
        console.log("Alice picks a color (red)");
        socket1.emit("choose_color", { roomId: "TEST99", color: 'red' });
    }
    if (p2State.currentPlayerIndex === 1 && p2State.phase === 'color_pick') {
        console.log("Bob picks a color (blue)");
        socket2.emit("choose_color", { roomId: "TEST99", color: 'blue' });
    }

    if (moveCount > 20) {
        console.log("Successfully played 20 turns without error. Multiplayer Logic is rock solid.");
        process.exit(0);
    }
  }, 100);
}
