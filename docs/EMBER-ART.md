# Ember Garden — art direction and asset map

The adventure's four images were generated for this project with Codex's built-in **image_gen** tool. No downloaded Core Keeper art or screenshots are used. The builder's original ingredient images remain separate from the adventure artwork.

All originals are preserved as generated in `client/public/quest-art/`. The game selects sprite frames at runtime; the transparent sheets have real alpha rather than a checkerboard background.

| File | Dimensions | Use |
| --- | --- | --- |
| `garden.png` | 1536 × 1024 | Traversable illustrated garden; coordinates and collision corridors in `questModel.ts` |
| `hero.png` | 1367 × 1151 | Four columns × four rows: down, left, right, up; four walking poses per direction |
| `enemies.png` | 1448 × 1086 | Four columns × three rows: garlic knight, potato rogue, eggplant sorceress; idle, alternate idle, attack, hurt |
| `arena.png` | 1672 × 941 | Side-view combat environment with clear foreground staging |

## Prompt set / reusable art briefs

The following briefs record the creative direction used for the four generation calls, rather than a verbatim tool transcript.

**Shared direction:** Original cohesive 2D pixel fantasy adventure set in an underground kitchen garden. Detailed hand-painted pixel clusters, consistent three-quarter lighting, moss-green stone ruins, glowing teal water, warm amber fire and crystals, lime mushrooms. Charming food adventurers with readable silhouettes. No photorealistic collage, text, UI, logos, or imitation of an existing game's characters.

**Garden:** A wide top-down three-quarter game map of an underground kitchen sanctuary. Connected ochre paths and wooden bridges weave around turquoise pools and waterfalls. A circular ancient oven shrine occupies the center; the bottom camp has a tent, crates, and a warm fire. Leave clear walking corridors around the shrine, an upper-right boss area, and distinct landmarks. No characters or interface baked into the environment.

**Hero:** A transparent sprite sheet of one expressive hamburger adventurer with a toasted sesame bun, lettuce, cheese, patty, small boots, lime scarf, and a spatula. Four equal columns and four equal rows; rows face down, left, right, and up. Each row contains four coordinated walking poses. Consistent character size, centered placement, lighting, and palette across all cells; enough transparent padding to prevent neighboring frames from bleeding.

**Enemies:** A transparent sprite sheet in the same visual language, four columns and three rows. Row one: garlic knight with wooden spoon and round shield. Row two: mischievous potato rogue. Row three: regal eggplant sorceress. Columns show idle, alternate idle, attacking, and hurt. Consistent scale and baseline within each row, separate cells with transparent padding, no baked backdrop or captions.

**Arena:** A wide side-view battle stage inside the same underground kitchen ruins. A clear mossy stone foreground supports two opposing characters. Teal waterfalls and pools illuminate the left; an ancient orange-lit oven, iron cooking utensils, vines, and crystals illuminate the right. Depth and atmosphere in the background while the foreground stays readable. No characters, text, or interface baked in.

## Integration

- Phaser draws the environment, directional animations, contact shadows, encounter rings, collectibles, target markers, and drifting light motes.
- Collision corridors follow the illustrated ground and bridges. A small pathfinder supports click/tap movement without crossing water.
- CSS uses the same sheets in combat and UI portraits, with matching gold/jade panels, health bars, damage numbers, lunges, and spell effects.
- Reduced-motion preferences suppress decorative motion. Sound effects are synthesized locally and opt-in.
- The garden contains two respawning guardians, one gated respawning boss, five collectibles per expedition, a camp shop and upgrade bench, and 20 expedition difficulty levels. The original builder-to-exploration-to-turn-based-battle loop is preserved.
- Character levels, skill levels, and equipment enhancements use wood/red/violet/gold milestone frames at 5/10/15/20. The world adds a matching aura and footstep particles; combat uses the selected path's color and skill icon.
