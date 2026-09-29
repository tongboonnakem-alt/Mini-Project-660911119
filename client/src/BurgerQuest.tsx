import { useMemo, useState } from "react";
import type { Category, Ingredient, ScoreResult } from "./types";
import PhaserWorld from "./PhaserWorld";

type Props = {
  name: string;
  score: ScoreResult;
  selected: Partial<Record<Category, Ingredient>>;
  onExit: () => void;
};

type Monster = {
  id: number;
  name: string;
  title: string;
  image: string;
  x: number;
  y: number;
  maxHp: number;
  attack: number;
  reward: number;
};

type BattleState = {
  monster: Monster;
  playerHp: number;
  enemyHp: number;
  turn: "player" | "enemy" | "busy";
  guard: boolean;
  log: string[];
};

const monsters: Monster[] = [
  { id: 1, name: "กระเทียมคลั่ง", title: "ผู้เฝ้าทางแยก", image: "/ingredients/chaos-garlic-fighter.png", x: 850, y: 790, maxHp: 72, attack: 12, reward: 35 },
  { id: 2, name: "คุณชายมันทอด", title: "อัศวินแห่งครัวไหม้", image: "/ingredients/chaos-potato-gentleman.png", x: 1290, y: 480, maxHp: 96, attack: 16, reward: 55 },
  { id: 3, name: "ราชินีมะเขือม่วง", title: "บอสแห่งสวนพิศวง", image: "/ingredients/chaos-eggplant-queen.png", x: 650, y: 250, maxHp: 128, attack: 20, reward: 100 },
];

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function BurgerFighter({ selected, side = "left", hit = false }: { selected: Props["selected"]; side?: "left" | "right"; hit?: boolean }) {
  const bun = selected.bun;
  const protein = selected.protein;
  const cheese = selected.cheese;
  const fresh = selected.fresh;
  const parts = [bun?.image, cheese?.image, protein?.image, fresh?.image, bun?.bottomImage].filter(Boolean) as string[];
  return (
    <div className={`quest-burger ${side} ${hit ? "is-hit" : ""}`}>
      <div className="fighter-shadow" />
      {parts.map((src, index) => <img key={`${src}-${index}`} src={src} alt="" style={{ "--piece": index } as React.CSSProperties} />)}
      <span className="fighter-face">•ᴗ•</span>
      <i className="fighter-leg leg-a" /><i className="fighter-leg leg-b" />
    </div>
  );
}

