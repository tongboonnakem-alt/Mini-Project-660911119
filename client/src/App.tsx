import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import BurgerStack from "./BurgerStack";
import OrbitPicker from "./OrbitPicker";
import SavedRecipes from "./SavedRecipes";
import ScorePanel from "./ScorePanel";
import { byCategory, categoryMeta, categoryOrder, scoreBurger } from "./ingredients";
import type { BurgerRecord, Category, Ingredient, ScoreResult } from "./types";
import { readAdventure } from "./questModel";

const funnyNames = ["ดาวเสาร์กัดได้", "คราเคนติดชีส", "ก้อนปั่นแห่งจักรวาล", "เบอร์เกอร์เชฟลาออก", "คำแรกว้าวคำสองงง"];
const BurgerQuest = lazy(() => import("./EmberQuest"));

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return response.status === 204 ? (null as T) : response.json();
}

export default function App() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Partial<Record<Category, Ingredient>>>({});
  const [assembled, setAssembled] = useState(false);
  const [name, setName] = useState("");
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [recipes, setRecipes] = useState<BurgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questMode, setQuestMode] = useState(false);
  const category = categoryOrder[Math.min(step, categoryOrder.length - 1)];
  const meta = categoryMeta[category];
  const complete = categoryOrder.every((key) => selected[key]);
  const localScore = useMemo(() => scoreBurger(categoryOrder.map((key) => selected[key]?.id ?? "").filter(Boolean)), [selected]);

  const loadRecipes = async () => {
    setLoading(true);
    try { setRecipes(await api<BurgerRecord[]>("/api/burgers")); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRecipes(); }, []);

  const choose = (item: Ingredient) => {
    setSelected((current) => ({ ...current, [category]: item }));
    if (step < categoryOrder.length - 1) window.setTimeout(() => setStep((value) => value + 1), 120);
  };

  const randomize = () => {
    const next: Partial<Record<Category, Ingredient>> = {};
    categoryOrder.forEach((key) => {
      const options = byCategory(key);
      next[key] = options[Math.floor(Math.random() * options.length)];
    });
    setSelected(next); setStep(categoryOrder.length - 1); setAssembled(false); setScore(null);
    setName(funnyNames[Math.floor(Math.random() * funnyNames.length)]);
  };

  const reset = () => { setSelected({}); setStep(0); setAssembled(false); setScore(null); setName(""); setError(""); };

  const undo = () => {
    if (step === 0 && !selected.bun) return;
    const key = selected[category] ? category : categoryOrder[Math.max(0, step - 1)];
    setSelected((current) => { const copy = { ...current }; delete copy[key]; return copy; });
    setStep(Math.max(0, selected[category] ? step : step - 1)); setAssembled(false);
  };

  const finalize = async () => {
    if (!complete) { setError("เลือกวัตถุดิบให้ครบทั้ง 6 ชั้นก่อนประกอบร่าง"); return; }
    setSaving(true); setError(""); setAssembled(true);
    const burgerName = name.trim() || funnyNames[Math.floor(Math.random() * funnyNames.length)];
    setName(burgerName);
    await new Promise((resolve) => setTimeout(resolve, 900));
    try {
      const record = await api<BurgerRecord>("/api/burgers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: burgerName, layers: categoryOrder.map((key) => selected[key]!.id) }) });
      setScore(record.scores); setRecipes((current) => [record, ...current]);
    } catch (err) { setError(err instanceof Error ? err.message : "บันทึกสูตรไม่สำเร็จ"); setAssembled(false); }
    finally { setSaving(false); }
  };

  const deleteRecipe = async (id: number) => {
    try { await api(`/api/burgers/${id}`, { method: "DELETE" }); setRecipes((current) => current.filter((item) => item.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "ลบสูตรไม่สำเร็จ"); }
  };

  const renameRecipe = async (recipe: BurgerRecord) => {
    const next = window.prompt("ตั้งชื่อใหม่ให้เบอร์เกอร์", recipe.name)?.trim();
    if (!next || next === recipe.name) return;
    try {
      const updated = await api<BurgerRecord>(`/api/burgers/${recipe.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: next }) });
      setRecipes((current) => current.map((item) => item.id === recipe.id ? updated : item));
    } catch (err) { setError(err instanceof Error ? err.message : "แก้ไขสูตรไม่สำเร็จ"); }
  };

  const progress = (Object.keys(selected).length / categoryOrder.length) * 100;

  if (questMode && score) {
    return <Suspense fallback={<main className="quest-loading"><span>BURGER ORBIT</span><b>กำลังเปิดแผนที่ผจญภัย…</b></main>}><BurgerQuest name={name} score={score} selected={selected} onExit={() => { setQuestMode(false); }} /></Suspense>;
  }

  return (
    <>
      {readAdventure() && <button className="resume-quest" onClick={() => { const saved = readAdventure(); if (saved) { setName(saved.profile.name); setSelected(saved.profile.selected); setScore(saved.profile.score); setQuestMode(true); } }}>✦ เล่นสวนเตาไฟต่อ</button>}
      <header className="topbar">
        <a className="brand" href="#top"><span>BO</span><div><b>BURGER ORBIT</b><small>BUILD · STACK · RATE</small></div></a>
        <div className="header-score"><span>คะแนนสด</span><b>{localScore.total}</b><small>/100</small></div>
        <a className="archive-link" href="#saved">ตู้สูตร <span>{recipes.length}</span></a>
      </header>

      <main id="top">
        <section className="game-hero">
          <div className="ambient ambient-one" /><div className="ambient ambient-two" />
          <div className="game-copy">
            <p className="overline">ADAPTIVE BURGER LAB · 01</p>
            <h1>สร้างมัน<br /><em>ซ้อนมัน</em><br />แล้วลุ้นเกรด</h1>
            <p>เลือกวัตถุดิบจากวงโคจร ประกอบเบอร์เกอร์ในแบบของคุณ แล้วให้ห้องแล็บตัดสินว่าเป็นอาหารหรืออุบัติเหตุ</p>
            <button className="random-button" onClick={randomize}>⚄ สุ่มความปั่น</button>
          </div>

          <div className="lab-stage">
            <div className="stage-heading"><span>{meta.step}</span><div><b>{meta.title}</b><small>{meta.subtitle}</small></div></div>
            <OrbitPicker items={byCategory(category)} disabled={saving || assembled} onSelect={choose} />
            <BurgerStack selected={selected} assembled={assembled} />
            <div className="stage-glow" />
          </div>

          <aside className="build-panel">
            <div className="progress-label"><span>ความคืบหน้า</span><b>{Object.keys(selected).length}/{categoryOrder.length}</b></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
            <ol>
              {categoryOrder.map((key, index) => (
                <li key={key} className={`${index === step ? "active" : ""} ${selected[key] ? "done" : ""}`} onClick={() => !assembled && setStep(index)}>
                  <span>{selected[key] ? "✓" : String(index + 1).padStart(2,"0")}</span>
                  <div><small>{categoryMeta[key].title}</small><b>{selected[key]?.shortName ?? "ยังไม่ได้เลือก"}</b></div>
                </li>
              ))}
            </ol>
            <label className="name-field"><span>ชื่อผลงาน</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="ตั้งชื่อเบอร์เกอร์สุดปั่น" maxLength={50} /></label>
            {error && <p className="error-message">{error}</p>}
            <div className="panel-actions"><button onClick={undo} disabled={saving}>ย้อนกลับ</button><button onClick={reset} disabled={saving}>ล้าง</button></div>
            <button className="assemble-button" onClick={finalize} disabled={!complete || saving}>{saving ? "กำลังประกอบ..." : "ประกอบร่าง!"}<span>→</span></button>
          </aside>
        </section>

        <section className="score-preview">
          <div><p>LIVE ANALYSIS</p><h2>ก่อนกดประกอบ<br />ห้องแล็บคาดการณ์ว่า...</h2></div>
          <div className="preview-rank"><span>RANK</span><b>{complete ? localScore.rank : "?"}</b></div>
          <div className="preview-stat"><span>อร่อย</span><b>{localScore.taste}</b><i><em style={{width:`${localScore.taste}%`}} /></i></div>
          <div className="preview-stat"><span>สมดุล</span><b>{localScore.balance}</b><i><em style={{width:`${localScore.balance}%`}} /></i></div>
          <div className="preview-stat chaos"><span>ความปั่น</span><b>{localScore.chaos}</b><i><em style={{width:`${localScore.chaos}%`}} /></i></div>
        </section>

        <SavedRecipes recipes={recipes} loading={loading} onDelete={deleteRecipe} onRename={renameRecipe} />
      </main>
      <footer><b>BURGER ORBIT</b><span>Node.js · Express · React · GSAP</span><span>ภาพวัตถุดิบใช้เพื่อการศึกษา · ดูแหล่งที่มาใน assets/SOURCES.md</span></footer>
      {score && <ScorePanel score={score} name={name} onClose={reset} onPlay={() => { setQuestMode(true); window.scrollTo(0, 0); }} />}
    </>
  );
}
