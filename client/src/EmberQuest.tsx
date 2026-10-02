import { useEffect, useRef, useState, type CSSProperties } from 'react';
import EmberWorld from './EmberWorld';
import EmberCamp, { GearBadge } from './EmberCamp';
import { ART, CAMP, ENEMIES, PATHS, RARITIES, SAVE_KEY, beginBattle, enemyTurn, equipped, grantVictory, heroAttack, initialProgress, levelOf, maxHealth, playerTurn, readAdventure, tierOf, xpForLevel, type Action, type Battle, type Loot, type Profile, type Progress } from './questModel';
import './ember.css';

export function Portrait({ enemy, frame = 0, className = '' }: { enemy?: number; frame?: number; className?: string }) {
  const isHero = enemy === undefined;
  return <div aria-hidden="true" className={`ember-sprite ${isHero ? 'hero' : 'enemy'} ${className}`} style={{ backgroundImage: `url(${ART}${isHero ? 'hero' : 'enemies'}.png)`, backgroundSize: `400% ${isHero ? '400%' : '300%'}`, backgroundPosition: `${frame * 100 / 3}% ${isHero ? 0 : enemy! * 50}%` }} />;
}
function Health({ value, max, enemy = false }: { value: number; max: number; enemy?: boolean }) {
  return <div className={`ember-health ${enemy ? 'enemy' : ''}`}><div role="progressbar" aria-label={enemy ? 'พลังศัตรู' : 'พลังชีวิต'} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i style={{ width: `${value / max * 100}%` }} /></div><span>{value} / {max}</span></div>;
}
export default function EmberQuest({ name, score, selected, onExit }: Profile & { onExit: () => void }) {
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = readAdventure();
    return saved && saved.profile.name === name && JSON.stringify(saved.profile.selected) === JSON.stringify(selected) ? saved.progress : initialProgress(score);
  });
  const [battle, setBattle] = useState<Battle | null>(null);
  const [intro, setIntro] = useState(true), [paused, setPaused] = useState(false), [sound, setSound] = useState(false);
  const [position, setPosition] = useState(CAMP), [respawn, setRespawn] = useState(0), [toast, setToast] = useState('');
  const [saved, setSaved] = useState(true);
  const [campOpen,setCampOpen] = useState(false), [running,setRunning] = useState(false);
  const [loot,setLoot] = useState<Loot|null>(null);
  const audio = useRef<AudioContext | null>(null), reward = useRef<number | null>(null);
  const maxHp = maxHealth(score,progress), allClear = progress.defeated.length === 3;
  const heroTint = selected.bun?.id === 'charcoal' ? 0xc1c4ea : selected.bun?.id === 'brioche' ? 0xffe0aa : 0xffffff;
  const heroFilter = selected.bun?.id === 'charcoal' ? 'saturate(.45) hue-rotate(180deg)' : 'brightness(1)';
  const level = levelOf(progress.xp), path = PATHS.find(c=>c.id===progress.path)!;
  const atCamp = Math.hypot(position.x - CAMP.x, position.y - CAMP.y) < 90;
  const suspended = intro || paused || campOpen || !!battle;
  const notify = (text: string) => setToast(text);
  const chime = (type: 'hit' | 'heal' | 'win' | 'click') => {
    if (!sound) return;
    try {
      const context = audio.current ??= new AudioContext();
      void context.resume();
      const frequencies = type === 'win' ? [392,494,587,784] : type === 'heal' ? [440,660,880] : type === 'hit' ? [130,65] : [330];
      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = type === 'hit' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
        const start = context.currentTime + index * .07;
        gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.075, start + .01); gain.gain.exponentialRampToValueAtTime(.0001, start + .24);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + .25);
      });
    } catch { /* Sound is optional when the browser blocks audio. */ }
  };
  useEffect(() => () => { void audio.current?.close(); }, []);
  useEffect(() => {
    const original = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ profile: { name, score, selected }, progress })); setSaved(true); }
    catch { setSaved(false); }
  }, [name, score, selected, progress]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(()=>setToast(''),3200); return ()=>clearTimeout(id); }, [toast]);
  useEffect(() => {
    if (!battle || paused || intro) return;
    if (battle.phase === 'strike') {
      const id = window.setTimeout(() => setBattle(b => b && b.phase === 'strike' ? { ...b, phase: b.enemyHp <= 0 ? 'won' : 'enemy' } : b), 780);
      return ()=>clearTimeout(id);
    }
    if (battle.phase === 'enemy') {
      const id = window.setTimeout(() => { setBattle(b => b ? enemyTurn(b, score, progress) : b); chime('hit'); }, 1000);
      return ()=>clearTimeout(id);
    }
    if (battle.phase === 'won' && reward.current !== battle.enemy) {
      reward.current = battle.enemy;
      const result=grantVictory(progress,battle,score);
      setProgress(result.progress);setLoot(result.loot);
      chime('win');
    }
  }, [battle, paused, intro]);
  const choose = (action: Action) => {
    if (paused || intro) return;
    setBattle(b => b ? playerTurn(b, action, score, progress) : b);
    chime(action === 'potion' ? 'heal' : 'click');
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'Escape' && !intro) { if(campOpen)setCampOpen(false);else setPaused(p=>!p); }
      if (event.key.toLowerCase()==='b' && !battle && !intro && !paused) setCampOpen(open=>!open);
      if (battle?.phase === 'choose' && !paused && !intro && ['1','2','3','4'].includes(event.key)) choose((['attack','special','guard','potion'] as Action[])[Number(event.key)-1]);
    };
    const blur = () => { if (!intro) setPaused(true); };
    window.addEventListener('keydown',onKey); window.addEventListener('blur',blur);
    return () => { window.removeEventListener('keydown',onKey); window.removeEventListener('blur',blur); };
  }, [battle?.phase, paused, intro, progress, sound, campOpen]);
  const returnCamp = () => {
    setProgress(p => ({ ...p, hp: maxHp, potions: Math.max(3, battle?.potions ?? p.potions) }));
    setBattle(null); setRespawn(n=>n+1); setPosition(CAMP); notify('พักที่แคมป์แล้ว · พลังเต็มและน้ำซุปพร้อม'); chime('heal');
  };
  const collect = (id: number) => {
    setProgress(p => p.collected.includes(id) ? p : ({ ...p, collected: [...p.collected,id], potions: Math.min(9,p.potions+1), xp: Math.min(xpForLevel(20),p.xp + 10),stones:p.stones+1 }));
    notify('เก็บประกายเตาไฟ · +10 XP · หินเวท +1 · น้ำซุป +1'); chime('heal');
  };
  const nextEnemy = ENEMIES.find(e=>!progress.defeated.includes(e.id));
  const objective = allClear ? 'กลับแคมป์เพื่อเปิดรอบที่ยากขึ้น หรือฟาร์มอุปกรณ์ต่อ' : progress.defeated.includes(0)&&progress.defeated.includes(1) ? 'ผนึกราชินีเปิดแล้ว · ไปยังครัวด้านบนขวา' : 'ปราบผู้พิทักษ์ทั้งสองเพื่อเปิดผนึกราชินี';
  const foe = battle ? ENEMIES[battle.enemy] : null;
  return <main className={`ember-game path-${progress.path} ${battle ? 'in-battle' : ''}`} style={{ '--hero-filter': heroFilter,'--class-color':path.color,'--skill-glow':`${18+progress.skills[progress.path]*3}px` } as CSSProperties}>
    <EmberWorld key={progress.floor} progress={progress} suspended={suspended} respawn={respawn} tint={heroTint} running={running} onRun={()=>setRunning(v=>!v)} onCollect={collect} onPosition={setPosition} onNotice={notify}
      onEncounter={id => { if (suspended || progress.readyAt[id]>Date.now()) return; reward.current=null;setLoot(null); setBattle(beginBattle(id, progress)); chime('click'); }} />
    <div className="ember-vignette" />
    <header className="ember-top">
      <div className="ember-brand"><span className="ember-emblem">✦</span><div><small>BURGER ORBIT</small><b>สวนเตาไฟ</b></div><span className="ember-chapter">รอบสำรวจ {progress.floor}</span></div>
      <div className="ember-tools">{!battle&&<button onClick={()=>setCampOpen(true)}>◈ กระเป๋า / สาย</button>}<button aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} aria-pressed={sound} onClick={()=>setSound(v=>!v)}>{sound ? '♪ เสียงเปิด' : '♪ เสียงปิด'}</button><button onClick={()=>setPaused(true)} aria-label="พักเกม">Ⅱ <span>เมนู</span></button></div>
    </header>
    {!battle && <>
      <aside className="ember-mission"><small>THE EMBER GARDEN</small><h1>{allClear ? 'ผู้พิทักษ์สวนคนใหม่' : 'ปลุกไฟที่หลับใหล'}</h1><p>{objective}</p>
        <div className="ember-seals">{ENEMIES.map(enemy=><span key={enemy.id} className={progress.defeated.includes(enemy.id)?'done':''}>{progress.defeated.includes(enemy.id)?'✓':enemy.id+1} <b>{enemy.name}</b></span>)}</div>
        <div className="ember-collection">✧ ประกายเตาไฟ <b>{progress.collected.length} / 5</b></div>
      </aside>
      <aside className="ember-minimap" aria-label="แผนที่ย่อ"><div className="ember-map-image">{ENEMIES.filter(e=>progress.readyAt[e.id]<=Date.now()).map(e=><i key={e.id} className="foe-dot" style={{left:`${e.x/1536*100}%`,top:`${e.y/1024*100}%`}} />)}<i className="hero-dot" style={{left:`${position.x/1536*100}%`,top:`${position.y/1024*100}%`}} /></div><span>◆ คุณ <em>◆ ผู้พิทักษ์</em></span></aside>
      <div className={`ember-player-card tier-${tierOf(level)}`}><Portrait /><div><small>{path.icon} {path.role} · LV.{level}{level===20?' ★ MAX':''}</small><b>{name}</b><Health value={progress.hp} max={maxHp}/><p>{level===20?'MAX LEVEL':`${progress.xp-xpForLevel(level)} / ${xpForLevel(level+1)-xpForLevel(level)} XP`} <span>น้ำซุป {progress.potions}</span></p><p>◎ {progress.gold} <span>◆ {progress.stones} · ✧ {progress.essence}</span></p></div></div>
      <div className="ember-guide"><kbd>W A S D</kbd> เดิน <span>· Shift วิ่ง · คลิกเพื่อไป · B กระเป๋า</span></div>
      {atCamp && !intro && !paused && !campOpen && <div className="ember-camp-shortcuts"><button className="ember-rest" onClick={returnCamp}>♨ พักที่แคมป์ <small>เติม HP และน้ำซุป</small></button><button className="ember-open-shop" onClick={()=>setCampOpen(true)}>⚒ ร้านค้า / ตีบวก</button></div>}
    </>}
    {toast && <div className="ember-toast" role="status">✦ {toast}</div>}
    {intro && <div className="ember-modal-wrap"><section className="ember-welcome" role="dialog" aria-modal="true" aria-label="เริ่มผจญภัย">
      <small>BURGER ORBIT · CHAPTER I</small><h1>สวนเตาไฟ<br/><em>ที่ถูกลืม</em></h1><p>เปลวไฟโบราณกำลังมอดดับ<br/>พาฮีโร่ของคุณฝ่าสวนเรืองแสงและทวงคืนเตาไฟจากราชินี</p>
      <div className="ember-hero-intro"><Portrait/><div><b>{name}</b><span>พลังชีวิต {maxHp} · โจมตี {heroAttack(score,progress)} · เกรด {score.rank}</span><small>สูตรเบอร์เกอร์กำหนดค่าสถานะ · เลือกสายที่ชอบได้เลย</small></div></div>
      <div className="ember-path-picker">{PATHS.map(c=><button key={c.id} aria-pressed={progress.path===c.id} disabled={!!battle} onClick={()=>setProgress(p=>({...p,path:c.id}))}><span style={{color:c.color}}>{c.icon}</span>{c.role}</button>)}</div>
      <button className="ember-gold" autoFocus onClick={()=>setIntro(false)}>{progress.xp > 0 ? 'เดินทางต่อ' : 'ก้าวเข้าสู่สวน'} <span>→</span></button>
      <div className="ember-intro-controls"><span>⌨ WASD / ลูกศร</span><span>◎ คลิกทางเดิน</span><span>✦ ผลัดกันต่อสู้</span></div>
    </section></div>}
    {battle && foe && <section className={`ember-battle ${battle.phase === 'enemy' ? 'enemy-turn' : ''}`} aria-label="ฉากต่อสู้">
      <div className="ember-battle-shade" />
      <div className="ember-round"><small>ENCOUNTER {battle.enemy+1} / 3</small><b>{battle.phase === 'won' ? 'ได้รับชัยชนะ' : battle.phase === 'lost' ? 'การเดินทางยังไม่จบ' : `เทิร์นที่ ${battle.round}`}</b></div>
      <div className={`ember-combat-card player tier-${tierOf(level)}`}><Portrait/><div><small>LV.{level} · {path.role}</small><b>{name}</b><Health value={battle.phase === 'won' ? progress.hp : battle.hp} max={maxHp}/></div><GearBadge gear={equipped(progress,'weapon')}/></div>
      <div className="ember-combat-card foe"><Portrait enemy={battle.enemy}/><div><small>{foe.title} · รอบ {progress.floor}</small><b>{foe.name}</b><Health value={battle.enemyHp} max={battle.maxEnemyHp} enemy/></div></div>
      <div className={`ember-combatant player ${battle.phase==='strike' && battle.damage ? 'striking' : ''} ${battle.received && battle.phase==='choose' ? 'hurt' : ''}`} key={`player-${battle.round}`}><div className="ember-ground-shadow"/><Portrait frame={battle.phase==='strike'?1:0}/>{battle.guard && <span className="ember-shield">◇</span>}{battle.received > 0 && <b className="ember-number damage">−{battle.received}</b>}{battle.heal > 0 && <b className="ember-number heal">+{battle.heal}</b>}</div>
      <div className={`ember-combatant foe ${battle.phase==='enemy'?'striking':''} ${battle.phase==='won'?'defeated':''}`} key={`foe-${battle.round}`}><div className="ember-ground-shadow"/><Portrait enemy={battle.enemy} frame={battle.phase==='strike' && battle.damage || battle.phase==='won' ? 3 : battle.phase==='enemy'?2:0}/>{battle.damage>0 && <b className="ember-number damage" key={`damage-${battle.round}`}>−{battle.damage}</b>}</div>
      {battle.phase==='strike' && battle.move==='special' && <div className="ember-special" key={battle.round}>{path.icon}</div>}
      <div className="ember-battle-bottom">
        <div className="ember-turn-banner"><span className="ember-turn-light"/>{battle.phase==='choose'?'ตาของคุณ':battle.phase==='enemy'?'ศัตรูกำลังโจมตี':battle.phase==='strike'?'กำลังใช้สกิล':battle.phase==='won'?'ผู้พิทักษ์พ่ายแพ้':'พักฟื้นแล้วกลับมาใหม่'}<small>{battle.phase==='choose' ? battle.round%3===0 ? 'ระวัง! ศัตรูเตรียมท่าแรง · ใช้ป้องกันลดความเสียหาย' : 'ศัตรูเตรียมโจมตีปกติ' : ' '}</small></div>
        <div className="ember-battle-log" role="status">{battle.log}</div>
        {battle.phase==='won' ? <div className="ember-result"><div><small>{loot?.levelUp?'✦ LEVEL UP':allClear?'BOSS DEFEATED':'VICTORY'}</small><h2>{allClear?'เปลวไฟกลับมาส่องสว่าง':'เก็บเกี่ยวชัยชนะ'}</h2><p>+{loot?.xp||0} XP · ◎ {loot?.gold||0} · ◆ {loot?.stones||0} · ✧ {loot?.essence||0} · น้ำซุป +1</p>{loot?.gear&&<p className="ember-loot" style={{color:RARITIES.find(r=>r.id===loot.gear!.rarity)!.color}}>◈ {RARITIES.find(r=>r.id===loot.gear!.rarity)!.name}: {loot.gear.name}{loot.sold?' · คลังเต็ม ขายเป็นเงินแล้ว':' · อยู่ในกระเป๋า'}</p>}{loot?.levelUp&&<p>LV.{level} · ฟื้น HP เต็ม · ได้แต้มพาสซีฟ!</p>}</div><button className="ember-gold" onClick={()=>{setBattle(null); notify(allClear?'ชนะบอสแล้ว! กลับแคมป์เปิดรอบที่ยากขึ้น หรือฟาร์มต่อได้':'รับของแล้ว · มอนสเตอร์จะเกิดใหม่ใน 25 วินาที');}}>เดินทางต่อ →</button></div> : battle.phase==='lost' ? <div className="ember-result"><div><h2>ไฟดวงเล็กยังไม่ดับ</h2><p>ความคืบหน้ายังอยู่ · พักฟื้นที่แคมป์แล้วกลับมาสู้ใหม่</p></div><button className="ember-gold" onClick={returnCamp}>กลับแคมป์ →</button></div> : <div className="ember-actions">
          {([
            { id:'attack', icon:'⚔', name:'ตะหลิวพิฆาต', desc:`โจมตี ${heroAttack(score,progress)} · ฟื้นพลัง 1`, lock:false },
            { id:'special', icon:path.icon, name:path.skill, desc:`LV.${progress.skills[progress.path]} · ใช้พลัง 2`, lock:battle.energy<2 },
            { id:'guard', icon:'◇', name:'โล่ขนมปังกรอบ', desc:'ลดดาเมจ 70% · ฟื้นพลัง 1', lock:false },
            { id:'potion', icon:'♨', name:'น้ำซุปอุ่น', desc:`ฟื้น HP · เหลือ ${battle.potions} ขวด`, lock:battle.potions===0 || battle.hp===maxHp },
          ] as const).map((action,index)=><button key={action.id} disabled={battle.phase!=='choose' || action.lock || paused} onClick={()=>choose(action.id)}><kbd>{index+1}</kbd><span className="ember-action-icon">{action.icon}</span><b>{action.name}</b><small>{action.desc}</small></button>)}
        </div>}
        <div className="ember-battle-footer"><span>พลังสกิล <b>{'◆'.repeat(battle.energy)}<i>{'◇'.repeat(4-battle.energy)}</i></b></span><span>ฟื้นพลังด้วยการโจมตีหรือป้องกัน</span>{battle.phase==='choose' && <button onClick={returnCamp}>ถอนตัวกลับแคมป์ ↗</button>}</div>
      </div>
    </section>}
    {campOpen&&<EmberCamp progress={progress} score={score} atCamp={atCamp} onChange={setProgress} onClose={()=>setCampOpen(false)}/>}
    {paused && <div className="ember-modal-wrap pause"><section role="dialog" aria-modal="true" aria-label="พักเกม" className="ember-pause"><small>TAKE A BREATHER</small><h2>พักข้างกองไฟ</h2><p>{saved?'บันทึกความคืบหน้าในเครื่องนี้แล้ว':'เบราว์เซอร์ไม่อนุญาตให้บันทึก · อย่าปิดหน้านี้ระหว่างเล่น'}</p><button className="ember-gold" autoFocus onClick={()=>setPaused(false)}>เล่นต่อ →</button>{!battle&&<button onClick={()=>{returnCamp();setPaused(false);}}>กลับแคมป์ / ร้านค้า</button>}<button onClick={()=>{setIntro(true);setPaused(false);}}>ดูวิธีเล่น</button><button onClick={()=>{
      setPaused(false); onExit();
    }}>กลับห้องสร้างเบอร์เกอร์</button><small>{nextEnemy ? `เป้าหมายต่อไป: ${nextEnemy.name}`:'ชนะบอสแล้ว · เปิดรอบสำรวจใหม่ที่แคมป์ได้'}</small>{battle&&battle.phase!=='won' && <small>ออกแล้วจะกลับไปยังจุดบันทึกก่อนการต่อสู้นี้</small>}</section></div>}
  </main>;
}
