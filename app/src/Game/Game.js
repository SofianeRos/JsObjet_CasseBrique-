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

    // Elements HTML pour le score et les vies
    elScore;
    elLives;

    // Timestamp haute résolution de la boucle d'animation 
    currentLoopStamp;

    // <span> de débug
    debugSpan;
    debugInfo = '';

    // Images
    images = {
        ball: null,
        paddle: null,
        brick: null,
        edge: null
    };

    // State (un objet qui décrit l'état actuel du jeu, les balles, les briques encore présentes, etc.)
    state = {
        score: 0, 
        lives: 3, 
        // Balles (plusieurs car possible multiball)
        balls: [],
        // Briques
        bricks: [],
        // Bordure de la mort
        deathEdge: null,
        // Bordures à rebond
        bouncingEdges: [],
        // Paddle
        paddle: null,
        // Entrées utilisateur
        userInput: {
            paddleLeft: false,
            paddleRight: false
        }
    };

    constructor( customConfig = {}, levelsConfig = [] ) {
        // Object.assign() permet de fusionner deux objets littéraux (seulement le premier niveau)
        Object.assign( this.config, customConfig );

        this.levels = levelsConfig;
    }

    start() {
        console.log('Jeu démarré ...');
        // Initialisation de l'interface HTML
        this.initHtmlUI();
        // Initialisation des images
        this.initImages();
        // Initialisation des objets du jeu
        this.initGameObjects();
        // Lancement de la boucle
        requestAnimationFrame( this.loop.bind(this) );
    }

    // Méthodes "privées"
    initHtmlUI() {
        const elH1 = document.createElement('h1');
        elH1.textContent = 'Arkanoïd';

        // --- BARRE D'INFO (Score / Vies) ---
        const infoBar = document.createElement('div');
        infoBar.style.display = 'flex';
        infoBar.style.justifyContent = 'space-between';
        infoBar.style.width = this.config.canvasSize.width + 'px';
        infoBar.style.marginBottom = '10px';
        infoBar.style.fontFamily = 'sans-serif';
        infoBar.style.fontWeight = 'bold';

        this.elLives = document.createElement('span');
        this.elLives.textContent = `Vies: ${this.state.lives}`;
        
        this.elScore = document.createElement('span');
        this.elScore.textContent = `Score: ${this.state.score}`;

        infoBar.append(this.elLives, this.elScore);
        // -----------------------------------

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;

        // Débug box
        this.debugSpan = document.createElement( 'span' );
        
        // Ajout des éléments au DOM
        document.body.append( elH1, infoBar, elCanvas, this.debugSpan );

        // Récupération du contexte de dessin
        this.ctx = elCanvas.getContext('2d');

        // Écouteur d'évènements du clavier
        document.addEventListener( 'keydown', this.handlerKeyboard.bind(this, true) );
        document.addEventListener( 'keyup', this.handlerKeyboard.bind(this, false) );
    }

    // Création des images
    initImages() {
        const imgBall = new Image();
        imgBall.src = ballImgSrc;
        this.images.ball = imgBall;

        const imgPaddle = new Image();
        imgPaddle.src = paddleImgSrc;
        this.images.paddle = imgPaddle;

        const imgBrick = new Image();
        imgBrick.src = brickImgSrc;
        this.images.brick = imgBrick;

        const imgEdge = new Image();
        imgEdge.src = edgeImgSrc;
        this.images.edge = imgEdge;
    }

    // Méthode pour faire apparaître une balle (utilisée au début et après une mort)
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
        
        // On réinitialise le tableau de balles
        this.state.balls = [ ball ];
    }

    // Mise en place des objets du jeu sur la scene
    initGameObjects() {
        // Balle
        this.spawnBall();

        // Bordure de la mort
        const deathEdge = new GameObject(
            this.images.edge,
            this.config.canvasSize.width,
            20
        );
        deathEdge.setPosition(
            0,
            this.config.canvasSize.height + 30
        );
        this.state.deathEdge = deathEdge;

        // -- Bordures à rebond
        // Haut
        const edgeTop = new GameObject(
            this.images.edge,
            this.config.canvasSize.width,
            20
        );
        edgeTop.setPosition(0, 0);

        // Droite
        const edgeRight = new GameObject(
            this.images.edge,
            20,
            this.config.canvasSize.height + 10
        );
        edgeRight.setPosition(
            this.config.canvasSize.width - 20,
            20
        );
        edgeRight.tag = 'RightEdge';

        // Gauche
        const edgeLeft = new GameObject(
            this.images.edge,
            20,
            this.config.canvasSize.height + 10
        );
        edgeLeft.setPosition(0, 20);
        edgeLeft.tag = 'LeftEdge';

        // Ajout dans la liste des bords
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

        // Chargement de briques
        this.loadBricks(this.levels.data[0]);
    }

    // Création des briques
    loadBricks( levelArray ) {
        // Lignes
        for( let line = 0; line < levelArray.length; line ++ ) {
            // Colonnes
            for( let column = 0; column < levelArray[line].length; column ++ ) {
                let brickType = levelArray[line][column];
                // Si la valeur trouvée est 0, c'est un espace vide
                if( brickType == 0 ) continue;

                // Création de la brique
                const brick = new Brick( this.images.brick, 50, 25, brickType );
                brick.setPosition(
                    20 + (50 * column),
                    20 + (25 * line)
                );

                this.state.bricks.push( brick );
            }
        }
    }


    // Cycle de vie: 1- Entrées Utilisateur
    checkUserInput() {
        // -- Paddle
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

    // Cycle de vie: 2- Collisions et calculs qui en découlent
    checkCollisions() {

        // Collisions du paddle avec les bords
        this.state.bouncingEdges.forEach( theEdge => {
            const collisionType = this.state.paddle.getCollisionType( theEdge );

            if( collisionType !== CollisionType.HORIZONTAL ) return;

            this.state.paddle.speed = 0;

            const edgeBounds = theEdge.getBounds();

            if( theEdge.tag === "RightEdge" ) {
                this.state.paddle.position.x = edgeBounds.left - 1 - this.state.paddle.size.width;
            }
            else if( theEdge.tag === "LeftEdge" ) {
                this.state.paddle.position.x = edgeBounds.right + 1;
            }

            this.state.paddle.update();
        });

        // Collisions des balles avec tous les objets
        const savedBalls = [];

        this.state.balls.forEach( theBall => {
            
            // Collision de la balle avec le bord de la mort
            if( theBall.getCollisionType( this.state.deathEdge ) !== CollisionType.NONE ) {
                return;
            }

            savedBalls.push( theBall );

            // Collisions de la balle avec les bords rebondissants
            this.state.bouncingEdges.forEach( theEdge => {
                const collisionType = theBall.getCollisionType( theEdge );

                switch( collisionType ) {
                    case CollisionType.NONE: return;
                    case CollisionType.HORIZONTAL: theBall.reverseOrientationX(); break;
                    case CollisionType.VERTICAL: theBall.reverseOrientationY(); break;
                    default: break;
                }
            });

            // Collisions de la balle avec les briques
            this.state.bricks.forEach( theBrick => {
                const collisionType = theBall.getCollisionType( theBrick );

                switch( collisionType ) {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        theBall.reverseOrientationX();
                        break;

                    case CollisionType.VERTICAL:
                        theBall.reverseOrientationY();
                        break;

                    default:
                        break;
                }

                // --- GESTION BRIQUE INCASSABLE ---
                // Si la brique est incassable, on s'arrête là.
                // Le rebond a déjà eu lieu dans le switch.
                if (theBrick.isUnbreakable) {
                    return; 
                }

                // Sinon, on détruit et on compte les points
                theBrick.strength --;
                
                this.state.score += 10;
                this.elScore.textContent = `Score: ${this.state.score}`;
            });

            // Collision avec le paddle
            const paddleCollisionType = theBall.getCollisionType( this.state.paddle );
            switch( paddleCollisionType ) {
                case CollisionType.HORIZONTAL:
                    theBall.reverseOrientationX();
                    break;

                case CollisionType.VERTICAL:
                    let alteration = 0;
                    if( this.state.userInput.paddleRight )
                        alteration = -1 * this.config.ball.angleAlteration;
                    else if( this.state.userInput.paddleLeft )
                        alteration = this.config.ball.angleAlteration;

                    theBall.reverseOrientationY(alteration);
                    
                    if( theBall.orientation === 0 ) theBall.orientation = 10;
                    else if( theBall.orientation === 180 ) theBall.orientation = 170;

                    break;

                default:
                    break;
            }
        });

        this.state.balls = savedBalls;
    }

    // Cycle de vie: 3- Mise à jours des données des GameObjects
    updateObjects() {
        // Balles
        this.state.balls.forEach( theBall => {
            theBall.update();
        });

        // Briques : On supprime celles qui ont 0 PV
        this.state.bricks = this.state.bricks.filter( theBrick => theBrick.strength !== 0 );
    
        // Paddle
        this.state.paddle.updateKeyframe();
    }

    // Cycle de vie: 4- Rendu graphique des GameObjects
    renderObjects() {
        this.ctx.clearRect(
            0,
            0,
            this.config.canvasSize.width,
            this.config.canvasSize.height
        );

        this.state.bouncingEdges.forEach( theEdge => theEdge.draw() );
        this.state.bricks.forEach( theBrick => theBrick.draw() );
        this.state.paddle.draw();
        this.state.balls.forEach( theBall => theBall.draw() );
    }

    // Boucle d'animation
    loop(stamp) {
        this.currentLoopStamp = stamp;
        
        this.checkUserInput();
        this.checkCollisions();
        this.updateObjects();
        this.renderObjects();

        // --- GESTION DU GAME OVER / RESPAWN ---
        if( this.state.balls.length <= 0 ) {
            
            this.state.lives --;
            this.elLives.textContent = `Vies: ${this.state.lives}`;
            
            if (this.state.lives > 0) {
                 // Encore des vies : on relance
                 this.spawnBall();
            } else {
                // Plus de vies : Game Over
                console.log( "Game Over !!!");
                alert("Game Over ! Score final : " + this.state.score);
                // On recharge la page pour recommencer (simple et efficace)
                window.location.reload();
                return;
            }
        }

        requestAnimationFrame( this.loop.bind(this) );
    }

    // debug info
    addDebugInfo( label, value ) {
        this.debugInfo += label + ': ' + value + '<br>';
    }

    // Gestionnaires d'événement DOM
    handlerKeyboard( isActive, evt ) {
        if( evt.key === 'Right' || evt.key === 'ArrowRight' ) {
            if( isActive && this.state.userInput.paddleLeft )
                this.state.userInput.paddleLeft = false;
            this.state.userInput.paddleRight = isActive;
        }
        else if( evt.key === 'Left' || evt.key === 'ArrowLeft' ) {
            if( isActive && this.state.userInput.paddleRight )
                this.state.userInput.paddleRight = false;
            this.state.userInput.paddleLeft = isActive;
        }
    }
}

const theGame = new Game(customConfig, levelsConfig);

export default theGame;