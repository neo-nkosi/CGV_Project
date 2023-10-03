import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 0.2; // adjust as necessary
camera.position.z = 1;
camera.lookAt(0, 0, 5);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize event
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

//CONTROLS
//event listener for keyboard presses
const keyState = {};

document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

function onDocumentKeyDown(event) {
    keyState[event.which] = true;
}

function onDocumentKeyUp(event) {
    keyState[event.which] = false;
}

//MOUSE CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.minDistance = 1;
orbitControls.maxDistance = 15;
orbitControls.enableRotate = true;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents the camera from going below the ground or too high above the soldier
//orbitControls.target.copy(soldier.position); // Make sure the controls always orbit around the soldier


//MOUSE CONTROLS
// const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.target.copy(soldier.position); // Make sure the controls always orbit around the soldier
// orbitControls.enableDamping = true;
// orbitControls.dampingFactor = 0.05;
// orbitControls.minDistance = 5;
// orbitControls.maxDistance = 15;
// orbitControls.enablePan = false;
// orbitControls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents the camera from going below the ground or too high above the soldier


// Soldier geometry
let soldier;
let mixer;
let animations = {};
let currentAnimation = 'Idle';
let currentAnimationAction;

const soldierLoader = new GLTFLoader();

soldierLoader.load('models/Soldier.glb', function (gltf) {
    soldier = gltf.scene;
    soldier.scale.set(0.25, 0.25, 0.25);
    scene.add(soldier);

    // Create a mixer for the soldier
    mixer = new THREE.AnimationMixer(soldier);

    // Store the animations in the animations object for quick lookup
    animations = {}; // Reset the animations object
    gltf.animations.forEach((clip) => {
        animations[clip.name] = mixer.clipAction(clip);
    });

    currentAnimationAction = animations[currentAnimation];
    currentAnimationAction.play();
    if (animations['Idle']) animations['Idle'].play();

    // Set the target of OrbitControls after the soldier is loaded
    orbitControls.target.copy(soldier.position);

}, undefined, function (error) {
    console.error(error);
});

// Land texture
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('textures/floor.jpg');

// Land Geometry
const landGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
const landMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
const land = new THREE.Mesh(landGeometry, landMaterial);
land.rotation.x = -Math.PI / 2; // Rotate the plane to horizontal
scene.add(land);

// Create walls
const wallTexture = textureLoader.load('textures/wall.png');
const wallGeometry = new THREE.BoxGeometry(1, 5, 1);
const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(3, 0, 0);
scene.add(wall);

// Create floor
const floorGeometry = new THREE.BoxGeometry(10, 1, 10);
const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -1;
scene.add(floor);

// Light
const light = new THREE.AmbientLight(0xffffff);
light.translateY(5);
scene.add(light);

let villaHouse;

// Load the maze model
const loader = new GLTFLoader();
loader.load('models/villaHouse.glb', function (gltf) {
    villaHouse = gltf.scene;
    gltf.scene.position.set(0, 0, -8);
    gltf.scene.scale.set(1, 1, 1);
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

// Animation function
var cameraPosition;

// Add these variables at the beginning of your code
const raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
const raycastDirection = new THREE.Vector3(); // The direction of the ray

const rayLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for the ray line
const rayLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -10)]); // Set the initial points of the ray line
const rayLine = new THREE.Line(rayLineGeometry, rayLineMaterial);
scene.add(rayLine);

// Define material and geometry for the sphere
const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);


function animate() {
    requestAnimationFrame(animate);

    if (mixer) mixer.update(0.016);

    updateMovement();

    // Update the raycaster position and direction based on the soldier's front
    soldier.getWorldPosition(raycaster.ray.origin);
    soldier.getWorldDirection(raycastDirection);
    raycaster.ray.direction.copy(raycastDirection);

    // Update the ray line's position
    rayLine.geometry.setFromPoints([raycaster.ray.origin, raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, -10)]);

    // Update the raycaster position and direction based on the soldier's front
    raycaster.ray.origin.copy(soldier.position);
    // Calculate the direction vector based on the soldier's rotation
    const direction = new THREE.Vector3(0, 0, -1); // Default direction (in front of the soldier)
    direction.applyQuaternion(soldier.quaternion); // Apply soldier's rotation

    raycaster.ray.direction.copy(direction);

    const intersects = raycaster.intersectObject(villaHouse, true);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        sphere.position.copy(intersectionPoint); // Position the sphere at the intersection point
        sphere.visible = true; // Make the sphere visible
    } else {
        sphere.visible = false; // Hide the sphere when not intersecting
    }

    camera.position.x = soldier.position.x;
    camera.position.z = soldier.position.z + 2;
    camera.lookAt(soldier.position);
    cameraPosition = getCameraPositionBehindSoldier(soldier, 5);
    //camera.position.copy(cameraPosition);
    camera.lookAt(soldier.position);

    orbitControls.update();

    renderer.render(scene, camera);

}

function getCameraPositionBehindSoldier(soldier, distanceBehind) {
    const forwardDirection = new THREE.Vector3();
    soldier.getWorldDirection(forwardDirection);

    // The computed offset
    const offset = forwardDirection.multiplyScalar(-distanceBehind);

    return new THREE.Vector3().addVectors(soldier.position, offset);
}



function updateMovement() {
    var moveDistance = 0.015;

    if (keyState[16]) {  // shift key is pressed
        moveDistance *= 2;  // speed is doubled
    }

    let moveX = 0;
    let moveZ = 0;

    if (keyState[87] || keyState[38]) moveZ = -moveDistance;
    if (keyState[83] || keyState[40]) moveZ = moveDistance;
    if (keyState[65] || keyState[37]) moveX = -moveDistance;
    if (keyState[68] || keyState[39]) moveX = moveDistance;

    if (moveX !== 0 && moveZ !== 0) {
        moveX /= Math.sqrt(2);
        moveZ /= Math.sqrt(2);
    }

    if (moveX !== 0 || moveZ !== 0) {
        const rotationAngle = Math.PI + Math.atan2(moveX, moveZ);
        soldier.rotation.y = rotationAngle;

        if (keyState[16]) {
            if (currentAnimation !== 'Run') {
                currentAnimationAction.fadeOut(0.6);
                currentAnimation = 'Run';
                currentAnimationAction = animations[currentAnimation];
                currentAnimationAction.reset().fadeIn(0.5).play();
            }
        } else {
            if (currentAnimation !== 'Walk') {
                currentAnimationAction.fadeOut(0.6);
                currentAnimation = 'Walk';
                currentAnimationAction = animations[currentAnimation];
                currentAnimationAction.reset().fadeIn(0.5).play();
            }
        }
    } else {

        if (currentAnimation !== 'Idle'){
            currentAnimationAction.fadeOut(0.6);
            currentAnimation = 'Idle';
            currentAnimationAction = animations[currentAnimation];
            currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }
    soldier.position.x += moveX;
    soldier.position.z += moveZ;
    orbitControls.target.copy(soldier.position);
}

// Start animation
animate();
