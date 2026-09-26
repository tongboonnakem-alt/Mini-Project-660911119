import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Ingredient } from "./types";

type Props = {
  items: Ingredient[];
  disabled?: boolean;
  onSelect: (item: Ingredient) => void;
};

export default function OrbitPicker({ items, disabled, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    let raf = 0;
    let angleOffset = -Math.PI / 2;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused.current && !disabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) angleOffset += dt * .22;
      const mobile = window.innerWidth < 760;
      const radiusX = mobile ? Math.min(window.innerWidth * .37, 175) : 430;
      const radiusY = mobile ? 215 : 265;
      itemRefs.current.forEach((node, index) => {
        if (!node) return;
        const theta = angleOffset + (index / items.length) * Math.PI * 2;
        const depth = (Math.sin(theta) + 1) / 2;
        const x = Math.cos(theta) * radiusX;
        const y = Math.sin(theta) * radiusY;
        const scale = .78 + depth * .22;
        node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        node.style.zIndex = String(Math.round(depth * 20) + 2);
        node.style.opacity = String(.66 + depth * .34);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items, disabled]);

  const select = (item: Ingredient, button: HTMLButtonElement) => {
    if (disabled) return;
    paused.current = true;
    const source = button.getBoundingClientRect();
    const target = document.querySelector(".burger-core")?.getBoundingClientRect();
    const flyer = document.createElement(item.image ? "img" : "div");
    flyer.className = "ingredient-flyer";
    if (item.image && flyer instanceof HTMLImageElement) flyer.src = item.image;
    else flyer.style.background = item.color ?? "#ef4444";
    Object.assign(flyer.style, { left: `${source.left}px`, top: `${source.top}px`, width: `${source.width}px`, height: `${source.height}px` });
    document.body.appendChild(flyer);
    gsap.to(flyer, {
      left: target ? target.left + target.width * .16 : innerWidth / 2 - 120,
      top: target ? target.top + target.height * .42 : innerHeight / 2,
      width: target ? target.width * .68 : 240,
      height: 74,
      rotation: 360,
      opacity: .9,
      duration: .72,
      ease: "power3.inOut",
      onComplete: () => {
        flyer.remove();
        onSelect(item);
        window.setTimeout(() => { paused.current = false; }, 250);
      },
    });
  };

  return (
    <div className="orbit-picker" ref={containerRef} aria-label="วัตถุดิบที่เลือกได้">
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(node) => { itemRefs.current[index] = node; }}
          type="button"
          className="orbit-item"
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
          onClick={(event) => select(item, event.currentTarget)}
          disabled={disabled}
        >
          <span className="orbit-picture">
            {item.image ? <img className={item.image.includes("chaos-") ? "chaos-art" : ""} src={item.image} alt="" draggable={false} /> : <span className="sauce-preview" style={{ background: item.color }} />}
          </span>
          <span>{item.shortName}</span>
          <small>{item.calories} kcal</small>
        </button>
      ))}
    </div>
  );
}
