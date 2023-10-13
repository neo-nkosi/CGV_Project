import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {checkMovement, initializeRays} from "./collisionCheck";
import {Pathfinding, PathfindingHelper} from 'three-pathfinding';

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
    soldier.position.set(0,0,8);
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
let dummyMonster; // For grid generation
monsterloader.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
    monster = gltf.scene;
    monster.position.set(0.3, 0, 8); // Set initial position here
    monster.scale.set(0.35, 0.35, 0.35);

    monsterMixer = new THREE.AnimationMixer(monster);
    scene.add(monster);


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


 const pathfinding = new Pathfinding();
const pathfindinghelper = new PathfindingHelper();
 scene.add(pathfindinghelper);
const ZONE = "villaHouse";
let navmesh;
let groupId;
let navpath;
scene.add(pathfindinghelper);
loader.load("navmesh/blendernavmesh4.glb", function(gltf){
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
                    if (distance.lengthSq() < 0.05 * 0.05) {
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
                }
            }


    }
}


// function findSoldier(delta){
//     for (let i = 0; i < pathfinding.zones["villaHouse"].groups.length; i++) {
//         groupId = i
//         // groupId = pathfinding.getGroup('villaHouse', monster.position.clone());
//         console.log("Group Id:", groupId);
//         const closest = pathfinding.getClosestNode(monster.position.clone(), 'villaHouse', groupId);
//         console.log("Closest Pos:", closest);
//         navpath = pathfinding.findPath(closest.centroid, soldier.position.clone(), "villaHouse", groupId);
//         console.log("Navpath:", navpath);
//         if (!navpath || navpath.length <= 0) return;
//         if(navpath.length > 0) {
//             let targetPos = navpath[0];
//             console.log("Target", targetPos);
//             const distance = targetPos.clone().sub(monster.position);
//             if (distance.lengthSq() > 0.0005 * 0.05) {
//                 distance.normalize();
//                 monster.position.add(distance.multiply(delta * 0.035))
//             } else {
//                 navpath.shift();
//             }
//         }
//     }
// }

// function getSafeClosestNode(position, zone, groupId, maxDistance = Infinity) {
//     const nodes = pathfinding.zones[zone].groups[groupId].nodes;
//     const vertices = pathfinding.zones[zone].vertices;
//
//     let closestNode = null;
//     let closestDistance = maxDistance;
//
//     nodes.forEach((node) => {
//         const distance = Utils.distanceToSquared(node.centroid, position);
//         console.log("Node centroid:", node.centroid, "Position:", position, "Distance:", distance);
//
//         if (distance < closestDistance && Utils.isVectorInPolygon(position, node, vertices)) {
//             closestNode = node;
//             closestDistance = distance;
//         }
//     });
//
//
//     return closestNode;
// }

// function findPath(deltaTime) {
//     if (!pursuing) return;
//
//     const zone = 'villaHouse';
//
//     let groupId = pathfinding.getGroup(zone, monster.position);
//     if (groupId === null) {
//         console.warn("Couldn't determine monster's group!");
//         return;
//     }
//
//     let monsterNode = getSafeClosestNode(monster.position, zone, groupId);
//     let soldierNode = getSafeClosestNode(soldier.position, zone, groupId);
//
//     if (!monsterNode || !soldierNode) {
//         console.warn("Monster or Soldier is outside navmesh or beyond max search distance!");
//         return;
//     }
//
//
//     // Consider visualizing the nodes:
//     // visualizeNode(monsterNode, 'red');
//     // visualizeNode(soldierNode, 'blue');
//
//     let navpath = pathfinding.findPath(monsterNode, soldierPos, zone, groupId);
//
//     if (navpath && navpath.length > 0) {
//         // Consider visualizing the path:
//         // visualizePath(navpath);
//
//         const waypointProximityThreshold = 0.025; // Adjust this value based on your requirements
//
//         let targetPos = navpath[0];
//         let distanceToWaypoint = targetPos.clone().sub(monster.position).lengthSq();
//
//         if (distanceToWaypoint < waypointProximityThreshold) {
//             navpath.shift();
//             if (navpath.length === 0) return; // Reached destination
//             targetPos = navpath[0];
//         }
//
//         const direction = targetPos.clone().sub(monster.position).normalize();
//         const speed = 0.035;
//
//         monster.position.add(direction.multiplyScalar(speed * deltaTime));
//         monster.lookAt(targetPos); // Adjust if any unwanted rotation occurs
//     }
// }






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

                     break;
             }
         });

//monster pursuit code:

     const clock = new THREE.Clock();
     function animate() {
         requestAnimationFrame(animate);

         if (mixer) mixer.update(0.016);
         if (monsterMixer) monsterMixer.update(0.015);


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

         var moveDistance = 0.1;

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