import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {checkMovement, initializeRays} from "./collisionCheck";

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

let villaBoundingBox;
let villaSize;
let pursuing = false; // Flag to check if monster is in pursuit mode
let path = []; // To store the path
let grid; // We've already initialized this in the villa loader
const cellSize = 0.3;  // Declare this variable here, at the top level
let gridHeight; // Declare this variable here
let gridWidth;  // Declare this too if it's not already


loader.load('models/villaHouse.glb', function (gltf) {
    villaHouse = gltf.scene;

    // Determine bounding box right after the model is loaded
    villaBoundingBox = new THREE.Box3().setFromObject(villaHouse);
    villaSize = villaBoundingBox.getSize(new THREE.Vector3());


    // Initialize grid here

    const gridSizeX = Math.ceil(villaSize.x / cellSize);
    const gridSizeZ = Math.ceil(villaSize.z / cellSize);
    gridWidth = Math.ceil(villaSize.x / cellSize);
    gridHeight = Math.ceil(villaSize.z / cellSize);

    grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));  // Updated to false

    console.log("Grid initialized:");
    console.table(grid);  // Check the initialized grid in the console


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

    // Now, villaHouse is loaded and you can safely access its position
    const villaPosition = villaHouse.position;
    const startX = Math.floor((villaPosition.x - villaBoundingBox.min.x) / cellSize);
    const startZ = Math.floor((villaPosition.z - villaBoundingBox.min.z) / cellSize);

    let start = {
        x: startX,
        y: startZ,
        distance: 0
    };

    if (dummyMonster) {
        console.log("Starting dummy monster exploration...");
        dummyMonster.position.copy(monster.position); // Start from real monster's position
        exploreWithDummyMonster(dummyMonster);
    }

}, undefined, function (error) {
    console.error(error);
});

//breadth first search algorithm:
function BFS(grid, start, target) {
    const queue = [];
    const visited = new Set();
    const predecessors = {};

    queue.push(start);
    visited.add(JSON.stringify(start));

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === target.x && current.y === target.y) {
            return reconstructPath(predecessors, start, target);
        }

        const neighbors = [
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y }
        ];

        for (const neighbor of neighbors) {
            const key = JSON.stringify(neighbor);
            if (neighbor.x >= 0 && neighbor.x < grid[0].length &&
                neighbor.y >= 0 && neighbor.y < grid.length &&
                grid[neighbor.y][neighbor.x] && // This checks if the cell is walkable
                !visited.has(key)) {
                queue.push(neighbor);
                visited.add(key);
                predecessors[key] = current;
            }
        }
    }

    return []; // Return empty path if no path found
}

function reconstructPath(predecessors, start, target) {
    let current = target;
    const path = [current];

    while (current.x !== start.x || current.y !== start.y) {
        current = predecessors[JSON.stringify(current)];
        path.unshift(current);
    }

    return path;
}

function toGridCoordinates(worldX, worldZ) {
    const relativeX = worldX - villaBoundingBox.min.x;
    const relativeZ = worldZ - villaBoundingBox.min.z;

    const gridX = Math.floor(relativeX / cellSize);
    const gridY = Math.floor(relativeZ / cellSize);

    return new THREE.Vector2(gridX, gridY);
}

function toWorldCoordinates(gridX, gridY) {
    const worldX = gridX * cellSize + villaBoundingBox.min.x;
    const worldZ = gridY * cellSize + villaBoundingBox.min.z;

    return new THREE.Vector3(worldX, 0, worldZ);  // Assuming y = 0 for simplicity
}


// Animation function
var cameraPosition;

let isJumping = false; // This will tell us if the character has initiated a jump


//Monster Code

let monster;
let monsterMixer;
const monsterAnimations = {};
const monsterloader = new GLTFLoader();
let animationState = 'Idle'; // default animation

//function to play animation
function playAnimation(name) {
    // Stop all other actions
    for (let actionName in monsterAnimations) {
        if (monsterMixer) {
            monsterMixer.stopAllAction();
        }
        monsterMixer.clipAction(monsterAnimations[actionName]).stop();
    }

    // Play the desired action
    if (monsterAnimations[name]) {
        monsterMixer.clipAction(monsterAnimations[name]).play();
    }

    // Update animation state
    animationState = name;
}

// Correctly position monster on the floor:
function positionOnFloor(entity) {
    const box = new THREE.Box3().setFromObject(entity);
    entity.position.y -= box.min.y;
}

let dummyMonster; // For grid generation
monsterloader.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
    monster = gltf.scene;
    monster.scale.set(0.3, 0.3, 0.3);
    monster.position.set(0.3, 0, 0); // Set initial position here

    monsterMixer = new THREE.AnimationMixer(monster);
    scene.add(monster);

    dummyMonster = monster.clone(); // Create a dummy monster based on the real one
    dummyMonster.scale.set(0.3, 0.3, 0.3); // Ensure it has the same scale as the actual monster
    dummyMonster.position.copy(monster.position); // This sets x, y, and z of dummy to the original monster


    monsterAnimations.Idle = gltf.animations[0];
    playAnimation('Idle');

    // Adjust the monster's y position based on bounding box here
    const box = new THREE.Box3().setFromObject(monster);
    monster.position.y = -0.4 - box.min.y;
});

