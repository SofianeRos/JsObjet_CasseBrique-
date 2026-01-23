import GameObject from "./GameObject";
import theGame from "./Game";

export default class Projectile extends GameObject
{
    speed = 10;
    toRemove = false;

    constructor( x, y ) {
        // On crée un petit rectangle rouge pour le laser
        super( null, 4, 10 ); 
        this.position = { x: x, y: y };
    }

    draw() {
        theGame.ctx.fillStyle = '#f00';
        theGame.ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }

    update() {
        this.position.y -= this.speed;
        
        // Si ça sort de l'écran, on le marque pour suppression
        if (this.position.y < 0) {
            this.toRemove = true;
        }
    }

    getBounds() {
        return {
            top: this.position.y,
            right: this.position.x + this.size.width,
            bottom: this.position.y + this.size.height,
            left: this.position.x
        };
    }
}