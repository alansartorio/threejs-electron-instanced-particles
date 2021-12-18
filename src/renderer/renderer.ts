import { BoxGeometry, BufferAttribute, BufferGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, TriangleFanDrawMode, WebGLRenderer } from 'three';
import './index.css'
import { toTrianglesDrawMode } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor('#7d2de3');
// renderer.setClearAlpha(0);
const scene = new Scene();



const camera = new OrthographicCamera(
    0,
    window.innerWidth, window.innerHeight,
    0,
    0.01,
    1000
);
camera.position.set(0, 0, 200);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
camera.position.z = 5;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);




let time = 0;
let timer = 0;
const defaultBlobLength = 400;

type BlobData = {
    x: number;
    y: number;
    scale: number;
    speed: number;
};

function createBlob(width: number, height: number): BlobData {
    const scale = 2 ** (Math.random() * 2 - 1);
    const length = defaultBlobLength * scale;
    return {
        x: -Math.sqrt((length / 2) ** 2 / 2) - 100,
        y: Math.random() * (width + height) - width,
        scale: scale,
        speed: Math.random() * 150 + 100,
    };
}

function isBlobInside(blob: BlobData, width: number, height: number) {
    return blob.x <= width + defaultBlobLength * 2;
}
let blobs: BlobData[] = [];

function pillGeometry() {
    const geometry = new BufferGeometry();
    const verticesGenerated: [number, number][] = [];

    verticesGenerated.push([-1, -1]);
    for (let a = 0; a < Math.PI; a += 0.1) {
        verticesGenerated.push([
            Math.cos(-a - Math.PI / 2) * 1 - 1,
            Math.sin(-a - Math.PI / 2) * 1,
        ]);
    }
    verticesGenerated.push([-1, 1]);
    verticesGenerated.push([1, 1]);
    for (let a = 0; a < Math.PI; a += 0.1) {
        verticesGenerated.push([
            Math.cos(-a + Math.PI / 2) * 1 + 1,
            Math.sin(-a + Math.PI / 2) * 1,
        ]);
    }
    verticesGenerated.push([1, -1]);
    verticesGenerated.push([-1, -1]);
    verticesGenerated.push([0, 0]);
    const vertices = new Float32Array(
        verticesGenerated
            .reverse()
            .flatMap((v) => [...v.map((c) => (c * defaultBlobLength) / 4), 0])
    );

    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    return geometry;
}

const geometry = pillGeometry();

const material = new MeshBasicMaterial({
    // wireframe: true,
    transparent: true,
    opacity: 0.1,
    color: "black",
});
const cube = new InstancedMesh(geometry, material, 10000);

function setPositions(positions: BlobData[]) {
    cube.count = positions.length;
    for (const [index, position] of positions.entries()) {
        cube.setMatrixAt(
            index,
            new Matrix4()
                .multiply(
                    new Matrix4().makeTranslation(position.x, position.y, 0)
                )
                .multiply(new Matrix4().makeRotationZ(Math.PI / 4))
                .multiply(
                    new Matrix4().makeScale(position.scale, position.scale, 0)
                )
        );
    }
    cube.instanceMatrix.needsUpdate = true;
}
cube.geometry = toTrianglesDrawMode(cube.geometry, TriangleFanDrawMode);
cube.position.set(0, 0, 0);

scene.add(cube);

const tick = (dt: number) => {
    const { innerWidth: width, innerHeight: height } = window;

    if (time >= timer) {
        time -= timer;
        blobs.push(createBlob(width, height));
        timer = Math.random() * 0.5 + 0.25;
    }

    for (const blob of blobs) {
        blob.x += dt * blob.speed;
        blob.y += dt * blob.speed;
    }

    blobs = blobs.filter((blob) => isBlobInside(blob, width, height));
    time += dt;

    setPositions(blobs);
};

let prevTime = Date.now();
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now();
    tick((time - prevTime) / 1000);
    prevTime = time;

    renderer.render(scene, camera);
}




function onMouseClick(event: MouseEvent) {
}
function onMouseMove(event: MouseEvent) {
}
function onWindowResize() {
    camera.left = 0;
    camera.right = window.innerWidth;
    camera.top = window.innerHeight;
    camera.bottom = 0;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('click', onMouseClick, false);
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', onWindowResize, false);

animate();
