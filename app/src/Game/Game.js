// Import de la feuille de style
import '../assets/css/style.css';
// Import des données de configuration
import customConfig from '../config.json';
import levelsConfig from '../levels.json';
// Import des assets de sprite
import ballImgSrc from '../assets/img/ball.png';
import paddleImgSrc from '../assets/img/paddle.png';
import brickImgSrc from '../assets/img/brick.png';
import edgeImgSrc from '../assets/img/edge.png';
import Ball from './Ball';
import GameObject from './GameObject';
import CollisionType from './DataType/CollisionType';
import Paddle from './Paddle';
import Brick from './Brick';

class Game
{
    config = {
        canvasSize: {
            width: 800,
            height: 600
        },
        ball: {
            radius: 10,
            orientation: 45,
            speed: 3,
            position: {
                x: 400,
                y: 300
            },
            angleAlteration: 30
        },
        paddleSize: {
            width: 100,
            height: 20
        }

    };
    
    // Données des niveaux
    levels;

    // Contexte de dessin du canvas
    ctx;

    // Elements HTML
    elScore;
    elLives;
    elLevel; // Nouvel affichage pour le niveau

    currentLoopStamp;
    debugSpan;
    debugInfo = '';

    images = {
        ball: null,
        paddle: null,
        brick: null,
        edge: null
    };

    state = {
        score: 0, 
        lives: 3,
        currentLevelIndex: 0, // <--- On suit le niveau actuel ici
        balls: [],
        bricks: [],
        deathEdge: null,
        bouncingEdges: [],
        paddle: null,
        userInput: {
            paddleLeft: false,
            paddleRight: false
        }
    };

    constructor( customConfig = {}, levelsConfig = [] ) {
        Object.assign( this.config, customConfig );
        this.levels = levelsConfig;
    }

    start() {
        console.log('Jeu démarré ...');
        this.initHtmlUI();
        this.initImages();
        this.initGameObjects();
        requestAnimationFrame( this.loop.bind(this) );
    }

    initHtmlUI() {
        const elH1 = document.createElement('h1');
        elH1.textContent = 'Arkanoïd';

        // Barre d'info
        const infoBar = document.createElement('div');
        infoBar.style.display = 'flex';
        infoBar.style.justifyContent = 'space-between';
        infoBar.style.width = this.config.canvasSize.width + 'px';
        infoBar.style.marginBottom = '10px';
        infoBar.style.fontFamily = 'sans-serif';
        infoBar.style.fontWeight = 'bold';

        this.elLives = document.createElement('span');
        this.elLives.textContent = `Vies: ${this.state.lives}`;
        
        // Affichage du Niveau
        this.elLevel = document.createElement('span');
        this.elLevel.textContent = `Niveau: ${this.state.currentLevelIndex + 1}`;

        this.elScore = document.createElement('span');
        this.elScore.textContent = `Score: ${this.state.score}`;

        infoBar.append(this.elLives, this.elLevel, this.elScore);

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;

        this.debugSpan = document.createElement( 'span' );
        
        document.body.append( elH1, infoBar, elCanvas, this.debugSpan );

        this.ctx = elCanvas.getContext('2d');

        document.addEventListener( 'keydown', this.handlerKeyboard.bind(this, true) );
        document.addEventListener( 'keyup', this.handlerKeyboard.bind(this, false) );
    }

    initImages() {
        const imgBall = new Image(); imgBall.src = ballImgSrc; this.images.ball = imgBall;
        const imgPaddle = new Image(); imgPaddle.src = paddleImgSrc; this.images.paddle = imgPaddle;
        const imgBrick = new Image(); imgBrick.src = brickImgSrc; this.images.brick = imgBrick;
        const imgEdge = new Image(); imgEdge.src = edgeImgSrc; this.images.edge = imgEdge;
    }

    spawnBall() {
        const ballDiamater = this.config.ball.radius * 2;
        const ball = new Ball(
            this.images.ball,
            ballDiamater, ballDiamater,
            this.config.ball.orientation,
            this.config.ball.speed
        );
        ball.setPosition(
            this.config.ball.position.x,
            this.config.ball.position.y
        );
        ball.isCircular = true;
        
        this.state.balls = [ ball ];
    }

