import Phaser from 'phaser';
import { ENEMY_WALK_SPEED, ENEMY_BODY } from '../config/constants.js';
import { getActiveWorld } from '../config/worlds.js';

// A goomba-style patrolling enemy. Extending Arcade.Sprite means Phaser
// calls our preUpdate() automatically every frame — the enemy carries
// its own behaviour instead of GameScene micro-managing it.
// Its ART (which creature it looks like) comes from the world config —
// the behaviour and the locked collision box below never change with it.
export default class Walker extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, gridKey = null) {
    const cfg = getActiveWorld().enemies.walker;
    super(scene, x, y, cfg.sheet, cfg.walkFrame);
    this.cfg = cfg;
    scene.add.existing(this); // register for rendering + updates
    scene.physics.add.existing(this); // give it a dynamic body
    this.gridKey = gridKey; // identity for cross-pipe level state

    this.body.setSize(ENEMY_BODY.width, ENEMY_BODY.height);
    this.body.setOffset(ENEMY_BODY.offsetX, ENEMY_BODY.offsetY); // body bottom at the feet
    this.setDepth(1); // same layer as items, above terrain
    this.setCollideWorldBounds(true);

    this.direction = -1; // start walking left, toward the player
    this.isSquashed = false;
    this.play(cfg.walkAnim);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta); // keeps the animation running

    if (this.isSquashed) return;

    // Sleep when far off-camera: no patrolling or edge probes for
    // enemies the player can't see (perf + they stay where designed).
    const cam = this.scene.cameras.main;
    if (Math.abs(this.x - (cam.scrollX + cam.width / 2)) > 1100) {
      this.setVelocityX(0);
      return;
    }

    // Turn at walls (blocked = static obstacle, touching = another enemy)
    if (this.body.blocked.left || this.body.touching.left) {
      this.direction = 1;
    } else if (this.body.blocked.right || this.body.touching.right) {
      this.direction = -1;
    }

    // Turn at platform edges: probe a tiny rectangle just ahead of and
    // below the front foot — if no static body is there, it's a cliff.
    if (this.body.onFloor()) {
      const aheadX = this.direction > 0 ? this.body.right + 2 : this.body.left - 3;
      const ground = this.scene.physics.overlapRect(
        aheadX, this.body.bottom + 2, 2, 4,
        false, true // ignore dynamic bodies, include static ones
      );
      if (ground.length === 0) this.direction *= -1;
    }

    this.setVelocityX(ENEMY_WALK_SPEED * this.direction);
    this.setFlipX(this.direction > 0);
  }

  /** Killed by a fireball or a star-powered player: flip and fall away. */
  knockAway(fromX = this.x) {
    this.isSquashed = true; // reuse the flag: stops AI and contact checks
    this.scene.consume?.(this.gridKey);
    this.anims.stop();
    this.body.checkCollision.none = true;
    this.setFlipY(true);
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocity(dir * 120, -280);
    this.body.setAngularVelocity(dir * 240);
    this.scene.time.delayedCall(900, () => this.destroy());
  }

  /** Stomped from above: flatten, stop interacting, vanish shortly after. */
  squash() {
    this.isSquashed = true;
    this.scene.consume?.(this.gridKey);
    this.anims.stop();
    this.setFrame(this.cfg.squashedFrame);
    this.body.checkCollision.none = true;
    this.body.setVelocity(0, 0);
    this.body.allowGravity = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 300,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