monsterloader.load('monster models/Monster warrior/MW Running gltf/MW Running.gltf', (gltf) => {
    // Store the running animation
    monsterAnimations.Running = gltf.animations[6];
});

monsterloader.load('monster models/Monster warrior/MW Walking gltf/MW Walking.gltf', (gltf) => {
    // Store the walking animation
    monsterAnimations.Walking = gltf.animations[1];
});

let visited = new Set();

const visitedCells = new Set();

function exploreWithDummyMonster(dummy, stepSize = 1) {
    const directions = [
        new THREE.Vector3(0, 0, -stepSize),
        new THREE.Vector3(0, 0, stepSize),
        new THREE.Vector3(-stepSize, 0, 0),
        new THREE.Vector3(stepSize, 0, 0),
    ];

    const stack = [dummy.position.clone()];  // Initialize the stack with the starting position

    while (stack.length > 0) {
        const currentPos = stack.pop();

        directions.forEach(dir => {
            const newPos = currentPos.clone().add(dir);
            const gridPos = toGridCoordinates(newPos.x, newPos.z);

            const cellKey = `${gridPos.x},${gridPos.y}`;

            if (gridPos.y >= 0 && gridPos.y < gridHeight &&
                gridPos.x >= 0 && gridPos.x < gridWidth &&
                !visitedCells.has(cellKey)) {

                visitedCells.add(cellKey);

                if (!grid[gridPos.y][gridPos.x] && isTileWalkable(newPos, villaHouse, -0.4)) {
                    grid[gridPos.y][gridPos.x] = true;
                    console.log(`Marking cell ${cellKey} as walkable`);
                    stack.push(newPos);  // Add the new position to the stack to continue exploration
                }
            }
        });
    }
}


function visualizeGrid(grid) {
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.5});
    const geometry = new THREE.BoxGeometry(0.3, 0.01, 0.3);  // Adjust dimensions according to your grid cell size

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j]) {
                const worldPos = toWorldCoordinates(j, i);  // Assuming toWorldCoordinates function is still in the code
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(worldPos);
                scene.add(cube);
            }
        }
    }
}



//play different animations
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyI':
            playAnimation('Idle');
            break;
        case 'KeyR':
            if (!pursuing) {
                pursuing = true;
                // Calculate BFS path from monster to soldier
                const monsterGridPos = toGridCoordinates(monster.position.x, monster.position.z);
                console.log("Monster's world position:", monster.position, "Grid position:", monsterGridPos);
                const soldierGridPos = toGridCoordinates(soldier.position.x, soldier.position.z);
                console.log("Soldier's world position:", soldier.position, "Grid position:", soldierGridPos);

                path = BFS(grid, monsterGridPos, soldierGridPos);
                console.log("Generated path:", path);
                playAnimation('Running');
            } else {
                pursuing = false;
                path = [];
                playAnimation('Idle');
            }
            break;
            // generateRandomDestination(monster);
        case 'KeyO':
            playAnimation('Walking');
            break;
    }
});

//monster pursuit code:



function animate() {
    requestAnimationFrame(animate);

    if (mixer) mixer.update(0.016);
    if (monsterMixer) monsterMixer.update(0.015);

    updateMovement();
    // Call the function after the exploration is done
    visualizeGrid(grid);

    //monster movement
    if (pursuing && path.length > 0) {
        const nextStep = path[0];
        const nextWorldPos = toWorldCoordinates(nextStep.x, nextStep.y);
        nextWorldPos.y = monster.position.y; // Keep the y-coordinate the same

        const moveSpeed = 0.02;
        const direction = nextWorldPos.clone().sub(monster.position).normalize();
        const moveVector = direction.multiplyScalar(moveSpeed);


        console.log("Next world position:", nextWorldPos);
        console.log("Direction vector:", direction);
        console.log("Monster's new position:", monster.position);

        monster.position.add(moveVector);

        dummyMonster.position.copy(monster.position);

        // Smoothly rotate the monster towards the direction
        const lookAtPos = monster.position.clone().add(direction);
        monster.lookAt(lookAtPos);

        if (monster.position.distanceTo(nextWorldPos) < 0.1) {
            path.shift(); // Move to the next grid point if close enough to the current one
        }

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


let verticalVelocity = 0;

function updateMovement() {

    // Move the collision checks to the checkMovement function
    const movementChecks = checkMovement(soldier, villaHouse, keyState, isJumping, verticalVelocity);
    let canMove = movementChecks.canMove;
    let isOnGround = movementChecks.isOnGround;
    verticalVelocity = movementChecks.verticalVelocity;

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
        }, 50); // Adjust this time based on your needs
    }

    orbitControls.target.copy(soldier.position);
}


// Start animation
animate();

// console.table("grid", grid);