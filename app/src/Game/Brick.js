import GameObject from "./GameObject";
import theGame from "./Game";

export default class Brick extends GameObject
{
    type;
    strength;
    isUnbreakable = false;

    constructor( image, width, height, strength = 1 ) {
        super( image, width, height );
        
        // Si la force est 3, c'est une brique incassable
        if (strength === 3) {
            this.isUnbreakable = true;
            // On la fait ressembler à une brique de base (Jaune) pour l'image de fond
            this.strength = 1; 
            this.type = 1;     
        } else {
            this.strength = strength;
            this.type = strength;
        }
    }

    draw() {
        const sourceX = (this.size.width * this.type) - this.size.width;
        const sourceY = (this.size.height * this.strength) - this.size.height;

        // 1. On dessine la brique normalement (elle sera jaune)
        theGame.ctx.drawImage(
            this.image,
            sourceX,
            sourceY,
            this.size.width,
            this.size.height,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );

        // 2. Si c'est une incassable, on DESSINE un rectangle sombre par-dessus
        if (this.isUnbreakable) {
            // Sauvegarde du contexte pour ne pas affecter les autres dessins
            theGame.ctx.save();
            
            // Couleur noire avec 60% d'opacité
            theGame.ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
            theGame.ctx.fillRect(
                this.position.x,
                this.position.y,
                this.size.width,
                this.size.height
            );

            // Optionnel : On peut ajouter un petit contour gris pour faire "métal"
            theGame.ctx.strokeStyle = "#888"; 
            theGame.ctx.lineWidth = 2;
            theGame.ctx.strokeRect(
                this.position.x + 1,
                this.position.y + 1,
                this.size.width - 2,
                this.size.height - 2
            );

            theGame.ctx.restore();
        }
    }
}