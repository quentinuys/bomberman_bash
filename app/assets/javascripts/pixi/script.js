$(document).ready(function(){
  //Test that Pixi is working

  console.log(PIXI);
  //Create the renderer
  var Container = PIXI.Container,
      autoDetectRenderer = PIXI.autoDetectRenderer,
      loader = PIXI.loader,
      resources = PIXI.loader.resources,
      Sprite = PIXI.Sprite,
      Graphics = PIXI.Graphics,
      MovieClip = PIXI.extras.MovieClip,
      Text = PIXI.Text;

  sounds.load([
    "assets/sounds/boing.wav", 
    "assets/sounds/explode.wav",
    "assets/sounds/spring.wav",
    "assets/sounds/walk_fast.wav"
  ]);

  sounds.whenLoaded = setup_sound;
  
  loader
    .add([
      "assets/characters/oldman_down.png",
      "assets/enemies/Mons_2.png",
      "assets/enemies/Mons_6.png",
      "assets/enemies/Mons_8.png",
      "assets/items/bomb.png",
      "assets/items/wood_wall.png",
      "assets/items/ice_wall.png",
      "assets/items/jump_wall.png",
      "assets/items/background.png",
      "assets/items/bomb_distance.png",
      "assets/items/key.png",
      "assets/items/speed.png",
      "assets/items/bombs.png",
      "assets/items/door.png"


    ])
    .load(setup)


  var resolution=window.devicePixelRatio;
  
  var stage_width = 640, stage_height = 640, cell_width = 64;
    //Create a container object called the `stage` and initialize elements
  var stage = new Container(), game_scene = new Container(), end_scene = new Container(),
    renderer = autoDetectRenderer(stage_width, stage_height,{resolution:resolution,autoResize:true,antialias:false}),
    character = '', state = '', wood_boxes = new Container(), msg = '', enemies = new Container(),
    bombs = new Container(), explotions = new Container(), old_vx = 1, old_vy = 1, explode = '',
    boing = '', spring = '', walking = false;
  
  var number_of_speed_on_stage = 1,
  number_of_bombs_on_stage = 1,
  number_of_bomb_distance_on_stage = 1,
  number_of_keys_on_stage = 3,
  items = new Container();

  PIXI.RESOLUTION=2;
  
  var mons = ['Mons_6.png', 'Mons_2.png', 'Mons_8.png'];

  document.body.appendChild(renderer.view);
  $.getScript( "assets/pixi/keyboard.js" );
  $.getScript( "assets/pixi/collision.js" );

  function setup_sound(){

  }

  function setup(){
    explode = sounds["assets/sounds/explode.wav"];
    spring = sounds["assets/sounds/spring.wav"];
    boing = sounds["assets/sounds/boing.wav"],
    walk = sounds["assets/sounds/walk_fast.wav"];
    walk.loop = true;
    
    ground = new Sprite(resources['assets/items/background.png'].texture);

    renderer.view.style.border = "1px dashed black";
    initialize_character();
    initialize_keyboard();
    initialize_wood_boxes();
    initialize_enemies();
    initialize_items();
    game_scene.addChild(ground);
    game_scene.addChild(bombs);
    game_scene.addChild(character);
    game_scene.addChild(items);
    game_scene.addChild(wood_boxes);
    game_scene.addChild(enemies);
    game_scene.addChild(explotions);
    key_bar();
    speed_bar();
    stage.addChild(end_scene);
    stage.addChild(game_scene);
    state = play;
    gameLoop(); 

  }

  function gameLoop() {

    //Loop this function at 60 frames per second
    requestAnimationFrame(gameLoop);

    //Move the character 1 pixel to the right each frame
    state();

    //Render the stage to see the animation
    renderer.render(stage);
  }

  function play(){
    if (keyBar.outer.width < 0) {
      state = end;
    }
    character.old_x = character.x;
    character.old_y = character.y;

    character.x += character.vx;
    character.y += character.vy;

    move_enemies();
    fire_bombs();
    check_collisions();
 
  }

//ACTIONS###################################################
  function add_bomb(){
    var x, y;
    if (bombs.children.length < character.bombs) {
      bomb = new Sprite(resources['assets/items/bomb.png'].texture);
      if(old_vx > 0 && character.x < (stage_width - 65)){
        x = character.x + 65;
      }
      if(old_vx <= 0 && character.x > 65){
        x = character.x - 65;
      }

      y = character.y;
      bomb.x = x;
      bomb.y = y;
      bomb.time = character.bomb_time;
      bomb.strength = character.bomb_strength
      bombs.addChild(bomb);
    }

  }

  function add_explotion(x, y){
    var explotion_animation = ["assets/items/explode_1.png","assets/items/explode_2.png","assets/items/explode_3.png","assets/items/explode_4.png","assets/items/explode_5.png", "assets/items/explode_6.png"];
    var textureArray = [];

    for (var i=0; i < 6; i++)
    {
         var texture = PIXI.Texture.fromImage(explotion_animation[i]);
         textureArray.push(texture);
    };

    var mc = new MovieClip(textureArray);
    mc.x = x
    mc.y = y
    mc.loop = false;
    mc.animationSpeed = .1;
    mc.onComplete = function(){ explotions.removeChild(this) }
    mc.play();
    explode.play();
    explotions.addChild(mc);
  }

  function fire_bombs(){
    for(i=0; i <= bombs.children.length; i++)
    {
      var bom = bombs.children[i];
      
      if(bom){
        bom.time -= 1;
        if(bom.time <= 0){
          bombs.removeChild(bom);
          add_explotion(bom.x, bom.y);
          for (var k = 0; k <= bom.strength; k++) {
            add_explotion((k*64)+bom.x, bom.y);
            add_explotion(bom.x-(k*64), bom.y);
            add_explotion(bom.x, (k*64)+bom.y);
            add_explotion(bom.x, bom.y-(k*64));
          }
        }   
      }
    };
  }

  function check_collisions(){

    wall_collide = contain(character, {x: 5, y: 5, width: stage_width, height: stage_height});
    
    if (wall_collide === "top" || wall_collide === "bottom") {
      character.vy *= -1;
      character.vy = 0;
      boing.play();
    }
    if (wall_collide === "left" || wall_collide === "right") {
      character.vx *= -1;
      character.vx = 0;
      boing.play();
    }

    for (var i = 0; i <= explotions.children.length -1; i++) {
      explotion = explotions.children[i];

      if(hitTestRectangle(explotion, character)){

        stage.removeChild(character);
        state = end;
      }
      for (var k = 0; k <= enemies.children.length -1; k++) {
        enemy = enemies.children[k];
        if(hitTestRectangle(explotion, enemy)){
          enemies.removeChild(enemy);
        }

      }
      for (var m = 0; m <= bombs.children.length -1; m++) {
        bomb = bombs.children[m];
        if(hitTestRectangle(explotion, bomb)){
          bomb.time = 1;
        }

      }
      for (var n = 0; n <= wood_boxes.children.length -1; n++) {
        box = wood_boxes.children[n];
        if(hitTestRectangle(explotion, box)){
          wood_boxes.removeChild(box);
        }
      }

    }
    for (var n = 0; n <= wood_boxes.children.length -1; n++) {
      box = wood_boxes.children[n];
      if(hitTestRectangle(character, box)){
        character.vy = 0;
        character.vx = 0;
        stop_walk_sound();
        character.x = character.old_x;
        character.y = character.old_y;
      }
      for (var o = 0; o <= enemies.children.length -1; o++) {
        enemy = enemies.children[o];
        
        if(hitTestRectangle(enemy, box)){
          if(enemy.vx != 0){
            enemy.vx *= -1;
          }
          else
          {
            enemy.vy *= -1;
          }
        }

      }

    }
    for (var o = 0; o <= enemies.children.length -1; o++) {
      enemy = enemies.children[o];
      enemy_wall_collide = contain(enemy, {x: 5, y: 5, width: stage_width, height: stage_height});
      if (enemy_wall_collide === "top" || enemy_wall_collide === "bottom") {
        enemy.vy *= -1;
      }
      if (enemy_wall_collide === "left" || enemy_wall_collide === "right") {
        enemy.vx *= -1;
      }
      if(hitTestRectangle(character, enemy)){
        stop_walk_sound();
        stage.removeChild(character);
        state = end;

      }
      for (var b = 0; b <= bombs.children.length -1; b++) {
        bomb = bombs.children[b];
        if(hitTestRectangle(bomb, enemy)){
          enemy.vx *= -1;
          spring.play();
        }
      }

    }
    for (var b = 0; b <= bombs.children.length -1; b++) {
      bomb = bombs.children[b];
      if(hitTestRectangle(bomb, character)){
        character.vy = 0;
        character.vx = 0;
        stop_walk_sound();
        character.x = character.old_x;
        character.y = character.old_y;
      }
    }
    for (var it = 0; it <= items.children.length -1; it++) {
      item = items.children[it];
      if(hitTestRectangle(item, character)){
        if (item.item_type=='speed') {
          character.speed += 1;
          speedBar.outer.width = character.speed;
        }
        else if(item.item_type=='bomb_powerup' ){
          character.bombs += 1;
        }
        else if(item.item_type=='bomb_distance' ){
          character.bomb_strength += 1;
        }
        else if(item.item_type=='key' ){
          character.keys += 1;
          keyBar.outer.width -= 50;
        }
        items.removeChild(item);
      }        
    }
  }

  function move_enemies(){
    for (var i = 0; i <= enemies.children.length -1; i++) {
      enemy = enemies.children[i];
      enemy.x = enemy.x + enemy.vx;
      enemy.y = enemy.y + enemy.vy;
    }
  }

  function contain(sprite, container) {

    var collision = undefined;

    //Left
    if (sprite.x < container.x) {
      sprite.x = container.x;
      collision = "left";
    }

    //Top
    if (sprite.y < container.y) {
      sprite.y = container.y;
      collision = "top";
    }

    //Right
    if (sprite.x + sprite.width > container.width) {
      sprite.x = container.width - sprite.width;
      collision = "right";
    }

    //Bottom
    if (sprite.y + sprite.height > container.height) {
      sprite.y = container.height - sprite.height;
      collision = "bottom";
    }

    //Return the `collision` value
    return collision;
  }
  //INITIALIZERS ##############################################
  function initialize_items(){

    var old_item = 1,
      y=1, x;

    for (var i = 0; i <= number_of_speed_on_stage -1; i++) {
      speed = new Sprite(resources['assets/items/speed.png'].texture);
      speed.item_type='speed';
      items.addChild(speed);
    }

    for (var i = 0; i <= number_of_bombs_on_stage -1; i++) {
      bomb_powerup = new Sprite(resources['assets/items/bombs.png'].texture);
      bomb_powerup.item_type='bomb_powerup';
      items.addChild(bomb_powerup);
    }

    for (var i = 0; i <= number_of_bomb_distance_on_stage -1; i++) {
      bd = new Sprite(resources['assets/items/bomb_distance.png'].texture);
      bd.item_type='bomb_distance';
      items.addChild(bd);
    }

    for (var i = 0; i <= number_of_keys_on_stage -1; i++) {
      key = new Sprite(resources['assets/items/key.png'].texture);
      key.item_type='key';
      items.addChild(key);
    }

    var block_array = [];

    for (var i = 1; i <= stage_width; i += 64) {
      block_array.push(i);

    }

 
    for (var i = 0; i <= items.children.length -1; i++) {
      item = items.children[i];

      x = block_array[Math.floor(Math.random() * block_array.length)];
      y = y;
      //Give the blob a random `y` position
      if(i > old_item + 1 )
      {
        old_item = i;
        y = y+128;
      }
      item.height = 50;
      item.width = 50;
      item.x = x + 8;
      item.y = y + 10;
    }

  }

  function initialize_enemies(){
    var numberOfenemies = 5,
      spacing = 128,
      xOffset = 64,
      old_monster = 1,
      y=194, x;

    
    for (var i = 0; i <= numberOfenemies -1; i++) {
      var mon = mons[Math.floor(Math.random() * mons.length)];

      
      x = xOffset * i;
      y = y;
      //Give the blob a random `y` position
      if(i > old_monster )
      {
        old_monster = i;
        y = y+128;

      }

      enemy = new Sprite(resources['assets/enemies/'+mon].texture)
      enemy.height = 50;
      enemy.width = 50;
      enemy.x = x;
      enemy.y = y;
      enemy.vx = 1;
      enemy.vy = 0;
      enemies.addChild(enemy);
    }
  }

  function  initialize_character(){
    character = new Sprite(resources['assets/characters/oldman_down.png'].texture);
    character.width = 60;
    character.height = 60;
    character.x = 65;
    character.y = 65;
    character.vx = 0;
    character.vy = 0;
    character.bomb_time = 120;
    character.bomb_strength = 1;
    character.bombs = 2;
    character.speed = 5;
    character.keys = 0;
    //character.rotation = 0.9;
  }

  function initialize_keyboard(){
    var left = keyboard(37),
      up = keyboard(38),
      right = keyboard(39),
      down = keyboard(40),
      space = keyboard(32);
    //Left arrow key `press` method
    left.press = function() {

      //Change the cat's velocity when the key is pressed
      character.vx = 0 - character.speed;
      character.vy = 0;
      old_vx = 0 - character.speed;
      play_walk_sound();
    };

    //Left arrow key `release` method
    left.release = function() {

      //If the left arrow has been released, and the right arrow isn't down,
      //and the cat isn't moving vertically:
      //Stop the cat
      if (!right.isDown && character.vy === 0) {
        character.vx = 0;
      }
      stop_walk_sound();
    };

    //Up
    up.press = function() {
      character.vy = 0 - character.speed;
      character.vx = 0;
      play_walk_sound();
    };
    up.release = function() {
      if (!down.isDown && character.vx === 0) {
        character.vy = 0;
        stop_walk_sound();
      }
    };

    //Right
    right.press = function() {
      character.vx = character.speed;
      character.vy = 0;
      old_vx = character.speed;
      play_walk_sound();
    };
    right.release = function() {
      if (!left.isDown && character.vy === 0) {
        character.vx = 0;
        stop_walk_sound();
      }
    };

    //Down
    down.press = function() {
      character.vy = character.speed;
      character.vx = 0;
      play_walk_sound();
    };
    down.release = function() {
      if (!up.isDown && character.vx === 0) {
        character.vy = 0;
        stop_walk_sound();
      }
    };
    space.press = function(){
      add_bomb();
    };
  }

  function initialize_wood_boxes(){
    var numberOfBoxes = 10,
      spacing = 128,
      xOffset = 64;

    for (var i = 1; i <= stage_height + 1; i += spacing) {
      for (var k = 1; k <= stage_width + 1; k += xOffset) {
        wood_box = new Sprite(resources['assets/items/wood_wall.png'].texture)
          //Space each blob horizontally according to the `spacing` value.
        //`xOffset` determines the point from the left of the screen
        //at which the first blob should be added
        //Give the blob a random `y` position
        //var y = Math.floor(Math.random() * (stage_height - wood_box.height));

        wood_box.x = k;
        wood_box.y = i;
        wood_boxes.addChild(wood_box);        
      }
    }
  }
  
  function play_walk_sound(){
    if(!walking){
      walk.play();        
    }
    walking = true;
  }

  function stop_walk_sound(){
    walk.pause();  
    walking = false;
  }

  function key_bar(){
    //Create the health bar
    keyBar = new Container();
    keyBar.position.set(game_scene.width - 190, 10)
    game_scene.addChild(keyBar);

    //Create the black background rectangle
    var innerBar = new PIXI.Graphics();
    innerBar.beginFill(0x000000);
    innerBar.drawRect(0, 0, 128, 8);
    innerBar.endFill();
    keyBar.addChild(innerBar);

    //Create the front red rectangle
    var outerBar = new PIXI.Graphics();
    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, 128, 8);
    outerBar.endFill();
    keyBar.addChild(outerBar);

    keyBar.outer = outerBar;
  }

  function speed_bar(){
    //Create the health bar
    speedBar = new Container();
    speedBar.position.set(game_scene.width - 190, 20)
    game_scene.addChild(speedBar);

    //Create the black background rectangle
    var innerBar = new PIXI.Graphics();
    innerBar.beginFill(0x000000);
    innerBar.drawRect(0, 0, 128, 8);
    innerBar.endFill();
    speedBar.addChild(innerBar);

    //Create the front red rectangle
    var outerBar = new PIXI.Graphics();
    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, 1, 8);
    outerBar.endFill();
    speedBar.addChild(outerBar);

    speedBar.outer = outerBar;
  }

  function end() {
    message = new Text(
      "The End!",
      {font: "64px Futura", fill: "white"}
    );

    message.x = 120;
    message.y = stage.height / 2 - 32;

    end_scene.addChild(message);

    game_scene.visible = false;
    end_scene.visible = true;
    stage.removeChild(game_scene);
  }
})
