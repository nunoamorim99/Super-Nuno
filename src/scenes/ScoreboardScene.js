import Phaser from 'phaser';
import { LEVELS } from '../levels/index.js';
import { WORLDS } from '../config/worlds.js';
import { isCompleted, highScore, bestScore } from '../save/progress.js';

// Local scoreboard: the high score plus completion at a glance.
// Phase 7 expands this with per-level bests from the full save system.
export default class ScoreboardScene extends Phaser.Scene {
  constructor() {
    super('ScoreboardScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1b2447');
    this.scale.once('resize', () => this.scene.restart());

    this.add
      .text(width / 2, 60, 'SCOREBOARD', {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    this.add
      .text(width / 2, 116, `HIGH SCORE   ${String(highScore()).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#9dff8d',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    let y = 168;
    for (const world of Object.values(WORLDS)) {
      if (world.levels.length === 0) continue;
      const done = world.levels.filter(isCompleted).length;
      this.add
        .text(width / 2, y, `— ${world.title}  ·  ${done}/${world.levels.length} —`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: 'bold',
          color: done === world.levels.length ? '#9dff8d' : '#8a9bd8',
        })
        .setOrigin(0.5);
      y += 26;
      for (const id of world.levels) {
        const best = bestScore(id);
        const line = `${isCompleted(id) ? '✓' : '·'} ${LEVELS[id].name.padEnd(12)} best ${
          best ? String(best).padStart(6, '0') : '——————'
        }`;
        this.add
          .text(width / 2, y, line, {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: isCompleted(id) ? '#ffffff' : '#667',
          })
          .setOrigin(0.5);
        y += 22;
      }
      y += 8;
    }

    const prompt = this.add
      .text(width / 2, height - 40, 'ESC / TAP TO GO BACK', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8a9bd8',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const back = () => this.scene.start('TitleScene');
    this.input.keyboard.once('keydown-ESC', back);
    this.input.keyboard.once('keydown-SPACE', back);
    this.input.once('pointerdown', back);
  }
}
