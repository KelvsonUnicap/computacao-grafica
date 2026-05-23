const scene     = new THREE.Scene();
const camera    = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
const renderer  = new THREE.WebGLRenderer({ antialias: true });
const cubies    = [];
const ambient   = new THREE.AmbientLight(0xffffff, 0.65);
const dirLight  = new THREE.DirectionalLight(0xffffff, 0.9);
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
const ANIM_SPEED = 0.14;
const INNER      = 0x111111;

const COLORS = {
    right: 0xff3300, // vermelho
    left:  0xff8800, // laranja
    up:    0xffffff, // branco
    down:  0xffdd00, // amarelo
    front: 0x0055ff, // azul
    back:  0x00cc44  // verde
};

const MOVES = {
    W: { sel: c => Math.round(c.position.y) ===  1, axis: 'y', dir:  1 },  // W = cima
    S: { sel: c => Math.round(c.position.y) === -1, axis: 'y', dir: -1 },  // S = baixo
    F: { sel: c => Math.round(c.position.z) ===  1, axis: 'z', dir:  1 },  // F = frente
    T: { sel: c => Math.round(c.position.z) === -1, axis: 'z', dir: -1 },  // T = trás
    D: { sel: c => Math.round(c.position.x) ===  1, axis: 'x', dir: -1 },  // D = direita
    E: { sel: c => Math.round(c.position.x) === -1, axis: 'x', dir:  1 },  // E = esquerda
};

const SHUFFLE_KEYS = ['W', 'S', 'F', 'T', 'D', 'E'];

let isDragging   = false;
let lastX        = 0;
let lastY        = 0;
let sph          = { theta: 0.6, phi: 0.8, r: 11 };
let animating    = false;
let faceGroup    = null;
let rotKey       = 'y';
let targetAng    = 0;
let currentAng   = 0;
let afterCB      = null;
let moveCount    = 0;
let isShuffling  = false;
let shuffleQueue = [];

function updateCamera() {
    camera.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
    );
    camera.lookAt(0, 0, 0);
}

function buildCube() {
    cubies.forEach(c => scene.remove(c));
    cubies.length = 0;
    
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const g = new THREE.Group();
                const mats = [
                    new THREE.MeshStandardMaterial({ color: x ===  1 ? COLORS.right : INNER }),
                    new THREE.MeshStandardMaterial({ color: x === -1 ? COLORS.left  : INNER }),
                    new THREE.MeshStandardMaterial({ color: y ===  1 ? COLORS.up    : INNER }),
                    new THREE.MeshStandardMaterial({ color: y === -1 ? COLORS.down  : INNER }),
                    new THREE.MeshStandardMaterial({ color: z ===  1 ? COLORS.front : INNER }),
                    new THREE.MeshStandardMaterial({ color: z === -1 ? COLORS.back  : INNER }),
                ];
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.93, 0.93), mats);
                g.add(mesh);
                g.position.set(x, y, z);
                scene.add(g);
                cubies.push(g);
            }
        }
    }
}

function rotateFace(selectorFn, axis, dir, onDone) {
    if (animating) return false;
    const face = cubies.filter(selectorFn);
    if (!face.length) return false;

    faceGroup = new THREE.Group();
    scene.add(faceGroup);
    face.forEach(c => { scene.remove(c); faceGroup.add(c); });

    rotKey     = axis;
    targetAng  = dir * Math.PI / 2;
    currentAng = 0;
    animating  = true;

    afterCB = () => {
        faceGroup.updateMatrixWorld();
        face.forEach(c => {
            c.applyMatrix4(faceGroup.matrixWorld);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
            c.quaternion.normalize();
            faceGroup.remove(c);
            scene.add(c);
        });
        scene.remove(faceGroup);
        faceGroup = null;
        animating = false;
        onDone && onDone();
    };
    return true;
}

function doMove(key, inv, onDone) {
    const m = MOVES[key];
    if (!m) return false;
    return rotateFace(m.sel, m.axis, inv ? -m.dir : m.dir, onDone);
}

function incrMoves() {
    moveCount++;
    document.getElementById('move-count').textContent = moveCount;
}

function runShuffleQueue() {
    if (!shuffleQueue.length) {
        isShuffling = false;
        document.getElementById('status').textContent = '';
        return;
    }
    const { key, inv } = shuffleQueue.shift();
    doMove(key, inv, () => setTimeout(runShuffleQueue, 30));
}

function animate() {
    requestAnimationFrame(animate);
    updateCamera();
    if (animating && faceGroup) {
        const diff = targetAng - currentAng;
        currentAng += diff * ANIM_SPEED;
        faceGroup.rotation[rotKey] = currentAng;
        if (Math.abs(diff) < 0.0008) {
            faceGroup.rotation[rotKey] = targetAng;
            afterCB && afterCB();
        }
    }
    renderer.render(scene, camera);
}

// ─── SETUP ────────────────────────────────────────────────
camera.position.set(5, 5, 7);
camera.lookAt(0, 0, 0);

renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x0a0a0f);
document.body.appendChild(renderer.domElement);

dirLight.position.set(6, 12, 8);
fillLight.position.set(-5, -5, -5);
scene.add(ambient);
scene.add(dirLight);
scene.add(fillLight);

buildCube();

renderer.domElement.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup',   () => isDragging = false);
window.addEventListener('mousemove', e => {
    if (!isDragging || animating) return;
    sph.theta -= (e.clientX - lastX) * 0.008;
    sph.phi   -= (e.clientY - lastY) * 0.008;
    sph.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi));
    lastX = e.clientX; lastY = e.clientY;
});
renderer.domElement.addEventListener('wheel', e => {
    sph.r = Math.max(5, Math.min(20, sph.r + e.deltaY * 0.02));
});

document.addEventListener('keydown', e => {
    if (animating || isShuffling) return;
    const k = e.key.toUpperCase();
    if (MOVES[k]) {
        if (doMove(k, e.shiftKey)) incrMoves();
    }
});

document.getElementById('btn-shuffle').addEventListener('click', () => {
    if (animating || isShuffling) return;
    shuffleQueue = [];
    for (let i = 0; i < 22; i++) {
        shuffleQueue.push({
            key: SHUFFLE_KEYS[Math.floor(Math.random() * 6)],
            inv: Math.random() > 0.5
        });
    }
    isShuffling = true;
    moveCount   = 0;
    document.getElementById('move-count').textContent = 0;
    document.getElementById('status').textContent = '⏳ Embaralhando...';
    runShuffleQueue();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (animating || isShuffling) return;
    buildCube();
    moveCount = 0;
    document.getElementById('move-count').textContent = 0;
    document.getElementById('status').textContent = '';
});

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

animate();