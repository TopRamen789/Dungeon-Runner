lass TesterBehavior extends Sup.Behavior {
  awake() {
    
  }

  update() {
    //get mouse position
    var mousePosition = Sup.Input.getMousePosition();
    
    //create a new actor with a new sprite renderer
    var piece = new Sup.Actor("dungeonpiece");
    new Sup.SpriteRenderer(piece, "someSprite");
    
    //set position of new actor to current mouse position
    piece.setPosition(mousePosition.x, mousePosition.y, 0);
    
    //var ray = new Sup.Math.Ray();
    //ray.setFromCamera(Sup.getActor("Camera").camera, Sup.Input.getMousePosition());
  }
}
Sup.registerBehavior(TesterBehavior);
