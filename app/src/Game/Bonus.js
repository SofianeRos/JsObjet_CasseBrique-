import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class Bonus extends MovingObject
{
    type;
    color;
    symbol; // On remplace 'text' par un symbole plus simple

    constructor( x, y ) {
        // On définit une taille carrée pour que ce soit rond
        super( null, 30, 30, 270, 2 ); 
        this.position = { x: x, y: y };
        
        this.randomizeType();
    }

    randomizeType() {
        const rand = Math.random();
        // Couleurs néons
        if (rand < 0.2) { this.type = 'MULTI'; this.symbol = 'M'; this.color = '#00ffff'; } // Cyan
        else if (rand < 0.4) { this.type = 'BIG'; this.symbol = '+'; this.color = '#00ff00'; } // Vert
        else if (rand < 0.5) { this.type = 'SMALL'; this.symbol = '-'; this.color = '#ff3333'; } // Rouge
        else if (rand < 0.7) { this.type = 'LASER'; this.symbol = '⚡'; this.color = '#ff00ff'; } // Magenta
        else if (rand < 0.85) { this.type = 'STICKY'; this.symbol = '⚓'; this.color = '#ffff00'; } // Jaune
        else { this.type = 'PENETRATING'; this.symbol = '★'; this.color = '#ffffff'; } // Blanc
    }

    draw() {
        const ctx = theGame.ctx;
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;
        const radius = this.size.width / 2;

        // 1. Lueur externe (Glow)
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // 2. Cercle principal
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 3. Reflet brillant (pour effet 3D)
        ctx.shadowBlur = 0; // On coupe le glow pour le détail
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 5, radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();
        ctx.closePath();

        // 4. Symbole au centre
        ctx.fillStyle = "#000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.symbol, centerX, centerY + 1); // +1 pour ajuster visuellement
    }
}