import * as THREE from "three";

// Function to initialize raycasters and related variables
export function initializeRays() {
    // Add these variables at the beginning of your code
    const raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const raycastDirection = new THREE.Vector3(); // The direction of the ray

    const rayLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for the ray line
    const rayLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -10)]); // Set the initial points of the ray line
    const rayLine = new THREE.Line(rayLineGeometry, rayLineMaterial);
    //scene.add(rayLine);

    // Define material and geometry for the sphere
    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    //scene.add(sphere);

    // Add these variables at the beginning of your code
    const downRaycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const downRayDirection = new THREE.Vector3(0, -1, 0); // Pointing straight down

    // Visualization for the downward ray
    const downRayLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -10, 0)]);
    const downRayLine = new THREE.Line(downRayLineGeometry, rayLineMaterial); // Reuse the red material
    //scene.add(downRayLine);

    const downSphere = new THREE.Mesh(sphereGeometry, sphereMaterial); // Reuse the red material
    //scene.add(downSphere);

    const middleRaycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const middleRaycastDirection = new THREE.Vector3(); // The direction of the ray

    // ... (Other ray-related variables)

    return {
        raycaster,
        raycastDirection,
        rayLine,
        sphere,
        downRaycaster,
        downRayDirection,
        downRayLine,
        downSphere,
        middleRaycaster,
        middleRaycastDirection,
        // ... (Other ray-related variables)
    };
}

export function checkMovement(soldier, villaHouse, keyState, isJumping, verticalVelocity) {
    //let verticalVelocity = 0;
    const rayVars = initializeRays();

    let canMove = true;
    let isOnGround = false;
    const direction = new THREE.Vector3(0, 0, -1); // Default direction (in front of the soldier)
    direction.applyQuaternion(soldier.quaternion); // Apply soldier's rotation

    // Update raycaster and middleRaycaster position and direction based on the soldier's front
    soldier.getWorldPosition(rayVars.raycaster.ray.origin);
    rayVars.raycaster.ray.direction.copy(direction);

    const midBodyPosition = soldier.position.clone().add(new THREE.Vector3(0, 0.2, 0)); // roughly middle of a human body
    rayVars.middleRaycaster.ray.origin.copy(midBodyPosition);
    rayVars.middleRaycaster.ray.direction.copy(direction);

    // Update the downward raycaster position and direction
    soldier.getWorldPosition(rayVars.downRaycaster.ray.origin);
    rayVars.downRaycaster.ray.direction.copy(rayVars.downRayDirection);

    const intersects = rayVars.raycaster.intersectObject(villaHouse, true);
    const midIntersects = rayVars.middleRaycaster.intersectObject(villaHouse, true);

    function checkCollision(intersections, refPosition) {
        if (intersections.length > 0) {
            const collisionPoint = intersections[0].point;
            const distance = refPosition.distanceTo(collisionPoint);
            const collisionThreshold = 0.2;

            return distance < collisionThreshold;
        }
        return false;
    }

    if (keyState[87] || keyState[83] || keyState[65] || keyState[68] || keyState[38] || keyState[40] || keyState[37] || keyState[39]) {  // Check if any forward key is pressed
        if (checkCollision(intersects, soldier.position) || checkCollision(midIntersects, midBodyPosition)) {
            console.log("colliding");
            canMove = false;
        } else {
            rayVars.sphere.visible = false;
            canMove = true;
        }
    }

    const downIntersects = rayVars.downRaycaster.intersectObject(villaHouse, true);
    if (!isJumping) {
        if (checkCollision(downIntersects, soldier.position)) {
            console.log("colliding downward");
            soldier.position.y = downIntersects[0].point.y + 0.05;
            verticalVelocity = 0;
            isOnGround = true;
        } else {
            isOnGround = false;
            verticalVelocity -= 0.005;
        }
    }
    //console.log("is on ground: ", isOnGround);
    console.log("is jumping: ", isJumping);
    return { canMove, isOnGround, verticalVelocity };
}
