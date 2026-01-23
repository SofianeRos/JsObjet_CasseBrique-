import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class Bonus extends MovingObject
{
    // Types : 'M' (Multi), 'L' (Laser), 'S' (Slow/Sticky), 'P' (Penetrating), '+' (Grand), '-' (Petit)
    type;
    color;
    text;

    constructor( x, y ) {
        // Pas d'image pour l'instant, on dessine un carré
        super( null, 30, 15, 270, 2 ); // 270° = vers le bas, vitesse 2
        this.position = { x: x, y: y };
        
        this.randomizeType();
    }

    randomizeType() {
        const rand = Math.random();
        if (rand < 0.2) { this.type = 'MULTI'; this.text = 'M'; this.color = '#00f'; }
        else if (rand < 0.4) { this.type = 'BIG'; this.text = '+'; this.color = '#0f0'; }
        else if (rand < 0.5) { this.type = 'SMALL'; this.text = '-'; this.color = '#f00'; }
        else if (rand < 0.7) { this.type = 'LASER'; this.text = 'L'; this.color = '#f0f'; }
        else if (rand < 0.85) { this.type = 'STICKY'; this.text = 'S'; this.color = '#ff0'; }
        else { this.type = 'PENETRATING'; this.text = 'P'; this.color = '#0ff'; }
    }

    draw() {
        theGame.ctx.fillStyle = this.color;
        theGame.ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        theGame.ctx.fillStyle = '#000';
        theGame.ctx.font = '12px Arial';
        theGame.ctx.fillText(this.text, this.position.x + 8, this.position.y + 12);
    }
}