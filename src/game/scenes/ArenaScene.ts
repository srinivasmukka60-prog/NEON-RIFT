/**
 * NEON RIFT - Phaser 3 Arena Scene
 * Renders the futuristic neon battleground, authoritative interpolated players,
 * energy crystals, control zones, and particle effects.
 */
import Phaser from 'phaser';
import {
  RoomState,
  PlayerState,
  CrystalState,
  ControlZoneState,
  CombatEvent
} from '../../shared/types';
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PLAYER_RADIUS,
  CRYSTAL_RADIUS
} from '../../shared/constants';
import { soundEngine } from '../../services/audio';

interface PlayerRenderObject {
  container: Phaser.GameObjects.Container;
  bodyGraphic: Phaser.GameObjects.Graphics;
  shieldGraphic: Phaser.GameObjects.Graphics;
  healthBar: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  targetX: number;
  targetY: number;
  targetAngle: number;
}

export class ArenaScene extends Phaser.Scene {
  private roomState: RoomState | null = null;
  private myPlayerId: string = '';
  private playerObjects: Map<string, PlayerRenderObject> = new Map();
  private crystalObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private zoneObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private obstacleGraphics: Phaser.GameObjects.Graphics | null = null;
  private gridGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  public init(data: { myPlayerId: string }) {
    this.myPlayerId = data.myPlayerId || '';
  }

  public setMyPlayerId(id: string) {
    this.myPlayerId = id;
  }

  public setRoomState(state: RoomState) {
    this.roomState = state;
  }

  public handleCombatEvent(event: CombatEvent) {
    const { type, x, y, value, sourcePlayerId, targetPlayerId } = event;

    if (type === 'crystal') {
      soundEngine.playCrystalPickup(value ? value > 20 : false);
      if (x !== undefined && y !== undefined) {
        this.emitCrystalParticles(x, y, value ? value > 20 : false);
      }
    } else if (type === 'dash') {
      soundEngine.playDash();
      if (x !== undefined && y !== undefined) {
        this.emitDashShock(x, y);
      }
    } else if (type === 'pulse') {
      soundEngine.playPulse();
      if (x !== undefined && y !== undefined) {
        this.emitPulseWave(x, y, value || 180);
      }
    } else if (type === 'damage') {
      soundEngine.playDamage();
      if (x !== undefined && y !== undefined) {
        this.emitDamageNumber(x, y, `-${value}`);
      }
    } else if (type === 'takedown') {
      soundEngine.playTakedown();
      if (x !== undefined && y !== undefined) {
        this.emitDamageNumber(x, y - 20, `TAKEDOWN! +${value}`, '#ff0055');
      }
    }
  }

  public create() {
    // Set World and Camera Bounds
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw Cybernetic Grid Background
    this.drawBackground();

    // Draw Static Obstacles
    this.drawObstacles();

    // Camera setup
    this.cameras.main.setZoom(0.95);
  }

  private drawBackground() {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(-10);

    // Arena Floor: Deep Navy
    this.gridGraphics.fillStyle(0x060913, 1);
    this.gridGraphics.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Subtle Grid lines
    this.gridGraphics.lineStyle(1, 0x111e38, 0.4);
    const gridSize = 60;
    for (let x = 0; x <= ARENA_WIDTH; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(ARENA_WIDTH, y);
    }
    this.gridGraphics.strokePath();

    // Arena Perimeter Glow Walls
    this.gridGraphics.lineStyle(6, 0x00f5ff, 0.7);
    this.gridGraphics.strokeRect(4, 4, ARENA_WIDTH - 8, ARENA_HEIGHT - 8);

    this.gridGraphics.lineStyle(2, 0xbf55ec, 0.9);
    this.gridGraphics.strokeRect(10, 10, ARENA_WIDTH - 20, ARENA_HEIGHT - 20);
  }

  private drawObstacles() {
    if (!this.roomState) return;

    this.obstacleGraphics = this.add.graphics();
    this.obstacleGraphics.setDepth(1);

    for (const obs of this.roomState.obstacles) {
      // Dark cyber barrier fill
      this.obstacleGraphics.fillStyle(0x0d1527, 0.95);
      this.obstacleGraphics.fillRoundedRect(obs.x, obs.y, obs.width, obs.height, 8);

      // Glowing border
      const borderColor = obs.type === 'pillar' ? 0xbf55ec : 0x00f5ff;
      this.obstacleGraphics.lineStyle(2.5, borderColor, 0.85);
      this.obstacleGraphics.strokeRoundedRect(obs.x, obs.y, obs.width, obs.height, 8);

      // Center tech accent
      this.obstacleGraphics.fillStyle(borderColor, 0.25);
      this.obstacleGraphics.fillRect(
        obs.x + obs.width / 2 - 4,
        obs.y + obs.height / 2 - 4,
        8,
        8
      );
    }
  }

