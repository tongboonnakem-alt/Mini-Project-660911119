import type { Category, Ingredient, ScoreResult } from "./types";

export const categoryOrder: Category[] = ["bun", "sauce", "cheese", "protein", "crunch", "fresh"];

export const categoryMeta: Record<Category, { step: string; title: string; subtitle: string }> = {
  bun: { step: "ชั้น 01 · แป้ง", title: "เลือกขนมปัง", subtitle: "ขนมปังปกติ ขนมปังหมา หรือขนมปังแมว" },
  sauce: { step: "ชั้น 02 · เครื่องปรุง", title: "เลือกซอส", subtitle: "ซอสจริงและซอสจากมิติพิศวง" },
  cheese: { step: "ชั้น 03 · ของนัว", title: "เลือกชีส", subtitle: "ชีสแผ่นหรือชีสที่มองกลับมาหาเรา" },
  protein: { step: "ชั้น 04 · สัตว์ / โปรตีน", title: "เลือกพระเอก", subtitle: "เนื้อหลักและมาสคอตสัตว์แฟนตาซี" },
  crunch: { step: "ชั้น 05 · ของกรุบ", title: "เพิ่มความกรุบ", subtitle: "ผักหัว ของทอด และวัตถุปริศนา" },
  fresh: { step: "ชั้น 06 · ผัก / ผลไม้", title: "เติมความสด", subtitle: "ผักจริงจังที่มีบุคลิกไม่ธรรมดา" },
};

const p = "/ingredients/";

