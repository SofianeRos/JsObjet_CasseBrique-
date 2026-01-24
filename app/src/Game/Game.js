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
    
    gameState = 'MENU'; 
    gameMode = 'SOLO';
    
    menuCursor = 0; 
    gameOverCursor = 0;

    players = []; 
    currentPlayerIndex = 0; 
    
    switchTimer = 0;
    frameCount = 0;
    currentLoopStamp;

    images = { ball: null, paddle: null, brick: null, edge: null };

    state = {
        score: 0, 
        lives: 0, 
        currentLevelIndex: 0,
        balls: [],
        bricks: [],
        bonuses: [],
        projectiles: [],
        deathEdge: null, 
        bouncingEdges: [],
        paddle: null,
        userInput: { paddleLeft: false, paddleRight: false, space: false, enter: false, up: false, down: false }
    };

    lastInputTime = 0;

    constructor( customConfig = {}, levelsConfig = [] ) {
        Object.assign( this.config, customConfig );
        this.levels = levelsConfig;
    }

    start() {
        this.initHtmlUI();
        this.initImages();
        this.initPlayersData();
        requestAnimationFrame( this.loop.bind(this) );
    }

    initPlayersData() {
        if (this.gameMode === 'SOLO') {
            this.players = [
                { id: 1, score: 0, lives: 3, level: 0, bricks: null, paddleWidthRatio: 1, color: '#00ffff' }
            ];
        } else {
            this.players = [
                { id: 1, score: 0, lives: 3, level: 0, bricks: null, paddleWidthRatio: 1, color: '#00ffff' },
                { id: 2, score: 0, lives: 3, level: 0, bricks: null, paddleWidthRatio: 1, color: '#39ff14' } 
            ];
        }
        this.currentPlayerIndex = 0;
    }

    initHtmlUI() {
        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = this.config.canvasSize.width; 
        elCanvas.height = this.config.canvasSize.height;
        document.body.append( elCanvas );
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

    saveCurrentPlayerState() {
        const p = this.players[this.currentPlayerIndex];
        p.score = this.state.score;
        p.lives = this.state.lives;
        p.level = this.state.currentLevelIndex;
        p.bricks = this.state.bricks; 
        p.paddleWidthRatio = this.state.paddle.size.width / this.config.paddleSize.width;
    }

    loadPlayerState(playerIndex) {
        this.currentPlayerIndex = playerIndex;
        const p = this.players[playerIndex];

        if (p.lives <= 0) {
            if (this.players.every(pl => pl.lives <= 0)) {
                this.gameState = 'GAMEOVER';
                this.gameOverCursor = 0;
                return;
            }
            this.loadPlayerState((playerIndex + 1) % this.players.length);
            return;
        }

        this.state.score = p.score;
        this.state.lives = p.lives;
        this.state.currentLevelIndex = p.level;
        this.state.balls = [];
        this.state.bonuses = [];
        this.state.projectiles = [];

        this.initGameObjects(p.bricks, p.paddleWidthRatio);
    }

    initGameObjects(savedBricks = null, paddleRatio = 1) {
        this.spawnBall();
        
        const de = new GameObject(this.images.edge, 800, 20); de.setPosition(0, 630); this.state.deathEdge = de;
        const et = new GameObject(this.images.edge, 800, 20); et.setPosition(0, 0);
        const er = new GameObject(this.images.edge, 20, 610); er.setPosition(780, 20); er.tag = 'RightEdge';
        const el = new GameObject(this.images.edge, 20, 610); el.setPosition(0, 20); el.tag = 'LeftEdge';
        this.state.bouncingEdges = [et, er, el];

        const p = new Paddle(this.images.paddle, this.config.paddleSize.width, this.config.paddleSize.height, 0, 0);
        p.setPosition(350, 550);
        p.setWidth(paddleRatio);
        this.state.paddle = p;

        if (savedBricks) {
            this.state.bricks = savedBricks;
        } else {
            this.state.bricks = [];
            this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
        }
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

    // --- GAMEPLAY BONUS ET MALUS ---

    activateBonus(bonus) {
        this.state.score += 50; 
        switch(bonus.type) {
            case 'MULTI': this.spawnBall(true); this.spawnBall(true); break;
            case 'BIG': this.state.paddle.setWidth(1.5); break;
            case 'SMALL': this.state.paddle.setWidth(0.7); break;
            case 'STICKY': this.state.paddle.isSticky = true; this.state.paddle.hasLaser = false; break;
            case 'LASER': this.state.paddle.hasLaser = true; this.state.paddle.isSticky = false; break;
            
            // ACTIVATION BALLE PERFORANTE
            case 'PENETRATING': 
                this.state.balls.forEach(b => { 
                    b.isPenetrating = true; 
                    // Visuel pour dire qu'elle est puissante
                }); 
                break;
                
            case 'FAST': this.state.balls.forEach(b => { b.speed *= 1.5; }); break;
            case 'DEATH': this.state.balls = []; break;
        }
    }

    checkUserInput() {
        if(this.state.userInput.paddleRight) { this.state.paddle.orientation=0; this.state.paddle.speed=7; }
        if(this.state.userInput.paddleLeft) { this.state.paddle.orientation=180; this.state.paddle.speed=7; }
        if(!this.state.userInput.paddleRight && !this.state.userInput.paddleLeft) this.state.paddle.speed=0;
        
        if (this.state.userInput.space) {
            this.state.balls.forEach(b => {
                if (b.isStuck) { b.isStuck = false; b.orientation = 90; }
            });
            if (this.state.paddle.hasLaser && this.frameCount % 10 === 0) {
                const p1 = new Projectile(this.state.paddle.position.x, this.state.paddle.position.y);
                const p2 = new Projectile(this.state.paddle.position.x + this.state.paddle.size.width - 4, this.state.paddle.position.y);
                this.state.projectiles.push(p1, p2);
            }
        }
        this.state.paddle.update();
    }

    checkCollisions() {
        this.state.bouncingEdges.forEach(e => {
            if(this.state.paddle.getCollisionType(e) === CollisionType.HORIZONTAL) {
                this.state.paddle.speed = 0;
                const b = e.getBounds();
                if(e.tag==="RightEdge") this.state.paddle.position.x = b.left - 1 - this.state.paddle.size.width;
                else this.state.paddle.position.x = b.right + 1;
                this.state.paddle.update();
            }
        });

        this.state.bonuses = this.state.bonuses.filter(bonus => {
            if (this.state.paddle.intersects(bonus)) { this.activateBonus(bonus); return false; }
            return true;
        });

        const savedBalls = [];
        this.state.balls.forEach(ball => {
            if(ball.getCollisionType(this.state.deathEdge) !== CollisionType.NONE) return; 
            savedBalls.push(ball);

            if (ball.isStuck) { ball.position.x = this.state.paddle.position.x + ball.stuckOffset; return; }

            this.state.bouncingEdges.forEach(e => {
                const c = ball.getCollisionType(e);
                if(c===CollisionType.HORIZONTAL) ball.reverseOrientationX();
                if(c===CollisionType.VERTICAL) ball.reverseOrientationY();
            });

            this.state.bricks.forEach(brick => {
                const c = ball.getCollisionType(brick);
                if (c !== CollisionType.NONE) {
                    if (c===CollisionType.HORIZONTAL) ball.reverseOrientationX(); else ball.reverseOrientationY();
                    
                    if(!brick.isUnbreakable) {
                        // --- LOGIQUE BALLE PERFORANTE ---
                        if (ball.isPenetrating) {
                            brick.strength = 0; // Destruction immédiate (peu importe la vie de la brique)
                        } else {
                            brick.strength --;
                        }
                        
                        this.state.score += 10;
                        if (brick.strength === 0 && Math.random() < 0.40) {
                            this.state.bonuses.push(new Bonus(brick.position.x + 10, brick.position.y));
                        }
                    }
                }
            });

            const pc = ball.getCollisionType(this.state.paddle);
            if(pc !== CollisionType.NONE) {
                if (this.state.paddle.isSticky) {
                    ball.isStuck = true; ball.stuckOffset = ball.position.x - this.state.paddle.position.x;
                } else {
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

        this.state.projectiles = this.state.projectiles.filter(proj => {
            let hit = false;
            if (proj.toRemove) return false;
            for (const brick of this.state.bricks) {
                if (proj.intersects(brick)) { 
                    if (!brick.isUnbreakable) { brick.strength--; this.state.score += 5; }
                    hit = true; break; 
                }
            }
            this.state.bouncingEdges.forEach(e => { if (proj.intersects(e)) hit = true; });
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
        if (left === 0) {
            this.state.currentLevelIndex++;
            if (this.state.currentLevelIndex >= this.levels.data.length) {
                this.state.currentLevelIndex = 0; 
            }
            this.state.balls=[]; this.state.projectiles=[]; this.state.bonuses=[];
            this.spawnBall();
            this.state.bricks = [];
            this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
        }
    }

    renderObjects() {
        this.ctx.clearRect(0,0,800,600);
        this.state.bouncingEdges.forEach(e => e.draw());
        this.state.bricks.forEach(b => b.draw());
        this.state.bonuses.forEach(b => b.draw());
        this.state.projectiles.forEach(p => p.draw());
        this.state.paddle.draw();
        this.state.balls.forEach(b => b.draw());
        this.drawHUD();
    }

    drawHUD() {
        const pColor = this.players[this.currentPlayerIndex].color;
        this.ctx.font = "bold 20px 'Segoe UI', sans-serif";
        this.ctx.fillStyle = "#fff";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`Vies: ${this.state.lives}`, 20, 50);
        this.ctx.fillText(`Niveau: ${this.state.currentLevelIndex + 1}`, 120, 50);
        this.ctx.textAlign = "right";
        this.ctx.fillText(`Score: ${this.state.score}`, 780, 50);

        this.ctx.textAlign = "center";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = pColor;
        this.ctx.fillStyle = pColor;
        const playerName = this.gameMode === 'MULTI' ? `JOUEUR ${this.currentPlayerIndex + 1}` : "SOLO";
        this.ctx.fillText(playerName, 400, 50);
        this.ctx.shadowBlur = 0;
    }

    drawMenu() {
        this.ctx.clearRect(0, 0, 800, 600);
        
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 60px 'Segoe UI'";
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = "#00ffff";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("ARKANOID ULTRA", 400, 150);
        this.ctx.shadowBlur = 0;

        const options = ["1 JOUEUR", "2 JOUEURS "];
        options.forEach((opt, index) => {
            const isSelected = this.menuCursor === index;
            this.ctx.font = isSelected ? "bold 35px 'Segoe UI'" : "30px 'Segoe UI'";
            this.ctx.fillStyle = isSelected ? "#fff" : "#666";
            if (isSelected) {
                this.ctx.shadowBlur = 15; this.ctx.shadowColor = "#00ffff";
                this.ctx.fillText("> " + opt + " <", 400, 300 + (index * 60));
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.fillText(opt, 400, 300 + (index * 60));
            }
        });
        this.ctx.shadowBlur = 0;
        this.ctx.font = "20px 'Segoe UI'";
        this.ctx.fillStyle = "#ccc";
        this.ctx.fillText("Utilisez les Flèches et ENTRÉE pour choisir", 400, 500);
    }

    drawSwitching() {
        this.ctx.clearRect(0, 0, 800, 600);
        const pColor = this.players[this.currentPlayerIndex].color;
        
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 40px 'Segoe UI'";
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = pColor;
        this.ctx.fillStyle = pColor;
        this.ctx.fillText(`TOUR DU JOUEUR ${this.currentPlayerIndex + 1}`, 400, 300);
        this.ctx.shadowBlur = 0;
        this.ctx.font = "20px 'Segoe UI'";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(`Vies restantes: ${this.state.lives}`, 400, 350);
    }

    drawGameOver() {
        this.ctx.clearRect(0, 0, 800, 600);
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 60px 'Segoe UI'";
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = "#ff0000";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("GAME OVER", 400, 120);
        this.ctx.shadowBlur = 0;

        this.ctx.font = "25px 'Segoe UI'";
        if (this.gameMode === 'MULTI') {
            this.ctx.fillStyle = this.players[0].color;
            this.ctx.fillText(`Joueur 1 : ${this.players[0].score} pts`, 400, 200);
            this.ctx.fillStyle = this.players[1].color;
            this.ctx.fillText(`Joueur 2 : ${this.players[1].score} pts`, 400, 240);
            
            let winnerText = "";
            if (this.players[0].score > this.players[1].score) winnerText = "VICTOIRE JOUEUR 1 !";
            else if (this.players[1].score > this.players[0].score) winnerText = "VICTOIRE JOUEUR 2 !";
            else winnerText = "ÉGALITÉ !";

            this.ctx.font = "bold 30px 'Segoe UI'";
            this.ctx.fillStyle = "#ffff00";
            this.ctx.fillText(winnerText, 400, 300);
        } else {
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText(`Score Final : ${this.state.score}`, 400, 220);
        }

        const options = ["REJOUER", "ACCUEIL"];
        options.forEach((opt, index) => {
            const isSelected = this.gameOverCursor === index;
            this.ctx.font = isSelected ? "bold 30px 'Segoe UI'" : "25px 'Segoe UI'";
            this.ctx.fillStyle = isSelected ? "#fff" : "#666";
            
            if (isSelected) {
                this.ctx.shadowBlur = 10; this.ctx.shadowColor = "#00ff00";
                this.ctx.strokeStyle = "#fff"; this.ctx.lineWidth = 2;
                this.ctx.strokeRect(300, 380 + (index * 60) - 35, 200, 50);
            } else {
                this.ctx.shadowBlur = 0;
            }
            this.ctx.fillText(opt, 400, 380 + (index * 60));
        });
    }

    loop(stamp) {
        this.frameCount++;
        this.currentLoopStamp = stamp;
        const now = Date.now();
        let inputUp = false, inputDown = false, inputEnter = false;

        if (now - this.lastInputTime > 200) {
            if (this.state.userInput.up) { inputUp = true; this.lastInputTime = now; }
            if (this.state.userInput.down) { inputDown = true; this.lastInputTime = now; }
            if (this.state.userInput.enter) { inputEnter = true; this.lastInputTime = now; }
        } else if (!this.state.userInput.up && !this.state.userInput.down && !this.state.userInput.enter) {
            this.lastInputTime = 0;
        }

        if (this.gameState === 'MENU') {
            this.drawMenu();
            if (inputUp) this.menuCursor = Math.max(0, this.menuCursor - 1);
            if (inputDown) this.menuCursor = Math.min(1, this.menuCursor + 1);
            if (inputEnter) {
                this.gameMode = this.menuCursor === 0 ? 'SOLO' : 'MULTI';
                this.initPlayersData();
                this.loadPlayerState(0);
                this.gameState = 'PLAYING';
            }
        }
        else if (this.gameState === 'PLAYING') {
            this.checkUserInput(); 
            this.checkCollisions(); 
            this.updateObjects(); 
            this.renderObjects();

            if(this.state.balls.length <= 0) {
                this.state.lives--; 
                this.saveCurrentPlayerState();

                if (this.gameMode === 'SOLO') {
                    if (this.state.lives <= 0) {
                        this.gameState = 'GAMEOVER';
                        this.gameOverCursor = 0;
                    } else {
                        this.spawnBall();
                        this.state.paddle.setWidth(1);
                        this.state.paddle.hasLaser=false; this.state.paddle.isSticky=false;
                    }
                } else {
                    this.gameState = 'SWITCHING';
                    this.switchTimer = stamp;
                    const nextPlayer = (this.currentPlayerIndex + 1) % 2;
                    this.loadPlayerState(nextPlayer);
                }
            }
        }
        else if (this.gameState === 'SWITCHING') {
            this.drawSwitching();
            if (stamp - this.switchTimer > 2000) {
                if (this.gameState === 'GAMEOVER') return;
                this.gameState = 'PLAYING';
            }
        }
        else if (this.gameState === 'GAMEOVER') {
            this.drawGameOver();
            if (inputUp) this.gameOverCursor = Math.max(0, this.gameOverCursor - 1);
            if (inputDown) this.gameOverCursor = Math.min(1, this.gameOverCursor + 1);
            if (inputEnter) {
                if (this.gameOverCursor === 0) {
                    this.initPlayersData();
                    this.loadPlayerState(0);
                    this.gameState = 'PLAYING';
                } else {
                    this.gameState = 'MENU';
                    this.menuCursor = 0;
                }
            }
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
        else if(evt.key==='Up'||evt.key==='ArrowUp') { this.state.userInput.up = isActive; }
        else if(evt.key==='Down'||evt.key==='ArrowDown') { this.state.userInput.down = isActive; }
        else if(evt.key===' '||evt.code==='Space') { this.state.userInput.space = isActive; }
        else if(evt.key==='Enter') { this.state.userInput.enter = isActive; }
    }
}

const theGame = new Game(customConfig, levelsConfig);
export default theGame;