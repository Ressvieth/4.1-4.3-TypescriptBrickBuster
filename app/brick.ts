import { Sprite } from './sprite';

export class Brick extends Sprite {
    timesHit : number = 1;

    wasHit() : boolean {
        return --this.timesHit < 1;
    }

    hitOnce() {
        this.sprite.classList.add('hit-once');
    }
}

export class HardBrick extends Brick {
    timesHit : number = 2;
}

export class ImmortalBrick extends Brick {
    wasHit() : boolean {
        return false;
    }
}