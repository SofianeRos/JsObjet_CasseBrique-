// Import de la feuille de style
import '../assets/css/style.css';
import customConfig from '../config.json';
import levelsConfig from '../levels.json';
import ballImgSrc from '../assets/img/ball.png';
import paddleImgSrc from '../assets/img/paddle.png';
import brickImgSrc from '../assets/img/brick.png';
import edgeImgSrc from '../assets/img/edge.png';
import Ball from './Ball';
import GameObject from './GameObject';
import CollisionType from './DataType/CollisionType';
import Paddle from './Paddle';
import Brick from './Brick';
import Bonus from './Bonus';
import Projectile from './Projectile';

class Game
{
    config = {
        canvasSize: { width: 800, height: 600 },
        ball: { radius: 10, orientation: 45, speed: 4, position: { x: 400, y: 300 }, angleAlteration: 30 },
        paddleSize: { width: 100, height: 20 }
    };
    
    levels;
    ctx;
    elScore; elLives; elLevel;
    
    // Compteur pour le rythme des tirs
    frameCount = 0;
    
    currentLoopStamp;
    debugSpan; debugInfo = '';

    images = { ball: null, paddle: null, brick: null, edge: null };

    state = {
        score: 0, lives: 3, currentLevelIndex: 0,
        balls: [],
        bricks: [],
        bonuses: [],
        projectiles: [],
        deathEdge: null, bouncingEdges: [],
        paddle: null,
        userInput: { paddleLeft: false, paddleRight: false, space: false }
    };

    constructor( customConfig = {}, levelsConfig = [] ) {
        Object.assign( this.config, customConfig );
        this.levels = levelsConfig;
    }

    start() {
        this.initHtmlUI();
        this.initImages();
        this.initGameObjects();
        requestAnimationFrame( this.loop.bind(this) );
    }

    initHtmlUI() {
        const elH1 = document.createElement('h1'); elH1.textContent = 'Arkanoïd Ultra';
        // Style modifié pour aller avec le thème sombre
        elH1.style.color = '#fff';
        elH1.style.textShadow = '0 0 10px #0ff';
        elH1.style.fontFamily = 'Segoe UI, sans-serif';

        const infoBar = document.createElement('div');
        infoBar.style.display = 'flex'; infoBar.style.justifyContent = 'space-between'; infoBar.style.width = '800px'; infoBar.style.fontWeight = 'bold';
        
        this.elLives = document.createElement('span'); this.elLives.textContent = `Vies: ${this.state.lives}`;
        this.elLevel = document.createElement('span'); this.elLevel.textContent = `Niveau: ${this.state.currentLevelIndex + 1}`;
        this.elScore = document.createElement('span'); this.elScore.textContent = `Score: ${this.state.score}`;
        infoBar.append(this.elLives, this.elLevel, this.elScore);

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = this.config.canvasSize.width; elCanvas.height = this.config.canvasSize.height;
        this.debugSpan = document.createElement( 'span' );
        document.body.append( elH1, infoBar, elCanvas, this.debugSpan );
        this.ctx = elCanvas.getContext('2d');

        document.addEventListener( 'keydown', this.handlerKeyboard.bind(this, true) );
        document.addEventListener( 'keyup', this.handlerKeyboard.bind(this, false) );
    }

    initImages() {
        const i = this.images;
        i.ball = new Image(); i.ball.src = ballImgSrc;
        i.paddle = new Image(); i.paddle.src = paddleImgSrc;
        i.brick = new Image(); i.brick.src = brickImgSrc;
        i.edge = new Image(); i.edge.src = edgeImgSrc;
    }

    spawnBall(addToExisting = false) {
        const d = this.config.ball.radius * 2;
        let angle = Math.floor(Math.random() * (135 - 45 + 1) + 45);

        const ball = new Ball(this.images.ball, d, d, angle, this.config.ball.speed);
        
        if (addToExisting && this.state.paddle) {
             ball.setPosition(this.state.paddle.position.x + 20, this.state.paddle.position.y - 20);
        } else {
             ball.setPosition(this.config.ball.position.x, this.config.ball.position.y);
        }
        ball.isCircular = true;
        
        if (addToExisting) this.state.balls.push(ball);
        else this.state.balls = [ ball ];
    }

    initGameObjects() {
        this.spawnBall();
        const de = new GameObject(this.images.edge, 800, 20); de.setPosition(0, 630); this.state.deathEdge = de;
        const et = new GameObject(this.images.edge, 800, 20); et.setPosition(0, 0);
        const er = new GameObject(this.images.edge, 20, 610); er.setPosition(780, 20); er.tag = 'RightEdge';
        const el = new GameObject(this.images.edge, 20, 610); el.setPosition(0, 20); el.tag = 'LeftEdge';
        this.state.bouncingEdges.push(et, er, el);

        const p = new Paddle(this.images.paddle, this.config.paddleSize.width, this.config.paddleSize.height, 0, 0);
        p.setPosition(350, 550);
        this.state.paddle = p;
        this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
    }

