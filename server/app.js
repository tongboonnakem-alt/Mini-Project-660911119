const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const categories = ["bun", "sauce", "cheese", "protein", "crunch", "fresh"];
const p = "/ingredients/";
const list = [
  ["sesame","ขนมปังงาคลาสสิก","bun",p+"bun-sesame-top.png",p+"bun-sesame-bottom.png",15,8,4,0,0,190,["classic","beef","cheddar"]],
  ["charcoal","ขนมปังชาร์โคล","bun",p+"bun-charcoal-top.png",p+"bun-charcoal-bottom.png",12,7,4,0,10,205,["modern","squid","wasabi"]],
  ["brioche","ขนมปังบริออช","bun",p+"bun-brioche-top.png",p+"bun-brioche-bottom.png",14,9,3,0,2,235,["premium","chicken","pork"]],
  ["doge-loaf","ขนมปังดอจจ์","bun",p+"chaos-doge-loaf.png",p+"chaos-doge-loaf.png",11,5,4,0,18,180,["dog","chaos"]],
  ["face-loaf","ขนมปังหน้าคน","bun",p+"chaos-face-loaf.png",p+"chaos-face-loaf-alt.png",10,6,3,0,22,195,["face","chaos"]],
  ["cat-loaf","ขนมปังแมวส้ม","bun",p+"chaos-cat-loaf.png",p+"chaos-cat-loaf.png",12,5,2,0,16,175,["cat","cute"]],
  ["ketchup","ซอสมะเขือเทศ","sauce",null,null,14,10,0,2,0,35,["classic","beef"],"#d92d20"],
  ["bbq","ซอสบาร์บีคิวรมควัน","sauce",null,null,15,14,0,0,2,55,["beef","pork","smoky"],"#6d2817"],
  ["spicy-mayo","สไปซีมาโย","sauce",null,null,13,12,0,1,4,95,["chicken","squid"],"#f27b45"],
  ["wasabi","วาซาบิมาโย","sauce",null,null,10,9,0,5,14,88,["squid","charcoal"],"#9cc55b"],
  ["handsome-mayo","มายองหน้าหล่อ","sauce",p+"chaos-handsome-squidward.png",null,7,5,0,4,25,65,["face","sea","chaos"]],
  ["plankton-sauce","ซอสแพลงก์ตอนทะเลลึก","sauce",p+"chaos-plankton.png",null,6,8,0,3,28,45,["sea","squid","chaos"]],
  ["egg-sauce","ซอสไข่คุณลุง","sauce",p+"chaos-egg-gentleman.png",null,9,10,0,0,20,90,["egg","cat","chaos"]],
  ["cheddar","เชดดาร์ชีส","cheese",p+"cheddar.png",null,16,15,0,0,0,115,["classic","beef","pork"]],
  ["double-cheddar","ดับเบิลเชดดาร์","cheese",p+"cheddar.png",null,13,18,0,0,6,225,["beef","max"]],
  ["naked","ไม่ใส่ชีส","cheese",null,null,10,2,0,8,3,0,["fresh"],"#f2e8d8"],
  ["cheese-head","ชีสหัวเราะ","cheese",p+"chaos-cheese-head.png",null,9,16,0,0,22,140,["face","dog","chaos"]],
  ["parmesan-face","พาร์เมซานยิ้มหวาน","cheese",p+"chaos-parmesan-face.png",null,11,18,0,0,16,125,["face","premium"]],
  ["beef","เนื้อวัวพรีเมียม","protein",p+"beef-premium.png",null,18,24,5,0,0,320,["classic","cheddar","bbq"]],
  ["pork","หมูย่างลายไฟ","protein",p+"pork-grill.png",null,16,21,7,0,4,285,["brioche","bbq"]],
  ["chicken","ไก่ทอดกรอบ","protein",p+"chicken-crispy.png",null,17,20,24,0,2,300,["brioche","spicy-mayo"]],
  ["squid","ปลาหมึกทอดจักรวาล","protein",p+"squid-crispy.png",null,10,16,22,0,22,260,["charcoal","wasabi","spicy-mayo"]],
  ["pineapple-orangutan","อุรังอุตังสับปะรด","protein",p+"chaos-pineapple-orangutan.png",null,10,8,3,8,30,250,["animal","fruit","banana-monkey"]],
  ["banana-monkey","ลิงกล้วยสามเปลือก","protein",p+"chaos-banana-monkey.png",null,11,12,2,5,27,270,["animal","fruit","pineapple-orangutan"]],
  ["elephant-sandal","ช้างรองเท้าแตะ","protein",p+"chaos-elephant-sandal.png",null,6,11,10,0,36,310,["animal","mystery","chaos"]],
  ["screaming-dog","มาสคอตหมาพุ่ง","protein",p+"chaos-screaming-dog.png",null,9,15,8,0,32,280,["animal","dog","chaos"]],
  ["pickles","แตงกวาดองกรุบ","crunch",p+"pickles.png",null,14,8,15,10,0,12,["classic","beef"]],
  ["onion","หอมแดงวงแหวน","crunch",p+"onion.png",null,12,9,12,9,2,24,["beef","pork"]],
  ["calamari-crunch","ปลาหมึกซ้อนปลาหมึก","crunch",p+"squid-crispy.png",null,7,15,25,0,30,245,["squid","chaos"]],
  ["wooden-bat","ไม้พายกรอบมีชีวิต","crunch",p+"chaos-wooden-bat.png",null,6,3,26,0,30,110,["mystery","chaos"]],
  ["potato-gentleman","มันฝรั่งคุณชาย","crunch",p+"chaos-potato-gentleman.png",null,13,10,20,6,15,210,["vegetable","garlic-fighter"]],
  ["garlic-fighter","กระเทียมนักสู้","crunch",p+"chaos-garlic-fighter.png",null,12,12,8,10,14,35,["vegetable","potato-gentleman"]],
  ["onion-lady","หอมใหญ่คุณหนู","crunch",p+"chaos-onion-lady.png",null,11,9,10,12,15,40,["vegetable","pepper-face"]],
  ["lettuce","ผักสลัดสด","fresh",p+"lettuce.png",null,15,2,8,24,0,8,["classic","balance"]],
  ["tomato","มะเขือเทศฉ่ำ","fresh",p+"tomato.png",null,14,5,3,22,0,18,["classic","balance"]],
  ["onion-fresh","หอมแดงสด","fresh",p+"onion.png",null,11,8,10,14,3,22,["beef","fresh"]],
  ["pickle-fresh","แตงดองดับเบิล","fresh",p+"pickles.png",null,9,7,13,12,9,14,["pickle","chaos"]],
  ["pepper-face","พริกหวานหน้าคุ้น","fresh",p+"chaos-pepper-face.png",null,13,4,7,24,12,30,["vegetable","onion-lady"]],
  ["spinach-mascot","ผักโขมสายยิ้ม","fresh",p+"chaos-spinach-mascot.png",null,15,3,7,30,7,18,["vegetable","balance","eggplant-queen"]],
  ["eggplant-queen","ราชินีมะเขือม่วง","fresh",p+"chaos-eggplant-queen.png",null,14,6,5,26,11,32,["vegetable","balance","spinach-mascot"]],
];

