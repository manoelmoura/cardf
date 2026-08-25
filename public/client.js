import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/MTLLoader.js";

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
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5,10,7);
scene.add(dirLight);

document.body.appendChild(renderer.domElement);

// chão
const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20000),
    new THREE.MeshBasicMaterial({color: 0x444444})
);

const floor2 = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20000),
    new THREE.MeshBasicMaterial({color: 0x444FF4})
);

const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    new THREE.MeshBasicMaterial({color: 0xFF0000})
);
for (let i = 0; i < 1000; i++) {
    const coneClone = cone.clone();
    coneClone.position.set(Math.random() * 20 - 10, 1, Math.random() * 20000);
    scene.add(coneClone);
}


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
            obj.rotation.y = player.rotation + Math.PI; // inverter 180°
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
            player.position.z + -6
        );

        camera.lookAt(player.position);
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
let carTemplate = null;

// se tiver .mtl (ex: Porsche_911_GT2.mtl)
mtlLoader.load(
  '/models/Porsche_911_GT2.mtl',
  mtl => {
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load('/models/Porsche_911_GT2.obj', obj => {
      carTemplate = obj;
      carTemplate.scale.set(1,1,1);
      console.log('OBJ carregado com MTL:', carTemplate);
      replacePlaceholdersWithTemplate();
    }, undefined, err => console.error('Erro OBJ:', err));
  },
  undefined,
  () => {
    // se .mtl não existir, tenta só o OBJ
    objLoader.load('/models/Porsche_911_GT2.obj', obj => {
      carTemplate = obj;
      carTemplate.scale.set(1,1,1);
      console.log('OBJ carregado (sem MTL):', carTemplate);
      replacePlaceholdersWithTemplate();
    }, undefined, err => console.error('Erro OBJ sem MTL:', err));
  }
);

function replacePlaceholdersWithTemplate() {
  if (!carTemplate) return;
  // forçar material de teste (ajuste depois conforme .mtl/texturas)
  const testClone = carTemplate.clone(true);
  testClone.traverse(n => {
    if (n.isMesh && (!n.material || Array.isArray(n.material) && n.material.length === 0)) {
      n.material = new THREE.MeshStandardMaterial({ color: 0x999999 });
    }
  });
  // substituir placeholders existentes
  for (const [id, obj] of players.entries()) {
    if (obj && obj.isMesh && obj.geometry && obj.geometry.type === 'BoxGeometry') {
      const clone = carTemplate.clone(true);
      clone.position.copy(obj.position);
      clone.rotation.copy(obj.rotation);
      scene.add(clone);
      scene.remove(obj);
      players.set(id, clone);
      console.log('placeholder substituído para', id);
    }
  }
}