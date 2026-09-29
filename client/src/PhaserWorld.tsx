import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { Category, Ingredient } from "./types";

type WorldMonster = {
  id: number;
  name: string;
  image: string;
  x: number;
  y: number;
};

type Props = {
  playerName: string;
  selected: Partial<Record<Category, Ingredient>>;
  monsters: WorldMonster[];
  defeated: number[];
  resetNonce: number;
  onEncounter: (id: number) => void;
};

type HeldDirection = "up" | "down" | "left" | "right" | null;

const TILE_SHEET = "/kenney/rpg/Spritesheet/roguelikeSheet_transparent.png";

export default function PhaserWorld({ playerName, selected, monsters, defeated, resetNonce, onEncounter }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const heldRef = useRef<HeldDirection>(null);
  const encounterRef = useRef(onEncounter);
  encounterRef.current = onEncounter;

  useEffect(() => {
    if (!hostRef.current) return;

    const activeMonsters = monsters.filter((monster) => !defeated.includes(monster.id));
    const layers = [selected.bun?.image, selected.cheese?.image, selected.protein?.image, selected.fresh?.image, selected.bun?.bottomImage]
      .filter(Boolean) as string[];

    class QuestScene extends Phaser.Scene {
      player!: Phaser.GameObjects.Container;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      wasd!: Record<string, Phaser.Input.Keyboard.Key>;
      encounterLocked = false;

      constructor() { super("BurgerGarden"); }

      preload() {
        this.load.spritesheet("kenney-rpg", TILE_SHEET, { frameWidth: 16, frameHeight: 16, spacing: 1 });
        layers.forEach((url, index) => this.load.image(`burger-layer-${index}`, url));
        activeMonsters.forEach((monster) => this.load.image(`monster-${monster.id}`, monster.image));
      }

      create() {
        const width = 1800;
        const height = 1120;
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor("#15381f");

        // Kenney tile field: grass, paths, water and decorative RPG props.
        const grass = this.add.graphics();
        for (let y = 0; y < height; y += 48) {
          for (let x = 0; x < width; x += 48) {
            grass.fillStyle((x / 48 + y / 48) % 2 ? 0x477c3d : 0x4f8543, 1);
            grass.fillRect(x, y, 48, 48);
            if ((x / 48 * 3 + y / 48) % 17 === 0) this.add.image(x + 24, y + 24, "kenney-rpg", 399).setScale(2.7).setAlpha(.75);
          }
        }

        const road = this.add.graphics();
        road.fillStyle(0xb6834d, 1);
        road.fillRoundedRect(-80, 690, 1960, 245, 110);
        road.fillRoundedRect(715, -80, 250, 1280, 110);
        road.lineStyle(8, 0x835b36, .38);
        road.strokeRoundedRect(-80, 690, 1960, 245, 110);
        road.strokeRoundedRect(715, -80, 250, 1280, 110);

        const water = this.add.graphics();
        water.fillStyle(0x2ca4a5, 1);
        water.fillRoundedRect(1315, 760, 390, 260, 85);
        water.lineStyle(14, 0x76c6a0, .75);
        water.strokeRoundedRect(1315, 760, 390, 260, 85);
        for (let x = 1360; x < 1680; x += 55) this.add.image(x, 835 + (x % 3) * 32, "kenney-rpg", 3).setScale(2.4).setAlpha(.72);

        const blockers = this.physics.add.staticGroup();
        const addProp = (x: number, y: number, frame: number, scale = 3.2, blocks = true) => {
          const prop = this.add.image(x, y, "kenney-rpg", frame).setScale(scale).setDepth(y);
          if (blocks) blockers.add(prop);
        };

        const trees = [
          [90,100],[230,90],[390,135],[610,90],[1050,100],[1240,95],[1450,120],[1690,100],
          [90,350],[260,430],[1510,390],[1700,455],[120,1040],[340,1015],[580,1040],[1120,1030],[1580,1060],[1740,980]
        ];
        trees.forEach(([x, y], index) => addProp(x, y, index % 3 === 0 ? 580 : 581, 4.2));
        [[520,300],[1170,300],[350,610],[1450,620],[1090,620]].forEach(([x,y]) => addProp(x,y,601,3.1));
        [[1320,220],[1380,220],[1440,220],[1500,220]].forEach(([x,y], index) => addProp(x,y,45 + index,3));

        const shop = this.add.container(235, 700).setDepth(700);
        const shopBody = this.add.rectangle(0, 0, 150, 115, 0x9c422a).setStrokeStyle(8, 0x542817);
        const shopRoof = this.add.triangle(0, -77, -95, 25, 95, 25, 0, -65, 0xe99b38).setStrokeStyle(7, 0x542817);
        const shopText = this.add.text(0, 10, "🍟\nจุดพัก", { align: "center", fontFamily: "sans-serif", fontSize: "24px", color: "#fff" }).setOrigin(.5);
        shop.add([shopBody, shopRoof, shopText]);

        const burgerParts = layers.map((_, index) => this.add.image(0, -36 + index * 16, `burger-layer-${index}`).setDisplaySize(104, 58));
        const shadow = this.add.ellipse(0, 42, 88, 28, 0x000000, .35);
        const face = this.add.text(0, 2, "•ᴗ•", { fontFamily: "monospace", fontSize: "18px", color: "#ffffff", backgroundColor: "#28160ccc", padding: { x: 7, y: 1 } }).setOrigin(.5);
        const label = this.add.text(0, 68, playerName, { fontFamily: "sans-serif", fontStyle: "bold", fontSize: "15px", color: "#ffffff", backgroundColor: "#101910dd", padding: { x: 8, y: 4 } }).setOrigin(.5);
        this.player = this.add.container(300, 850, [shadow, ...burgerParts, face, label]).setSize(72, 70).setDepth(1000);
        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true).setSize(62, 48).setOffset(5, 6);
        this.physics.add.collider(this.player, blockers);

        activeMonsters.forEach((monster) => {
          const enemy = this.physics.add.image(monster.x, monster.y, `monster-${monster.id}`).setDisplaySize(130, 130).setDepth(monster.y);
          enemy.setImmovable(true);
          const alert = this.add.text(monster.x + 48, monster.y - 62, "!", { fontFamily: "sans-serif", fontStyle: "bold", fontSize: "27px", color: "#1b1308", backgroundColor: "#d8ff3e", padding: { x: 10, y: 3 } }).setOrigin(.5).setDepth(monster.y + 1);
          this.tweens.add({ targets: [enemy, alert], y: "-=10", duration: 850, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          this.add.text(monster.x, monster.y + 79, monster.name, { fontFamily: "sans-serif", fontStyle: "bold", fontSize: "14px", color: "#fff", backgroundColor: "#111b12dd", padding: { x: 7, y: 4 } }).setOrigin(.5).setDepth(monster.y + 2);
          this.physics.add.overlap(this.player, enemy, () => {
            if (this.encounterLocked) return;
            this.encounterLocked = true;
            body.setVelocity(0, 0);
            this.cameras.main.flash(260, 255, 255, 255);
            this.time.delayedCall(240, () => encounterRef.current(monster.id));
          });
        });

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
        this.cameras.main.startFollow(this.player, true, .09, .09);
        this.cameras.main.setZoom(1.08);
        this.cameras.main.fadeIn(450, 0, 0, 0);
        this.add.text(900, 34, "สวนครัวพิศวง · BURGER QUEST", { fontFamily: "monospace", fontStyle: "bold", fontSize: "22px", color: "#ecf8d0", backgroundColor: "#0d1810cc", padding: { x: 18, y: 9 } }).setOrigin(.5).setScrollFactor(0).setDepth(3000);
      }

      update() {
        if (this.encounterLocked) return;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const held = heldRef.current;
        const left = this.cursors.left.isDown || this.wasd.A.isDown || held === "left";
        const right = this.cursors.right.isDown || this.wasd.D.isDown || held === "right";
        const up = this.cursors.up.isDown || this.wasd.W.isDown || held === "up";
        const down = this.cursors.down.isDown || this.wasd.S.isDown || held === "down";
        body.setVelocity(0, 0);
        if (left) body.setVelocityX(-235);
        else if (right) body.setVelocityX(235);
        if (up) body.setVelocityY(-235);
        else if (down) body.setVelocityY(235);
        body.velocity.normalize().scale(235);
        this.player.setDepth(this.player.y + 1000);
        if (body.velocity.lengthSq() > 0) {
          this.player.rotation = Math.sin(this.time.now / 70) * .035;
          this.player.scaleX = left ? -1 : 1;
        } else this.player.rotation = 0;
      }
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: hostRef.current.clientWidth,
      height: hostRef.current.clientHeight,
      backgroundColor: "#15381f",
      physics: { default: "arcade", arcade: { debug: false } },
      scene: QuestScene,
      render: { antialias: false, pixelArt: true },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { keyboard: true, mouse: true, touch: true },
    });

    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, [defeated, monsters, playerName, resetNonce, selected]);

  const hold = (direction: HeldDirection) => () => { heldRef.current = direction; };
  const release = () => { heldRef.current = null; };

  return (
    <>
      <div ref={hostRef} className="phaser-world" aria-label="แผนที่ผจญภัย Burger Quest" />
      <div className="phaser-dpad" onPointerLeave={release}>
        <button onPointerDown={hold("up")} onPointerUp={release}><img src="/kenney/ui/PNG/Green/Default/arrow_basic_n.png" alt="ขึ้น" /></button>
        <button onPointerDown={hold("left")} onPointerUp={release}><img src="/kenney/ui/PNG/Green/Default/arrow_basic_w.png" alt="ซ้าย" /></button>
        <button onPointerDown={hold("down")} onPointerUp={release}><img src="/kenney/ui/PNG/Green/Default/arrow_basic_s.png" alt="ลง" /></button>
        <button onPointerDown={hold("right")} onPointerUp={release}><img src="/kenney/ui/PNG/Green/Default/arrow_basic_e.png" alt="ขวา" /></button>
      </div>
    </>
  );
}
