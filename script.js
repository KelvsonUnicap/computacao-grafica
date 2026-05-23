const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cubies = [];
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const SPEED = 0.12;

const COLORS = {
    right: 0xff3300, // vermelho
    left: 0xff8800, // laranja
    up: 0xffffff, // branco
    down: 0xffdd00, // amarelo
    front: 0x0055ff, // azul
    back: 0x00cc44, // verde
    inner: 0x111111  // arestas internas
};

let isDragging = false, lastX = 0, lastY = 0;
let spherical = { theta: 0.6, phi: 0.8, radius: 10 };

let animating = false;
let faceGroup = null;
let targetAngle = 0;
let currentAngle = 0;
let rotAxis = new THREE.Vector3();
let afterRotation = null;

function animate() {
    requestAnimationFrame(animate);
    updateCamera();

    if (animating && faceGroup) {
        const diff = targetAngle - currentAngle;
        const step = diff * SPEED;
        currentAngle += step;
        faceGroup.rotation[rotAxis.x !== 0 ? 'x' : rotAxis.y !== 0 ? 'y' : 'z'] = currentAngle;

        if (Math.abs(diff) < 0.001) {
            faceGroup.rotation[rotAxis.x !== 0 ? 'x' : rotAxis.y !== 0 ? 'y' : 'z'] = targetAngle;
            afterRotation && afterRotation();
        }
    }

    renderer.render(scene, camera);
}

function updateCamera() {
    camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    );
    camera.lookAt(0, 0, 0);
}

function makeCube(x, y, z) {
    const g = new THREE.Group();
    const mats = [
        new THREE.MeshStandardMaterial({ color: x === 1 ? COLORS.right : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: x === -1 ? COLORS.left : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: y === 1 ? COLORS.up : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: y === -1 ? COLORS.down : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: z === 1 ? COLORS.front : COLORS.inner }),
        new THREE.MeshStandardMaterial({ color: z === -1 ? COLORS.back : COLORS.inner }),
    ];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.93, 0.93), mats);
    g.add(mesh);
    g.position.set(x, y, z);
    scene.add(g);
    cubies.push(g);
    return g;
}

function rotateFace(selector, axis, direction) {
    if (animating) return;
    const face = cubies.filter(selector);
    if (face.length === 0) return;

    // Cria grupo temporário
    faceGroup = new THREE.Group();
    scene.add(faceGroup);
    face.forEach(c => {
        scene.remove(c);
        faceGroup.add(c);
    });

    rotAxis.copy(axis);
    targetAngle = direction * Math.PI / 2;
    currentAngle = 0;
    animating = true;

    afterRotation = () => {
        faceGroup.updateMatrixWorld();
        face.forEach(c => {
            c.applyMatrix4(faceGroup.matrixWorld);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
            faceGroup.remove(c);
            scene.add(c);
        });
        scene.remove(faceGroup);
        faceGroup = null;
        animating = false;
    };
}

camera.position.set(5, 5, 7);
camera.lookAt(0, 0, 0);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x0a0a0f);
document.body.appendChild(renderer.domElement);

renderer.domElement.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    spherical.theta -= (e.clientX - lastX) * 0.01;
    spherical.phi -= (e.clientY - lastY) * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    lastX = e.clientX; lastY = e.clientY;
});
renderer.domElement.addEventListener('wheel', e => {
    spherical.radius = Math.max(5, Math.min(20, spherical.radius + e.deltaY * 0.02));
});

for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
            makeCube(x, y, z);

// Luz
scene.add(ambient);
dir.position.set(5, 10, 5);
scene.add(dir);

document.addEventListener('keydown', e => {
    if (animating) return;
    const inv = e.shiftKey ? -1 : 1;
    switch (e.key.toUpperCase()) {
        // Face SUPERIOR (y = 1)
        case 'W':
            rotateFace(c => Math.round(c.position.y) === 1, new THREE.Vector3(0, 1, 0), -inv);
            break;

        // Face INFERIOR (y = -1)
        case 'S':
            rotateFace(c => Math.round(c.position.y) === -1, new THREE.Vector3(0, 1, 0), -inv);
            break;

        // Face FRONTAL (z = 1)
        case 'E':
            rotateFace(c => Math.round(c.position.z) === 1, new THREE.Vector3(0, 0, 1), -inv);
            break;

        // Face TRASEIRA (z = -1)
        case 'Q':
            rotateFace(c => Math.round(c.position.z) === -1, new THREE.Vector3(0, 0, 1), -inv);
            break;

        // Face DIREITA (x = 1)
        case 'D':
            rotateFace(c => Math.round(c.position.x) === 1, new THREE.Vector3(1, 0, 0), -inv);
            break;

        // Face ESQUERDA (x = -1)
        case 'A':
            rotateFace(c => Math.round(c.position.x) === -1, new THREE.Vector3(1, 0, 0), -inv);
            break;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
animate();