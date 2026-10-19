export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, id, data, x, y) {
    super(scene, x, y, `${data.color}_idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.id = id;
    this.dataInfo = data;
    this.setScale(0.65);
    this.body.setSize(60, 90).setOffset(34, 36);
    this.setMaxVelocity(235, 800).setDragX(1450).setBounce(0);
    this.controls = {};
    this.lastGround = -999;
    this.bufferUntil = -999;
    this.lastJumpSeq = 0;
    this.invincibleUntil = 0;
    this.behindSince = 0;
    this.safe = { x, y };
    this.label = scene.add
      .text(x, y - 50, data.name, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#172c32",
        backgroundColor: "#ffffffbb",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
  receive(input = {}) {
    // Penghitung jump terpisah mempertahankan tap cepat walaupun frame host terlambat.
    if ((input.jumpSeq || 0) > this.lastJumpSeq)
      this.bufferUntil = this.scene.time.now + 110;
    this.lastJumpSeq = input.jumpSeq || 0;
    this.controls = input;
  }
  tick(time) {
    if (this.body.blocked.down) {
      this.lastGround = time;
      this.safe = { x: this.x, y: this.y };
    }
    const axis = Number(!!this.controls.right) - Number(!!this.controls.left);
    this.setAccelerationX(axis * 1550);
    if (axis) this.setFlipX(axis < 0);
    if (time <= this.bufferUntil && time - this.lastGround <= 110) {
      this.setVelocityY(-690);
      this.lastGround = -999;
      this.bufferUntil = -999;
      this.scene.sfx("jump");
    }
    if (this.x < 20) {
      this.x = 20;
      this.setVelocityX(Math.max(0, this.body.velocity.x));
    }
    const color = this.dataInfo.color;
    if (time < this.invincibleUntil) {
      this.anims.stop();
      this.setTexture(`${color}_hit`);
      this.setAlpha(Math.floor(time / 90) % 2 ? 0.4 : 1);
    } else {
      this.setAlpha(1);
      if (!this.body.blocked.down) {
        this.anims.stop();
        this.setTexture(`${color}_jump`);
      } else if (Math.abs(this.body.velocity.x) > 20)
        this.play(`${color}_walk`, true);
      else {
        this.anims.stop();
        this.setTexture(`${color}_idle`);
      }
    }
    this.label.setPosition(this.x, this.y - 47);
  }
  respawn(point) {
    this.body.reset(point.x, point.y - 8);
    this.setVelocity(0, 0);
    this.invincibleUntil = this.scene.time.now + 1500;
    this.behindSince = 0;
  }
}
