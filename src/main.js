var TILE_SIZE = 20;

var game = new Phaser.Game(42*TILE_SIZE, 21*TILE_SIZE, Phaser.AUTO, 'snake',
			   { preload: preload,
			     create: create,
			     update: update ,
			     render: render });

function preload() {
    game.load.image('tile', 'assets/tile.png');
    game.load.image('chunk', 'assets/chunk.png');
    game.load.image('food', 'assets/food.png');
    game.load.image('img_music', 'assets/music.png');

    game.load.audio('eat', ['assets/eat.mp3', 'assets/eat.ogg']);
    game.load.audio('gameover', ['assets/gameover.mp3', 'assets/gameover.ogg']);
    game.load.audio('music', ['assets/8bit-music-loop.wav', 'assets/8bit-music-loop.mp3', 'assets/8bit-music-loop.ogg']);

    game.load.spritesheet('btn', 'assets/button_sprite_sheet.png', 260, 100);
}

// image grid (y: 21 x: 42)
var images = [
    new Array(42), new Array(42), new Array(42), new Array(42),
    new Array(42), new Array(42), new Array(42), new Array(42),
    new Array(42), new Array(42), new Array(42), new Array(42),
    new Array(42), new Array(42), new Array(42), new Array(42),
    new Array(42), new Array(42), new Array(42), new Array(42),
    new Array(42)
];

// to handle inputs
var direction = {
    STOP:  0,
    UP:    1,
    DOWN:  2,
    LEFT:  3,
    RIGHT: 4
};
var current_direction = direction.STOP;
var upKey;
var downKey;
var leftKey;
var rightKey;

var button;

// game state and score
var game_state = {
    MENU: 0,
    GAME: 1
};
var current_state = game_state.MENU;
var score = 0;
var max_score_easy, max_score_medium, max_score_hard;

// next event time
var next_event = 0;

// snake
var snake = new Snake(20, 10);

var foodX;
var foodY;

var music;
var difficultyFactor;
var difficulty;

var img_music;

function rand_foodX() {
    return Math.floor(Math.random() * 38) + 2;
}
function rand_foodY() {
    return Math.floor(Math.random() * 17) + 2;
}

function create() {
    music = game.add.audio('music', 0.9, true, true);
    snd_eat = game.add.audio('eat', 0.3, false, true);
    snd_gameover = game.add.audio('gameover', 0.2, false, true);
    game.stage.backgroundColor = '#000';
    for(var y = 0; y < 21; ++y)
	for(var x = 0; x < 42; ++x)
	    images[y][x] = game.add.sprite(x*TILE_SIZE, y*TILE_SIZE, 'tile');
    music_btn();
    draw_frame();
    getMaxScores();
    spawn_food();
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    button = game.add.button(250, 120, 'btn', btnPlayClick, this, 2, 1, 0);
    button.events.onInputOver.add(overBtn, this);
}

function music_btn() {
    if(img_music != null)
	img_music.destroy();
    img_music = game.add.sprite(780, 30, 'img_music');
    img_music.inputEnabled = true;
    img_music.events.onInputDown.add(music_on_off, this);
}

function music_on_off() {
    if(music.isPlaying)
	music.stop();
    else
	music.play();
}

function getMaxScores() {
    max_score_easy   = localStorage.getItem('snake_max_score_easy');
    max_score_medium = localStorage.getItem('snake_max_score_medium');
    max_score_hard   = localStorage.getItem('snake_max_score_hard');
}

function overBtn() {
    snd_eat.play();
}

function displayDifficultyChoice() {
    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    textBtnEasy = game.add.text(270, 140, 'Easy', style);
    textBtnMedium = game.add.text(270, 200, 'Medium', style);
    textBtnHard = game.add.text(270, 260, 'Hard', style);
    textBtnEasy.inputEnabled = true;
    textBtnMedium.inputEnabled = true;
    textBtnHard.inputEnabled = true;
    textBtnEasy.events.onInputOver.add(over, this);
    textBtnEasy.events.onInputOut.add(out, this);
    textBtnEasy.events.onInputDown.add(BtnEasyDown, this);
    textBtnMedium.events.onInputOver.add(over, this);
    textBtnMedium.events.onInputOut.add(out, this);
    textBtnMedium.events.onInputDown.add(BtnMediumDown, this);
    textBtnHard.events.onInputOver.add(over, this);
    textBtnHard.events.onInputOut.add(out, this);
    textBtnHard.events.onInputDown.add(BtnHardDown, this);
}

function over(item) {
    snd_eat.play();
    item.fill = "#a00909";
}

function out(item) {
    item.fill = "#fff";
}

function BtnEasyDown(item) {
    difficulty = 1;
    difficultyFactor = 1;
    startGame();
}

function BtnMediumDown(item) {
    difficulty = 2;
    difficultyFactor = 0.8;
    startGame();
}

