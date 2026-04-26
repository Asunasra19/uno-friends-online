import { io } from "socket.io-client";

const socket1 = io("http://localhost:3001");
const socket2 = io("http://localhost:3001");

socket1.on("connect", () => {
  socket1.emit("create_room", { username: "Alice", character: { emoji: '🦊', name: 'Fox' }, code: "TEST99" }, (res) => {
    console.log("Socket 1 created room.");
    
    // Once Alice created, Bob joins.
    setTimeout(() => {
        socket2.emit("join_room", { username: "Bob", character: { emoji: '🐱', name: 'Cat' }, code: "TEST99" }, (res2) => {
            console.log("Socket 2 joined room.");
        });
    }, 500);
  });
});

socket1.on("lobby_update", (data) => {
    console.log("Socket 1 received lobby_update. Players:", data.players.map(p => p.name));
    if (data.players.length === 2) {
        console.log("Socket 1 successfully saw Socket 2 join!");
        process.exit(0);
    }
});

setTimeout(() => {
    console.log("Timeout! Socket 1 didn't see Socket 2.");
    process.exit(1);
}, 3000);
