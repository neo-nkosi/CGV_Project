import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';


// Scene
const scene = new THREE.Scene();

// Camera

const fov = 60;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.y = 0.6; // adjust as necessary
camera.position.z = 1;
let firstPersonView = false;

function toggleFirstPersonView() {
    firstPersonView = !firstPersonView;

    // Disable OrbitControls in first-person mode and enable in third-person mode
    orbitControls.enabled = !firstPersonView;
    firstPersonControls.enabled = firstPersonView;

    if (firstPersonView) {
        // Adjust camera's position if needed (e.g., to set it at the soldier's eye level)
        camera.position.set(soldier.position.x, soldier.position.y + 1.6, soldier.position.z);
    }
}

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


const firstPersonControls = new FirstPersonControls(camera, renderer.domElement);
firstPersonControls.movementSpeed = 10;
firstPersonControls.lookSpeed = 0.3;
firstPersonControls.lookVertical = true;

// Resize event
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

//ORBIT CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

orbitControls.minPolarAngle = Math.PI /3
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents the camera from going below the ground or too high above the soldier
orbitControls.minAzimuthAngle = -Infinity;
orbitControls.maxAzimuthAngle = Infinity;

//CONTROLS
//event listener for keyboard presses
const keyState = {};
document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

function onDocumentKeyDown(event) {
    keyState[event.which] = true;
    if (event.which === 86) { // 'v' key
        toggleFirstPersonView();
    }
}


function onDocumentKeyUp(event) {
    keyState[event.which] = false;
}

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

// Load the maze model
const loader = new GLTFLoader();
loader.load('models/villaHouse.glb', function (gltf) {
    gltf.scene.position.set(0, 0, -8);
    gltf.scene.scale.set(1, 1, 1);
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

// Animation function
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if (mixer) mixer.update(0.016);

    updateMovement();

    if (firstPersonView) {
        firstPersonControls.update(clock.getDelta());
    } else {
        orbitControls.update();
    }

    renderer.render(scene, camera);
}

function updateMovement() {
    var moveDistance = 0.015;

    if (keyState[16]) {  // shift key is pressed
        moveDistance *= 2;  // speed is doubled
    }

    const forwardDirection = new THREE.Vector3();
    camera.getWorldDirection(forwardDirection);  // or you can use camera.getWorldDirection(forwardDirection);
    forwardDirection.y = 0;
    forwardDirection.normalize();

    let moveDirection = new THREE.Vector3();

    if (keyState[87] || keyState[38]) moveDirection.add(forwardDirection);
    if (keyState[83] || keyState[40]) moveDirection.sub(forwardDirection);
    if (keyState[65] || keyState[37]) moveDirection.add(new THREE.Vector3(forwardDirection.z, 0, -forwardDirection.x));
    if (keyState[68] || keyState[39]) moveDirection.sub(new THREE.Vector3(forwardDirection.z, 0, -forwardDirection.x));

    moveDirection.normalize().multiplyScalar(moveDistance);

    if (moveDirection.x !== 0 || moveDirection.z !== 0) {
        const rotationAngle = 2*Math.PI + Math.atan2(-moveDirection.x, -moveDirection.z);
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

    soldier.position.add(moveDirection);
    orbitControls.target.copy(soldier.position);

    if (firstPersonView) {
        camera.rotation.y = soldier.rotation.y;
        // Adjust position for first-person (for example, put camera in soldier's head)
        camera.position.set(soldier.position.x, soldier.position.y + 0.6, soldier.position.z);
    } else {
        // ... [existing third-person camera position adjustment]
        // Adjusting Y position
        if (camera.position.y > 1.5) {
            camera.position.y -= 0.01; // gradual adjustment
            console.log('Adjusted camera Y due to being above 1.5:', camera.position.y);
        } else if (camera.position.y < 0.6) {
            camera.position.y += 0.01; // gradual adjustment
            console.log('Adjusted camera Y due to being below 0.6:', camera.position.y);
        }

        // Maintain a specific distance from the soldier
        const desiredDistance = 2;
        let soldierToCamera = new THREE.Vector3().subVectors(camera.position, soldier.position);
        soldierToCamera.normalize().multiplyScalar(desiredDistance);
        let desiredPosition = new THREE.Vector3().addVectors(soldier.position, soldierToCamera);
        camera.position.copy(desiredPosition);
        // console.log('Adjusted camera position to maintain distance:', camera.position);
    }

}
// Start animation
animate();
