import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class Paddle extends MovingObject
{
    // Propriétés pour l'animation
    animationIndex = 0;
    previousKeyframeStamp;
    frameRate = 20;

    // Bonus
    hasLaser = false;
    isSticky = false;

    // Sauvegarde de la taille originale
    originalWidth;

    constructor(image, width, height, orientation, speed) {
        super(image, width, height, orientation, speed);
        this.originalWidth = width;
    }

    draw() {
        // On dessine différemment si on a le Laser (filtre rouge)
        if (this.hasLaser) theGame.ctx.filter = 'sepia(100%) hue-rotate(-50deg) saturate(600%)';
        else if (this.isSticky) theGame.ctx.filter = 'sepia(100%) hue-rotate(50deg) saturate(600%)';

        const sourceY = this.animationIndex * this.size.height;

        theGame.ctx.drawImage(
            this.image,
            0, sourceY, // On prend toujours toute la largeur de l'image source
            100, 20,    // Taille originale de l'image (hardcodée ici selon ton image)
            this.position.x,
            this.position.y,
            this.size.width, // Largeur dynamique (bonus)
            this.size.height
        );
        
        theGame.ctx.filter = 'none';
    }

    setWidth(ratio) {
        this.size.width = this.originalWidth * ratio;
    }

    updateKeyframe() {
        if( ! this.previousKeyframeStamp ) {
            this.previousKeyframeStamp = theGame.currentLoopStamp;
            return;
        }
        const delta = theGame.currentLoopStamp - this.previousKeyframeStamp;
        if( delta < 1000 / this.frameRate ) return;

        this.animationIndex ++;
        if( this.animationIndex > 3) this.animationIndex = 0;

        this.previousKeyframeStamp = theGame.currentLoopStamp;
    }
}