const catalog = Object.fromEntries(list.map(([id,name,category,image,bottomImage,score,savory,crispy,fresh,chaos,calories,tags,color]) => [id,{id,name,category,image,bottomImage,score,savory,crispy,fresh,chaos,calories,tags,color}]));

function scoreBurger(ids) {
  const selected = ids.map((id) => catalog[id]);
  const set = new Set(ids);
  const bonuses = [];
  let bonus = 0;
  const pair = (a,b,points,label) => { if(set.has(a)&&set.has(b)){ bonus += points; bonuses.push(`${label} +${points}`); } };
  pair("sesame","beef",5,"คู่คลาสสิก"); pair("beef","cheddar",5,"เนื้อกับชีส"); pair("beef","pickles",3,"เปรี้ยวตัดมัน");
  pair("brioche","chicken",5,"บริออชกับไก่กรอบ"); pair("chicken","spicy-mayo",5,"ไก่สไปซี"); pair("pork","bbq",5,"หมูรมควัน");
  pair("charcoal","squid",5,"คราเคนดำ"); pair("squid","wasabi",6,"ทะเลวาซาบิ");
  pair("doge-loaf","screaming-dog",6,"หมาเต็มระบบ"); pair("cat-loaf","egg-sauce",4,"แมวชอบไข่");
  pair("face-loaf","parmesan-face",4,"หน้าชนหน้า"); pair("pineapple-orangutan","banana-monkey",7,"แก๊งผลไม้ป่า");
  pair("plankton-sauce","squid",5,"ทะเลลึกเจอกัน"); pair("handsome-mayo","cheese-head",5,"หล่อคูณสอง");
  pair("potato-gentleman","garlic-fighter",5,"มันกระเทียมเข้าคู่"); pair("onion-lady","pepper-face",4,"ชมรมผักมีหน้า");
  pair("spinach-mascot","eggplant-queen",4,"สวนผักอารมณ์ดี");
  if(set.has("calamari-crunch")&&set.has("squid")) bonuses.push("หมึกซ้อนหมึก +ความปั่น");
  const chaos=Math.min(100,selected.reduce((s,x)=>s+x.chaos,0));
  const taste=Math.min(100,24+selected.reduce((s,x)=>s+x.savory,0)/1.15+bonus);
  const crispy=Math.min(100,selected.reduce((s,x)=>s+x.crispy,0)*1.45);
  const hasFresh=selected.some((x)=>x.category==="fresh"&&x.fresh>=14);
  const balance=Math.max(0,Math.min(100,56+selected.reduce((s,x)=>s+x.fresh,0)-chaos*.28+(hasFresh?14:-18)));
  const total=Math.max(0,Math.min(100,Math.round(selected.reduce((s,x)=>s+x.score,0)+bonus-Math.max(0,chaos-35)*.18)));
  const rank=total>=98?"SS+":total>=90?"S":total>=80?"A":total>=70?"B":total>=60?"C":total>=45?"D":"F";
  const reviews={"SS+":"สมบูรณ์แบบ เชฟเห็นแล้วขอซื้อสูตร!",S:"อร่อยระดับเปิดร้านได้ พรุ่งนี้ขายเลย",A:"คำแรกว้าว คำที่สองขอเพิ่ม",B:"แปลกนิด แต่อร่อยเฉยเลย",C:"กินได้ และมีเรื่องเล่าให้เพื่อนฟัง",D:"นี่คือเบอร์เกอร์หรือการทดลองทางวิทยาศาสตร์",F:"เชฟเห็นแล้วขอลาออกทันที"};
  return {total,rank,taste:Math.round(taste),balance:Math.round(balance),crispy:Math.round(crispy),chaos,calories:selected.reduce((s,x)=>s+x.calories,0),review:reviews[rank],bonuses};
}

