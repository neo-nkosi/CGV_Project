import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {initializeRays} from "./collisionCheck";

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


// Create walls
const wallTexture = textureLoader.load('textures/wall.png');
const wallGeometry = new THREE.BoxGeometry(1, 5, 1);
const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(3, 0, 0);
scene.add(wall);


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
    // Find the child named "floor" and set its material to use the floorTexture
    const floor = villaHouse.getObjectByName("floor");
    if (floor) {
        floor.material = new THREE.MeshBasicMaterial({color: 0xffffff});
    } else {
        console.warn('Floor not found in the villaHouse model.');
    }

}, undefined, function (error) {
    console.error(error);
});

// Animation function
var cameraPosition;

let isJumping = false; // This will tell us if the character has initiated a jump

// Call the initializeRays function at the beginning of your code and store the returned variables
const rayVars = initializeRays();

function checkMovement(soldier, villaHouse, rayVars) {
    let canMove = true;
    let isOnGround = false;

    // Update the raycaster position and direction based on the soldier's front
    soldier.getWorldPosition(rayVars.raycaster.ray.origin);
    soldier.getWorldDirection(rayVars.raycastDirection);
    rayVars.raycaster.ray.direction.copy(rayVars.raycastDirection);

    // Update the MiddleRaycaster position and direction based on the soldier's front
    soldier.getWorldPosition(rayVars.middleRaycaster.ray.origin);
    soldier.getWorldDirection(rayVars.middleRaycastDirection);
    rayVars.middleRaycaster.ray.direction.copy(rayVars.middleRaycastDirection);

    // Update the raycaster position and direction based on the soldier's front
    rayVars.raycaster.ray.origin.copy(soldier.position);
    // Calculate the direction vector based on the soldier's rotation
    const direction = new THREE.Vector3(0, 0, -1); // Default direction (in front of the soldier)
    direction.applyQuaternion(soldier.quaternion); // Apply soldier's rotation

    rayVars.raycaster.ray.direction.copy(direction);

    const intersects = rayVars.raycaster.intersectObject(villaHouse, true);

    // Update the middleRaycaster position and direction based on the soldier's front
    const midBodyPosition = soldier.position.clone().add(new THREE.Vector3(0, 0.2, 0)); // roughly middle of a human body
    rayVars.middleRaycaster.ray.origin.copy(midBodyPosition);
    rayVars.middleRaycaster.ray.direction.copy(direction);

    // Update the downward raycaster position and direction
    soldier.getWorldPosition(rayVars.downRaycaster.ray.origin);
    rayVars.downRaycaster.ray.direction.copy(rayVars.downRayDirection);

    const midIntersects = rayVars.middleRaycaster.intersectObject(villaHouse, true);

    if (keyState[87] || keyState[83] || keyState[65] || keyState[68] || keyState[38] || keyState[40] || keyState[37] || keyState[39]) {  // Check if any forward key is pressed
        if (intersects.length > 0) {
            const collisionPoint = intersects[0].point;
            const distance = soldier.position.distanceTo(collisionPoint);
            const collisionThreshold = 0.2;

            if (distance < collisionThreshold) {
                console.log("colliding");
                canMove = false;
            } else {
                canMove = true;
            }
        }else if (midIntersects.length > 0) {
            const collisionPoint = midIntersects[0].point;
            const distance = midBodyPosition.distanceTo(collisionPoint);
            const collisionThreshold = 0.2;

            if (distance < collisionThreshold) {
                console.log("colliding");
                canMove = false;
            } else {
                canMove = true;
            }
        } else {
            rayVars.sphere.visible = false;
            canMove = true;
        }
    }

    const downIntersects = rayVars.downRaycaster.intersectObject(villaHouse, true);
    if (!isJumping) {
        // Existing logic
        if (downIntersects.length > 0) {
            const collisionPointDown = downIntersects[0].point;
            const distance = soldier.position.distanceTo(collisionPointDown);
            const collisionThreshold = 0.2;

            if (distance < collisionThreshold) {
                console.log("colliding downward");
                soldier.position.y = downIntersects[0].point.y + 0.05;
                verticalVelocity = 0;
                isOnGround = true;
            } else {
                isOnGround = false;
            }
        } else {
            isOnGround = false;
            verticalVelocity -= 0.005;
        }
    }

    return { canMove, isOnGround };
}
function animate() {
    requestAnimationFrame(animate);

    if (mixer) mixer.update(0.016);

    updateMovement();

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


let verticalVelocity = 0;

function updateMovement() {

    // Move the collision checks to the checkMovement function
    const movementChecks = checkMovement(soldier, villaHouse, rayVars);
    let canMove = movementChecks.canMove;
    let isOnGround = movementChecks.isOnGround;

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

        // Calculate the potential new position
        const newPositionX = soldier.position.x + moveX;
        const newPositionZ = soldier.position.z + moveZ;
        const newPositionY = soldier.position.y + verticalVelocity;

        if (canMove) {
            soldier.position.x = newPositionX;
            soldier.position.y = newPositionY;
            soldier.position.z = newPositionZ;
        }
    } else {
        if (currentAnimation !== 'Idle'){
            currentAnimationAction.fadeOut(0.6);
            currentAnimation = 'Idle';
            currentAnimationAction = animations[currentAnimation];
            currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }

    // Jumping logic
    const jumpSpeed = 0.06; // Adjust the jump speed as needed
    const gravity = 0.005; // Adjust the gravity as needed

    if (keyState[32] && isOnGround) { // Spacebar is pressed and the character is on the ground
        verticalVelocity = jumpSpeed; // Set the vertical velocity to make the character jump
        isOnGround = false;
        isJumping = true; // Character has initiated a jump
    }

    if (!isOnGround) {
        verticalVelocity -= gravity; // Apply gravity if the character is not on the ground
    }

    soldier.position.y += verticalVelocity; // Update the character's vertical position

    // After the jump has initiated, allow a brief period before checking downward collisions
    // This ensures the character can rise off the ground before collision is checked
    if (isJumping) {
        setTimeout(() => {
            isJumping = false; // Reset after allowing some time
        }, 35); // Adjust this time based on your needs
    }

    orbitControls.target.copy(soldier.position);
}


// Start animation
animate();
