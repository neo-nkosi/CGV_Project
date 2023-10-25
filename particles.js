import * as THREE from "three";

let initialParticlePositions = [];
let targetParticlePositions = [];
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

export function createSparkEffect() {
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const particlePositions = [];

    const circleTexture = createCircleTexture(64, 'white'); // White circle with a radius of 64 pixels

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffff40,
        size: 0.02,
        map: circleTexture,
        alphaTest: 0.5, // Ensure the transparent parts of the texture are not rendered
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    // Adjust these values to keep particles closer to the center
    const maxDistanceFromCenter = 1.5;

    for (let i = 0; i < particleCount; i++) {
        let x = (Math.random() - 0.5) * maxDistanceFromCenter;
        let y = (Math.random() - 0.5) * maxDistanceFromCenter;
        let z = (Math.random() - 0.5) * maxDistanceFromCenter;

        particlePositions.push(x, y, z);

        // Store the initial positions for later
        initialParticlePositions.push({ x, y, z });
        targetParticlePositions.push({ x, y, z });
    }

    particles.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));

    return new THREE.Points(particles, particleMaterial);
}

let rotationSpeed = 0.02;

export function updateParticleSystem(particleSystem) {
    const positions = particleSystem.geometry.attributes.position.array;

    for (let i = 0; i < initialParticlePositions.length; i++) {
        let x = positions[i * 3];
        let y = positions[i * 3 + 1];
        let z = positions[i * 3 + 2];

        // Rotate the particle in the xy-plane
        let newX = x * Math.cos(rotationSpeed) - z * Math.sin(rotationSpeed);
        let newZ = x * Math.sin(rotationSpeed) + z * Math.cos(rotationSpeed);

        positions[i * 3] = newX;
        positions[i * 3 + 2] = newZ;

        // Adjust the y position by interpolating towards the target position
        positions[i * 3 + 1] += (targetParticlePositions[i].y - positions[i * 3 + 1]) * 0.05;

        // Randomly choose a new target position
        if (Math.random() < 0.02) {
            let yOffset = (Math.random() - 0.5) * 0.3; // Random value between -0.1 and 0.1
            targetParticlePositions[i].y = initialParticlePositions[i].y + yOffset;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
}

export function createHealthEffect(modelMesh) {
    if (!modelMesh){
        console.log("no model loaded");
        return null; // Ensure the model is loaded
    }

    const particleCount = 20;
    const dummyObject = new THREE.Object3D(); // To apply transformations for each instance

    const instancedMesh = new THREE.InstancedMesh(
        modelMesh.geometry,
        modelMesh.material,
        particleCount
    );

    // Adjust these values to keep particles closer to the center
    const maxDistanceFromCenter = 1.5;

    const scaleFactor = 0.05; // Adjust this value as needed
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


