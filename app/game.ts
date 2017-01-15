import { Ball } from './ball';
import { Paddle } from './paddle';
import { Brick } from './brick';
import { HardBrick } from './brick';
import { ImmortalBrick } from './brick';
import { Obstacle } from './obstacle';
import { Vector } from './vector';
import { Side } from './side';

enum GameState {
    Running,
    GameOver
}

enum KeyCodes {
    LEFT = 37,
    RIGHT = 39
}

export class Game {
    loopInterval: number = 10;
    gameState: GameState;
    ball: Ball;
    paddle: Paddle;
    bricks: Array<Brick> = [];
    bricksDestroyed: number = 0;

    keyMap = {};

    wallLeft : Obstacle;
    wallTop: Obstacle;
    wallRight: Obstacle;
    wallBottom: Obstacle;    

    livesLeft : number;
    score: number;

    constructor(ballElement : HTMLElement, paddle: HTMLElement, bricks: HTMLCollection, boardElement : HTMLElement, public livesLabel : HTMLElement,
        public scoreLabel: HTMLElement, public newGameBtn: HTMLElement) {
        this.gameState = GameState.Running;
        this.paddle = new Paddle(paddle, boardElement.offsetWidth);

        this.ball = new Ball(
            ballElement,            
            new Vector(3, -3) 
        );

        this.generateSpecialBricks(bricks, 'hard', 8);
        this.generateSpecialBricks(bricks, 'immortal', 4);

        for (let i = 0; i < bricks.length; i++) {
            if(bricks[i].classList.contains('hard-brick')) {
                this.bricks.push(new HardBrick(<HTMLElement>bricks[i]));
            }else if(bricks[i].classList.contains('immortal-brick')) {
                this.bricks.push(new ImmortalBrick(<HTMLElement>bricks[i]));
            }else {
                this.bricks.push(new Brick(<HTMLElement>bricks[i]));
            }
        }

        this.createWalls(this.ball.radius, boardElement.offsetWidth, boardElement.offsetHeight);

        this.newGame();

        this.newGameBtn.addEventListener('click', () => this.newGame());
    }   

    generateSpecialBricks(bricks: HTMLCollection, type: string, qty: number) {
        let rand: Array<number> = [];

        while(rand.length < qty){
            let randomnumber: number = Math.ceil(Math.random()*(bricks.length-1))
            if(rand.indexOf(randomnumber) === -1) {
                rand.push(randomnumber);
            }
        }
        
        rand.forEach((el)=> {
            bricks[el].classList.add(`${type}-brick`);
        });
    } 

    resetBricks(bricks: Array<Brick>) {

        bricks.forEach(function(brick, i) {
           if(brick.sprite.classList.contains('hard-brick')) {
               brick.timesHit = 2;
               brick.sprite.classList.remove('hit-once');
           }else {
               brick.timesHit = 1;
           }
           brick.show();
        });
    }

    accelerate(): number {
        let allBricks: number = this.bricks.length;
        
        this.bricksDestroyed ++;

        let percentagOfDestroyed : number = Math.ceil((this.bricksDestroyed * 100) / allBricks);

        return percentagOfDestroyed;
        
    }

    createWalls(radius : number, maxX : number, maxY : number) {
        this.wallLeft = new Obstacle(-radius, -radius, 0, maxY + radius);
        this.wallTop = new Obstacle(-radius, -radius, maxX + radius, 0);
        this.wallRight = new Obstacle(maxX, -radius, maxX + radius, maxY + radius);
        this.wallBottom = new Obstacle(-radius, maxY, maxX + radius, maxY + radius);        
    }

    newGame() {
        this.newGameBtn.style.visibility = 'hidden';
        this.score = 0;
        this.livesLeft = 3;
        this.livesLabel.innerText = '' + this.livesLeft;
        this.score = 0;
        this.scoreLabel.innerText = '' + this.score;
        this.ball.show();
        this.ball.bounceWithAngle(60);
        var ballPosition = this.ball.clone();
        ballPosition.moveCenterXTo(this.paddle.centerX());
        ballPosition.moveBottomTo(this.paddle.topLeft.y - 4);
        this.ball.moveTo(ballPosition);
        this.resetBricks(this.bricks);
        this.gameState = GameState.Running;
    }

    lostLive() {
        if (--this.livesLeft) {
            this.ball.bounceWithAngle(60);
            var ballPosition = this.ball.clone();
            ballPosition.moveCenterXTo(this.paddle.centerX());
            ballPosition.moveBottomTo(this.paddle.topLeft.y - 4);
            this.ball.moveTo(ballPosition);
        } else {
            this.gameState = GameState.GameOver;
            this.ball.hide();          
            this.newGameBtn.style.visibility = 'visible';  
        }
        this.livesLabel.innerText = '' + this.livesLeft;
    }

    run() {
        document.addEventListener('keyup', (e) => this.keyMap[e.keyCode] = false);
        document.addEventListener('keydown', (e) => this.keyMap[e.keyCode] = true);

        var play = ()=> {
            if (this.gameState !== GameState.Running) {
                return;
            }
            var newBallPosition = this.ball.calculateNewPosition();

            if (this.keyMap[KeyCodes.LEFT]) {
                this.paddle.moveLeft(5);
            } else if (this.keyMap[KeyCodes.RIGHT]) {
                this.paddle.moveRight(5);
            }

            if (this.wallBottom.checkCollision(newBallPosition)) {
                this.lostLive();
                return;
            }

            if (this.wallLeft.checkCollision(newBallPosition) || this.wallRight.checkCollision(newBallPosition)) {
                this.ball.bounceVertical();
            }
            if (this.wallTop.checkCollision(newBallPosition)) {
                this.ball.bounceHorizontal();
            }     

            for (let brick of this.bricks) {
                let wasHit = false;

                switch (brick.checkCollision(newBallPosition)) {
                    case (Side.Left):
                    case (Side.Right):
                        this.ball.bounceVertical();
                        wasHit = true;
                        break;

                    case (Side.Top):
                    case (Side.Bottom):                    
                        this.ball.bounceHorizontal();
                        wasHit = true;
                }
                
                if (wasHit) {
                    if(brick.wasHit()) {
                        brick.hide();
                        let percent : number = this.accelerate();
                        if(percent > 32) {
                            clearInterval(speed);
                            speed = setInterval(play, 8) 
                        }else if (percent > 65) {
                            clearInterval(speed);
                            speed = setInterval(play, 7) 
                        }
                    }else {
                        brick.hitOnce();
                    }
                    this.score += 20;
                    this.scoreLabel.innerText = '' + this.score;
                    break;
                }
            }

            if (this.paddle.checkCollision(newBallPosition)) {
                this.ball.bounceWithAngle(this.paddle.calculateHitAngle(this.ball.centerX(), this.ball.radius));
            }

            this.ball.moveTo(this.ball.calculateNewPosition());
        }

        var speed = setInterval(play, this.loopInterval) 
    }
}