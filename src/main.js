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

    game.load.image('btn', 'assets/playbutton.png');
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

// next event time
var next_event = 0;

// snake
var snake = new Snake(20, 10);

var foodX;
var foodY;

function rand_foodX() {
    return Math.floor(Math.random() * 38) + 2;
}
function rand_foodY() {
    return Math.floor(Math.random() * 17) + 2;
}

function create() {
    game.stage.backgroundColor = '#000';
    for(var y = 0; y < 21; ++y)
	for(var x = 0; x < 42; ++x)
	    images[y][x] = game.add.sprite(x*TILE_SIZE, y*TILE_SIZE, 'tile');
    spawn_food();
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    button = game.add.button(250, 120, 'btn', actionOnClick, this, 2, 1, 0);
}

function actionOnClick () {
    current_state = game_state.GAME;
    button.visible = false;
    score = 0;
    images[foodY][foodX].destroy();
    images[foodY][foodX] = game.add.sprite(foodX*TILE_SIZE, foodY*TILE_SIZE, 'food');
}

function render() {
    this.game.debug.text('SCORE: '+score, 10, 14, 'red', 'Segoe UI');
    this.game.debug.text('CONTROLS: arrow keys', 10, 28, 'red', 'Segoe UI');
}

function update() {
    if(current_state == game_state.GAME && next_event < game.time.now) {
	check_input();
	move();
	check_eat();
	check_game_over();
	next_event = game.time.now + 100;
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
	score+=1;
	spawn_food();
	images[foodY][foodX].destroy();
	images[foodY][foodX] = game.add.sprite(foodX*TILE_SIZE, foodY*TILE_SIZE, 'food');
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
    current_state = game_state.MENU;
    clean_board();
    current_direction = direction.STOP;
    snake = new Snake(20, 10);
    spawn_food();
    button.destroy();
    button = game.add.button(250, 120, 'btn', actionOnClick, this, 2, 1, 0);
}

function clean_board() {
   for(var y = 0; y < 21; ++y)
       for(var x = 0; x < 42; ++x) {
	   images[y][x].destroy();
	   images[y][x] = game.add.sprite(x*TILE_SIZE, y*TILE_SIZE, 'tile');
       }
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
}
