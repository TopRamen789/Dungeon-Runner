class CreepAIBehavior extends Sup.Behavior {
  
  private player = Sup.getActor("Player");
  private map = Sup.getActor("Ground");

  private originalPlayerPosition = this.player.getPosition();
  private playerPosition;
  private currentPosition;
  private relativeCurrentPosition;
  private relativePlayerPosition;

  private delta = {x: 0, y: 0};
  private velocity = new Sup.Math.Vector2(0,0);
  private path;
  private AStarInitiated = false;
  private startPosition;

  private timer;

  awake() {
    this.playerPosition = this.player.getPosition();
    this.currentPosition = this.actor.getPosition();
    
    this.relativeCurrentPosition = { x: 0, y: 0 };
    this.relativePlayerPosition = { x: 0, y: 0 };
    
    this.relativeCurrentPosition.x = this.currentPosition.x < 0 
      ? Math.abs(this.map.getX()) - Math.abs(this.currentPosition.x)
      : Math.abs(this.map.getX()) + Math.abs(this.currentPosition.x);
    this.relativeCurrentPosition.y = this.currentPosition.y < 0 
      ? Math.abs(this.map.getY()) - Math.abs(this.currentPosition.y)
      : Math.abs(this.map.getY()) + Math.abs(this.currentPosition.y);
    
    this.relativePlayerPosition.x = this.playerPosition.x < 0 
      ? Math.abs(this.map.getX()) - Math.abs(this.playerPosition.x) 
      : Math.abs(this.map.getX()) + Math.abs(this.playerPosition.x);
    this.relativePlayerPosition.y = this.playerPosition.y < 0
      ? Math.abs(this.map.getY()) - Math.abs(this.playerPosition.y)
      : Math.abs(this.map.getY()) + Math.abs(this.playerPosition.y);
    
    this.AStarInitiated = false;
  }

  start() {
    this.initiateAStar();
    this.startPosition = this.currentPosition;
  }

  update() {
    //this is only if we don't want enemies to collide with each other, thus allowing "stacking"
    //if you do want this, you should be sure to add some kind of additive shadow to each creep
    //this will (hopefully) let players know there is more than 1 unit in a specified square
    /*
    let bodies = Sup.ArcadePhysics2D.getAllBodies();
    let enemies = Sup.getActor("Enemies").getChildren();
    enemies.forEach(function(cv) {
      bodies.splice(bodies.indexOf(cv.arcadeBody2D), 1);
    });
    Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, bodies);
    */
    this.timer = new Date();
    Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, Sup.ArcadePhysics2D.getAllBodies());
    
    this.playerPosition = this.player.getPosition();
    this.currentPosition = this.actor.getPosition();
    this.relativeCurrentPosition.x = this.currentPosition.x < 0 
      ? Math.abs(this.map.getX()) - Math.abs(this.currentPosition.x)
      : Math.abs(this.map.getX()) + Math.abs(this.currentPosition.x);
    this.relativeCurrentPosition.y = this.currentPosition.y < 0 
      ? Math.abs(this.map.getY()) - Math.abs(this.currentPosition.y)
      : Math.abs(this.map.getY()) + Math.abs(this.currentPosition.y);
    
    this.relativePlayerPosition.x = this.playerPosition.x < 0 
      ? Math.abs(this.map.getX()) - Math.abs(this.playerPosition.x)
      : Math.abs(this.map.getX()) + Math.abs(this.playerPosition.x);
    this.relativePlayerPosition.y = this.playerPosition.y < 0
      ? Math.abs(this.map.getY()) - Math.abs(this.playerPosition.y)
      : Math.abs(this.map.getY()) + Math.abs(this.playerPosition.y);
    
    this.setVelocityBasedOnNextPosition();
    this.actor.arcadeBody2D.setVelocity(this.velocity);
    
    /*
    Lazy dynamic pathfinding, basically, we set the goal to the player's position on awake() and keep resetting it every 250ms
    then if the player moves, we reset AStar and return a new path to the player.
    */
    
    if(this.timer.getMilliseconds() < 275 &&
      this.timer.getMilliseconds() > 225) {
      this.initiateAStar();
      this.timer.setMilliseconds(0);
    }
  }

  resetOriginalPlayerPosition() {
    this.originalPlayerPosition = this.playerPosition;
  }

  setVelocityBasedOnNextPosition() {
    let len = this.path.length - 1;
    
    //Check path
    if(len == -1) {
      return;
    }
    
    let speed = 0.01;
    
    //get X Velocity
    if(this.path[len].x > this.relativeCurrentPosition.x) {
      this.velocity.x = (speed);
    }
    if(this.path[len].x < this.relativeCurrentPosition.x) {
      this.velocity.x = -(speed);
    }
    if(this.path[len].x == this.relativeCurrentPosition.x) {
      this.velocity.x = 0;
    }
    
    //get Y Velocity
    if(this.path[len].y > this.relativeCurrentPosition.y) {
      this.velocity.y = (speed);
    }
    if(this.path[len].y < this.relativeCurrentPosition.y) {
      this.velocity.y = -(speed);
    }
    if(this.path[len].y == this.relativeCurrentPosition.y) {
      this.velocity.y = 0;
    }
    
    //Check position
    if(Math.round(this.relativeCurrentPosition.x) == this.path[len].x &&
      Math.round(this.relativeCurrentPosition.y) == this.path[len].y) {
      this.path.splice(len, 1);
    }
  }

  initiateAStar() {
    let start = {
      f: 0,
      g: 0,
      h: 0,
      parent: null,
      x: Math.round(this.relativeCurrentPosition.x),
      y: Math.round(this.relativeCurrentPosition.y),
      blocked: false
    };
    let goal = {
      f: 0,
      g: 0,
      h: 0,
      parent: null,
      x: Math.round(this.relativePlayerPosition.x),
      y: Math.round(this.relativePlayerPosition.y),
      blocked: false
    };
    this.path = this.AStarSearch(start, goal);
  }

  AStarSearch(start, goal) {
    let grid = this.generateGrid(start);

    let openList = [];
    let closedList = [];
    openList.push(start);
    
    while(openList.length > 0) {
      let lowestIndex = 0;
      for(let i = 0; i < openList.length; i++) {
        if(openList[i].f < openList[lowestIndex].f) { lowestIndex = i; }
      }

      let currentNode = openList[lowestIndex];
      
      //If current node position = goal position, return the set
      if(currentNode.x == goal.x && currentNode.y == goal.y) {
        let result = [];
        while(currentNode.parent) {
          result.push(currentNode);
          currentNode = currentNode.parent;
        }
        return result;
      }

      //cut out current node and add it to the closed list
      let valueToRemove = openList.indexOf(currentNode);
      openList.splice(valueToRemove, 1);
      closedList.push(currentNode);
      //find nodes neighbors and search through them
      let neighbors = this.findNeighbors(grid, currentNode);
      for(let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        if(closedList.indexOf(neighbor) > 0 || neighbor.blocked) {
          continue;
        }

        let gScore = currentNode.g + 1;
        let gScoreIsBest = false;

        //if the neighbor node isn't in the openList, calculate it's heuristic and add it to the openList
        //else, test it's gScore to the currentNode's g score, if it's better, make it's parent the current node
        if(openList.indexOf(neighbor) < 0) {
          gScoreIsBest = true;
          neighbor.h = this.heuristic(neighbor, goal);
          openList.push(neighbor);
        } else if(gScore < neighbor.g) {
          gScoreIsBest = true;
        }

        if(gScoreIsBest) {
          neighbor.parent = currentNode;
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
        }
      }
    }
    return [];
  }

  generateGrid(start) {
    let grid = [];
    let mapBounds = {
      x: this.map.tileMapRenderer.getTileMap().getWidth(),
      y: this.map.tileMapRenderer.getTileMap().getHeight()
    }
    
    //remove nullchild, this actor, and the player from the blocking bodies
    let bodies = Sup.ArcadePhysics2D.getAllBodies();
    let nullchild = Sup.getActor("nullchild").arcadeBody2D;
    
    //this is only if we don't want enemies to collide with each other, thus allowing "stacking"
    //we'd also have to remove them from collisions in the above update method for this to work
    /*
    let enemies = Sup.getActor("Enemies").getChildren();
    enemies.forEach(function(cv) {
      bodies.splice(bodies.indexOf(cv.arcadeBody2D), 1);
    });
    */
    
    bodies.splice(bodies.indexOf(nullchild), 1);
    bodies.splice(bodies.indexOf(this.actor.arcadeBody2D), 1);
    bodies.splice(bodies.indexOf(this.player.arcadeBody2D), 1);
    
    for(let x = 0; x < mapBounds.x; x++) {
      grid[x] = [];
      for(let y = 0; y < mapBounds.y; y++) {
        grid[x][y] = {};
        grid[x][y].f = 0;
        grid[x][y].h = 0;
        grid[x][y].x = x;
        grid[x][y].y = y;
        grid[x][y].parent = null;
        grid[x][y].g = 0;
        grid[x][y].blocked = false;
      }
    }
    for(let i = 0; i < bodies.length; i++) {
      let bodyX = bodies[i].actor.getX() < 0
        ? Math.round(Math.abs(this.map.getX()) - Math.abs(bodies[i].actor.getX())) 
        : Math.round(Math.abs(this.map.getX()) + Math.abs(bodies[i].actor.getX()));

      let bodyY = bodies[i].actor.getY() < 0
        ? Math.round(Math.abs(this.map.getY()) - Math.abs(bodies[i].actor.getY())) 
        : Math.round(Math.abs(this.map.getY()) + Math.abs(bodies[i].actor.getY()));

      let bodyXLength = bodyX + bodies[i].actor.arcadeBody2D.getSize().width + 1;
      let bodyYLength = bodyY + bodies[i].actor.arcadeBody2D.getSize().height + 1;

      for(let r = bodyX; r < bodyXLength; r++) {
        for(let l = bodyY; l < bodyYLength; l++) {
          grid[r][l].blocked = true;
        }
      }
    }
      
    return grid;
  }

  //Get neighbors from node if they exist on grid
  findNeighbors(grid, node) {
    let result = [];
    let x = node.x;
    let y = node.y;

    //See if nodes exist on the grid
    if(grid[x-1] && grid[x-1][y]) {
      result.push(grid[x-1][y]);
    }
    if(grid[x+1] && grid[x+1][y]) {
      result.push(grid[x+1][y]);
    }
    if(grid[x][y-1]) {
      result.push(grid[x][y-1]);
    }
    if(grid[x][y+1]) {
      result.push(grid[x][y+1]);
    }

    return result;
  }

  //Gives straight line from a to b
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}

Sup.registerBehavior(CreepAIBehavior);
