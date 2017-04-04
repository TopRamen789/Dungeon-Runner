class PlayerBuildBehavior extends Sup.Behavior {
  
  private camera = null;

  private piece = new Sup.Actor("buildableGround");
  private tilemap = null;
  private height = null;
  private width = null;

  private HUD = null;
  private HUDButtons = null;
  private selected = "BuildableGround2x2";
  private buildings = null;

  awake() {
    this.camera = Sup.getActor("Camera");
    this.HUD = Sup.getActor("HUD");
    this.HUDButtons = this.HUD.getChildren()[0].getChildren();
    this.setProperties();
    this.buildings = Sup.getActor("Buildings");
  }
  
  update() {
    let mousePosition = this.getMousePositionCamera(this.camera.camera);
    
    if(Sup.Input.wasMouseButtonJustPressed(0)) {
      let buttonClick = this.checkButtonClick(mousePosition);
      if(!buttonClick) {
        this.placePiece();
      }
    }
    
    this.piece.setPosition(Math.round(mousePosition.x - (this.width/2)),
                           Math.round(mousePosition.y - (this.height/2)),
                           0);
  }

  setProperties() {
    let asset = "Assets/Tiles/Buttons/" + this.selected;  
    if(this.piece.tileMapRenderer)
      this.piece.tileMapRenderer.destroy();
    this.tilemap = new Sup.TileMapRenderer(this.piece, asset);
    this.width = this.tilemap.getTileMap().getWidth();
    this.height = this.tilemap.getTileMap().getHeight();
  }

  placePiece() {
    new Sup.ArcadePhysics2D.Body(this.piece, Sup.ArcadePhysics2D.BodyType.Box,
                                 { movable: true,
                                  width: this.width,
                                  height: this.height,
                                  offset: { 
                                    x: (this.width/2), 
                                    y: (this.height/2) }
                                 });
    this.piece.setParent(this.buildings);
    this.piece = new Sup.Actor(this.selected);
    this.setProperties();
  }

  checkButtonClick(mousePosition) {
    for(let button of this.HUDButtons) {
      if(mousePosition.x > button.getX() 
         && mousePosition.x < button.getX() + button.tileMapRenderer.getTileMap().getWidth()
         && mousePosition.y > button.getY()
         && mousePosition.y < button.getY() + button.tileMapRenderer.getTileMap().getHeight()) {
        this.selected = button.getName();
        if(this.selected.indexOf("Buildings") > 0) {
          this.hideBuildings();
          for(let building of this.displayBuildings()) {
            this.HUDButtons.push(building);
          }
        } else {
          this.hideBuildings();
          this.setProperties();
        }
        return true;
      }
    }
    return false;
  }

  displayBuildings() {
    let buildingType = Sup.getActor(this.selected);
    let buildings = buildingType.getChildren();
    for(let building of buildings) {
      building.setVisible(true);
    }
    return buildings;
  }

  hideBuildings() {
    for(let button of this.HUDButtons) {
      for(let childButton of button.getChildren()) {
        let index = this.HUDButtons.indexOf(childButton);
        if(index != -1) {
          this.HUDButtons.splice(index, 1);
          childButton.setVisible(false);
        }
      }
    }
  }

  getMousePositionCamera(camera: Sup.Camera): Sup.Math.Vector2{
    let position = Sup.Input.getMousePosition().multiplyScalar(camera.getOrthographicScale()*0.5);
    position.x *= camera.getWidthToHeightRatio();
    return(position.add(camera.actor.getPosition()));
  }
}

Sup.registerBehavior(PlayerBuildBehavior);