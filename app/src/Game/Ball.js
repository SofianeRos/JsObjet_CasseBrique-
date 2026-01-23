import MovingObject from "./MovingObject";
import CustomMath from "./CustomMath";
import Vector from "./DataType/Vector";

export default class Ball extends MovingObject
{
    isPenetrating = false;
    isStuck = false;
    stuckOffset = 0; // Décalage par rapport au paddle quand collée

    reverseOrientationX(alteration = 0) {
        if (this.isStuck) return; // Si collée, elle ne bouge pas
        super.reverseOrientationX(alteration);
    }

    reverseOrientationY(alteration = 0) {
        if (this.isStuck) return;
        super.reverseOrientationY(alteration);
    }

    update() {
        if (this.isStuck) return; // Si collée, la position est gérée par le paddle
        super.update();
    }
}