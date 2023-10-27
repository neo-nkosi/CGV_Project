import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from "three";
import {updateHUDCoin, updateHUDHP} from "./hud";

// Creates a single coin and makes it brighter
export function createCoin(x, y, z, scene, coins) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/coin.glb', function (gltf) {
        let coin = gltf.scene;
        coin.position.set(x, y, z);
        coin.scale.set(0.02, 0.02, 0.02);
        scene.add(coin);

        // Creates a dummy mesh to help with collision
        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let coinDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));

        // Add the mesh as a child of coin to keep the same position
        coin.add(coinDummyMesh);

        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(coin);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();

            coins.push({
                mesh: coin,
                dummyMesh: coinDummyMesh,
                collected: false,
                mixer:mixer,
            });
        }
        coin.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive.set(0xffff00);
                child.material.emissiveIntensity = 0.3;  // Used to make the coin brighter
            }
        });

    }, undefined, function (error) {
        console.error(error);
    });
}

// Creates a single boost and makes it brighter
export function createBoost(x, y, z, scene, boosts) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/speed.glb', function (gltf) {
        let boost = gltf.scene;
        boost.position.set(x, y, z);
        boost.scale.set(0.02, 0.02, 0.02);
        scene.add(boost);

        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let boostDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));

        boost.add(boostDummyMesh);

        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(boost);
            const action = mixer.clipAction(gltf.animations[1]);
            action.play();

            boosts.push({
                mesh: boost,
                dummyMesh: boostDummyMesh,
                collected: false,
                mixer: mixer
            });
        }
        boost.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive.set(0xffff00);
                child.material.emissiveIntensity = 0.2;  // Used to make the boost brighter
            }
        });
    }, undefined, function (error) {
        console.error(error);
    });
}

// Creates a single health and makes it brighter
export function createHealth(x, y, z, scene, healths) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/health.glb', function (gltf) {
        let health = gltf.scene;
        health.position.set(x, y, z);
        health.scale.set(0.02, 0.02, 0.02);
        scene.add(health);

        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let healthDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));
        health.add(healthDummyMesh);

        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(health);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();

            healths.push({
                mesh: health,
                dummyMesh: healthDummyMesh,
                collected: false,
                mixer: mixer
            });
        }
        health.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive.set(0xff0000); // Red emissive color
                child.material.emissiveIntensity = 0.3; // Controls the brightness of the heart
            }
        });


    }, undefined, function (error) {
        console.error(error);
    });
}

// Checks for collision between the character and the coins

export function checkCollisionsWithCoins(scene, dummyMesh, coins, numCoins, coinsNeeded) {
    let allCoinsCollected = false;
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);

    // Check collision with coins
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        const coinBoundingBox = new THREE.Box3().setFromObject(coin.dummyMesh);
        if (soldierBoundingBox.intersectsBox(coinBoundingBox) && !coin.collected) {
            numCoins+=1;
            coin.mesh.visible = false;
            coin.collected = true;
            updateHUDCoin(numCoins);

            // Clean up and memory management
            disposeCollectible(coin, scene);
            // Remove the coin from the array since it's collected
            coins.splice(i, 1);

            // Load the portal if all level coins have been collected
            if (numCoins === coinsNeeded) {
                allCoinsCollected = true;
            }
        }
    }
    return {
        coins,
        numCoins: numCoins,
        allCoinsCollected
    };
}

// Checks for collision between the character and the boost
export function checkCollisionsWithBoosts(scene, dummyMesh, boosts, boostFactor) {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);
    let newBoostFactor = boostFactor;
    let initiateBoost = false;

    for (let i = boosts.length - 1; i >= 0; i--) {
        let boost = boosts[i];
        const boostBoundingBox = new THREE.Box3().setFromObject(boost.dummyMesh);
        if (soldierBoundingBox.intersectsBox(boostBoundingBox) && !boost.collected) {
            initiateBoost = true;
            boost.mesh.visible = false;
            boost.collected = true;

            disposeCollectible(boost, scene);

            // Remove the boost from the array
            boosts.splice(i, 1);
        }
    }

    return {
        boosts,
        boostFactor: newBoostFactor,
        initiateBoost
    };
}
// Checks for collision between the character and the health
export function checkCollisionsWithHealths(scene, dummyMesh, healths, soldierHealth) {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);
    let isHealthCollected = false;
    for (let i = healths.length - 1; i >= 0; i--) {
        let health = healths[i];
        const healthBoundingBox = new THREE.Box3().setFromObject(health.dummyMesh);
        if (soldierBoundingBox.intersectsBox(healthBoundingBox) && !health.collected) {
            soldierHealth += 1;
            health.mesh.visible = false;
            health.collected = true;
            updateHUDHP(soldierHealth);

            disposeCollectible(health, scene);

            // Remove the health from the array
            healths.splice(i, 1);
            isHealthCollected = true;
        }
    }

    return {
        healths,
        soldierHealth,
        isHealthCollected
    };
}

// Function disposes of everything related to collectables once they are collected
function disposeCollectible(collectible, scene) {
    scene.remove(collectible.mesh);

    if (collectible.mixer) {
        collectible.mixer.stopAllAction();
        collectible.mixer.uncacheRoot(collectible.mixer.getRoot());
    }
    if (collectible.dummyMesh) {
        collectible.dummyMesh.geometry.dispose();
        collectible.dummyMesh.material.dispose();
        scene.remove(collectible.dummyMesh);
    }
    if (collectible.mesh.geometry) {
        collectible.mesh.geometry.dispose();
    }
    if (collectible.mesh.material) {
        collectible.mesh.material.dispose();
    }
}

// Used to make collectables rotate
export function animateCollectibles(coins, boosts, healths, updateSpeed) {
    for (const coin of coins) {
        if (coin.mixer) {
            coin.mixer.update(updateSpeed);
        }
    }

    for (const boost of boosts) {
        if (boost.mixer) {
            boost.mixer.update(updateSpeed);
        }
    }

    for (const health of healths) {
        if (health.mixer) {
            health.mixer.update(updateSpeed);
        }
    }
}