    // Passage au niveau suivant
    nextLevel() {
        // On incrémente l'index
        this.state.currentLevelIndex++;

        // Vérification Victoire Globale (si on dépasse le nombre de niveaux dispo)
        if (this.state.currentLevelIndex >= this.levels.data.length) {
            alert("FÉLICITATIONS ! VOUS AVEZ FINI TOUS LES NIVEAUX ! Score Final : " + this.state.score);
            window.location.reload();
            return;
        }

        // Sinon, on charge le niveau suivant
        console.log("Chargement du niveau " + (this.state.currentLevelIndex + 1));
        
        // Mise à jour affichage HTML
        this.elLevel.textContent = `Niveau: ${this.state.currentLevelIndex + 1}`;

        // On vide les briques et les balles actuelles
        this.state.bricks = [];
        this.state.balls = [];

        // On remet la balle en place
        this.spawnBall();
        
        // On charge les nouvelles briques
        this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
    }

    initGameObjects() {
        this.spawnBall();

        // Death Edge
        const deathEdge = new GameObject(this.images.edge, this.config.canvasSize.width, 20);
        deathEdge.setPosition(0, this.config.canvasSize.height + 30);
        this.state.deathEdge = deathEdge;

        // Bouncing Edges
        const edgeTop = new GameObject(this.images.edge, this.config.canvasSize.width, 20);
        edgeTop.setPosition(0, 0);

        const edgeRight = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10);
        edgeRight.setPosition(this.config.canvasSize.width - 20, 20);
        edgeRight.tag = 'RightEdge';

