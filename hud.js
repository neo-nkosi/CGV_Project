import * as THREE from 'three';

let coinScreen, speedScreen, hpScreen, blindScreen, coinURLs, speedURLs, hpURLs, blindURL, minimapScreen,HUD;
export function createHUD(camera,numCoins,numSpeed,currentHPlevel){
    HUD = new THREE.Scene();

    //===========================================Blindness Vingette==========================================================


    //Create an var for the Blind URL
    blindURL = "textures/blindness-vingnette.png";

    //Create a texture from the image
    const blindTexture = new THREE.TextureLoader().load(blindURL);
    blindTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const blindPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const blindPlaneMaterial = new THREE.MeshBasicMaterial({map: blindTexture, transparent: true});
    blindScreen = new THREE.Mesh(blindPlaneGeometry, blindPlaneMaterial);
    blindScreen.renderOrder = 999;
    blindScreen.material.depthTest = false;
    blindScreen.material.depthWrite = false;
    
    blindScreen.geometry.computeBoundingBox();
    blindScreen.material.opacity = -0.0889*(currentHPlevel)+0.889;

    updateBlindScreenPosition();
    HUD.add(blindScreen);

    function updateBlindScreenPosition(){
        const box = new THREE.Box3();
        box.copy(blindScreen.geometry.boundingBox).applyMatrix4(blindScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;

        //Set the position of the video screen 

        blindScreen.position.x = 0;
        blindScreen.position.y = 0;
        blindScreen.position.z = -1;

        blindScreen.scale.set(width*0.5,height*0.8,1);
    }

    window.addEventListener('resize', updateBlindScreenPosition);

    //===========================================Coins==========================================================


    //Create an var for the coin collected
    coinURLs = ["icons/coins/Coin0.png",
                     "icons/coins/Coin1.png",
                     "icons/coins/Coin2.png",
                     "icons/coins/Coin3.png",
                     "icons/coins/Coin4.png",
                     "icons/coins/Coin5.png"];

    //Create a texture from the image
    const coinTexture = new THREE.TextureLoader().load(coinURLs[numCoins]);
    coinTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const coinPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const coinPlaneMaterial = new THREE.MeshBasicMaterial({map: coinTexture, transparent: true});
    coinScreen = new THREE.Mesh(coinPlaneGeometry, coinPlaneMaterial);
    coinScreen.renderOrder = 999;
    coinScreen.material.depthTest = false;
    coinScreen.material.depthWrite = false;
    coinScreen.scale.set(0.14,0.14,1);
    coinScreen.geometry.computeBoundingBox();

    updateCoinScreenPosition();
    HUD.add(coinScreen);

    function updateCoinScreenPosition(){
        const box = new THREE.Box3();
        box.copy(coinScreen.geometry.boundingBox).applyMatrix4(coinScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;

        //Set the position of the video screen to the top left corner

        coinScreen.position.x = (-width / 2)-1;
        coinScreen.position.y = (height/ 2)+0.5;
        coinScreen.position.z = -2;
    }

    window.addEventListener('resize', updateCoinScreenPosition);

    //===========================================Speed Boost====================================================

    //Create an var for the speed boost collected
    speedURLs = ["icons/speed_boost/Speed0.png",
                      "icons/speed_boost/Speed1.png",
                      "icons/speed_boost/Speed2.png",
                      "icons/speed_boost/Speed3.png",
                      "icons/speed_boost/Speed4.png",
                      "icons/speed_boost/Speed5.png"];

    //Create a texture from the image
    const speedTexture = new THREE.TextureLoader().load(speedURLs[numSpeed-1]);
    speedTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const speedPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const speedPlaneMaterial = new THREE.MeshBasicMaterial({map: speedTexture, transparent: true});
    speedScreen = new THREE.Mesh(speedPlaneGeometry, speedPlaneMaterial);
    speedScreen.renderOrder = 999;
    speedScreen.material.depthTest = false;
    speedScreen.material.depthWrite = false;
    speedScreen.scale.set(0.14,0.12,1);
    speedScreen.geometry.computeBoundingBox();

    updateSpeedScreenPosition();
    HUD.add(speedScreen);

    function updateSpeedScreenPosition(){
        const box = new THREE.Box3();
        box.copy(speedScreen.geometry.boundingBox).applyMatrix4(speedScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;

        //Set the position of the video screen to the top right corner

        speedScreen.position.x = (width / 2)+1;
        speedScreen.position.y = (height/ 2)+0.5;
        speedScreen.position.z = -2;
    }

    window.addEventListener('resize', updateSpeedScreenPosition);

    //===========================================HP BAR=========================================================
    //Create an array of HP image URLs
    hpURLs = ["icons/hp_bar/HP0.png",
                    "icons/hp_bar/HP1.png",
                    "icons/hp_bar/HP2.png",
                    "icons/hp_bar/HP3.png",
                    "icons/hp_bar/HP4.png",
                    "icons/hp_bar/HP5.png",
                    "icons/hp_bar/HP6.png",
                    "icons/hp_bar/HP7.png",
                    "icons/hp_bar/HP8.png",
                    "icons/hp_bar/HP9.png",
                    "icons/hp_bar/HP10.png"];

    //Create a texture from the first image
    const hpTexture = new THREE.TextureLoader().load(hpURLs[currentHPlevel]);
    hpTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const hpPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const hpPlaneMaterial = new THREE.MeshBasicMaterial({map: hpTexture, transparent: true});
    hpScreen = new THREE.Mesh(hpPlaneGeometry, hpPlaneMaterial);
    hpScreen.renderOrder = 999;
    hpScreen.material.depthTest = false;
    hpScreen.material.depthWrite = false;
    hpScreen.scale.set(0.7,0.36,1);
    hpScreen.geometry.computeBoundingBox();

    updateHPScreenPosition();
    HUD.add(hpScreen);

    function updateHPScreenPosition(){
        const box = new THREE.Box3();
        box.copy(hpScreen.geometry.boundingBox).applyMatrix4(hpScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;

        //Set the position of the video screen to the bottom left corner

        hpScreen.position.x = (-width / 2)-0.5;
        hpScreen.position.y = (-height/ 2)-0.3;
        hpScreen.position.z = -2;
    }

    //Listen for window resize events and update the video screen position
    window.addEventListener('resize', updateHPScreenPosition);

    //=======================================================================================================================================
    //createMinimap(camera, HUD);
    camera.add(HUD);
}

export function removeHUD(camera){
    camera.remove(HUD);
}

export function updateHUDHP(currentHPlevel){

    // Check if the current material has a texture and if so, dispose of it
    if (hpScreen.material.map) {
        hpScreen.material.map.dispose();
    }

    const hpTexture = new THREE.TextureLoader().load(hpURLs[currentHPlevel]); 
    hpTexture.encoding = THREE.sRGBEncoding;

    hpScreen.material.map = hpTexture;
    blindScreen.material.opacity = -0.0889*(currentHPlevel)+0.889; //Also update the blindness overlay when HP changes

    hpScreen.material.needsUpdate = true;
    blindScreen.material.needsUpdate = true;
}

export function updateHUDCoin(numCoins){
    // Check if the current material has a texture and if so, dispose of it
    if (coinScreen.material.map) {
        coinScreen.material.map.dispose();
    }

    const coinTexture = new THREE.TextureLoader().load(coinURLs[numCoins]);
    coinTexture.encoding = THREE.sRGBEncoding;

    coinScreen.material.map = coinTexture;

    coinScreen.material.needsUpdate = true;
}

export function updateHUDSpeed(numSpeed){
    // Check if the current material has a texture and if so, dispose of it
    if (speedScreen.material.map) {
        speedScreen.material.map.dispose();
    }

    const speedTexture = new THREE.TextureLoader().load(speedURLs[numSpeed-1]);
    speedTexture.encoding = THREE.sRGBEncoding;

    speedScreen.material.map = speedTexture;

    speedScreen.material.needsUpdate = true;
}

export function createMinimap(camera, scene) {
    const minimapURL = "icons/minimap/mapv4.png"; // Replace with the actual path to your minimap image

    const minimapTexture = new THREE.TextureLoader().load(minimapURL);
    minimapTexture.encoding = THREE.sRGBEncoding;

    const minimapPlaneGeometry = new THREE.PlaneGeometry(2, 1.5);
    const minimapPlaneMaterial = new THREE.MeshBasicMaterial({
        map: minimapTexture,
        transparent: true, // Make the material transparent
        opacity: 0.5 // Adjust the opacity level as needed
    });

    minimapScreen = new THREE.Mesh(minimapPlaneGeometry, minimapPlaneMaterial);
    minimapScreen.renderOrder = 899;
    minimapScreen.material.depthTest = false;
    minimapScreen.material.depthWrite = false;
    minimapScreen.scale.set(0.5, 0.36, 1);
    scene.add(minimapScreen);
    minimapScreen.geometry.computeBoundingBox();

    updateMinimapPosition();

    function updateMinimapPosition() {
        if (minimapScreen.geometry) {
            const box = new THREE.Box3();
            box.copy(minimapScreen.geometry.boundingBox).applyMatrix4(minimapScreen.matrixWorld);
            let measure = new THREE.Vector3();
            box.getSize(measure);

            const vFOV = THREE.MathUtils.degToRad(camera.fov);
            const height = 2 * Math.tan(vFOV / 2);
            const width = height * camera.aspect;

            minimapScreen.position.x = (width / 2) +0.7;
            minimapScreen.position.y = (-height / 2)-0.3;
            minimapScreen.position.z = -2;
        }
    }

    window.addEventListener('resize', updateMinimapPosition);

}

