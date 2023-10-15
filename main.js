import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {createHUD, updateHUDCoin, updateHUDHP, updateHUDSpeed} from './hud';
import {checkMovement} from "./collisionCheck";
import {Vector3} from "three";
import {createBoost, createCoin, createHealth} from './iconsCreation.js';
import {Pathfinding, PathfindingHelper} from 'three-pathfinding';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 0.2; // adjust as necessary
camera.position.z = 1;
camera.lookAt(0, 0, 5);
scene.add(camera);




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

let soldierLoader = new GLTFLoader();
let soldierBoxHelper;
let dummyMesh;
let yOffset;
soldierLoader.load('models/Soldier.glb', function (gltf) {
    soldier = gltf.scene;
    soldier.position.set(0,0,8);
    soldier.scale.set(0.25, 0.25, 0.25);

    scene.add(soldier);

    // 1. Create a dummy mesh with a BoxGeometry of your desired size.
    let boxSize = new THREE.Vector3(0.2,0.5, 0.2); // Size of the box (width, height, depth)
    dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z));

// 2. Position this mesh at the position of the soldier.
    dummyMesh.position.copy(new Vector3(soldier.position.x, soldier.position.y, soldier.position.z));
    yOffset = 0.2;  // or any value you deem appropriate
    dummyMesh.position.y += yOffset;


// 3. Create a BoxHelper using this dummy mesh.
    soldierBoxHelper = new THREE.BoxHelper(dummyMesh, 0x00ff00);

// 4. Add the BoxHelper to the scene.
    scene.add(soldierBoxHelper);



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
//scene.add(wall);


// Light
const light = new THREE.AmbientLight(0xffffff);
light.translateY(5);
scene.add(light);

let villaHouse;
let meshfloor;

// Load the maze model
const loader = new GLTFLoader();

let villaBoundingBox;
let villaSize;

let pursuing = false; // Flag to check if monster is in pursuit mode

let grid; // We've already initialized this in the villa loader
const cellSize = 0.3  // Declare this variable here, at the top level
const navMeshName = "SampleScene_Exported_NavMesh";  // Replace with your navmesh name

loader.load('models/villaHouse.glb', function (gltf) {
    villaHouse = gltf.scene;

    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    // Set the villaHouse to be invisible
    //villaHouse.visible = false;

    scene.add(gltf.scene);
    //

    console.log(soldier.position);

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


let coins = []; // Array to store multiple coins
let boosts = [];
let healths = [];

// Create multiple coins
createCoin(1, 0, 7, scene, coins);
createCoin(-1, 0, 7, scene, coins);
createCoin(0, 0, 7, scene, coins);

//Create multiple boosts
createBoost(-2,0,0,scene,boosts);
createBoost(-3,0,0,scene,boosts);
createBoost(-4,0,-1,scene,boosts);

//Create multiple hearts
createHealth(2,0,0,scene,healths);
createHealth(3,0,0,scene,healths);
createHealth(4,0,0,scene,healths);

let portalMixer;
let portalDummyMesh;

function loadPortal() {
    const portalLoader = new GLTFLoader();
    if (!portal) { // check if portal hasn't been loaded
        portalLoader.load('models/portal.glb', function (gltf) {
            portal = gltf.scene;
            gltf.scene.position.set(-7,-0.3,8);
            gltf.scene.scale.set(0.3, 0.3, 0.3);
            scene.add(gltf.scene);

            // After adding the portal to the scene:
            portalDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1));  // Adjust the size as necessary
            portalDummyMesh.position.copy(portal.position);
            portalDummyMesh.position.z -= 1.3;
            //scene.add(portalDummyMesh);

            const portalBoxHelper = new THREE.BoxHelper(portalDummyMesh, 0xff0000);  // Making it red for visibility
            //scene.add(portalBoxHelper);


            if (gltf.animations && gltf.animations.length) {
                portalMixer = new THREE.AnimationMixer(portal);
                const action = portalMixer.clipAction(gltf.animations[0]);
                action.play();
            }
        }, undefined, function (error) {
            console.error(error);
        });
    }
}

function isColliding(box1, box2) {
    return box1.intersectsBox(box2);
}

// Animation function
var cameraPosition;

let isJumping = false; // This will tell us if the character has initiated a jump


//Monster Code

function getCameraPositionBehindSoldier(soldier, distanceBehind) {
    const forwardDirection = new THREE.Vector3();
    soldier.getWorldDirection(forwardDirection);

    // The computed offset
    const offset = forwardDirection.multiplyScalar(-distanceBehind);

    return new THREE.Vector3().addVectors(soldier.position, offset);
}

let boostFactor = 1;
let soldierHealth = 1;
let numCoins = 0;
let verticalVelocity = 0;
let collectedAllCoinsMessage = false;
let portal;
let coinCounter = 0;
let jumpStartY = null;  // This will keep track of the Y position when the jump starts

createHUD(camera,numCoins,boostFactor,soldierHealth);