        const edgeLeft = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10);
        edgeLeft.setPosition(0, 20);
        edgeLeft.tag = 'LeftEdge';

        this.state.bouncingEdges.push(edgeTop, edgeRight, edgeLeft);

        // Paddle
        const paddle = new Paddle(
            this.images.paddle,
            this.config.paddleSize.width,
            this.config.paddleSize.height,
            0,
            0
        );
        paddle.setPosition(
            (this.config.canvasSize.width / 2) - ( this.config.paddleSize.width / 2),
            this.config.canvasSize.height - this.config.paddleSize.height - 20
        );
        this.state.paddle = paddle;

        // Chargement initial du niveau correspondant à l'index (0 au début)
        this.loadBricks(this.levels.data[this.state.currentLevelIndex]);
    }

    loadBricks( levelArray ) {
        for( let line = 0; line < levelArray.length; line ++ ) {
            for( let column = 0; column < levelArray[line].length; column ++ ) {
                let brickType = levelArray[line][column];
                if( brickType == 0 ) continue;

                const brick = new Brick( this.images.brick, 50, 25, brickType );
                brick.setPosition(
                    20 + (50 * column),
                    20 + (25 * line)
                );
                this.state.bricks.push( brick );
            }
        }
    }

    checkUserInput() {
        if( this.state.userInput.paddleRight ) {
            this.state.paddle.orientation = 0;
            this.state.paddle.speed = 7;
        }
        if( this.state.userInput.paddleLeft ) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = 7;
        }
        if( ! this.state.userInput.paddleRight && ! this.state.userInput.paddleLeft ) {
            this.state.paddle.speed = 0;
        }
        this.state.paddle.update();
    }

    checkCollisions() {
        this.state.bouncingEdges.forEach( theEdge => {
            const collisionType = this.state.paddle.getCollisionType( theEdge );
            if( collisionType !== CollisionType.HORIZONTAL ) return;
            this.state.paddle.speed = 0;
            const edgeBounds = theEdge.getBounds();
            if( theEdge.tag === "RightEdge" ) {
                this.state.paddle.position.x = edgeBounds.left - 1 - this.state.paddle.size.width;
            } else if( theEdge.tag === "LeftEdge" ) {
                this.state.paddle.position.x = edgeBounds.right + 1;
            }
            this.state.paddle.update();
        });

        const savedBalls = [];

        this.state.balls.forEach( theBall => {
            if( theBall.getCollisionType( this.state.deathEdge ) !== CollisionType.NONE ) return;
            savedBalls.push( theBall );

            this.state.bouncingEdges.forEach( theEdge => {
                const collisionType = theBall.getCollisionType( theEdge );
                switch( collisionType ) {
                    case CollisionType.NONE: return;
                    case CollisionType.HORIZONTAL: theBall.reverseOrientationX(); break;
                    case CollisionType.VERTICAL: theBall.reverseOrientationY(); break;
                }
            });

            this.state.bricks.forEach( theBrick => {
                const collisionType = theBall.getCollisionType( theBrick );
                switch( collisionType ) {
                    case CollisionType.NONE: return;
                    case CollisionType.HORIZONTAL: theBall.reverseOrientationX(); break;
                    case CollisionType.VERTICAL: theBall.reverseOrientationY(); break;
                }

                if (theBrick.isUnbreakable) return;

                theBrick.strength --;
                this.state.score += 10;
                this.elScore.textContent = `Score: ${this.state.score}`;
            });

            const paddleCollisionType = theBall.getCollisionType( this.state.paddle );
            switch( paddleCollisionType ) {
                case CollisionType.HORIZONTAL: theBall.reverseOrientationX(); break;
                case CollisionType.VERTICAL:
                    let alteration = 0;
                    if( this.state.userInput.paddleRight ) alteration = -1 * this.config.ball.angleAlteration;
                    else if( this.state.userInput.paddleLeft ) alteration = this.config.ball.angleAlteration;
                    theBall.reverseOrientationY(alteration);
                    if( theBall.orientation === 0 ) theBall.orientation = 10;
                    else if( theBall.orientation === 180 ) theBall.orientation = 170;
                    break;
            }
        });

        this.state.balls = savedBalls;
    }

    updateObjects() {
        this.state.balls.forEach( theBall => theBall.update() );

        // Nettoyage des briques détruites
        this.state.bricks = this.state.bricks.filter( theBrick => theBrick.strength !== 0 );
        
        this.state.paddle.updateKeyframe();

        // --- VERIFICATION DE LA FIN DU NIVEAU ---
        // On compte combien de briques destructibles il reste
        const destructibleBricksLeft = this.state.bricks.filter( b => !b.isUnbreakable ).length;

        // S'il n'en reste aucune, on passe au niveau suivant
        if (destructibleBricksLeft === 0) {
            this.nextLevel();
        }
    }

    renderObjects() {
        this.ctx.clearRect(0, 0, this.config.canvasSize.width, this.config.canvasSize.height);
        this.state.bouncingEdges.forEach( theEdge => theEdge.draw() );
        this.state.bricks.forEach( theBrick => theBrick.draw() );
        this.state.paddle.draw();
        this.state.balls.forEach( theBall => theBall.draw() );
    }

    loop(stamp) {
        this.currentLoopStamp = stamp;
        this.checkUserInput();
        this.checkCollisions();
        this.updateObjects();
        this.renderObjects();

        if( this.state.balls.length <= 0 ) {
            this.state.lives --;
            this.elLives.textContent = `Vies: ${this.state.lives}`;
            
            if (this.state.lives > 0) {
                 this.spawnBall();
            } else {
                alert("Game Over ! Score final : " + this.state.score);
                window.location.reload();
                return;
            }
        }

        requestAnimationFrame( this.loop.bind(this) );
    }

    addDebugInfo( label, value ) {
        this.debugInfo += label + ': ' + value + '<br>';
    }

    handlerKeyboard( isActive, evt ) {
        if( evt.key === 'Right' || evt.key === 'ArrowRight' ) {
            if( isActive && this.state.userInput.paddleLeft ) this.state.userInput.paddleLeft = false;
            this.state.userInput.paddleRight = isActive;
        }
        else if( evt.key === 'Left' || evt.key === 'ArrowLeft' ) {
            if( isActive && this.state.userInput.paddleRight ) this.state.userInput.paddleRight = false;
            this.state.userInput.paddleLeft = isActive;
        }
    }
}

const theGame = new Game(customConfig, levelsConfig);
export default theGame;