import * as THREE from 'three';

export function createPainting(scene){

    const paintingURL = "textures/BrandenFrame.png";

    const paintingTexture = new THREE.TextureLoader().load(paintingURL);
    paintingTexture.encoding = THREE.sRGBEncoding;

    const paintingPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const paintingPlaneMaterial = new THREE.MeshBasicMaterial({map: paintingTexture, transparent: true});
    const paintingScreen = new THREE.Mesh(paintingPlaneGeometry, paintingPlaneMaterial);
    
    paintingScreen.position.set(-0.23,2,-3.95);
    paintingScreen.scale.set(0.2,0.4,2)
    
    scene.add(paintingScreen);
}