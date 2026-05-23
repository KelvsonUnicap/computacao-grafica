const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cubies = [];
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);

const COLORS = {
    right: 0xff3300, // vermelho
    left: 0xff8800, // laranja
    up: 0xffffff, // branco
    down: 0xffdd00, // amarelo
    front: 0x0055ff, // azul
    back: 0x00cc44, // verde
    inner: 0x111111  // arestas internas
};

function makeCube(x, y, z) {
    const group = new THREE.Group();

    const geoFace = new THREE.BoxGeometry(0.93, 0.93, 0.93);
    const mats = [
        new THREE.MeshStandardMaterial({ color: x === 1 ? COLORS.right : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: x === -1 ? COLORS.left : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: y === 1 ? COLORS.up : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: y === -1 ? COLORS.down : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: z === 1 ? COLORS.front : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: z === -1 ? COLORS.back : COLORS.inner }),
    ];
    const mesh = new THREE.Mesh(geoFace, mats);

    group.add(mesh);
    group.position.set(x, y, z);
    scene.add(group);
    cubies.push(group);
    return group;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

camera.position.set(4, 4, 7);
camera.lookAt(0, 0, 0);

renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x0a0a0f);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);


for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
            makeCube(x, y, z);

// Luz
scene.add(ambient);
dir.position.set(5, 10, 5);
scene.add(dir);

// Resize
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

animate();