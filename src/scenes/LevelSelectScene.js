import Phaser from 'phaser';
import { LEVELS } from '../levels/index.js';
import { getActiveWorld } from '../config/worlds.js';
import { isCompleted, unlockedLevels, setLastLevel } from '../save/progress.js';

// Per-world level select: unlocked levels are playable, completed ones
// are ticked, the rest wait behind their predecessor.
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const { width, height } = this.scale;
    const world = getActiveWorld();
    this.cameras.main.setBackgroundColor('#1b2447');
    this.scale.once('resize', () => this.scene.restart());

    this.add
      .text(width / 2, 52, world.title.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    const unlocked = unlockedLevels(world);
    this.entries = world.levels.map((id, i) => {
      const level = LEVELS[id];
      const open = unlocked.includes(id);
      const done = isCompleted(id);
      const y = 120 + i * 44;
      const status = done ? '✓' : open ? '▸' : '🔒';
      const text = this.add
        .text(width / 2, y, `${status}  ${level.name}`, {
          fontFamily: 'monospace',
          fontSize: '20px',
          fontStyle: 'bold',
          color: open ? (done ? '#9dff8d' : '#ffffff') : '#556',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4);
      if (open) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => this.select(i));
        text.on('pointerdown', () => {
          this.select(i);
          this.choose();
        });
      }
      return { id, text, open, done };
    });

    this.add
      .text(width / 2, height - 30, '↑/↓ choose · ENTER play · ESC back', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a9bd8',
      })
      .setOrigin(0.5);

    this.index = this.entries.findIndex((e) => e.open && !e.done);
    if (this.index < 0) this.index = this.entries.findIndex((e) => e.open);
    this.select(Math.max(0, this.index));

    const move = (dir) => {
      let i = this.index;
      do i = (i + dir + this.entries.length) % this.entries.length;
      while (!this.entries[i].open);
      this.select(i);
    };
    this.input.keyboard.on('keydown-UP', () => move(-1));
    this.input.keyboard.on('keydown-DOWN', () => move(1));
    this.input.keyboard.on('keydown-W', () => move(-1));
    this.input.keyboard.on('keydown-S', () => move(1));
    this.input.keyboard.on('keydown-ENTER', () => this.choose());
    this.input.keyboard.on('keydown-SPACE', () => this.choose());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('WorldSelectScene'));
  }

  select(i) {
    if (!this.entries[i]?.open) return;
    this.index = i;
    for (const [j, e] of this.entries.entries()) {
      e.text.setColor(j === i ? '#ffe066' : e.open ? (e.done ? '#9dff8d' : '#ffffff') : '#556');
    }
  }

  choose() {
    const entry = this.entries[this.index];
    if (!entry?.open) return;
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
    this.registry.set('lives', 3);
    setLastLevel(entry.id);
    this.scene.start('IntroScene', { levelId: entry.id });
  }
}
