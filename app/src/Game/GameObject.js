import Bounds from "./DataType/Bounds";
import Size from "./DataType/Size";
import Vector from "./DataType/Vector";
import theGame from "./Game";

export default class GameObject
{
    image;
    position;
    size;
    tag;

    constructor( image, width, height ) {
        this.image = image;
        this.size = new Size( width, height );
        // On initialise la position à 0,0 par défaut pour éviter des erreurs
        this.position = new Vector(0, 0);
    }

    getBounds() {
        return new Bounds(
            this.position.y,
            this.position.x + this.size.width,
            this.position.y + this.size.height,
            this.position.x
        );
    }

    setPosition( x, y ) {
        this.position = new Vector( x, y );
    }

    // --- NOUVEAU : Méthode de collision simple (Intersection) ---
    // Parfait pour les bonus et les lasers
    intersects(other) {
        const b1 = this.getBounds();
        const b2 = other.getBounds();

        return !(
            b1.right < b2.left || 
            b1.left > b2.right || 
            b1.bottom < b2.top || 
            b1.top > b2.bottom
        );
    }

    draw() {
        // Sécurité : si l'objet n'a pas d'image (ex: Bonus dessiné à la main), on ne fait rien ici
        if (!this.image) return; 

        theGame.ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );
    }
}