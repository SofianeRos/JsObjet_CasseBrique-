import MovingObject from "./MovingObject";
import CustomMath from "./CustomMath";
import Vector from "./DataType/Vector";
import theGame from "./Game";

export default class Ball extends MovingObject
{
    isPenetrating = false; // Nouvelle propriété
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

        // VISUEL : Rouge si perforante, Blanc sinon
        const mainColor = this.isPenetrating ? "#ff3333" : "#ffffff";

        // Effet de halo (Glow)
        ctx.shadowBlur = this.isPenetrating ? 20 : 10; // Glow plus fort si perforante
        ctx.shadowColor = mainColor;

        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(0.5, mainColor);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}