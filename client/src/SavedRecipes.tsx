import type { BurgerRecord } from "./types";

type Props = {
  recipes: BurgerRecord[];
  loading: boolean;
  onDelete: (id: number) => void;
  onRename: (recipe: BurgerRecord) => void;
};

export default function SavedRecipes({ recipes, loading, onDelete, onRename }: Props) {
  return (
    <section className="saved-section" id="saved">
      <div className="section-heading"><div><p>RECIPE ARCHIVE</p><h2>สูตรที่รอดชีวิต</h2></div><span>{recipes.length} สูตร</span></div>
      {loading ? <div className="empty-state">กำลังเปิดตู้สูตร...</div> : recipes.length === 0 ? <div className="empty-state">ยังไม่มีสูตร กดประกอบเบอร์เกอร์ชิ้นแรกได้เลย</div> : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <article className="recipe-card" key={recipe.id}>
              <div className={`mini-rank rank-${recipe.scores.rank.replace("+", "plus")}`}>{recipe.scores.rank}</div>
              <div><p>#{String(recipe.id).padStart(3,'0')}</p><h3>{recipe.name}</h3><span>{recipe.ingredients.map((item) => item.name).join(" · ")}</span></div>
              <strong>{recipe.scores.total}<small>/100</small></strong>
              <div className="recipe-actions"><button onClick={() => onRename(recipe)}>เปลี่ยนชื่อ</button><button className="danger" onClick={() => onDelete(recipe.id)}>ลบสูตร</button></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