  public update(time: number, delta: number) {
    if (!this.roomState) return;

    // Draw Obstacles once state is available if not drawn
    if (!this.obstacleGraphics && this.roomState.obstacles.length > 0) {
      this.drawObstacles();
    }

    // 1. Update Control Zones
    this.updateZones(time);

    // 2. Update Crystals
    this.updateCrystals(time);

    // 3. Update Players
    this.updatePlayers(delta);

    // 4. Update Camera follow
    if (this.myPlayerId && this.playerObjects.has(this.myPlayerId)) {
      const myObj = this.playerObjects.get(this.myPlayerId);
      if (myObj) {
        this.cameras.main.startFollow(myObj.container, true, 0.1, 0.1);
      }
    }
  }

  private updateZones(time: number) {
    if (!this.roomState) return;

    for (const zone of this.roomState.zones) {
      let zoneCont = this.zoneObjects.get(zone.id);

      if (!zoneCont) {
        zoneCont = this.add.container(zone.x, zone.y);
        zoneCont.setDepth(0);

        const baseGraphic = this.add.graphics();
        const labelText = this.add.text(0, 0, zone.name, {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5);

        zoneCont.add([baseGraphic, labelText]);
        this.zoneObjects.set(zone.id, zoneCont);
      }

      // Re-draw zone visual
      const baseGraphic = zoneCont.getAt(0) as Phaser.GameObjects.Graphics;
      baseGraphic.clear();

      const hexColor = zone.controllingPlayerId
        ? parseInt(zone.color.replace('#', '0x'))
        : 0x334466;

      // Outer boundary ring
      baseGraphic.lineStyle(2, hexColor, 0.4);
      baseGraphic.strokeCircle(0, 0, zone.radius);

      // Rotating dashed-like marks
      baseGraphic.lineStyle(3, hexColor, 0.7);
      const angle = (time / 1000) % (Math.PI * 2);
      baseGraphic.beginPath();
      baseGraphic.arc(0, 0, zone.radius, angle, angle + Math.PI * 0.6);
      baseGraphic.strokePath();

      baseGraphic.beginPath();
      baseGraphic.arc(0, 0, zone.radius, angle + Math.PI, angle + Math.PI * 1.6);
      baseGraphic.strokePath();

      // Inner fill
      baseGraphic.fillStyle(hexColor, zone.controllingPlayerId ? 0.18 : 0.05);
      baseGraphic.fillCircle(0, 0, zone.radius);
    }
  }

  private updateCrystals(time: number) {
    if (!this.roomState) return;

    const currentCrystalIds = new Set(Object.keys(this.roomState.crystals));

    // Remove despawned crystals
    for (const [id, cont] of this.crystalObjects.entries()) {
      if (!currentCrystalIds.has(id)) {
        cont.destroy();
        this.crystalObjects.delete(id);
      }
    }

    // Add or animate crystals
    for (const [id, crystal] of Object.entries(this.roomState.crystals)) {
      let cont = this.crystalObjects.get(id);

      if (!cont) {
        cont = this.add.container(crystal.x, crystal.y);
        cont.setDepth(2);

        const g = this.add.graphics();
        cont.add(g);
        this.crystalObjects.set(id, cont);
      }

      const g = cont.getAt(0) as Phaser.GameObjects.Graphics;
      g.clear();

      const isMega = crystal.type === 'mega';
      const color = isMega ? 0xffaa00 : 0x00f5ff;
      const size = isMega ? 16 : 11;
      const floatOffset = Math.sin((time + crystal.spawnedAt) / 250) * 4;

      cont.y = crystal.y + floatOffset;

      // Glow halo
      g.fillStyle(color, 0.2);
      g.fillCircle(0, 0, size * 1.6);

      // Diamond / Octahedron Shape
      g.fillStyle(color, 0.95);
      g.beginPath();
      g.moveTo(0, -size);
      g.lineTo(size * 0.8, 0);
      g.lineTo(0, size);
      g.lineTo(-size * 0.8, 0);
      g.closePath();
      g.fillPath();

      // Bright inner core
      g.fillStyle(0xffffff, 0.9);
      g.beginPath();
      g.moveTo(0, -size * 0.4);
      g.lineTo(size * 0.3, 0);
      g.lineTo(0, size * 0.4);
      g.lineTo(-size * 0.3, 0);
      g.closePath();
      g.fillPath();
    }
  }

  private updatePlayers(delta: number) {
    if (!this.roomState) return;

    const activePlayerIds = new Set(Object.keys(this.roomState.players));

    // Remove disconnected players
    for (const [id, pObj] of this.playerObjects.entries()) {
      if (!activePlayerIds.has(id)) {
        pObj.container.destroy();
        this.playerObjects.delete(id);
      }
    }

    // Update active players
    for (const [id, p] of Object.entries(this.roomState.players)) {
      let pObj = this.playerObjects.get(id);

      if (!pObj) {
        const container = this.add.container(p.x, p.y);
        container.setDepth(5);

        const shieldGraphic = this.add.graphics();
        const bodyGraphic = this.add.graphics();
        const healthBar = this.add.graphics();

        const nameText = this.add.text(0, -PLAYER_RADIUS - 16, p.name, {
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: id === this.myPlayerId ? '#00f5ff' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        container.add([shieldGraphic, bodyGraphic, healthBar, nameText]);

        pObj = {
          container,
          bodyGraphic,
          shieldGraphic,
          healthBar,
          nameText,
          targetX: p.x,
          targetY: p.y,
          targetAngle: p.angle
        };
        this.playerObjects.set(id, pObj);
      }

      pObj.targetX = p.x;
      pObj.targetY = p.y;
      pObj.targetAngle = p.angle;

      // Smooth client-side interpolation (lerp)
      const lerpSpeed = Math.min(1, (delta / 1000) * 20);
      pObj.container.x += (pObj.targetX - pObj.container.x) * lerpSpeed;
      pObj.container.y += (pObj.targetY - pObj.container.y) * lerpSpeed;

      // Visible/Dead toggle
      pObj.container.setVisible(p.isAlive);
      if (!p.isAlive) continue;

      // Respawn Invulnerability strobe
      if (p.isInvulnerable) {
        pObj.container.alpha = Math.floor(Date.now() / 100) % 2 === 0 ? 0.4 : 1.0;
      } else {
        pObj.container.alpha = 1.0;
      }

      // Draw Ship Body
      pObj.bodyGraphic.clear();
      const hexColor = parseInt(p.color.replace('#', '0x')) || 0x00f5ff;

      // Glowing base aura
      pObj.bodyGraphic.fillStyle(hexColor, 0.25);
      pObj.bodyGraphic.fillCircle(0, 0, PLAYER_RADIUS + 4);

      // Rotating ship craft container angle
      pObj.bodyGraphic.rotation = p.angle;

      // Futuristic Triangular Hull
      pObj.bodyGraphic.fillStyle(0x0e172a, 1);
      pObj.bodyGraphic.lineStyle(2.5, hexColor, 1);
      pObj.bodyGraphic.beginPath();
      pObj.bodyGraphic.moveTo(PLAYER_RADIUS, 0);
      pObj.bodyGraphic.lineTo(-PLAYER_RADIUS * 0.75, -PLAYER_RADIUS * 0.7);
      pObj.bodyGraphic.lineTo(-PLAYER_RADIUS * 0.4, 0);
      pObj.bodyGraphic.lineTo(-PLAYER_RADIUS * 0.75, PLAYER_RADIUS * 0.7);
      pObj.bodyGraphic.closePath();
      pObj.bodyGraphic.fillPath();
      pObj.bodyGraphic.strokePath();

      // Thruster Flame when moving
      if (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10 || p.isDashing) {
        const flameLength = p.isDashing ? 26 : 14;
        pObj.bodyGraphic.fillStyle(0x00f5ff, 0.9);
        pObj.bodyGraphic.beginPath();
        pObj.bodyGraphic.moveTo(-PLAYER_RADIUS * 0.4, -4);
        pObj.bodyGraphic.lineTo(-PLAYER_RADIUS * 0.4 - flameLength, 0);
        pObj.bodyGraphic.lineTo(-PLAYER_RADIUS * 0.4, 4);
        pObj.bodyGraphic.closePath();
        pObj.bodyGraphic.fillPath();
      }

      // Draw Shield Bubble if active
      pObj.shieldGraphic.clear();
      if (p.isShieldActive) {
        pObj.shieldGraphic.lineStyle(3, 0x00f5ff, 0.9);
        pObj.shieldGraphic.strokeCircle(0, 0, PLAYER_RADIUS + 12);
        pObj.shieldGraphic.fillStyle(0x00f5ff, 0.2);
        pObj.shieldGraphic.fillCircle(0, 0, PLAYER_RADIUS + 12);
      }

      // Draw Health Bar Overhead
      pObj.healthBar.clear();
      const barWidth = 44;
      const barHeight = 5;
      const barY = -PLAYER_RADIUS - 6;

      // Background
      pObj.healthBar.fillStyle(0x111111, 0.8);
      pObj.healthBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);

      // Current health
      const hpPercent = Math.max(0, Math.min(1, p.health / p.maxHealth));
      const hpColor = hpPercent > 0.5 ? 0x00ff9d : hpPercent > 0.25 ? 0xffaa00 : 0xff0055;
      pObj.healthBar.fillStyle(hpColor, 1);
      pObj.healthBar.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
  }

  // Particle Effects
  private emitCrystalParticles(x: number, y: number, isMega: boolean) {
    const color = isMega ? 0xffaa00 : 0x00f5ff;
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 3, color, 0.9);
      p.setDepth(6);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40;

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  private emitDashShock(x: number, y: number) {
    const ring = this.add.circle(x, y, 10);
    ring.setStrokeStyle(3, 0x00f5ff, 0.9);
    ring.setDepth(4);

    this.tweens.add({
      targets: ring,
      radius: 60,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  private emitPulseWave(x: number, y: number, radius: number) {
    const ring = this.add.circle(x, y, 15);
    ring.setStrokeStyle(4, 0xffaa00, 1);
    ring.setFillStyle(0xffaa00, 0.15);
    ring.setDepth(4);

    this.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  private emitDamageNumber(x: number, y: number, text: string, color: string = '#ff3366') {
    const t = this.add.text(x, y - 20, text, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    t.setDepth(8);

    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => t.destroy()
    });
  }
}
