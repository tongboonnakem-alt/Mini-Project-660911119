const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

async function run() {
  const source = fs.readFileSync(path.join(__dirname, '../client/src/questModel.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  const model = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const { beginBattle, playerTurn, enemyTurn, initialProgress, maxHealth, canWalk, ENEMIES, CRYSTALS, CAMP, readAdventure } = model;
  const score = { total: 80, rank: 'A', taste: 70, balance: 80, crispy: 50, chaos: 30, calories: 700, review: 'Test', bonuses: [] };
  const fresh = initialProgress(score);
  let battle = beginBattle(0, fresh);
  assert.equal(playerTurn(battle, 'potion', score, fresh), battle, 'Full HP does not waste a potion');
  battle = playerTurn(battle, 'special', score, fresh);
  assert.equal(battle.energy, 0);
  assert.equal(playerTurn(battle, 'attack', score, fresh), battle, 'Repeated click during animation cannot deal extra damage');
  battle = enemyTurn({ ...battle, phase: 'enemy' }, score);
  assert.equal(battle.round, 2);
  assert.ok(battle.hp < fresh.hp);
  assert.equal(playerTurn(battle, 'special', score, fresh), battle, 'Insufficient energy blocks skill');
  const potion = playerTurn(battle, 'potion', score, fresh);
  assert.equal(potion.hp, maxHealth(score));
  assert.equal(potion.potions, fresh.potions - 1);
  assert.equal(potion.energy, 1);
  const charged = { ...battle, phase: 'enemy', round: 3, hp: fresh.hp };
  const normal = enemyTurn(charged, score), guarded = enemyTurn({ ...charged, guard: true }, score);
  assert.ok(guarded.received < normal.received * .4, 'Guard mitigates the telegraphed heavy hit');
  assert.equal(enemyTurn({ ...charged, hp: 1 }, score).phase, 'lost');
  assert.equal(enemyTurn({ ...charged, phase: 'won' }, score).phase, 'won', 'No retaliation after victory');
  const killingBlow = playerTurn({ ...battle, enemyHp: 1 }, 'attack', score, fresh);
  assert.equal(killingBlow.enemyHp, 0, 'Enemy HP never becomes negative');
  assert.equal(playerTurn({ ...battle, energy: 4 }, 'guard', score, fresh).energy, 4);

  const { levelOf, xpForLevel, tierOf, grantVictory, improveGear, improveSkill, improvePassive, buyGear, sellGear, passivePoints, PATHS } = model;
  for (let level=1;level<=20;level++) {
    assert.equal(levelOf(xpForLevel(level)),level);
    if(level>1)assert.equal(levelOf(xpForLevel(level)-1),level-1);
  }
  assert.equal(levelOf(9999999),20);
  assert.deepEqual([1,5,10,15,20].map(tierOf),['plain','wood','red','violet','gold']);
  for(const path of PATHS){
    const p={...fresh,path:path.id,hp:40};
    const special=playerTurn(beginBattle(0,p),'special',score,p);
    assert.ok(special.damage>0);
    assert.equal(special.energy,0);
    if(path.id==='life')assert.ok(special.hp>40,'Healing path restores health while attacking');
    if(path.id==='storm')assert.equal(special.shock,true);
    if(path.id==='ward')assert.equal(special.guard,true);
  }
  const winner={...beginBattle(0,fresh),phase:'won',hp:100,potions:2};
  const guaranteed={...fresh,rates:{equipment:100,weights:[0,0,0,0,100]}};
  const reward=grantVictory(guaranteed,winner,score,()=>.5,1000);
  assert.equal(reward.loot.gear.rarity,'legendary');
  assert.equal(reward.progress.inventory.length,3);
  assert.equal(reward.progress.readyAt[0],26000);
  assert.equal(reward.progress.kills,1);
  assert.ok(reward.progress.gold>fresh.gold&&reward.progress.stones>fresh.stones&&reward.progress.essence>fresh.essence);
  assert.equal(grantVictory({...fresh,rates:{equipment:0,weights:[55,27,13,4,1]}},winner,score,()=>0).loot.gear,undefined);
  assert.throws(()=>grantVictory(fresh,{...winner,phase:'lost'},score));
  const fullBag={...guaranteed,inventory:Array.from({length:40},(_,i)=>({...fresh.inventory[0],id:'item-'+i}))};
  const overflow=grantVictory(fullBag,winner,score,()=>.5);
  assert.equal(overflow.progress.inventory.length,40);assert.equal(overflow.loot.sold,true);
  assert.equal(grantVictory({...fresh,xp:xpForLevel(20)},winner,score).progress.xp,xpForLevel(20));
  let funded={...fresh,gold:100000,stones:10000,essence:10000,xp:xpForLevel(20)};
  for(let i=0;i<20;i++)funded=improveGear(funded,funded.weapon);
  assert.equal(funded.inventory[0].upgrade,20);
  assert.equal(improveGear(funded,funded.weapon),funded,'Max enhancement does not consume currency');
  assert.equal(improveGear({...fresh,gold:0},fresh.weapon).gold,0);
  for(let i=1;i<20;i++)funded=improveSkill(funded,'storm');
  assert.equal(funded.skills.storm,20);
  assert.equal(improveSkill(funded,'storm'),funded);
  let passive={...fresh,xp:xpForLevel(2)};
  passive=improvePassive(passive,'life',score);
  assert.equal(passivePoints(passive),0);assert.equal(passive.passives.life,1);
  assert.equal(improvePassive(passive,'life',score),passive,'Cannot spend the same passive point twice');
  assert.equal(sellGear(fresh,fresh.weapon),fresh,'Equipped item cannot be sold');
  assert.equal(buyGear(fresh,0,'weapon'),fresh,'Insufficient gold blocks purchase');
  const purchase=buyGear(funded,0,'weapon','shop-test');
  assert.equal(purchase.gold,funded.gold-90);assert.equal(purchase.inventory.length,3);
  assert.equal(sellGear(purchase,'shop-test').inventory.length,2);
  const advanced=model.advanceExpedition({...funded,defeated:[0,1,2]},score);
  assert.equal(advanced.floor,2);assert.deepEqual(advanced.defeated,[]);
  assert.equal(model.advanceExpedition(advanced,score),advanced,'Double click cannot skip an expedition');
  assert.equal(advanced.inventory,funded.inventory,'Equipment carries into the next expedition');

  // Every encounter and collectible must be reachable from camp on the actual
  // movement grid. This catches isolated corridors and map-coordinate mistakes.
  const step = 12, cols = 128, rows = 85;
  const cells = new Set();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (canWalk(x * step, y * step)) cells.add(y * cols + x);
  const point = id => ({ x: id % cols * step, y: Math.floor(id / cols) * step });
  const origin = [...cells].reduce((best,id) => Math.hypot(point(id).x-CAMP.x,point(id).y-CAMP.y) < Math.hypot(point(best).x-CAMP.x,point(best).y-CAMP.y) ? id : best);
  const queue = [origin], visited = new Set(queue);
  for (let i = 0; i < queue.length; i++) for (const next of [queue[i]-1,queue[i]+1,queue[i]-cols,queue[i]+cols]) {
    if (cells.has(next) && !visited.has(next)) { visited.add(next); queue.push(next); }
  }
  for (const target of [...ENEMIES, ...CRYSTALS]) {
    assert.ok([...visited].some(id => Math.hypot(point(id).x-target.x,point(id).y-target.y)<20), `Unreachable target ${target.x},${target.y}`);
  }
  assert.equal(canWalk(0,0), false, 'Map exterior is not walkable');

  const storage = global.localStorage;
  try {
    global.localStorage = { getItem: () => JSON.stringify({ profile: { name:'Test',selected:{},score }, progress:funded }) };
    assert.equal(readAdventure().progress.skills.storm,20,'Progress survives serialization');
    global.localStorage = { getItem: () => '{broken json' };
    assert.equal(readAdventure(), null);
    global.localStorage = { getItem: () => { throw new Error('storage denied'); } };
    assert.equal(readAdventure(), null);
    global.localStorage = { getItem: () => JSON.stringify({ profile: { name: 'Test', selected: {}, score }, progress: { ...fresh, hp: -1 } }) };
    assert.equal(readAdventure(), null, 'Invalid progress is ignored');
  } finally { global.localStorage = storage; }
  console.log('Quest tests passed: combat, four paths, level 20, drops, respawn, inventory, purchases, upgrades, passive points, map connectivity, save recovery');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
