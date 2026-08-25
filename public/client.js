import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.129.0/build/three.module.js";

const socket = io();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    90,
    innerWidth / innerHeight,
    0.1,
    1000
);

camera.position.set(0, 0, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// chão
const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20),
    new THREE.MeshBasicMaterial({color: 0x444444})
);

floor.position.y = -0.5;
scene.add(floor);

// jogadores
const players = new Map();

socket.on("state", state => {
    for (const player of state) {
        if (!players.has(player.id)) {
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 4),
                new THREE.MeshBasicMaterial({color: 0x00ff00})
            );
            scene.add(cube);
            players.set(player.id, cube);
        }

        const obj = players.get(player.id);
        if (obj) {
            obj.position.set(player.x, player.y, player.z);
            obj.rotation.y = player.rotation;
        }
    }
});

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

setInterval(() => {
    socket.emit("input", {
        throttle: keys["w"],
        brake: keys["s"],
        left: keys["a"],
        right: keys["d"]
    });
}, 1000 / 60);

function animate() {
    const player = players.get(socket.id);

    if (player) {
        camera.position.set(
            player.position.x,
            player.position.y + 5,
            player.position.z + -8
        );

        camera.lookAt(player.position);
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();