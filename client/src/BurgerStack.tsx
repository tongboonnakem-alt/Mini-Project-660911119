import { categoryOrder } from "./ingredients";
import type { Category, Ingredient } from "./types";

type Props = {
  selected: Partial<Record<Category, Ingredient>>;
  assembled: boolean;
};

export default function BurgerStack({ selected, assembled }: Props) {
  const layers = categoryOrder.map((category) => selected[category]).filter(Boolean) as Ingredient[];
  const bun = selected.bun;
  const visualLayers = [...layers, ...(bun ? [{ ...bun, id: `${bun.id}-bottom`, image: bun.bottomImage, category: "bun" as Category }] : [])];

  return (
    <div className={`burger-core ${assembled ? "assembled" : ""}`}>
      <div className="plate-shadow" />
      {visualLayers.length === 0 && (
        <div className="empty-burger"><span>+</span><p>เลือกวัตถุดิบ<br />จากวงโคจร</p></div>
      )}
      {visualLayers.map((item, index) => (
        <div
          key={`${item.category}-${item.id}`}
          className={`burger-layer layer-${item.category}`}
          style={{ "--layer-index": index, "--layer-count": visualLayers.length } as React.CSSProperties}
        >
          {item.image ? <img className={item.image.includes("chaos-") ? "chaos-art" : ""} src={item.image} alt={item.name} /> : <span className="sauce-layer" style={{ "--sauce": item.color } as React.CSSProperties} />}
        </div>
      ))}
    </div>
  );
}
