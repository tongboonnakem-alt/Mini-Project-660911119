import { useEffect, useState } from "react";
import type { ScoreResult } from "./types";

type Props = { score: ScoreResult; name: string; onClose: () => void; onPlay: () => void };

export default function ScorePanel({ score, name, onClose, onPlay }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 950);
      setShown(Math.round(score.total * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score.total]);

  return (
    <div className="score-backdrop" role="dialog" aria-modal="true" aria-label="ผลคะแนนเบอร์เกอร์">
      <section className={`score-card rank-${score.rank.replace("+", "plus")}`}>
        <button className="score-close" onClick={onClose} aria-label="ปิด">×</button>
        <p className="score-kicker">ผลตรวจจาก BURGER LAB</p>
        <h2>{name}</h2>
        <div className="rank-row"><span className="rank-mark">{score.rank}</span><strong>{shown}<small>/100</small></strong></div>
        <p className="review">“{score.review}”</p>
        <div className="score-grid">
          {[['ความอร่อย',score.taste],['สมดุล',score.balance],['ความกรอบ',score.crispy],['ความปั่น',score.chaos]].map(([label,value]) => (
            <div key={String(label)}><span>{label}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>
          ))}
        </div>
        <div className="score-meta"><span>🔥 {score.calories} kcal</span><span>🧪 โบนัส {score.bonuses.length}</span></div>
        {score.bonuses.length > 0 && <ul className="bonus-list">{score.bonuses.map((bonus) => <li key={bonus}>{bonus}</li>)}</ul>}
        <div className="score-actions">
          <button className="primary-button" onClick={onPlay}>ออกผจญภัย →</button>
          <button className="secondary-button" onClick={onClose}>สร้างตัวใหม่</button>
        </div>
      </section>
    </div>
  );
}
