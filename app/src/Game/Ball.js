import MovingObject from "./MovingObject";
import CustomMath from "./CustomMath";
import Vector from "./DataType/Vector";
import theGame from "./Game"; // Nécessaire pour accéder au contexte

export default class Ball extends MovingObject
{
    isPenetrating = false;
    isStuck = false;
    stuckOffset = 0;

    reverseOrientationX(alteration = 0) {
        if (this.isStuck) return;
        super.reverseOrientationX(alteration);
    }

    reverseOrientationY(alteration = 0) {
        if (this.isStuck) return;
        super.reverseOrientationY(alteration);
    }

    update() {
        if (this.isStuck) return;
        super.update();
    }

    draw() {
        const ctx = theGame.ctx;
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;
        const radius = this.size.width / 2;

        // Couleur : Rouge si pénétrante, Blanche sinon
        const mainColor = this.isPenetrating ? "#ff3333" : "#ffffff";

        // Effet de halo (Glow)
        ctx.shadowBlur = 10;
        ctx.shadowColor = mainColor;

        // Dégradé radial pour faire une sphère
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
        gradient.addColorStop(0, "#fff");       // Centre blanc pur
        gradient.addColorStop(0.5, mainColor);  // Couleur principale
        gradient.addColorStop(1, "rgba(0,0,0,0)"); // Bord transparent

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Reset
        ctx.shadowBlur = 0;
    }
}