function updateMovement() {
    // Move the collision checks to the checkMovement function
    const movementChecks = checkMovement(soldier, villaHouse, keyState, isJumping, verticalVelocity);
    let canMove = movementChecks.canMove;
    let isOnGround = movementChecks.isOnGround;
    verticalVelocity = movementChecks.verticalVelocity;

    var moveDistance = 0.030;

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
        if (currentAnimation !== 'Idle') {
            currentAnimationAction.fadeOut(0.6);
            currentAnimation = 'Idle';
            currentAnimationAction = animations[currentAnimation];
            currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }


// Jumping logic
    const jumpSpeed = 0.06; // Adjust the jump speed as needed
    const gravity = 0.005; // Adjust the gravity as needed
    const collisionThreshold = 0.2;

    if (keyState[32] && isOnGround) { // Spacebar is pressed and the character is on the ground
        verticalVelocity = jumpSpeed; // Set the vertical velocity to make the character jump
        isOnGround = false;
        isJumping = true; // Character has initiated a jump
        jumpStartY = soldier.position.y;
    }

    if (isJumping && soldier.position.y >= jumpStartY + collisionThreshold) {
        isJumping = false;
    }

    if (!isOnGround) {
        verticalVelocity -= gravity; // Apply gravity if the character is not on the ground
    }

    soldier.position.y += verticalVelocity; // Update the character's vertical position


    orbitControls.target.copy(soldier.position);

// Update dummyMesh's position
    dummyMesh.position.copy(soldier.position);
    dummyMesh.position.y += yOffset;  // make sure to add yOffset again
// At the end of your movement updates, add:
    if (soldierBoxHelper) {
        soldierBoxHelper.update();
    }

    checkCollisionsWithCollectibles();

    let allCoinsCollected = coins.every(coin => coin.collected);

    if (allCoinsCollected && !collectedAllCoinsMessage) {
        console.log("You have collected all the coins");
        collectedAllCoinsMessage = true;  // This ensures the message is only printed once.
    }

// At the end of your movement updates:
    if (dummyMesh && portalDummyMesh) {
        let soldierBox = new THREE.Box3().setFromObject(dummyMesh);
        let portalBox = new THREE.Box3().setFromObject(portalDummyMesh);
        if (soldierBox.intersectsBox(portalBox)) {
            console.log("Soldier collided with portal!");
        }
    }
}




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