export default function BurgerQuest({ name, score, selected, onExit }: Props) {
  const maxHp = Math.round(90 + score.balance * .45);
  const baseAttack = Math.round(12 + score.taste * .11);
  const [defeated, setDefeated] = useState<number[]>([]);
  const [xp, setXp] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const startBattle = (monsterId: number) => {
    if (battle) return;
    const target = monsters.find((monster) => monster.id === monsterId && !defeated.includes(monster.id));
    if (target) setBattle({ monster: target, playerHp: maxHp, enemyHp: target.maxHp, turn: "player", guard: false, log: [`${target.name} ขวางทาง!`, `${name} พร้อมต่อสู้`] });
  };

  const skills = useMemo(() => [
    { id: "smash", icon: "💥", name: "เบอร์เกอร์พุ่งชน", desc: `โจมตีตรง ${baseAttack}–${baseAttack + 8}`, kind: "attack" },
    { id: "sauce", icon: "🌶️", name: `${selected.sauce?.shortName ?? "ซอส"}ระเบิด`, desc: "แรงขึ้นตามความอร่อย", kind: "sauce" },
    { id: "guard", icon: "🛡️", name: "เกราะกรุบกรอบ", desc: "ลดความเสียหายและฟื้น HP", kind: "guard" },
    { id: "heal", icon: "🥬", name: "พลังผักสด", desc: "ฟื้น HP จากความสมดุล", kind: "heal" },
  ], [baseAttack, selected.sauce?.shortName]);

  const useSkill = async (kind: string, skillName: string) => {
    if (!battle || battle.turn !== "player") return;
    const current = battle;
    let damage = 0;
    let heal = 0;
    let guard = false;
    if (kind === "attack") damage = baseAttack + Math.floor(Math.random() * 9);
    if (kind === "sauce") damage = Math.round(baseAttack * .7 + score.taste * .13 + Math.random() * 5);
    if (kind === "guard") { heal = 7 + Math.round(score.crispy * .08); guard = true; }
    if (kind === "heal") heal = 13 + Math.round(score.balance * .12);
    const enemyHp = clamp(current.enemyHp - damage, 0, current.monster.maxHp);
    const playerHp = clamp(current.playerHp + heal, 0, maxHp);
    setBattle({ ...current, enemyHp, playerHp, turn: "busy", guard, log: [`${name} ใช้ ${skillName}${damage ? ` ทำ ${damage} ดาเมจ` : ` ฟื้น ${heal} HP`}`, ...current.log].slice(0, 4) });
    if (damage) { setEnemyHit(true); await delay(360); setEnemyHit(false); }
    await delay(360);
    if (enemyHp <= 0) {
      setDefeated((value) => [...value, current.monster.id]);
      setXp((value) => value + current.monster.reward);
      setBattle({ ...current, enemyHp: 0, playerHp, turn: "busy", guard, log: [`ชนะ ${current.monster.name}! +${current.monster.reward} XP`, ...current.log].slice(0, 4) });
      return;
    }
    setBattle((value) => value ? { ...value, turn: "enemy" } : value);
    await delay(650);
    const enemyDamage = Math.max(3, current.monster.attack + Math.floor(Math.random() * 7) - Math.round(score.crispy * .04));
    const finalDamage = guard ? Math.round(enemyDamage * .4) : enemyDamage;
    const afterHit = clamp(playerHp - finalDamage, 0, maxHp);
    setPlayerHit(true); await delay(300); setPlayerHit(false);
    setBattle((value) => value ? { ...value, playerHp: afterHit, turn: afterHit <= 0 ? "busy" : "player", guard: false, log: [`${current.monster.name} โจมตีกลับ ${finalDamage} ดาเมจ`, ...value.log].slice(0, 4) } : value);
  };

  const leaveBattle = () => {
    if (!battle) return;
    const won = battle.enemyHp <= 0;
    if (won && defeated.length === monsters.length) return;
    setBattle(null);
    setResetNonce((value) => value + 1);
  };

  const restartBattle = () => {
    if (!battle) return;
    setBattle({ monster: battle.monster, playerHp: maxHp, enemyHp: battle.monster.maxHp, turn: "player", guard: false, log: ["ลุกขึ้นมาแก้มืออีกครั้ง!"] });
  };

  const allClear = defeated.length === monsters.length;

  return (
    <main className="quest-shell">
      <header className="quest-header">
        <button onClick={onExit}>← กลับห้องแล็บ</button>
        <div><span>BURGER ORBIT</span><b>QUEST MODE</b></div>
        <p>LV.{1 + Math.floor(xp / 80)} <strong>{xp} XP</strong></p>
      </header>

      <section className="world-wrap">
        <div className="world-hud">
          <p>ภารกิจหลัก</p>
          <h1>ฝ่าด่านสวนครัวพิศวง</h1>
          <span>{defeated.length}/{monsters.length} มอนสเตอร์ถูกปรุง</span>
        </div>
        <PhaserWorld playerName={name} selected={selected} monsters={monsters} defeated={defeated} resetNonce={resetNonce} onEncounter={startBattle} />
        <div className="walk-tip">WASD / ลูกศร หรือปุ่มด้านขวาเพื่อเดิน<br /><small>สำรวจแผนที่และเดินชนมอนสเตอร์เพื่อเริ่มต่อสู้</small></div>
      </section>

      {battle && (
        <section className="battle-overlay">
          <div className="battle-arena">
            <div className="battle-sky"><span /><span /><span /></div>
            <div className="enemy-zone">
              <div className="battle-name"><div><small>{battle.monster.title}</small><b>{battle.monster.name}</b></div><span>LV.{battle.monster.id * 3}</span></div>
              <div className="hp-track"><i style={{ width: `${battle.enemyHp / battle.monster.maxHp * 100}%` }} /></div>
              <p>{battle.enemyHp}/{battle.monster.maxHp} HP</p>
              <img className={`battle-monster-art ${enemyHit ? "is-hit" : ""}`} src={battle.monster.image} alt={battle.monster.name} />
            </div>
            <div className="player-zone">
              <BurgerFighter selected={selected} side="right" hit={playerHit} />
              <div className="battle-name"><div><small>RANK {score.rank} · PLAYER</small><b>{name}</b></div><span>LV.{1 + Math.floor(xp / 80)}</span></div>
              <div className="hp-track player"><i style={{ width: `${battle.playerHp / maxHp * 100}%` }} /></div>
              <p>{battle.playerHp}/{maxHp} HP</p>
            </div>
            <div className="battle-console">
              <div className="battle-log">{battle.log.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? "latest" : ""}>{line}</p>)}</div>
              {battle.playerHp <= 0 ? (
                <div className="battle-result"><b>เบอร์เกอร์แตกกระจาย!</b><button onClick={restartBattle}>แก้มืออีกครั้ง</button><button onClick={leaveBattle}>หนีกลับแผนที่</button></div>
              ) : battle.enemyHp <= 0 ? (
                <div className="battle-result win"><b>{allClear ? "เคลียร์สวนครัวแล้ว!" : "ชนะการต่อสู้!"}</b>{allClear ? <button onClick={onExit}>กลับไปสร้างฮีโร่ตัวใหม่</button> : <button onClick={leaveBattle}>เดินทางต่อ →</button>}</div>
              ) : (
                <div className="skill-grid">
                  {skills.map((skill) => <button key={skill.id} disabled={battle.turn !== "player"} onClick={() => useSkill(skill.kind, skill.name)}><span>{skill.icon}</span><div><b>{skill.name}</b><small>{skill.desc}</small></div></button>)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

