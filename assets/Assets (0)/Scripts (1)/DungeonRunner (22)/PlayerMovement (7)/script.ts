class PlayerMovementBehavior extends Sup.Behavior {

  enabled : boolean = true;
  movementEnabled: boolean = true;
  oldPosition;
  private inputs = ["UP", "DOWN", "LEFT", "RIGHT"];
  private runAnimations = ["RunUp", "RunDown", "RunLeft", "RunRight"];
  private idleAnimations = ["IdleUp", "IdleDown", "IdleLeft", "IdleRight"];
  private damageAnimations = ["DamageUp", "DamageDown", "DamageLeft", "DamageRight"];
  private deathAnimation = ["Death"];
  //attackAnims, abilityAnims
  //jumpingAnim
  private hitpoints = 3;

  speed = [[0,0.1],[0,-0.1],[-0.1,0],[0.1,0]];
  private sprintMultiplier = 2;

  /*
  private wallBodies: Sup.ArcadePhysics2D.Body[] = [];
  private buildingBodies: Sup.ArcadePhysics2D.Body[] = [];
  */
  private enemyBodies: Sup.ArcadePhysics2D.Body[] = [];
  private opacity = 100;
  private flicker = false;
  private fade = false;
  private spawnPoint = this.actor.getPosition();

  awake() {
    if(this.enabled) {
      let enemyActors = Sup.getActor("Enemies").getChildren();
      for(let enemy of enemyActors) this.enemyBodies.push(enemy.arcadeBody2D);
    }
  }

  update() {
    if(this.enabled) {
      let velocity = this.actor.arcadeBody2D.getVelocity();
      let animation = this.actor.spriteRenderer.getAnimation();
      let sprintValue = 1;

      if(this.hitpoints == 0) {
        animation = "Death";
        this.movementEnabled = false;
        //figure out respawn
        if(!this.fade) {
          Fade.start(Fade.Direction.Out, null, () => { 
            Fade.start(Fade.Direction.In, null, null);
          });
          this.fade = true;
        }
      }
      
      Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, Sup.ArcadePhysics2D.getAllBodies());
      
      if(this.movementEnabled) {
        //I feel like these loops could be done better.....
        for(let i = 0; i < this.inputs.length; i++) {
          //Movement checker
          if(Sup.Input.isKeyDown(this.inputs[i])) {
            if(Sup.Input.isKeyDown("SHIFT")) {
              sprintValue = this.sprintMultiplier;
            }

            velocity.set(this.speed[i][0] * sprintValue,
                         this.speed[i][1] * sprintValue);
            animation = this.runAnimations[i];
          }
          //Idle checker
          if(Sup.Input.wasKeyJustReleased(this.inputs[i])) {
            animation = this.idleAnimations[i];
            velocity.set(0,0);
          }
        }

        //Diagonal movement checker
        for(let i = 0; i < this.inputs.length / 2; i++) {
          for(let j = 2; j < this.inputs.length; j++) {
            if(Sup.Input.isKeyDown(this.inputs[i]) && Sup.Input.isKeyDown(this.inputs[j])) {
              //Should consider lowering sprintValue for diagonals
              velocity.set((this.speed[i][0] + this.speed[j][0]) * sprintValue,
                           (this.speed[i][1] + this.speed[j][1]) * sprintValue);

              animation = this.runAnimations[j];
            }
          }
        }
      }
      
      //Enemy collision
      if(Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, this.enemyBodies)) {
        animation = "DamageLeft";
        velocity.set(0.25,0);
        this.movementEnabled = false;
        this.flicker = true;
        if(this.hitpoints != 0) {
          Sup.getActor("HitPoints").getChildren()[this.hitpoints - 1].spriteRenderer.setAnimation("LostHeart");
          this.hitpoints = this.hitpoints - 1;
        }
        if(!this.oldPosition)
          this.oldPosition = { x: this.actor.getPosition().x, y: this.actor.getPosition().y };
      }
      if(this.flicker) {
        this.actor.spriteRenderer.setOpacity((Math.abs(this.actor.getPosition().x - Math.round(this.actor.getPosition().x)) * 10 * Math.random()));
      }
      if(this.oldPosition) {
        if(Math.round(this.oldPosition.x + 4) == Math.round(this.actor.getPosition().x)) {
          velocity.set(0,0);
          this.oldPosition = null;
          this.movementEnabled = true;
          this.flicker = false;
          this.actor.spriteRenderer.setOpacity(100);
        }
      }

      this.actor.arcadeBody2D.setVelocity(velocity);
      this.actor.spriteRenderer.setAnimation(animation);
    }
  }
}
Sup.registerBehavior(PlayerMovementBehavior);