// Load and store animations by their names
monsterloader.load('monster models/Monster warrior/MW Running gltf/MW Running.gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

monsterloader.load('monster models/Monster warrior/MW Walking gltf/MW Walking.gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

monsterloader.load('monster models/Monster warrior/MW Smashing gltf/MW Smashing .gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

let MondummyMesh;
let MonBoxHelper;

monsterloader.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
    monster = gltf.scene;
    monster.position.set(0.3, 0, 8); // Set initial position here
    monster.scale.set(0.35, 0.35, 0.35);

    monsterMixer = new THREE.AnimationMixer(monster);
    scene.add(monster);

    // 1. Create a dummy mesh with a BoxGeometry of your desired size.
    let MonboxSize = new THREE.Vector3(0.6,0.7, 0.4); // Size of the box (width, height, depth)
    MondummyMesh = new THREE.Mesh(new THREE.BoxGeometry(MonboxSize.x, MonboxSize.y, MonboxSize.z));

// 2. Position this mesh at the position of the soldier.
    MondummyMesh.position.copy(new Vector3(monster.position.x, monster.position.y, monster.position.z));
    yOffset = 0.1;  // or any value you deem appropriate
    MondummyMesh.position.y += yOffset;


// 3. Create a BoxHelper using this dummy mesh.
    MonBoxHelper = new THREE.BoxHelper(MondummyMesh, 0x00ff00);

// 4. Add the BoxHelper to the scene.
    scene.add(MonBoxHelper);


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

monsterloader.load('monster models/Monster warrior/MW Smashing gltf/MW Smashing .gltf', (gltf) => {
    // Store the smashing animation
    monsterAnimations.Smashing = gltf.animations[2];
});

 const pathfinding = new Pathfinding();
const pathfindinghelper = new PathfindingHelper();
 scene.add(pathfindinghelper);
const ZONE = "villaHouse";
let navmesh;
let groupId;
let navpath;
scene.add(pathfindinghelper);
loader.load("navmesh/blendernavmesh8.glb", function(gltf){
meshfloor = gltf.scene;
meshfloor.position.set(0, 0, 0);
meshfloor.scale.set(1, 1, 1);
scene.add(meshfloor);
gltf.scene.traverse(node =>{
         if(!navmesh && node.isObject3D && node.children && node.children.length > 0){
             navmesh = node.children[0];
             console.log("navmesh object:", navmesh);
             pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
             console.log("pathfinding zones", pathfinding.zones);

         }
     })
 })


function findPath() {

    if (pursuing) {

        let target = soldier.position.clone();
        console.log("soldier pos:", target);

        let monsterPos = monster.position.clone();

        //for (let i = 0; i < pathfinding.zones["villaHouse"].groups.length; i++) {
        groupId = pathfinding.getGroup('villaHouse', monsterPos);
        console.log("Group Id:", groupId);
        const closest = pathfinding.getClosestNode(monsterPos, 'villaHouse', groupId);
        console.log("closest node:", closest);
        const closest2 = pathfinding.getClosestNode(target, 'villaHouse', groupId);
        console.log("closest node 2:", closest2);
        if (closest) {
            navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);
            console.log("nav path :", navpath);
            if (navpath && navpath.length > 0) {
                pathfindinghelper.reset();
                pathfindinghelper.setPlayerPosition(monster.position);
                pathfindinghelper.setTargetPosition(target);
                pathfindinghelper.setPath(navpath);

                // Target position
                let targetPos = navpath[0];

                // Compute distance to target
                const distance = targetPos.clone().sub(monster.position);

                // If the monster is close enough to the target position
                if (distance.lengthSq() <   0.5) {

                    navpath.shift(); // Go to the next waypoint
                    if (navpath.length === 0) {
                        navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);

                    } // If there's no more waypoints, just return
                    targetPos = navpath[0]; // New target position
                    distance.copy(targetPos.clone().sub(monster.position)); // Update distance
                }

                // Normalize distance to get direction
                const direction = distance.normalize();

                // Set monster speed (adjust the 0.05 value to your preference)
                const speed = 0.035;

                // Update the monster's position
                monster.position.add(direction.multiplyScalar(speed));

                // Make the monster face the direction it's heading
                monster.lookAt(monster.position.clone().add(direction));

                // Check if monster is close enough to soldier to play smashing animation
                const distanceToSoldier = monster.position.distanceTo(soldier.position);
                const closeEnoughThreshold = 0.6; // Adjust this value based on your requirements

                // if (distanceToSoldier < closeEnoughThreshold) {
                //
                //     let event = new KeyboardEvent('keydown', {key: 'G', code: 'KeyG', which: 71});
                //     document.dispatchEvent(event);
                //
                // }
            }
        }

    }
}




function checkCollisionsWithCollectibles() {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);

    // Check collision with coins
    coins.forEach(coin => {
        const coinBoundingBox = new THREE.Box3().setFromObject(coin.dummyMesh);
        if (soldierBoundingBox.intersectsBox(coinBoundingBox) && !coin.collected) {
            console.log("Collision between character and coin");
            numCoins+=1;
            coin.mesh.visible = false;
            coin.collected = true;
            updateHUDCoin(numCoins);
            animate();

            // Remove the coin from the scene
            scene.remove(coin.mesh);

            // Load the portal if 3 coins have been collected
            if (numCoins === 3) {
                loadPortal();
            }
        }
    });

    // Check collision with boosts
    boosts.forEach(b => {
        const boostBoundingBox = new THREE.Box3().setFromObject(b.dummyMesh);
        if (soldierBoundingBox.intersectsBox(boostBoundingBox) && !b.collected) {
            console.log("Collision between character and boost");
            boostFactor += 1;  // or any other effect you want to give
            b.mesh.visible = false;
            b.collected = true;
            updateHUDSpeed(boostFactor);
            animate();
        }
    });

    // Check collision with healths
    healths.forEach(h => {
        const healthBoundingBox = new THREE.Box3().setFromObject(h.dummyMesh);
        if (soldierBoundingBox.intersectsBox(healthBoundingBox) && !h.collected) {
            console.log("Collision between character and health");
            soldierHealth += 1;
            h.mesh.visible = false;
            h.collected = true;
            updateHUDHP(soldierHealth);
            animate();
        }
    });


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
                 playAnimation('Running');
             } else {
                 pursuing = false;
                 // path = [];
                 playAnimation('Idle');
             }
             break;
         // generateRandomDestination(monster);
         case 'KeyO':
             playAnimation('Walking');
             break;
         case 'KeyG':
             playAnimation('Smashing');
             break;
     }
 });

//monster pursuit code:

     const clock = new THREE.Clock();
 function animate() {
     requestAnimationFrame(animate);

     if (mixer) mixer.update(0.016);
     if (monsterMixer) monsterMixer.update(0.015);
     if (portalMixer) portalMixer.update(0.016);

     // Update mixers for all coins
     for (const coin of coins) {
         if (coin.mixer) {
             coin.mixer.update(0.016);
         }
     }

     // Update mixers for all boost
     for (const boost of boosts) {
         if (boost.mixer) {
             boost.mixer.update(0.016);
         }
     }

     // Update mixers for all boost
     for (const health of healths) {
         if (health.mixer) {
             health.mixer.update(0.016);
         }
     }


     updateMovement();
     // Call the function after the exploration is done
     // visualizeGrid(grid);


     // In your animate function
     if (pursuing) {
         // findSoldier(clock.getDelta()); // start fin
         findPath();
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
// Start animation
 animate();