export const ingredients: Ingredient[] = [
  { id: "sesame", name: "ขนมปังงาคลาสสิก", shortName: "งาคลาสสิก", category: "bun", image: p+"bun-sesame-top.png", bottomImage: p+"bun-sesame-bottom.png", score: 15, savory: 8, crispy: 4, fresh: 0, chaos: 0, calories: 190, tags: ["classic","beef","cheddar"] },
  { id: "charcoal", name: "ขนมปังชาร์โคล", shortName: "ชาร์โคลดำ", category: "bun", image: p+"bun-charcoal-top.png", bottomImage: p+"bun-charcoal-bottom.png", score: 12, savory: 7, crispy: 4, fresh: 0, chaos: 10, calories: 205, tags: ["modern","squid","wasabi"] },
  { id: "brioche", name: "ขนมปังบริออช", shortName: "บริออช", category: "bun", image: p+"bun-brioche-top.png", bottomImage: p+"bun-brioche-bottom.png", score: 14, savory: 9, crispy: 3, fresh: 0, chaos: 2, calories: 235, tags: ["premium","chicken","pork"] },
  { id: "doge-loaf", name: "ขนมปังดอจจ์", shortName: "ดอจจ์โลฟ", category: "bun", image: p+"chaos-doge-loaf.png", bottomImage: p+"chaos-doge-loaf.png", score: 11, savory: 5, crispy: 4, fresh: 0, chaos: 18, calories: 180, tags: ["dog","chaos"] },
  { id: "face-loaf", name: "ขนมปังหน้าคน", shortName: "โลฟหน้ามนุษย์", category: "bun", image: p+"chaos-face-loaf.png", bottomImage: p+"chaos-face-loaf-alt.png", score: 10, savory: 6, crispy: 3, fresh: 0, chaos: 22, calories: 195, tags: ["face","chaos"] },
  { id: "cat-loaf", name: "ขนมปังแมวส้ม", shortName: "แคตโลฟ", category: "bun", image: p+"chaos-cat-loaf.png", bottomImage: p+"chaos-cat-loaf.png", score: 12, savory: 5, crispy: 2, fresh: 0, chaos: 16, calories: 175, tags: ["cat","cute"] },

  { id: "ketchup", name: "ซอสมะเขือเทศ", shortName: "เคตชัป", category: "sauce", color: "#d92d20", score: 14, savory: 10, crispy: 0, fresh: 2, chaos: 0, calories: 35, tags: ["classic","beef"] },
  { id: "bbq", name: "ซอสบาร์บีคิวรมควัน", shortName: "BBQ", category: "sauce", color: "#6d2817", score: 15, savory: 14, crispy: 0, fresh: 0, chaos: 2, calories: 55, tags: ["beef","pork","smoky"] },
  { id: "spicy-mayo", name: "สไปซีมาโย", shortName: "สไปซีมาโย", category: "sauce", color: "#f27b45", score: 13, savory: 12, crispy: 0, fresh: 1, chaos: 4, calories: 95, tags: ["chicken","squid"] },
  { id: "wasabi", name: "วาซาบิมาโย", shortName: "วาซาบิ", category: "sauce", color: "#9cc55b", score: 10, savory: 9, crispy: 0, fresh: 5, chaos: 14, calories: 88, tags: ["squid","charcoal"] },
  { id: "handsome-mayo", name: "มายองหน้าหล่อ", shortName: "หล่อมาโย", category: "sauce", image: p+"chaos-handsome-squidward.png", score: 7, savory: 5, crispy: 0, fresh: 4, chaos: 25, calories: 65, tags: ["face","sea","chaos"] },
  { id: "plankton-sauce", name: "ซอสแพลงก์ตอนทะเลลึก", shortName: "แพลงก์ตอน", category: "sauce", image: p+"chaos-plankton.png", score: 6, savory: 8, crispy: 0, fresh: 3, chaos: 28, calories: 45, tags: ["sea","squid","chaos"] },
  { id: "egg-sauce", name: "ซอสไข่คุณลุง", shortName: "ไข่คุณลุง", category: "sauce", image: p+"chaos-egg-gentleman.png", score: 9, savory: 10, crispy: 0, fresh: 0, chaos: 20, calories: 90, tags: ["egg","cat","chaos"] },

  { id: "cheddar", name: "เชดดาร์ชีส", shortName: "เชดดาร์", category: "cheese", image: p+"cheddar.png", score: 16, savory: 15, crispy: 0, fresh: 0, chaos: 0, calories: 115, tags: ["classic","beef","pork"] },
  { id: "double-cheddar", name: "ดับเบิลเชดดาร์", shortName: "ดับเบิลชีส", category: "cheese", image: p+"cheddar.png", score: 13, savory: 18, crispy: 0, fresh: 0, chaos: 6, calories: 225, tags: ["beef","max"] },
  { id: "naked", name: "ไม่ใส่ชีส", shortName: "โนชีส", category: "cheese", color: "#f2e8d8", score: 10, savory: 2, crispy: 0, fresh: 8, chaos: 3, calories: 0, tags: ["fresh"] },
  { id: "cheese-head", name: "ชีสหัวเราะ", shortName: "ชีสหัวคน", category: "cheese", image: p+"chaos-cheese-head.png", score: 9, savory: 16, crispy: 0, fresh: 0, chaos: 22, calories: 140, tags: ["face","dog","chaos"] },
  { id: "parmesan-face", name: "พาร์เมซานยิ้มหวาน", shortName: "พาร์เมซานหน้า", category: "cheese", image: p+"chaos-parmesan-face.png", score: 11, savory: 18, crispy: 0, fresh: 0, chaos: 16, calories: 125, tags: ["face","premium"] },

  { id: "beef", name: "เนื้อวัวพรีเมียม", shortName: "เนื้อวัว", category: "protein", image: p+"beef-premium.png", score: 18, savory: 24, crispy: 5, fresh: 0, chaos: 0, calories: 320, tags: ["classic","cheddar","bbq"] },
  { id: "pork", name: "หมูย่างลายไฟ", shortName: "หมูย่าง", category: "protein", image: p+"pork-grill.png", score: 16, savory: 21, crispy: 7, fresh: 0, chaos: 4, calories: 285, tags: ["brioche","bbq"] },
  { id: "chicken", name: "ไก่ทอดกรอบ", shortName: "ไก่ทอด", category: "protein", image: p+"chicken-crispy.png", score: 17, savory: 20, crispy: 24, fresh: 0, chaos: 2, calories: 300, tags: ["brioche","spicy-mayo"] },
  { id: "squid", name: "ปลาหมึกทอดจักรวาล", shortName: "ปลาหมึกทอด", category: "protein", image: p+"squid-crispy.png", score: 10, savory: 16, crispy: 22, fresh: 0, chaos: 22, calories: 260, tags: ["charcoal","wasabi","spicy-mayo"] },
  { id: "pineapple-orangutan", name: "อุรังอุตังสับปะรด", shortName: "ลิงสับปะรด", category: "protein", image: p+"chaos-pineapple-orangutan.png", score: 10, savory: 8, crispy: 3, fresh: 8, chaos: 30, calories: 250, tags: ["animal","fruit","banana-monkey"] },
  { id: "banana-monkey", name: "ลิงกล้วยสามเปลือก", shortName: "ลิงกล้วย", category: "protein", image: p+"chaos-banana-monkey.png", score: 11, savory: 12, crispy: 2, fresh: 5, chaos: 27, calories: 270, tags: ["animal","fruit","pineapple-orangutan"] },
  { id: "elephant-sandal", name: "ช้างรองเท้าแตะ", shortName: "ช้างแตะ", category: "protein", image: p+"chaos-elephant-sandal.png", score: 6, savory: 11, crispy: 10, fresh: 0, chaos: 36, calories: 310, tags: ["animal","mystery","chaos"] },
  { id: "screaming-dog", name: "มาสคอตหมาพุ่ง", shortName: "หมาพุ่ง", category: "protein", image: p+"chaos-screaming-dog.png", score: 9, savory: 15, crispy: 8, fresh: 0, chaos: 32, calories: 280, tags: ["animal","dog","chaos"] },

  { id: "pickles", name: "แตงกวาดองกรุบ", shortName: "แตงดอง", category: "crunch", image: p+"pickles.png", score: 14, savory: 8, crispy: 15, fresh: 10, chaos: 0, calories: 12, tags: ["classic","beef"] },
  { id: "onion", name: "หอมแดงวงแหวน", shortName: "หอมแดง", category: "crunch", image: p+"onion.png", score: 12, savory: 9, crispy: 12, fresh: 9, chaos: 2, calories: 24, tags: ["beef","pork"] },
  { id: "calamari-crunch", name: "ปลาหมึกซ้อนปลาหมึก", shortName: "หมึกคูณสอง", category: "crunch", image: p+"squid-crispy.png", score: 7, savory: 15, crispy: 25, fresh: 0, chaos: 30, calories: 245, tags: ["squid","chaos"] },
  { id: "wooden-bat", name: "ไม้พายกรอบมีชีวิต", shortName: "ไม้กรอบ", category: "crunch", image: p+"chaos-wooden-bat.png", score: 6, savory: 3, crispy: 26, fresh: 0, chaos: 30, calories: 110, tags: ["mystery","chaos"] },
  { id: "potato-gentleman", name: "มันฝรั่งคุณชาย", shortName: "คุณชายมัน", category: "crunch", image: p+"chaos-potato-gentleman.png", score: 13, savory: 10, crispy: 20, fresh: 6, chaos: 15, calories: 210, tags: ["vegetable","garlic-fighter"] },
  { id: "garlic-fighter", name: "กระเทียมนักสู้", shortName: "กระเทียมโกรธ", category: "crunch", image: p+"chaos-garlic-fighter.png", score: 12, savory: 12, crispy: 8, fresh: 10, chaos: 14, calories: 35, tags: ["vegetable","potato-gentleman"] },
  { id: "onion-lady", name: "หอมใหญ่คุณหนู", shortName: "หอมคุณหนู", category: "crunch", image: p+"chaos-onion-lady.png", score: 11, savory: 9, crispy: 10, fresh: 12, chaos: 15, calories: 40, tags: ["vegetable","pepper-face"] },

  { id: "lettuce", name: "ผักสลัดสด", shortName: "ผักสลัด", category: "fresh", image: p+"lettuce.png", score: 15, savory: 2, crispy: 8, fresh: 24, chaos: 0, calories: 8, tags: ["classic","balance"] },
  { id: "tomato", name: "มะเขือเทศฉ่ำ", shortName: "มะเขือเทศ", category: "fresh", image: p+"tomato.png", score: 14, savory: 5, crispy: 3, fresh: 22, chaos: 0, calories: 18, tags: ["classic","balance"] },
  { id: "onion-fresh", name: "หอมแดงสด", shortName: "หอมสด", category: "fresh", image: p+"onion.png", score: 11, savory: 8, crispy: 10, fresh: 14, chaos: 3, calories: 22, tags: ["beef","fresh"] },
  { id: "pickle-fresh", name: "แตงดองดับเบิล", shortName: "แตงดอง x2", category: "fresh", image: p+"pickles.png", score: 9, savory: 7, crispy: 13, fresh: 12, chaos: 9, calories: 14, tags: ["pickle","chaos"] },
  { id: "pepper-face", name: "พริกหวานหน้าคุ้น", shortName: "พริกมีหน้า", category: "fresh", image: p+"chaos-pepper-face.png", score: 13, savory: 4, crispy: 7, fresh: 24, chaos: 12, calories: 30, tags: ["vegetable","onion-lady"] },
  { id: "spinach-mascot", name: "ผักโขมสายยิ้ม", shortName: "ผักโขมยิ้ม", category: "fresh", image: p+"chaos-spinach-mascot.png", score: 15, savory: 3, crispy: 7, fresh: 30, chaos: 7, calories: 18, tags: ["vegetable","balance","eggplant-queen"] },
  { id: "eggplant-queen", name: "ราชินีมะเขือม่วง", shortName: "มะเขือราชินี", category: "fresh", image: p+"chaos-eggplant-queen.png", score: 14, savory: 6, crispy: 5, fresh: 26, chaos: 11, calories: 32, tags: ["vegetable","balance","spinach-mascot"] },
];

