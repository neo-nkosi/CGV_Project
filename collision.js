import * as THREE from 'three';
import { model, mixer, collisionObject } from './main.js'; // Import the functions and variables from collision.js


export function initCollision(scene, character, characterSize) {
    const raycasterFront = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const raycasterLeft = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const raycasterRight = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const raycasterBack = new THREE.Raycaster(undefined, undefined, 0, undefined);

    function handleCollision(intersects, direction) {
        let isColliding = false;

        if (intersects.length > 0) {
            const collisionPoint = intersects[0].point;
            const distance = character.position.distanceTo(collisionPoint);
            const collisionThreshold = 0.4;

            if (distance < collisionThreshold) {
                isColliding = true;
            }
        }

        return !isColliding; // Return whether movement is allowed
    }

    function updateCollision(allowMove) { // Pass in the allowMove function
        if (model && collisionObject) {
            model.position.set(0, 0, 0);
            model.scale.set(1, 1, 1);

            const characterDirection = new THREE.Vector3(0, 0, -1);
            const rightDirection = new THREE.Vector3(1, 0, 0);
            const leftDirection = new THREE.Vector3(-1, 0, 0);
            const backDirection = new THREE.Vector3(0, 0, 1);

            const raycastOrigin = character.position.clone().setY(character.position.y - characterSize / 2);

            raycasterFront.set(raycastOrigin, characterDirection);
            raycasterLeft.set(raycastOrigin, leftDirection);
            raycasterRight.set(raycastOrigin, rightDirection);
            raycasterBack.set(raycastOrigin, backDirection);

            const intersectsFront = raycasterFront.intersectObject(collisionObject);
            const intersectsLeft = raycasterLeft.intersectObject(collisionObject);
            const intersectsRight = raycasterRight.intersectObject(collisionObject);
            const intersectsBack = raycasterBack.intersectObject(collisionObject);

            // Check collision for each direction and update allowMove
            allowMove("front", handleCollision(intersectsFront, "front"));
            allowMove("left", handleCollision(intersectsLeft, "left"));
            allowMove("right", handleCollision(intersectsRight, "right"));
            allowMove("back", handleCollision(intersectsBack, "back"));
        }

        if (mixer) {
            mixer.update(0.01);
        }
    }

    return updateCollision;
}
