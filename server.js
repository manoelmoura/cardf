import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = new Map();

io.on("connection", socket => {
    players.set(socket.id, {
        id: socket.id,
        x: 0,
        y: 1,
        z: 0,
        speed: 0,
        rotation: 0
    });

    socket.on("input", input => {
        const player = players.get(socket.id);

        if (input.throttle)
            player.speed += 0.02;

        if (input.brake)
            player.speed -= 0.03;

        player.speed *= 0.98;

        if (input.left)
            player.rotation += 0.03;

        if (input.right)
            player.rotation -= 0.03;

        player.x += Math.sin(player.rotation) * player.speed;
        player.z += Math.cos(player.rotation) * player.speed;
    });
});

setInterval(() => {
    io.emit("state", [...players.values()]);
}, 1000 / 60);

server.listen(3000, () => {
    console.log("http://localhost:3000");
});