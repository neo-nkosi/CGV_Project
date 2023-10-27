import * as THREE from 'three';

export function createPainting(scene){

    //Create a var for the image URL
    const paintingURL = "textures/BrandenFrame.png";

    //Create a texture from the image
    const paintingTexture = new THREE.TextureLoader().load(paintingURL);
    paintingTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the object
    const paintingPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const paintingPlaneMaterial = new THREE.MeshBasicMaterial({map: paintingTexture, transparent: true});
    const paintingScreen = new THREE.Mesh(paintingPlaneGeometry, paintingPlaneMaterial);
    
    //position the object and scale accordingly
    paintingScreen.position.set(-0.23,2,-3.95);
    paintingScreen.scale.set(0.2,0.4,2)
    
    scene.add(paintingScreen);
}