function BtnHardDown(item) {
    difficulty = 3;
    difficultyFactor = 0.5;
    startGame();
}

function btnPlayClick() {
    displayDifficultyChoice();
    button.visible = false;
}

function startGame() {
    textBtnEasy.visible = false;
    textBtnMedium.visible = false;
    textBtnHard.visible = false;
    music.play();
    current_state = game_state.GAME;
    score = 0;
    images[foodY][foodX].destroy();
    images[foodY][foodX] = game.add.sprite(foodX*TILE_SIZE, foodY*TILE_SIZE, 'food');
    music_btn();
}

function render() {
    this.game.debug.text('SCORE: '+score, 16, 28, 'red', 'Segoe UI');
    this.game.debug.text('MAX SCORE: easy: '+max_score_easy
			 +' medium: '+max_score_medium
			 +' hard: '+max_score_hard, 16, 42, 'red', 'Segoe UI');
    this.game.debug.text('CONTROLS: arrow keys', 16, 56, 'red', 'Segoe UI');
}

function update() {
    check_input();
    if(current_state == game_state.GAME && next_event < game.time.now) {
	move();
	check_eat();
	check_game_over();
	next_event = game.time.now + (100*difficultyFactor);
    }
}

function check_input() {
    if(upKey.isDown && current_direction != direction.DOWN)
	current_direction = direction.UP;
    else if(downKey.isDown && current_direction != direction.UP)
	current_direction = direction.DOWN;
    else if(leftKey.isDown && current_direction != direction.RIGHT)
	current_direction = direction.LEFT;
    else if(rightKey.isDown && current_direction != direction.LEFT)
	current_direction = direction.RIGHT;
}

function move() {
    snake.move(current_direction);
    draw_snake();
}

function check_eat() {
    if(snake.head.x == foodX && snake.head.y == foodY) {
	snake.grow();
	snd_eat.play();
	score+=1;
	spawn_food();
	images[foodY][foodX].destroy();
	images[foodY][foodX] = game.add.sprite(foodX*TILE_SIZE, foodY*TILE_SIZE, 'food');
	music_btn();
    }
}

function spawn_food() {
    foodX = rand_foodX();
    foodY = rand_foodY();
    if(snake.is_on(foodX, foodY))
	spawn_food();
}

function check_game_over() {
    if(is_on_border(snake.head.x, snake.head.y) || snake.collide())
	game_over();
}

function is_on_border(x, y) {
    return(x > 40 || x < 1 || y > 19 || y < 1);
}

function game_over() {
    music.pause();
    snd_gameover.play();
    current_state = game_state.MENU;
    clean_board();
    current_direction = direction.STOP;
    snake = new Snake(20, 10);
    spawn_food();
    button.destroy();
    button = game.add.button(250, 120, 'btn', btnPlayClick, this, 2, 1, 0);
    button.events.onInputOver.add(overBtn, this);
    updateMaxScore();
}

function updateMaxScore() {
    if(difficulty == 1) {
	if(score > max_score_easy) {
	    max_score_easy = score;
	    localStorage.setItem('snake_max_score_easy', max_score_easy);
	}
    }
    else if(difficulty == 2) {
	if(score > max_score_medium) {
	    max_score_medium = score;
	    localStorage.setItem('snake_max_score_medium', max_score_medium);
	}
    }
    else if(difficulty == 3) {
	if(score > max_score_hard) {
	    max_score_hard = score;
	    localStorage.setItem('snake_max_score_hard', max_score_hard);
	}
    }
}

function clean_board() {
   for(var y = 0; y < 21; ++y)
       for(var x = 0; x < 42; ++x) {
	   images[y][x].destroy();
	   images[y][x] = game.add.sprite(x*TILE_SIZE, y*TILE_SIZE, 'tile');
       }
    music_btn();
    draw_frame();
}

function draw_snake() {
    if(!snake.hasEaten && snake.previousTail != null) {
	images[snake.previousTail.y][snake.previousTail.x].destroy();
	images[snake.previousTail.y][snake.previousTail.x] =
	    game.add.sprite(snake.previousTail.x*TILE_SIZE,
			    snake.previousTail.y*TILE_SIZE,
			    'tile');
    }
    else {
	snake.hasEaten = false;
    }
    images[snake.head.y][snake.head.x].destroy();
    images[snake.head.y][snake.head.x] =
	game.add.sprite(snake.head.x*TILE_SIZE,
			snake.head.y*TILE_SIZE,
			'chunk');
    music_btn();
}

function draw_frame() {
    var style = { font: "bold 20px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    game.add.text(10, 0, "---------------------------------------------------------------------------------------------------------------------", style);
    game.add.text(10, 395, "---------------------------------------------------------------------------------------------------------------------", style);
    for(var y=10; y<395; y+=22) {
	game.add.text(9, y, "|", style);
	game.add.text(824, y, "|", style);
    }
}

