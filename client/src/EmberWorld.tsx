import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ART, CAMP, CRYSTALS, ENEMIES, canWalk, levelOf, type Progress } from './questModel';
type Point = { x: number; y: number };
type Props = {
  progress: Progress; suspended: boolean; respawn: number; tint: number;
  running: boolean; onRun: () => void;
  onEncounter: (id: number) => void; onCollect: (id: number) => void;
  onPosition: (position: Point) => void; onNotice: (text: string) => void;
};
function findPath(start: Point, destination: Point): Point[] {
  const step = 12, cols = 128, rows = 85;
  const cells: number[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (canWalk(x * step, y * step)) cells.push(y * cols + x);
  const point = (id: number) => ({ x: id % cols * step, y: Math.floor(id / cols) * step });
  const nearest = (p: Point) => cells.reduce((best, id) => {
    const a = point(id), b = point(best);
    return Math.hypot(a.x-p.x,a.y-p.y) < Math.hypot(b.x-p.x,b.y-p.y) ? id : best;
  }, cells[0]);
  const origin = nearest(start), goal = nearest(destination), allowed = new Set(cells);
  const queue = [origin], previous = new Map<number, number>([[origin, -1]]);
  for (let i = 0; i < queue.length && !previous.has(goal); i++) {
    const current = queue[i];
    for (const next of [current - 1, current + 1, current - cols, current + cols]) {
      if (!allowed.has(next) || previous.has(next)) continue;
      previous.set(next, current); queue.push(next);
    }
  }
  if (!previous.has(goal)) return [];
  const route = [];
  for (let id = goal; id !== origin && id !== -1; id = previous.get(id) ?? -1) route.push(point(id));
  const raw=route.reverse(),smooth:Point[]=[];
  const visible=(a:Point,b:Point)=>{const length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(length/6);for(let i=1;i<=steps;i++)if(!canWalk(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;};
  let anchor=start;
  for(let i=0;i<raw.length;){let far=i;while(far+1<raw.length&&visible(anchor,raw[far+1]))far++;smooth.push(raw[far]);anchor=raw[far];i=far+1;}
  return smooth;
}
export default function EmberWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const held = useRef<string | null>(null);
  const [loading, setLoading] = useState(true), [failure, setFailure] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    let disposed = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    class Garden extends Phaser.Scene {
      hero!: Phaser.GameObjects.Sprite;
      shadow!: Phaser.GameObjects.Ellipse;
      aura!: Phaser.GameObjects.Ellipse;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      keys!: Record<string, Phaser.Input.Keyboard.Key>;
      destination: Point[] = [];
      foes: Phaser.GameObjects.Container[] = [];
      shards: Phaser.GameObjects.Container[] = [];
      collected = new Set<number>();
      encountered: number | null = null;
      lastRespawn = -1; blocked = false; cooldown = 0; lastReport = 0; lastDust = 0; direction = 'down';
      constructor() { super('EmberGarden'); }
      preload() {
        this.load.image('garden', ART + 'garden.png');
        this.load.image('hero', ART + 'hero.png');
        this.load.image('foes', ART + 'enemies.png');
        this.load.image('arena', ART + 'arena.png');
        this.load.on('loaderror', () => { if (!disposed) setFailure(true); });
      }
      create() {
        if (disposed || !this.textures.exists('hero') || !this.textures.exists('garden') || !this.textures.exists('foes')) return;
        const addFrames = (key: string, columns: number, rows: number) => {
          const texture = this.textures.get(key), source = texture.getSourceImage() as HTMLImageElement;
          for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
            const x = Math.round(col * source.width / columns), y = Math.round(row * source.height / rows);
            texture.add(row * columns + col, 0, x, y, Math.round((col + 1) * source.width / columns) - x, Math.round((row + 1) * source.height / rows) - y);
          }
        };
        addFrames('hero', 4, 4); addFrames('foes', 4, 3);
        this.add.image(0, 0, 'garden').setOrigin(0).setDisplaySize(1536, 1024);
        ['down','left','right','up'].forEach((direction, row) => this.anims.create({ key: direction, frames: this.anims.generateFrameNumbers('hero', { start: row * 4, end: row * 4 + 3 }), frameRate: 8, repeat: -1 }));
        ENEMIES.forEach((enemy, id) => {
          const shadow = this.add.ellipse(0, 2, 49, 15, 0x07130d, .5);
          const sprite = this.add.sprite(0, -27, 'foes', id * 4).setDisplaySize(id === 2 ? 82 : 66, id === 2 ? 82 : 66);
          this.anims.create({ key: 'foe-' + id, frames: [{ key: 'foes', frame: id * 4 }, { key: 'foes', frame: id * 4 + 1 }], frameRate: 1.5, repeat: -1 });
          if (!reducedMotion) sprite.play('foe-' + id);
          const marker = this.add.text(0, -79, id === 2 ? '♛' : '◆', { fontSize: '18px', color: id === 2 ? '#d8acff' : '#ffcd75', stroke: '#20182d', strokeThickness: 5 }).setOrigin(.5);
          const ring = this.add.ellipse(0, 3, 60, 20).setStrokeStyle(1.5, id === 2 ? 0xc797f6 : 0xffca72, .7);
          this.foes.push(this.add.container(enemy.x, enemy.y, [shadow,ring,sprite,marker]).setDepth(enemy.y));
        });
        CRYSTALS.forEach((p, id) => {
          const glow = this.add.circle(0, 0, 10, 0xaefda7, .12);
          const shard = this.add.polygon(0, 0, [0,-9,5,0,0,9,-5,0], 0xd4ffc0).setStrokeStyle(1, 0x69c79c);
          this.shards.push(this.add.container(p.x, p.y, [glow, shard]).setDepth(p.y));
          if (!reducedMotion) this.tweens.add({ targets: shard, y: -5, duration: 1000 + id * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
        this.add.text(CAMP.x, CAMP.y + 36, 'แคมป์เตาอุ่น', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffda94', stroke: '#19251f', strokeThickness: 4 }).setOrigin(.5).setDepth(2000);
        this.shadow = this.add.ellipse(CAMP.x, CAMP.y, 38, 12, 0x081a17, .5);
        this.aura = this.add.ellipse(CAMP.x,CAMP.y,46,17).setStrokeStyle(2,0xffd278,.7);
        this.hero = this.add.sprite(CAMP.x, CAMP.y, 'hero', 0).setOrigin(.5, .86).setDisplaySize(64, 56).setTint(latest.current.tint);
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
        this.cameras.main.setBounds(0, 0, 1536, 1024);
        this.cameras.main.startFollow(this.hero, true, reducedMotion ? 1 : .09, reducedMotion ? 1 : .09);
        this.cameras.main.setZoom(this.scale.width < 700 ? 1.3 : 1.05);
        this.scale.on('resize', (size: Phaser.Structs.Size) => this.cameras.main.setZoom(size.width < 700 ? 1.3 : 1.05));
        if (!reducedMotion) this.cameras.main.fadeIn(650, 7, 18, 21);
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (latest.current.suspended) return;
          const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.destination = findPath(this.hero, p);
          const end = this.destination[this.destination.length - 1];
          if (end) {
            const ring = this.add.ellipse(end.x, end.y, 20, 9).setStrokeStyle(2, 0xffdd97).setDepth(2100);
            this.tweens.add({ targets: ring, alpha: 0, scaleX: 2, scaleY: 2, duration: 700, onComplete: () => ring.destroy() });
          }
        });
        if (!reducedMotion) for (let i = 0; i < 38; i++) {
          const mote = this.add.circle(Phaser.Math.Between(110,1440), Phaser.Math.Between(90,970), i % 3 ? 1 : 2, i % 2 ? 0xe3ef99 : 0xffb962, .6).setDepth(1900);
          this.tweens.add({ targets: mote, y: '-=25', x: '+=12', alpha: .05, duration: 2000 + i * 115, yoyo: true, repeat: -1, delay: i * 57 });
        }
        setLoading(false);
      }
      update(time: number, delta: number) {
        if (!this.hero) return;
        const { progress, suspended, respawn } = latest.current;
        const level=levelOf(progress.xp),bossOpen=progress.defeated.includes(0)&&progress.defeated.includes(1);
        this.foes.forEach((foe, id) => foe.setVisible(progress.readyAt[id]<=Date.now()).setAlpha(id===2&&!bossOpen ? .55 : 1));
        this.shards.forEach((shard, id) => shard.setVisible(!progress.collected.includes(id)));
        if (respawn !== this.lastRespawn) { this.lastRespawn = respawn; this.hero.setPosition(CAMP.x, CAMP.y); this.destination = []; this.cooldown = time + 1500; }
        if (suspended) { this.hero.anims.stop(); held.current = null; this.blocked = true; this.destination = []; return; }
        if (this.blocked) { this.blocked = false; this.cooldown = time + 1800; this.encountered=ENEMIES.find(e=>Math.hypot(e.x-this.hero.x,e.y-this.hero.y)<65)?.id??null; }
        let dx = Number(this.cursors.right.isDown || this.keys.D.isDown || held.current === 'right') - Number(this.cursors.left.isDown || this.keys.A.isDown || held.current === 'left');
        let dy = Number(this.cursors.down.isDown || this.keys.S.isDown || held.current === 'down') - Number(this.cursors.up.isDown || this.keys.W.isDown || held.current === 'up');
        if (dx || dy) this.destination = [];
        else if (this.destination.length) {
          const target = this.destination[0]; dx = target.x - this.hero.x; dy = target.y - this.hero.y;
          if (Math.hypot(dx,dy) < 3) { this.destination.shift();const next=this.destination[0];dx=next?next.x-this.hero.x:0;dy=next?next.y-this.hero.y:0; }
        }
        const sprint=latest.current.running||this.keys.SHIFT.isDown;
        const length = Math.hypot(dx,dy), amount = Math.min(Math.min(delta, 40) * (sprint ? .235 : .155),this.destination.length?length:Infinity);
        if (length) {
          const x = this.hero.x + dx / length * amount, y = this.hero.y + dy / length * amount;
          if (canWalk(x, this.hero.y)) this.hero.x = x;
          if (canWalk(this.hero.x, y)) this.hero.y = y;
          this.direction = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
          this.hero.play(this.direction, true);
          this.hero.anims.timeScale=sprint?1.5:1;
          if(!reducedMotion&&time-this.lastDust>(sprint?110:200)){
            this.lastDust=time;const color=level>=20?0xffd278:level>=15?0xd2a2ff:level>=10?0xf2917a:0xdfcba0;
            const dust=this.add.circle(this.hero.x+Phaser.Math.Between(-7,7),this.hero.y+2,level>=15?2:1.4,color,level>=5?.5:.25).setDepth(this.hero.y-2);
            this.tweens.add({targets:dust,y:'-=12',alpha:0,duration:650,onComplete:()=>dust.destroy()});
          }
        } else { this.hero.anims.stop(); this.hero.setFrame(['down','left','right','up'].indexOf(this.direction) * 4); }
        this.hero.setDepth(this.hero.y + 1); this.shadow.setPosition(this.hero.x, this.hero.y).setDepth(this.hero.y - 1);
        this.aura.setPosition(this.hero.x,this.hero.y).setDepth(this.hero.y).setVisible(level>=5).setStrokeStyle(level>=20?3:1.5,level>=20?0xffd278:level>=15?0xcb9cff:level>=10?0xf08377:0xc39b64,reducedMotion?.6:.45+Math.sin(time*.004)*.2);
        if (time - this.lastReport > 180) { this.lastReport = time; latest.current.onPosition({ x: this.hero.x, y: this.hero.y }); }
        CRYSTALS.forEach((point, id) => {
          if (!this.collected.has(id) && !progress.collected.includes(id) && Math.hypot(point.x-this.hero.x,point.y-this.hero.y) < 30) {
            this.collected.add(id); latest.current.onCollect(id);
          }
        });
        if (time > this.cooldown) {
          if(this.encountered!==null){const last=ENEMIES[this.encountered];if(Math.hypot(last.x-this.hero.x,last.y-this.hero.y)>65)this.encountered=null;}
          const enemy = ENEMIES.find(e => e.id!==this.encountered && progress.readyAt[e.id]<=Date.now() && Math.hypot(e.x-this.hero.x,e.y-this.hero.y) < 40);
          if (enemy) {
            this.encountered=enemy.id;
            this.cooldown = time + 3000; this.destination = [];
            if (enemy.id === 2 && !bossOpen) latest.current.onNotice('ปราบผู้พิทักษ์ทั้งสองเพื่อปลดผนึกราชินี');
            else latest.current.onEncounter(enemy.id);
          }
        }
      }
    }
    setLoading(true); setFailure(false);
    const game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, backgroundColor: '#08151a', scene: Garden,
      scale: { mode: Phaser.Scale.RESIZE, width: host.current.clientWidth, height: host.current.clientHeight },
      render: { antialias: true, roundPixels: true }, input: { activePointers: 3 }, audio: { noAudio: true } });
    const release = () => { held.current = null; };
    window.addEventListener('blur', release); window.addEventListener('pointerup', release);
    return () => { disposed = true; game.destroy(true); window.removeEventListener('blur', release); window.removeEventListener('pointerup', release); };
  }, [attempt]);
  return <>
    <div className="ember-canvas" ref={host} aria-label="แผนที่สวนเตาไฟ กด WASD หรือลูกศรเพื่อเดิน หรือคลิกทางเดิน" />
    {(loading || failure) && <div className="ember-load" role="status"><span>✦</span><h2>{failure ? 'โหลดฉากไม่สำเร็จ' : 'กำลังจุดไฟในสวน…'}</h2>{failure ? <button onClick={() => setAttempt(v=>v+1)}>ลองโหลดอีกครั้ง</button> : <p>กำลังเตรียมฉากและตัวละคร</p>}</div>}
    {!props.suspended && <div className="ember-dpad" aria-label="ปุ่มเดิน" onContextMenu={e=>e.preventDefault()}>
      <button className="ember-run-toggle" aria-pressed={props.running} onClick={props.onRun}>{props.running?'» วิ่ง':'› เดิน'}</button>
      {(['up','left','down','right'] as const).map((direction, i) => <button key={direction} aria-label={['เดินขึ้น','เดินซ้าย','เดินลง','เดินขวา'][i]}
        onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); held.current = direction; }}
        onPointerUp={()=>held.current=null} onPointerCancel={()=>held.current=null} onLostPointerCapture={()=>held.current=null}>{['↑','←','↓','→'][i]}</button>)}
    </div>}
  </>;
}
