class CameraFollowBehavior extends Sup.Behavior {

  enabled : boolean = true;
  
  update() {
    if(this.enabled) {
      let player = Sup.getActor("Player");
      this.actor.setPosition(player.getX(), player.getY(), 5);
    }
  }
}
Sup.registerBehavior(CameraFollowBehavior);
