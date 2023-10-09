import * as THREE from 'three';


export function createHUD(camera){
    //Create an array of image URLs
    const hpURLs = ["icons/hp_bar/HP0.png",
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
    let currentHPlevel = 6;

    //Create a texture from the first image
    const hpTexture = new THREE.TextureLoader().load(hpURLs[currentHPlevel]);

    //Create a plane geometry for the image screen
    const hpPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const hpPlaneMaterial = new THREE.MeshBasicMaterial({map: hpTexture, transparent: true});
    const hpScreen = new THREE.Mesh(hpPlaneGeometry, hpPlaneMaterial);
    hpScreen.renderOrder = 999;
    hpScreen.material.depthTest = false;
    hpScreen.material.depthWrite = false;
    hpScreen.scale.set(0.35,0.18,1);
    hpScreen.geometry.computeBoundingBox();
    
    updateHPScreenPosition();
    camera.add(hpScreen);
    
    
    function updateHPScreenPosition(){
        const box = new THREE.Box3();
        box.copy(hpScreen.geometry.boundingBox).applyMatrix4(hpScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);

        console.log(measure);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;

        //Set the position of the video screen to the bottom left corner
        
        hpScreen.position.x = (-width / 2)+0.4;
        hpScreen.position.y = (-height/ 2)+0.18;
        hpScreen.position.z = -1;
        
    }

    //Listen for window resize events and update the video screen position
    window.addEventListener('resize', updateHPScreenPosition);

    //Return a function to clean up the event listener when needed
    return () => {
        window.removeEventListener('resize', updateHPScreenPosition);
        camera.remove(hpScreen);
    };   
}


