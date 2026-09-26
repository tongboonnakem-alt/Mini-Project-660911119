export type Category = "bun" | "sauce" | "cheese" | "protein" | "crunch" | "fresh";

export type Ingredient = {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  image?: string;
  bottomImage?: string;
  color?: string;
  score: number;
  savory: number;
  crispy: number;
  fresh: number;
  chaos: number;
  calories: number;
  tags: string[];
};

export type ScoreResult = {
  total: number;
  rank: "SS+" | "S" | "A" | "B" | "C" | "D" | "F";
  taste: number;
  balance: number;
  crispy: number;
  chaos: number;
  calories: number;
  review: string;
  bonuses: string[];
};

export type BurgerRecord = {
  id: number;
  name: string;
  layers: string[];
  ingredients: Pick<Ingredient, "id" | "name" | "category" | "image" | "bottomImage" | "color">[];
  scores: ScoreResult;
  createdAt: string;
};