function validate(body, partial=false) {
  const errors=[];
  if(!partial||Object.hasOwn(body,"name")){ if(typeof body.name!=="string"||!body.name.trim()) errors.push("กรุณาตั้งชื่อเบอร์เกอร์"); else if(body.name.trim().length>50) errors.push("ชื่อต้องไม่เกิน 50 ตัวอักษร"); }
  if(!partial||Object.hasOwn(body,"layers")){
    if(!Array.isArray(body.layers)) errors.push("layers ต้องเป็น array");
    else {
      const selected=body.layers.map((id)=>catalog[id]);
      if(selected.some((item)=>!item)) errors.push("พบวัตถุดิบที่ไม่มีในระบบ");
      const selectedCategories=new Set(selected.filter(Boolean).map((item)=>item.category));
      const missing=categories.filter((category)=>!selectedCategories.has(category));
      if(missing.length) errors.push(`เลือกวัตถุดิบไม่ครบ: ${missing.join(", ")}`);
    }
  }
  return errors;
}

let recipes=[];
let nextId=1;
function makeRecord(name,layers,id=nextId++){
  const selected=layers.map((layerId)=>catalog[layerId]);
  return {id,name:name.trim(),layers:[...layers],ingredients:selected.map(({id,name,category,image,bottomImage,color})=>({id,name,category,image,bottomImage,color})),scores:scoreBurger(layers),createdAt:new Date().toISOString()};
}

app.get("/api/burgers",(req,res)=>{
  let result=[...recipes];
  if(req.query.protein) result=result.filter((recipe)=>recipe.layers.includes(String(req.query.protein)));
  if(req.query.rank) result=result.filter((recipe)=>recipe.scores.rank===req.query.rank);
  if(req.query.minScore!==undefined){ const value=Number(req.query.minScore); if(Number.isNaN(value)) return res.status(400).json({error:"minScore ต้องเป็นตัวเลข"}); result=result.filter((recipe)=>recipe.scores.total>=value); }
  return res.json(result);
});
app.get("/api/burgers/:id",(req,res)=>{ const recipe=recipes.find((item)=>item.id===Number(req.params.id)); return recipe?res.json(recipe):res.status(404).json({error:"ไม่พบสูตรนี้"}); });
app.post("/api/burgers",(req,res)=>{ const errors=validate(req.body); if(errors.length) return res.status(400).json({error:errors.join(", ")}); const record=makeRecord(req.body.name,req.body.layers); recipes.unshift(record); return res.status(201).json(record); });
app.patch("/api/burgers/:id",(req,res)=>{
  const index=recipes.findIndex((item)=>item.id===Number(req.params.id)); if(index===-1) return res.status(404).json({error:"ไม่พบสูตรนี้"});
  if(!Object.hasOwn(req.body,"name")&&!Object.hasOwn(req.body,"layers")) return res.status(400).json({error:"กรุณาระบุข้อมูลที่ต้องการแก้ไข"});
  const body={name:req.body.name??recipes[index].name,layers:req.body.layers??recipes[index].layers}; const errors=validate(body); if(errors.length) return res.status(400).json({error:errors.join(", ")});
  recipes[index]=makeRecord(body.name,body.layers,recipes[index].id); return res.json(recipes[index]);
});
app.delete("/api/burgers/:id",(req,res)=>{ const index=recipes.findIndex((item)=>item.id===Number(req.params.id)); if(index===-1) return res.status(404).json({error:"ไม่พบสูตรนี้"}); recipes.splice(index,1); return res.status(204).end(); });
app.use("/api",(req,res)=>res.status(404).json({error:"ไม่พบ API ที่เรียก"}));

const dist=path.join(__dirname,"..","client","dist");
if(fs.existsSync(dist)){
  app.use(express.static(dist));
  app.use((req,res,next)=>{
    if(req.method!=="GET") return next();
    return res.sendFile(path.join(dist,"index.html"));
  });
}
if(require.main===module) app.listen(PORT,()=>console.log(`Burger Orbit API: http://localhost:${PORT}`));
module.exports=app;
