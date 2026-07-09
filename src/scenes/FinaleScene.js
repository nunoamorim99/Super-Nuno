import Phaser from 'phaser';
import { FINALES } from '../config/finales.js';
import { getActiveWorld } from '../config/worlds.js';

// The post-flag decorated zone (ROADMAP Phase 8): after the world's last
// level, Nuno walks into his memory. No physics, no input, no core
// logic — themed scenery (placeholder until Phase 9/10 art) + one card.
export default class FinaleScene extends Phaser.Scene {
  constructor() {
    super('FinaleScene');
  }

  init(data) {
    this.finaleId = data.finale ?? getActiveWorld().finale;
  }

  create() {
    const { width, height } = this.scale;
    const finale = FINALES[this.finaleId];
    this.scene.stop('HUDScene');
    this.scale.once('resize', () => this.scene.restart());

    // --- placeholder scenery: the world's finale sky + shared ground
    this.cameras.main.setBackgroundColor(finale.sky);
    this.add.tileSprite(width / 2, 414 + 9, width, 18, 'tex-grass-top');
    this.add.tileSprite(width / 2, 414 + 29, width, 22, 'tex-dirt');
    this.add
      .text(width / 2, 380, `[ finale scenery: "${this.finaleId}" — bespoke art in Phase 9/10 ]`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#00000066',
      })
      .setOrigin(0.5);

    // the memory Nuno walks toward: the world's prop if its pack has
    // one (world 1: the first dog), else a glowing placeholder spot
    const prop = finale.prop;
    if (prop && this.textures.exists(prop.sheet)) {
      const sprite = this.add
        .sprite(width * 0.72, 414 - (12 * (prop.scale ?? 1)), prop.sheet, prop.frame)
        .setScale(prop.scale ?? 1);
      if (prop.anim) sprite.play(prop.anim);
    } else {
      const marker = this.add.circle(width * 0.72, 402, 10, 0xffe066, 0.9);
      this.tweens.add({
        targets: marker,
        alpha: 0.4,
        scale: 1.3,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    }

    // --- Nuno walks into the scene, stops by the marker
    const char = getActiveWorld().character;
    const nuno = this.add
      .sprite(-20, 402, char.sheet, char.idleFrame)
      .play(`${char.animPrefix.SMALL}-run`)
      .setScale(1.5);
    this.tweens.add({
      targets: nuno,
      x: width * 0.62,
      duration: 2600,
      ease: 'Linear',
      onComplete: () => {
        nuno.play(`${char.animPrefix.SMALL}-idle`);
        this.showCard(finale);
      },
    });

    this.cameras.main.fadeIn(600);
  }

  /** The story card: title + one Portuguese line (decided: PT only). */
  showCard(finale) {
    const { width } = this.scale;

    const card = this.add.container(width / 2, 150).setAlpha(0);
    card.add(
      this.add
        .text(0, 0, finale.title, {
          fontFamily: 'monospace',
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 6)
    );
    card.add(
      this.add
        .text(0, 42, finale.pt, {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width - 160 },
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4)
    );
    this.tweens.add({ targets: card, alpha: 1, duration: 900 });

    this.time.delayedCall(1400, () => {
      const prompt = this.add
        .text(width / 2, 300, 'PRESS SPACE / TAP TO CONTINUE', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 3);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

      const done = () => {
        this.cameras.main.fadeOut(600);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EndScene'));
      };
      this.input.keyboard.once('keydown-SPACE', done);
      this.input.keyboard.once('keydown-ENTER', done);
      this.input.once('pointerdown', done);
    });
  }
}