export const byCategory = (category: Category) => ingredients.filter((item) => item.category === category);
export const byId = (id: string) => ingredients.find((item) => item.id === id);

export function scoreBurger(ids: string[]): ScoreResult {
  const selected = ids.map(byId).filter(Boolean) as Ingredient[];
  const set = new Set(ids);
  const tags = selected.flatMap((item) => item.tags);
  const bonuses: string[] = [];
  let bonus = 0;
  const pair = (a: string, b: string, points: number, label: string) => {
    if (set.has(a) && set.has(b)) { bonus += points; bonuses.push(`${label} +${points}`); }
  };
  pair("sesame", "beef", 5, "คู่คลาสสิก");
  pair("beef", "cheddar", 5, "เนื้อกับชีส");
  pair("beef", "pickles", 3, "เปรี้ยวตัดมัน");
  pair("brioche", "chicken", 5, "บริออชกับไก่กรอบ");
  pair("chicken", "spicy-mayo", 5, "ไก่สไปซี");
  pair("pork", "bbq", 5, "หมูรมควัน");
  pair("charcoal", "squid", 5, "คราเคนดำ");
  pair("squid", "wasabi", 6, "ทะเลวาซาบิ");
  pair("doge-loaf", "screaming-dog", 6, "หมาเต็มระบบ");
  pair("cat-loaf", "egg-sauce", 4, "แมวชอบไข่");
  pair("face-loaf", "parmesan-face", 4, "หน้าชนหน้า");
  pair("pineapple-orangutan", "banana-monkey", 7, "แก๊งผลไม้ป่า");
  pair("plankton-sauce", "squid", 5, "ทะเลลึกเจอกัน");
  pair("handsome-mayo", "cheese-head", 5, "หล่อคูณสอง");
  pair("potato-gentleman", "garlic-fighter", 5, "มันกระเทียมเข้าคู่");
  pair("onion-lady", "pepper-face", 4, "ชมรมผักมีหน้า");
  pair("spinach-mascot", "eggplant-queen", 4, "สวนผักอารมณ์ดี");
  if (set.has("calamari-crunch") && set.has("squid")) bonuses.push("หมึกซ้อนหมึก +ความปั่น");

  const raw = selected.reduce((sum, item) => sum + item.score, 0) + bonus;
  const chaos = Math.min(100, selected.reduce((sum, item) => sum + item.chaos, 0));
  const taste = Math.min(100, 24 + selected.reduce((sum, item) => sum + item.savory, 0) / 1.15 + bonus);
  const crispy = Math.min(100, selected.reduce((sum, item) => sum + item.crispy, 0) * 1.45);
  const hasFresh = selected.some((item) => item.category === "fresh" && item.fresh >= 14);
  const balance = Math.max(0, Math.min(100, 56 + selected.reduce((sum, item) => sum + item.fresh, 0) - chaos * .28 + (hasFresh ? 14 : -18)));
  const total = Math.max(0, Math.min(100, Math.round(raw - Math.max(0, chaos - 35) * .18)));
  const rank: ScoreResult["rank"] = total >= 98 ? "SS+" : total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : total >= 45 ? "D" : "F";
  const reviews: Record<ScoreResult["rank"], string> = {
    "SS+": "สมบูรณ์แบบ เชฟเห็นแล้วขอซื้อสูตร!",
    S: "อร่อยระดับเปิดร้านได้ พรุ่งนี้ขายเลย",
    A: "คำแรกว้าว คำที่สองขอเพิ่ม",
    B: "แปลกนิด แต่อร่อยเฉยเลย",
    C: "กินได้ และมีเรื่องเล่าให้เพื่อนฟัง",
    D: "นี่คือเบอร์เกอร์หรือการทดลองทางวิทยาศาสตร์",
    F: "เชฟเห็นแล้วขอลาออกทันที",
  };
  return { total, rank, taste: Math.round(taste), balance: Math.round(balance), crispy: Math.round(crispy), chaos, calories: selected.reduce((sum, item) => sum + item.calories, 0), review: reviews[rank], bonuses };
}
