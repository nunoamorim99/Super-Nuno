import Phaser from 'phaser';
import { loadHighScore } from '../highscore.js';
import { COMMON, getActiveWorld } from '../config/worlds.js';
import { lastLevel, setLastLevel } from '../save/progress.js';

const F = COMMON.frames.tiles;

// Title screen with a living slice of the game world behind the logo —
// no physics, just sprites, animations and tweens.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    this.scene.stop('HUDScene');
    this.cameras.main.setBackgroundColor('#5c94fc');
    // re-centre everything if the device rotates (logical size changes)
    this.scale.once('resize', () => this.scene.restart());

    // --- animated background: hills, clouds, ground, critters
    this.hills = this.add
      .tileSprite(width / 2, 414 - 36, Math.ceil(width / 3), 24, 'tex-hills')
      .setScale(3);

    [{ x: 120, y: 70 }, { x: 420, y: 110 }, { x: 690, y: 60 }].forEach(({ x, y }, i) => {
      // NOTE: the container is scaled 2x and that scales child POSITIONS
      // too — so children sit 18px apart locally to end up 36px apart
      // on screen (the width of one scaled tile, i.e. seamless).
      const cloud = this.add.container(x, y, [
        this.add.image(-18, 0, 'tiles', F.cloudLeft),
        this.add.image(0, 0, 'tiles', F.cloudMid),
        this.add.image(18, 0, 'tiles', F.cloudRight),
      ]).setScale(2);
      this.tweens.add({
        targets: cloud,
        x: x + 40,
        duration: 6000 + i * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.add.tileSprite(width / 2, 414 + 9, width, 18, 'tex-grass-top');
    this.add.tileSprite(width / 2, 414 + 29, width, 22, 'tex-dirt');

    // scenery: pipe, blocks, coins
    this.add.image(700, 414 - 9, 'pipe-mouth');
    this.add.tileSprite(700, 414 - 9 + 18, 36, 18, 'pipe-shaft');
    this.add.image(540, 320, 'tiles', F.blockQuestion);
    this.add.image(558, 320, 'tiles', F.brick);
    this.add.sprite(180, 396, 'tiles', F.coin).play('coin-spin');
    this.add.sprite(240, 350, 'tiles', F.coin).play('coin-spin');
    this.add.image(80, 414, 'tiles', COMMON.frames.decor['*']).setOrigin(0.5, 1); // bush
    this.add.image(620, 414, 'tiles', COMMON.frames.decor['^']).setOrigin(0.5, 1); // pine

    // patrolling walkers
    const walker = getActiveWorld().enemies.walker;
    [{ from: 230, to: 470, y: 402, d: 5200 }, { from: 320, to: 180, y: 402, d: 3400 }].forEach(
      ({ from, to, y, d }) => {
        const w = this.add.sprite(from, y, walker.sheet, walker.walkFrame).play(walker.walkAnim);
        w.setFlipX(to > from);
        this.tweens.add({
          targets: w,
          x: to,
          duration: d,
          yoyo: true,
          repeat: -1,
          onYoyo: () => w.setFlipX(!w.flipX),
          onRepeat: () => w.setFlipX(!w.flipX),
        });
      }
    );

    // the hero, idling by the logo
    const char = getActiveWorld().character;
    this.add
      .sprite(120, 398, char.sheet, char.idleFrame)
      .play(`${char.animPrefix.SMALL}-idle`)
      .setScale(1.5);

    // --- logo + texts
    const logo = this.add
      .text(width / 2, 120, 'SUPER NUNO', {
        fontFamily: 'monospace',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#7a3045', 10)
      .setShadow(0, 6, '#00000055', 0, true, true);
    this.tweens.add({
      targets: logo,
      y: 112,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(width / 2, 168, 'A RETRO PLATFORMER', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3);

    this.add
      .text(width / 2, 205, `HI ${String(loadHighScore()).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#9dff8d',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3);

    this.buildMenu(width);

    // fullscreen toggle (works on desktop and Android; iPhones don't
    // support the Fullscreen API)
    const fsBtn = this.add
      .text(width - 10, 8, '⛶', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setStroke('#000000', 4)
      .setAlpha(0.85)
      .setPadding(10)
      .setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation(); // don't trigger "tap to start"
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

  }

  // ------------------------------------------------------------- menu

  /** Fresh run counters, then off to a level. */
  startRun(levelId) {
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
    this.registry.set('lives', 3);
    setLastLevel(levelId);
    this.scene.start('IntroScene', { levelId });
  }

  buildMenu(width) {
    const world = getActiveWorld();
    const resume = lastLevel();

    const items = [
      { label: 'NEW GAME', run: () => this.startRun(world.startLevel ?? 'level1') },
      {
        label: 'CONTINUE',
        enabled: !!resume,
        run: () => this.startRun(resume),
      },
      { label: 'SELECT LEVEL', run: () => this.scene.start('WorldSelectScene') },
      { label: 'SCOREBOARD', run: () => this.scene.start('ScoreboardScene') },
    ];
    // the two editors are dev-only and must not exist in the public build
    if (import.meta.env.DEV) {
      items.push(
        {
          label: 'LEVEL EDITOR',
          run: () => this.scene.start('GameScene', { levelId: resume ?? world.startLevel, editorOpen: true }),
        },
        {
          label: 'COMPONENT EDITOR',
          run: () => window.open('tools/editors/component/index.html', '_blank'),
        }
      );
    }

    this.menuIndex = 0;
    const startY = 252;
    const step = 27;
    this.menuTexts = items.map((item, i) => {
      const enabled = item.enabled !== false;
      const text = this.add
        .text(width / 2, startY + i * step, item.label, {
          fontFamily: 'monospace',
          fontSize: '19px',
          fontStyle: 'bold',
          color: enabled ? '#ffffff' : '#777788',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4);
      if (enabled) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => this.selectItem(i));
        text.on('pointerdown', () => {
          this.selectItem(i);
          item.run();
        });
      }
      return { text, item, enabled };
    });

    const move = (dir) => {
      let i = this.menuIndex;
      do i = (i + dir + items.length) % items.length;
      while (this.menuTexts[i].enabled === false);
      this.selectItem(i);
    };
    this.input.keyboard.on('keydown-UP', () => move(-1));
    this.input.keyboard.on('keydown-DOWN', () => move(1));
    this.input.keyboard.on('keydown-W', () => move(-1));
    this.input.keyboard.on('keydown-S', () => move(1));
    const activate = () => this.menuTexts[this.menuIndex].item.run();
    this.input.keyboard.on('keydown-ENTER', activate);
    this.input.keyboard.on('keydown-SPACE', activate);

    // skip CONTINUE if there's nothing to continue
    if (this.menuTexts[0].enabled === false) move(1);
    this.selectItem(this.menuIndex);
  }

  selectItem(i) {
    if (this.menuTexts[i].enabled === false) return;
    this.menuIndex = i;
    this.menuTexts.forEach(({ text, item, enabled }, j) => {
      const sel = j === i;
      text.setColor(sel ? '#ffe066' : enabled ? '#ffffff' : '#777788');
      text.setText(sel ? `▶ ${item.label}` : item.label);
    });
  }

  update() {
    this.hills.tilePositionX += 0.08; // slow drift
  }
}
