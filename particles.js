import * as THREE from "three";

let initialParticlePositions = [];
let targetParticlePositions = [];

// Texture for speed boost
function createCircleTexture(radius, fillColor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = radius * 2;
    canvas.height = radius * 2;

    context.beginPath();
    context.arc(radius, radius, radius, 0, 2 * Math.PI, false);
    context.fillStyle = fillColor;
    context.fill();

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Creates particles around character when boost is collected
export function createBoostEffect() {
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const particlePositions = [];

    const circleTexture = createCircleTexture(64, 'white');

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffff40,
        size: 0.02,
        map: circleTexture,
        alphaTest: 0.5,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    // Keeps the particles close to the character
    const maxDistanceFromCenter = 1.5;

    for (let i = 0; i < particleCount; i++) {
        let x = (Math.random() - 0.5) * maxDistanceFromCenter;
        let y = (Math.random() - 0.5) * maxDistanceFromCenter;
        let z = (Math.random() - 0.5) * maxDistanceFromCenter;

        particlePositions.push(x, y, z);

        // These positions are used to help keep the movement of the particles close to their original point
        initialParticlePositions.push({ x, y, z });
        targetParticlePositions.push({ x, y, z });
    }

    particles.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));

    return new THREE.Points(particles, particleMaterial);
}

let rotationSpeed = 0.02;

// Adds the bouncing and rotating movement of the particles
export function updateBoostSystem(particleSystem) {
    const positions = particleSystem.geometry.attributes.position.array;

    for (let i = 0; i < initialParticlePositions.length; i++) {
        let x = positions[i * 3];
        let y = positions[i * 3 + 1];
        let z = positions[i * 3 + 2];

        // Rotates the particles
        let newX = x * Math.cos(rotationSpeed) - z * Math.sin(rotationSpeed);
        let newZ = x * Math.sin(rotationSpeed) + z * Math.cos(rotationSpeed);

        positions[i * 3] = newX;
        positions[i * 3 + 2] = newZ;

        positions[i * 3 + 1] += (targetParticlePositions[i].y - positions[i * 3 + 1]) * 0.05;

        // Adds slight randomness to the movement of the particles
        if (Math.random() < 0.02) {
            let yOffset = (Math.random() - 0.5) * 0.3;
            targetParticlePositions[i].y = initialParticlePositions[i].y + yOffset;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
}

export function createHealthEffect(modelMesh) {
    if (!modelMesh){
        console.log("no model loaded");
        return null; // Need to check if the model is loaded first since it is a .glb file
    }

    const particleCount = 30;
    const dummyObject = new THREE.Object3D();

    const instancedMesh = new THREE.InstancedMesh(
        modelMesh.geometry,
        modelMesh.material,
        particleCount
    );

    const maxDistanceFromCenter = 1.5;

    const scaleFactor = 0.05;
    dummyObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * maxDistanceFromCenter;
        const y = (Math.random() - 0.5) * maxDistanceFromCenter;
        const z = (Math.random() - 0.5) * maxDistanceFromCenter;

        dummyObject.position.set(x, y, z);
        dummyObject.updateMatrix();
        instancedMesh.setMatrixAt(i, dummyObject.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    return instancedMesh;
}

export function updateHealthEffect(instancedMesh) {
    const dummyObject = new THREE.Object3D();
    const scaleFactor = 0.05;
    dummyObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

    for (let i = 0; i < instancedMesh.count; i++) {
        instancedMesh.getMatrixAt(i, dummyObject.matrix);
        dummyObject.position.setFromMatrixPosition(dummyObject.matrix);

        // Rotates each particle around its on Y axis
        dummyObject.rotateY(rotationSpeed);

        // Rotates each particle around the character
        let newX = dummyObject.position.x * Math.cos(rotationSpeed) - dummyObject.position.z * Math.sin(rotationSpeed);
        let newZ = dummyObject.position.x * Math.sin(rotationSpeed) + dummyObject.position.z * Math.cos(rotationSpeed);

        dummyObject.position.x = newX;
        dummyObject.position.z = newZ;

        dummyObject.position.y += (targetParticlePositions[i].y - dummyObject.position.y) * 0.05;

        // Adds randomness to the particles movement
        if (Math.random() < 0.02) {
            let yOffset = (Math.random() - 0.5) * 0.3;
            targetParticlePositions[i].y = initialParticlePositions[i].y + yOffset;
        }

        dummyObject.updateMatrix();
        instancedMesh.setMatrixAt(i, dummyObject.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
}