    loadBricks(arr) {
        for(let l=0; l<arr.length; l++) {
            for(let c=0; c<arr[l].length; c++) {
                if(arr[l][c]!==0) {
                    const b = new Brick(this.images.brick, 50, 25, arr[l][c]);
                    b.setPosition(20 + (50 * c), 20 + (25 * l));
                    this.state.bricks.push(b);
                }
            }
        }
    }

    activateBonus(bonus) {
        this.state.score += 50; 
        this.elScore.textContent = `Score: ${this.state.score}`;

        switch(bonus.type) {
            case 'MULTI':
                this.spawnBall(true); this.spawnBall(true);
                break;
            case 'BIG':
                this.state.paddle.setWidth(1.5);
                break;
            case 'SMALL':
                this.state.paddle.setWidth(0.7);
                break;
            case 'STICKY':
                this.state.paddle.isSticky = true;
                this.state.paddle.hasLaser = false; // Laser et Sticky sont mutuellement exclusifs
                break;
            case 'LASER':
                this.state.paddle.hasLaser = true;
                this.state.paddle.isSticky = false;
                break;
            case 'PENETRATING':
                this.state.balls.forEach(b => { b.isPenetrating = true; });
                break;
        }
    }

    checkUserInput() {
        // Mouvement Paddle
        if(this.state.userInput.paddleRight) { this.state.paddle.orientation=0; this.state.paddle.speed=7; }
        if(this.state.userInput.paddleLeft) { this.state.paddle.orientation=180; this.state.paddle.speed=7; }
        if(!this.state.userInput.paddleRight && !this.state.userInput.paddleLeft) this.state.paddle.speed=0;
        
        // Touche ESPACE
        if (this.state.userInput.space) {
            
            // 1. GESTION DE LA BALLE COLLANTE
            this.state.balls.forEach(b => {
                if (b.isStuck) {
                    b.isStuck = false;
                    b.orientation = 90; // On la lance vers le haut
                }
            });

            // 2. GESTION DU LASER (Cadence de tir)
            if (this.state.paddle.hasLaser && this.frameCount % 10 === 0) {
                const p1 = new Projectile(this.state.paddle.position.x, this.state.paddle.position.y);
                const p2 = new Projectile(this.state.paddle.position.x + this.state.paddle.size.width - 4, this.state.paddle.position.y);
                this.state.projectiles.push(p1, p2);
            }
        }
        this.state.paddle.update();
    }

    checkCollisions() {
        // Paddle vs Bords
        this.state.bouncingEdges.forEach(e => {
            if(this.state.paddle.getCollisionType(e) === CollisionType.HORIZONTAL) {
                this.state.paddle.speed = 0;
                const b = e.getBounds();
                if(e.tag==="RightEdge") this.state.paddle.position.x = b.left - 1 - this.state.paddle.size.width;
                else this.state.paddle.position.x = b.right + 1;
                this.state.paddle.update();
            }
        });

        // Paddle vs Bonus
        this.state.bonuses = this.state.bonuses.filter(bonus => {
            if (this.state.paddle.intersects(bonus)) { 
                this.activateBonus(bonus);
                return false; 
            }
            return true;
        });

        const savedBalls = [];
        this.state.balls.forEach(ball => {
            // Mort ?
            if(ball.getCollisionType(this.state.deathEdge) !== CollisionType.NONE) return;
            savedBalls.push(ball);

            // --- LOGIQUE STICKY (COLLANT) ---
            if (ball.isStuck) {
                // Si la balle est collée, on force sa position X à suivre le paddle
                ball.position.x = this.state.paddle.position.x + ball.stuckOffset;
                return; // On arrête là, elle ne doit pas rebondir ailleurs
            }

            // Murs
            this.state.bouncingEdges.forEach(e => {
                const c = ball.getCollisionType(e);
                if(c===CollisionType.HORIZONTAL) ball.reverseOrientationX();
                if(c===CollisionType.VERTICAL) ball.reverseOrientationY();
            });

            // Briques
            this.state.bricks.forEach(brick => {
                const c = ball.getCollisionType(brick);
                if (c !== CollisionType.NONE) {
                    if (c===CollisionType.HORIZONTAL) ball.reverseOrientationX();
                    else ball.reverseOrientationY();

                    if(!brick.isUnbreakable) {
                        if (ball.isPenetrating) brick.strength = 0;
                        else brick.strength --;

                        this.state.score += 10;
                        this.elScore.textContent = `Score: ${this.state.score}`;

                        // Drop de Bonus (20% de chance)
                        if (brick.strength === 0 && Math.random() < 0.20) {
                            const bonus = new Bonus(brick.position.x + 10, brick.position.y);
                            this.state.bonuses.push(bonus);
                        }
                    }
                }
            });

            // Collision Paddle
            const pc = ball.getCollisionType(this.state.paddle);
            if(pc !== CollisionType.NONE) {
                // Si le paddle est "Sticky", on colle la balle
                if (this.state.paddle.isSticky) {
                    ball.isStuck = true;
                    // On retient où elle a touché par rapport au paddle
                    ball.stuckOffset = ball.position.x - this.state.paddle.position.x;
                } else {
                    // Rebond normal
                    if(pc===CollisionType.HORIZONTAL) ball.reverseOrientationX();
                    else {
                        let alt = 0;
                        if(this.state.userInput.paddleRight) alt = -30;
                        else if(this.state.userInput.paddleLeft) alt = 30;
                        ball.reverseOrientationY(alt);
                        if( ball.orientation === 0 ) ball.orientation = 10;
                        else if( ball.orientation === 180 ) ball.orientation = 170;
                    }
                }
            }
        });
        this.state.balls = savedBalls;

        // Projectiles
        this.state.projectiles = this.state.projectiles.filter(proj => {
            let hit = false;
            if (proj.toRemove) return false;

            for (const brick of this.state.bricks) {
                if (proj.intersects(brick)) { 
                    if (!brick.isUnbreakable) {
                        brick.strength--;
                        this.state.score += 5;
                    }
                    hit = true;
                    break; 
                }
            }
            this.state.bouncingEdges.forEach(e => {
                 if (proj.intersects(e)) hit = true;
            });
            return !hit;
        });
    }

