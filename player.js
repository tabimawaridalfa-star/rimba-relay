export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, id, data, x, y) {
    super(scene, x, y, `${data.color}_idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.id = id;
    this.dataInfo = data;
    this.setScale(0.65);
    this.body.setSize(60, 90).setOffset(34, 36);
    this.setMaxVelocity(293.75, 950).setDragX(1812.5).setBounce(0);
    this.controls = {};
    this.starUntil = 0;
    this.isBig = false;
    this.growthPending = false;
    this.variableJump = false;
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
    if (this.growthPending) this.tryGrow();
    if (this.body.blocked.down) {
      this.variableJump = false;
      this.lastGround = time;
      // Titik respawn hanya diperbarui di pijakan tetap, bukan platform sementara.
      if (!(this.scene.ridePlatforms || []).some(f => f.body.enable &&
          Math.abs(this.body.bottom-f.body.top)<4 && this.body.right>f.body.left && this.body.left<f.body.right))
        this.safe = { x: this.x, y: this.y };
    }
    const axis = Number(!!this.controls.right) - Number(!!this.controls.left);
    this.setAccelerationX(axis * 1937.5);
    if (axis) this.setFlipX(axis < 0);
    if (time <= this.bufferUntil && time - this.lastGround <= 110) {
      this.setVelocityY(-690);
      this.variableJump = true;
      this.lastGround = -999;
      this.bufferUntil = -999;
      this.scene.sfx("jump");
    }
    // Potong hanya lompatan sendiri, bukan pantulan musuh atau knockback.
    if (this.variableJump && !this.controls.jump && this.body.velocity.y < -340) {
      this.setVelocityY(-340);
      this.variableJump = false;
    }
    if (this.body.velocity.y >= 0) this.variableJump = false;
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
    if (this.starUntil > this.scene.playTime) {
      this.setTint(Math.floor(this.scene.playTime / 100) % 2 ? 0xffe77c : 0xffffff);
      this.setAlpha(0.8 + 0.2 * Math.sin(this.scene.playTime / 70));
    } else if (this.isBig) this.setTint(0xffe0ce);
    else this.clearTint();
    this.label.setPosition(this.x, this.y - 47 * (this.isBig ? 1.4 : 1));
  }
  // Pertahankan posisi kaki dan momentum saat ukuran tubuh berubah.
  resizeBody(big) {
    const center = this.body.center.x, bottom = this.body.bottom;
    const { x: vx, y: vy } = this.body.velocity;
    const { x: ax, y: ay } = this.body.acceleration;
    this.setScale(big ? 0.91 : 0.65);
    this.body.updateFromGameObject();
    this.x += center - this.body.center.x;
    this.y += bottom - this.body.bottom;
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
    this.body.autoFrame.copy(this.body.position);
    this.setVelocity(vx, vy).setAcceleration(ax, ay);
    this.isBig = big;
  }
  tryGrow() {
    if (this.isBig) { this.growthPending = false; return; }
    const width = 60 * 0.91, height = 90 * 0.91;
    const left = this.body.center.x - width / 2, top = this.body.bottom - height;
    const solids = [...this.scene.ground.getChildren(), ...this.scene.boxes.getChildren(), ...(this.scene.ridePlatforms || [])];
    if (solids.some(({body:b}) => b?.enable && left < b.right - 0.1 && left + width > b.left + 0.1 &&
        top < b.bottom - 0.1 && this.body.bottom > b.top + 0.1)) return;
    this.resizeBody(true);
    this.growthPending = false;
  }
  shrink() {
    this.growthPending = false;
    if (this.isBig) this.resizeBody(false);
  }
  respawn(point) {
    this.shrink();
    this.body.reset(point.x, point.y - 8);
    this.setVelocity(0, 0);
    this.variableJump = false;
    this.invincibleUntil = this.scene.time.now + 1500;
    this.behindSince = 0;
  }
}
