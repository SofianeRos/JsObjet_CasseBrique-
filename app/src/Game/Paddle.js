import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class Paddle extends MovingObject
{
    animationIndex = 0;
    previousKeyframeStamp;
    frameRate = 20;

    // Bonus
    hasLaser = false;
    isSticky = false;

    originalWidth;

    constructor(image, width, height, orientation, speed) {
        super(image, width, height, orientation, speed);
        this.originalWidth = width;
    }

    draw() {
        const ctx = theGame.ctx;
        const x = this.position.x;
        const y = this.position.y;
        const w = this.size.width;
        const h = this.size.height;

        // Choix de la couleur des lumières selon le bonus
        let lightColor = "#00ffff"; // Cyan par défaut
        if (this.hasLaser) lightColor = "#ff00ff"; // Violet si Laser
        else if (this.isSticky) lightColor = "#ffff00"; // Jaune si Collant

        // 1. Corps du vaisseau (Métallique)
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, "#555");
        gradient.addColorStop(0.5, "#eee"); // Reflet au milieu
        gradient.addColorStop(1, "#222");

        ctx.fillStyle = gradient;
        
        // Forme trapézoïdale arrondie
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10); 
        ctx.fill();

        // 2. Lumières latérales (Réacteurs)
        ctx.shadowBlur = 10;
        ctx.shadowColor = lightColor;
        ctx.fillStyle = lightColor;

        // Lumière Gauche
        ctx.beginPath();
        ctx.arc(x + 10, y + h/2, 4, 0, Math.PI*2);
        ctx.fill();

        // Lumière Droite
        ctx.beginPath();
        ctx.arc(x + w - 10, y + h/2, 4, 0, Math.PI*2);
        ctx.fill();

        // 3. Barre d'énergie centrale
        ctx.fillStyle = lightColor;
        ctx.fillRect(x + w/2 - 15, y + 5, 30, 4);

        // Reset des effets d'ombre pour la suite du jeu
        ctx.shadowBlur = 0;
    }

    setWidth(ratio) {
        this.size.width = this.originalWidth * ratio;
    }

    updateKeyframe() {
        // Animation inutile maintenant qu'on dessine en code, 
        // mais on garde la méthode pour ne pas casser Game.js
    }
}