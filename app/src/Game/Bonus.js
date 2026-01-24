import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class Bonus extends MovingObject
{
    type;
    color;
    symbol;

    constructor( x, y ) {
        // On définit une taille carrée pour que ce soit rond, vitesse 2 vers le bas (270°)
        super( null, 30, 30, 270, 2 ); 
        this.position = { x: x, y: y };
        this.randomizeType();
    }

    randomizeType() {
        const rand = Math.random();
        
        // --- BONUS (Positifs) ---
        if (rand < 0.15) { 
            this.type = 'MULTI'; this.symbol = 'M'; this.color = '#00ffff'; // Cyan
        } 
        else if (rand < 0.30) { 
            this.type = 'BIG'; this.symbol = '+'; this.color = '#00ff00'; // Vert
        } 
        else if (rand < 0.40) { 
            this.type = 'LASER'; this.symbol = '🔫'; this.color = '#ff00ff'; // Violet
        } 
        else if (rand < 0.50) { 
            this.type = 'STICKY'; this.symbol = '⚓'; this.color = '#ffff00'; // Jaune
        } 
        
        // --- NOUVEAU BONUS : BALLE PERFORANTE (15% de chance) ---
        else if (rand < 0.65) { 
            this.type = 'PENETRATING'; this.symbol = '★'; this.color = '#ffffff'; // Blanc
        } 
        
        // --- MALUS (Négatifs) ---
        else if (rand < 0.80) { 
            this.type = 'SMALL'; this.symbol = '-'; this.color = '#ff6600'; // Orange
        } 
        else if (rand < 0.90) { 
            this.type = 'FAST'; this.symbol = '⚡'; this.color = '#ff0000'; // Rouge Vif
        } 
        else { 
            this.type = 'DEATH'; this.symbol = '💀'; this.color = '#333333'; // Gris Foncé (Mortel)
        } 
    }

    draw() {
        const ctx = theGame.ctx;
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;
        const radius = this.size.width / 2;

        // Effet de brillance (Glow) autour de la boule
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Dessin de la sphère colorée
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // On coupe le glow pour les détails
        ctx.shadowBlur = 0;
        
        // Petit reflet brillant (effet 3D)
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 5, radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();
        ctx.closePath();

        // Dessin du Symbole au centre
        
        ctx.fillStyle = this.type === 'DEATH' ? '#ff0000' : '#000';
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.symbol, centerX, centerY + 1);
    }
}