    updateObjects() {
        this.state.balls.forEach(b => b.update());
        this.state.bonuses.forEach(b => b.update());
        this.state.projectiles.forEach(p => p.update());
        this.state.bricks = this.state.bricks.filter(b => b.strength > 0);
        this.state.bonuses = this.state.bonuses.filter(b => b.position.y < this.config.canvasSize.height);
        this.state.paddle.updateKeyframe();

        const left = this.state.bricks.filter(b => !b.isUnbreakable).length;
        if (left === 0) this.nextLevel();
    }

    renderObjects() {
        this.ctx.clearRect(0,0,800,600);
        this.state.bouncingEdges.forEach(e => e.draw());
        this.state.bricks.forEach(b => b.draw());
        this.state.bonuses.forEach(b => b.draw());
        this.state.projectiles.forEach(p => p.draw());
        this.state.paddle.draw();
        this.state.balls.forEach(b => b.draw());
    }

    nextLevel() {
        this.state.currentLevelIndex++;
        if (this.state.currentLevelIndex >= this.levels.data.length) {
            alert("VICTOIRE ! Score: " + this.state.score); window.location.reload(); return;
        }
        this.state.balls=[]; this.state.bricks=[]; this.state.bonuses=[]; this.state.projectiles=[];
        this.elLevel.textContent = `Niveau: ${this.state.currentLevelIndex + 1}`;
        this.spawnBall();
        this.state.paddle.setWidth(1);
        this.state.paddle.hasLaser=false; this.state.paddle.isSticky=false;
        this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
    }

    loop(stamp) {
        this.frameCount++;
        this.currentLoopStamp = stamp;
        this.checkUserInput(); this.checkCollisions(); this.updateObjects(); this.renderObjects();

        if(this.state.balls.length <= 0) {
            this.state.lives--; this.elLives.textContent=`Vies: ${this.state.lives}`;
            if(this.state.lives>0) { 
                this.spawnBall(); 
                this.state.paddle.setWidth(1); this.state.paddle.hasLaser=false; this.state.paddle.isSticky=false;
            } else { alert("Game Over"); window.location.reload(); return; }
        }
        requestAnimationFrame(this.loop.bind(this));
    }

    handlerKeyboard(isActive, evt) {
        if(evt.key==='Right'||evt.key==='ArrowRight') { 
            if(isActive && this.state.userInput.paddleLeft) this.state.userInput.paddleLeft=false;
            this.state.userInput.paddleRight=isActive;
        }
        else if(evt.key==='Left'||evt.key==='ArrowLeft') {
            if(isActive && this.state.userInput.paddleRight) this.state.userInput.paddleRight=false;
            this.state.userInput.paddleLeft=isActive;
        }
        else if(evt.key===' '||evt.code==='Space') {
            this.state.userInput.space = isActive;
        }
    }
}

const theGame = new Game(customConfig, levelsConfig);
export default theGame;