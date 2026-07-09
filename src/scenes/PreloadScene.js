import Phaser from 'phaser';
import { COMMON, WORLDS, getActiveWorld, resolveTheme } from '../config/worlds.js';

const PACKS_DIR = 'assets/packs';

// The pale sky colour baked into Kenney's background tiles — we turn it
// transparent at load time so the hills can sit on our own blue sky.
const BG_SKY_COLOR = { r: 223, g: 246, b: 245 };

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    this.loadFailed = false;

    // --- Simple loading bar driven by the loader's progress event (0..1)
    this.add.rectangle(width / 2, height / 2, 324, 22, 0x222230);
    this.bar = this.add
      .rectangle(width / 2 - 158, height / 2, 316, 12, 0x5c94fc)
      .setOrigin(0, 0.5)
      .setScale(0, 1);
    this.attachLoaderEvents();

    // --- Pass 1: just the manifests. Each pack DECLARES its sheets and
    // animations; the game loads what the manifest says, never a folder
    // scan. Sheets are queued in create(), once these are parsed.
    // ALL world manifests load (tiny JSONs) — the world-select map needs
    // every age's portrait, not just the active world's.
    this.load.json('manifest:common', `${PACKS_DIR}/common/manifest.json`);
    for (const world of Object.values(WORLDS)) {
      this.load.json(`manifest:${world.pack}`, `${PACKS_DIR}/${world.pack}/manifest.json`);
    }
  }

  /** Phaser's loader drops ALL its listeners when a load pass completes,
   *  so these must be re-attached before every pass — including the
   *  error trap, or a bad filename in pass 2 would fail silently. */
  attachLoaderEvents() {
    this.load.on('progress', (value) => this.bar.setScale(value, 1));
    // A missing file must be IMPOSSIBLE to miss — no silent black squares.
    this.load.on('loaderror', (file) => this.failLoudly(file.key, file.src ?? file.url));
  }

  create() {
    // --- Pass 2: the spritesheets the manifests list. Full sheets for
    // common + the ACTIVE world; from the other worlds only the `nuno`
    // character sheet, keyed nuno-w{id} (world-select portraits).
    const manifests = [
      { base: `${PACKS_DIR}/common`, data: this.cache.json.get('manifest:common') },
      {
        base: `${PACKS_DIR}/${getActiveWorld().pack}`,
        data: this.cache.json.get(`manifest:${getActiveWorld().pack}`),
      },
    ];
    for (const m of manifests) {
      if (!m.data) return; // manifest 404 — failLoudly already fired
      for (const [key, sheet] of Object.entries(m.data.sheets)) {
        this.load.spritesheet(key, `${m.base}/${sheet.file}`, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
      }
    }
    this.portraitKeys = {};
    for (const world of Object.values(WORLDS)) {
      const data = this.cache.json.get(`manifest:${world.pack}`);
      const nuno = data?.sheets?.nuno;
      if (!nuno) continue;
      const key = `nuno-w${world.id}`;
      this.portraitKeys[key] = `${PACKS_DIR}/${world.pack}/${nuno.file}`;
      this.load.spritesheet(key, this.portraitKeys[key], {
        frameWidth: nuno.frameWidth,
        frameHeight: nuno.frameHeight,
      });
    }
    this.attachLoaderEvents();
    this.load.once('complete', () => this.onAssetsReady(manifests));
    this.load.start();
  }

  /** Everything that needs loaded textures: generated art, anims, boot. */
  onAssetsReady(manifests) {
    // Belt AND suspenders: Phaser emits 'loaderror' for network failures
    // but only console-logs a file that fails at the PROCESSING stage —
    // so verify every sheet the manifests promised actually exists.
    for (const m of manifests) {
      for (const [key, sheet] of Object.entries(m.data.sheets)) {
        if (!this.textures.exists(key)) this.failLoudly(key, `${m.base}/${sheet.file}`);
      }
    }
    for (const [key, url] of Object.entries(this.portraitKeys)) {
      if (!this.textures.exists(key)) this.failLoudly(key, url);
    }
    if (this.loadFailed) return;
    this.createAnimations(manifests);
    // TileSprites repeat a whole texture, not a single frame of a sheet —
    // so we copy the frames we want to repeat into small standalone textures.
    // The ACTIVE world's overworld theme decides what ground and parallax
    // look like (world 1: calçada + the Lisbon skyline).
    const overworld = resolveTheme(getActiveWorld(), 'overworld');
    const terrainSheet = overworld.terrainSheet ?? 'tiles';
    this.makeTilingTexture('tex-grass-top', terrainSheet, [overworld.terrainTop]);
    this.makeTilingTexture('tex-dirt', terrainSheet, [overworld.terrainFill]);
    const par = overworld.parallaxSource ?? {
      sheet: 'bg',
      frames: COMMON.frames.hills,
      colorKey: BG_SKY_COLOR,
    };
    this.makeTilingTexture('tex-hills', par.sheet, par.frames, par.colorKey ?? null);
    this.makeFireballTexture();

    // Tints in Phaser MULTIPLY colours, so they can only darken — an
    // orange tint on the blue gem gives muddy green. For real recolours
    // we rewrite the pixels instead:
    // fire gem: swap red/blue channels → blue gem becomes orange,
    // with all of its shading intact.
    const gem = COMMON.frames.tiles.gemBlue;
    this.makeRecoloredTexture('gem-fire', 'tiles', gem, (r, g, b) => [b, g, r]);
    // star gem: bright neutral version → rainbow tints stay vivid.
    this.makeRecoloredTexture('gem-star', 'tiles', gem, (r, g, b) => {
      const l = Math.min(255, Math.round(Math.max(r, g, b) * 1.15));
      return [l, l, l];
    });
    // The pack has no Mario-style pipe tiles — draw our own.
    this.makePipeTextures();

    // 4x4 white square for particle sparkles (tinted per use)
    const spark = this.textures.createCanvas('spark', 4, 4);
    spark.context.fillStyle = '#ffffff';
    spark.context.fillRect(0, 0, 4, 4);
    spark.refresh();
    // 1-UP mushroom: swap R/G — the red cap turns green.
    this.makeRecoloredTexture('mushroom-1up', 'tiles', COMMON.frames.tiles.mushroom, (r, g, b) => [g, r, b]);

    // Game-wide state lives in the registry so it survives scene changes
    // and the HUD can listen for changes.
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
    this.registry.set('lives', 3);
    this.registry.set('time', 300);
    this.registry.set('world', '1-1');

    this.scene.start('TitleScene');
  }

  /** Big red unmissable error — a wrong filename must never fail silently. */
  failLoudly(key, url) {
    this.loadFailed = true;
    const msg = `ASSET LOAD FAILED\n\nkey: "${key}"\n${url ?? ''}\n\nCheck the pack's manifest.json — the file name must match exactly.`;
    console.error(`[Super Nuno] ${msg.replace(/\n+/g, ' — ')}`);
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x220000, 0.92).setDepth(99);
    this.add
      .text(width / 2, height / 2, msg, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ff5555',
        align: 'center',
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  /** Animations are DATA in the pack manifests, created here in one loop. */
  createAnimations(manifests) {
    for (const m of manifests) {
      for (const [key, a] of Object.entries(m.data.anims ?? {})) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(a.sheet, { frames: a.frames }),
          frameRate: a.frameRate ?? 0,
          repeat: a.repeat ?? 0,
        });
      }
    }
  }

  /**
   * Copies one or more frames side by side into a new canvas texture.
   * If colorKey is given, every pixel of exactly that colour becomes
   * transparent (classic "color key" transparency).
   */
  makeTilingTexture(destKey, srcKey, frames, colorKey = null) {
    const first = this.textures.getFrame(srcKey, frames[0]);
    const w = first.width;
    const h = first.height;

    const canvas = this.textures.createCanvas(destKey, w * frames.length, h);
    const ctx = canvas.context;

    frames.forEach((frameIndex, i) => {
      const f = this.textures.getFrame(srcKey, frameIndex);
      // cutX/cutY = where this frame lives inside the packed source image
      ctx.drawImage(f.source.image, f.cutX, f.cutY, w, h, i * w, 0, w, h);
    });

    if (colorKey) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data; // flat array: r,g,b,a, r,g,b,a, ...
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === colorKey.r && d[i + 1] === colorKey.g && d[i + 2] === colorKey.b) {
          d[i + 3] = 0; // alpha 0 = fully transparent
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    canvas.refresh(); // push the canvas pixels to the GPU texture
  }

  /** Copies a frame into a new texture, rewriting every pixel's colour. */
  makeRecoloredTexture(destKey, srcKey, frameIndex, transform) {
    const f = this.textures.getFrame(srcKey, frameIndex);
    const canvas = this.textures.createCanvas(destKey, f.width, f.height);
    const ctx = canvas.context;
    ctx.drawImage(f.source.image, f.cutX, f.cutY, f.width, f.height, 0, 0, f.width, f.height);

    const img = ctx.getImageData(0, 0, f.width, f.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue; // skip transparent pixels
      const [r, g, b] = transform(d[i], d[i + 1], d[i + 2]);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
    canvas.refresh();
  }

  /** Classic green pipe: a wider rimmed mouth + a tileable shaft piece. */
  makePipeTextures() {
    const OUTLINE = '#14541c';
    const DARK = '#2e8a36';
    const MID = '#48b552';
    const LIGHT = '#a0e25c';

    const mouth = this.textures.createCanvas('pipe-mouth', 44, 18);
    const m = mouth.context;
    m.fillStyle = OUTLINE;
    m.fillRect(0, 0, 44, 18);
    m.fillStyle = MID;
    m.fillRect(2, 2, 40, 14);
    m.fillStyle = LIGHT;
    m.fillRect(7, 2, 7, 14);
    m.fillStyle = DARK;
    m.fillRect(33, 2, 6, 14);
    mouth.refresh();

    const shaft = this.textures.createCanvas('pipe-shaft', 36, 18);
    const s = shaft.context;
    s.fillStyle = MID;
    s.fillRect(0, 0, 36, 18);
    s.fillStyle = OUTLINE;
    s.fillRect(0, 0, 2, 18);
    s.fillRect(34, 0, 2, 18);
    s.fillStyle = LIGHT;
    s.fillRect(6, 0, 6, 18);
    s.fillStyle = DARK;
    s.fillRect(28, 0, 5, 18);
    shaft.refresh();
  }

  /** A tiny hand-drawn texture: orange ball with a yellow core. */
  makeFireballTexture() {
    const size = 10;
    const canvas = this.textures.createCanvas('fireball', size, size);
    const ctx = canvas.context;
    ctx.fillStyle = '#d83b0c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9b1c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe45c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    canvas.refresh();
  }

}
