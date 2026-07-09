import Phaser from 'phaser';
import { loadHighScore } from '../highscore.js';
import { WORLDS } from '../config/worlds.js';
import { isCompleted } from '../save/progress.js';

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
      .text(width / 2, 140, `HIGH SCORE   ${String(loadHighScore()).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#9dff8d',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    let y = 200;
    for (const world of Object.values(WORLDS)) {
      if (world.levels.length === 0) continue;
      const done = world.levels.filter(isCompleted).length;
      this.add
        .text(width / 2, y, `${world.title}   ${done}/${world.levels.length} levels`, {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: done === world.levels.length ? '#9dff8d' : '#ffffff',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 3);
      y += 30;
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
