import Phaser from 'phaser';
import { WORLDS, ACTIVE_WORLD, switchWorld } from '../config/worlds.js';
import { isWorldUnlocked } from '../save/progress.js';

// The world-select map: five life stages, Nuno's portrait at each age.
// Picking the active world goes to its level select; picking another
// unlocked world saves the choice and reloads (packs load at boot).
export default class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super('WorldSelectScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1b2447');
    this.scale.once('resize', () => this.scene.restart());

    this.add
      .text(width / 2, 52, 'SELECT WORLD', {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    this.add
      .text(width / 2, 88, "five worlds, one life — Nuno grows as you play", {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a9bd8',
      })
      .setOrigin(0.5);

    const ids = Object.keys(WORLDS).map(Number);
    const gap = Math.min(150, (width - 120) / ids.length);
    const startX = width / 2 - ((ids.length - 1) * gap) / 2;

    this.nodes = ids.map((id, i) => {
      const world = WORLDS[id];
      const unlocked = isWorldUnlocked(id) && !!world.startLevel;
      const x = startX + i * gap;
      const y = height / 2 + 10;

      const ring = this.add.circle(x, y, 44, 0x2b3766).setStrokeStyle(3, 0x3d4c8a);
      const portrait = this.add
        .sprite(x, y, `nuno-w${id}`, world.character.idleFrame)
        .setScale(2.6);
      const label = this.add
        .text(x, y + 66, world.stage.toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 3);
      const sub = this.add
        .text(x, y + 86, `WORLD ${id}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8a9bd8',
        })
        .setOrigin(0.5);

      if (!unlocked) {
        portrait.setTintFill(0x0e142e); // silhouette: the future is a mystery
        label.setColor('#556');
        this.add
          .text(x, y, '🔒', { fontSize: '18px' })
          .setOrigin(0.5)
          .setDepth(2);
      } else {
        ring.setInteractive({ useHandCursor: true });
        portrait.setInteractive({ useHandCursor: true });
        const pick = () => this.choose(id);
        const hover = () => this.select(i);
        for (const obj of [ring, portrait]) {
          obj.on('pointerover', hover);
          obj.on('pointerdown', () => {
            this.select(i);
            pick();
          });
        }
      }
      return { id, ring, unlocked };
    });

    this.add
      .text(width / 2, height - 30, '←/→ choose · ENTER play · ESC back', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a9bd8',
      })
      .setOrigin(0.5);

    this.index = this.nodes.findIndex((n) => n.id === ACTIVE_WORLD);
    if (this.index < 0 || !this.nodes[this.index].unlocked) {
      this.index = this.nodes.findIndex((n) => n.unlocked);
    }
    this.select(this.index);

    const move = (dir) => {
      let i = this.index;
      do i = (i + dir + this.nodes.length) % this.nodes.length;
      while (!this.nodes[i].unlocked);
      this.select(i);
    };
    this.input.keyboard.on('keydown-LEFT', () => move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => move(1));
    this.input.keyboard.on('keydown-A', () => move(-1));
    this.input.keyboard.on('keydown-D', () => move(1));
    this.input.keyboard.on('keydown-ENTER', () => this.choose(this.nodes[this.index].id));
    this.input.keyboard.on('keydown-SPACE', () => this.choose(this.nodes[this.index].id));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }

  select(i) {
    if (!this.nodes[i]?.unlocked) return;
    this.index = i;
    for (const [j, node] of this.nodes.entries()) {
      node.ring.setStrokeStyle(3, j === i ? 0xffe066 : 0x3d4c8a);
    }
  }

  choose(id) {
    const node = this.nodes.find((n) => n.id === id);
    if (!node?.unlocked) return;
    if (id === ACTIVE_WORLD) {
      this.scene.start('LevelSelectScene');
    } else {
      switchWorld(id); // saves the choice + reloads into that world's pack
    }
  }
}
