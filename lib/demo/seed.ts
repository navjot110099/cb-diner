import type { Category, ItemImage, ItemTag, MenuItem } from "@/lib/types";

/**
 * CB Diner demo menu — a Park Avenue steakhouse and raw bar. Used as the
 * in-memory catalogue in demo mode and by `npm run seed` to fill a fresh
 * Supabase project. Photos are self-hosted WebP files in /public/food
 * (Unsplash License), so the menu stays fast and works offline.
 */
export const SEED_CATEGORIES: Category[] = [
  { id: "raw-bar", name: "Raw Bar & Caviar", blurb: "East and West Coast oysters, chilled daily on crushed ice.", sort: 1 },
  { id: "starters", name: "Starters", blurb: "To share, or not.", sort: 2 },
  { id: "steaks", name: "Prime Steaks", blurb: "USDA Prime, dry-aged in house for 28 days, finished over white oak.", sort: 3 },
  { id: "mains", name: "From Land & Sea", blurb: "Seasonal plates from Chef’s kitchen.", sort: 4 },
  { id: "sides", name: "Sides", blurb: "Served family style for the table.", sort: 5 },
  { id: "desserts", name: "Desserts", blurb: "Made by our pastry team every afternoon.", sort: 6 },
  { id: "bar", name: "Cocktails, Wine & Coffee", blurb: "Classic cocktails, a 400-label cellar and zero-proof pours.", sort: 7 },
];

const photo = (slug: string): ItemImage => ({ full: `/food/${slug}.webp`, thumb: `/food/${slug}-sq.webp` });

type Row = [id: string, categoryId: string, name: string, price: number, isVeg: boolean, tags: ItemTag[], photoSlug: string | null, description: string, available?: boolean];

const ROWS: Row[] = [
  // Raw bar & caviar
  ["oysters-half-dozen", "raw-bar", "Oysters on the Half Shell", 26, false, ["gf"], "oysters",
    "Half dozen, Chef’s daily selection. Champagne mignonette, fresh horseradish, lemon."],
  ["jumbo-shrimp-cocktail", "raw-bar", "Jumbo Shrimp Cocktail", 24, false, ["gf", "signature"], "shrimp-cocktail",
    "Four colossal Gulf shrimp, house cocktail sauce with fresh-grated horseradish."],
  ["ahi-tuna-tartare", "raw-bar", "Ahi Tuna Tartare", 23, false, [], "tuna-tartare",
    "Yellowfin tuna, mango, cucumber, avocado, yuzu-soy dressing, sesame crisp."],
  ["osetra-caviar", "raw-bar", "Osetra Caviar Service", 145, false, ["chef"], "caviar",
    "30 g Kaluga-hybrid osetra, warm buckwheat blini, crème fraîche, chive."],
  ["grand-seafood-tower", "raw-bar", "Grand Seafood Tower", 129, false, ["shareable", "gf"], "seafood-tower",
    "Maine lobster, a dozen oysters, jumbo shrimp, king crab and tuna tartare. Serves two to three."],

  // Starters
  ["burrata-heirloom", "starters", "Burrata & Heirloom Tomato", 19, true, ["seasonal", "gf"], "burrata",
    "Puglian burrata, heirloom tomatoes, basil oil, aged balsamic, Maldon salt."],
  ["jumbo-lump-crab-cake", "starters", "Jumbo Lump Crab Cake", 26, false, ["signature"], "crab-cake",
    "Maryland blue crab, barely bound, with whole-grain mustard remoulade."],
  ["classic-caesar", "starters", "Tableside Caesar", 17, false, [], "caesar",
    "Little gem, white anchovy, garlic croutons, 24-month Parmigiano-Reggiano."],
  ["french-onion-soup", "starters", "French Onion Soup", 15, false, [], "onion-soup",
    "Slow-caramelized onions, veal stock, sherry, Gruyère crust."],
  ["seared-diver-scallops", "starters", "Seared Diver Scallops", 28, false, ["gf"], "scallops",
    "Day-boat scallops, sweet corn purée, crispy pancetta, brown butter."],
  ["wedge-salad", "starters", "The Wedge", 16, false, ["gf"], null,
    "Iceberg, Maytag blue cheese, smoked bacon, cherry tomato, chive."],

  // Prime steaks
  ["filet-mignon", "steaks", "Filet Mignon · 8 oz", 62, false, ["gf", "signature"], "filet-mignon",
    "The most tender cut, finished with herb butter and bordelaise."],
  ["new-york-strip", "steaks", "Dry-Aged New York Strip · 16 oz", 68, false, ["gf"], "ny-strip",
    "28-day dry-aged, deep beefy flavor with a peppercorn crust."],
  ["bone-in-ribeye", "steaks", "Bone-In Ribeye · 22 oz", 78, false, ["gf", "chef"], "ribeye",
    "Richly marbled cowboy cut, charred over white oak, with grilled asparagus."],
  ["tomahawk-for-two", "steaks", "Tomahawk for Two · 40 oz", 165, false, ["shareable", "gf"], "tomahawk",
    "Carved tableside with bone marrow butter and two sauces."],
  ["a5-wagyu", "steaks", "Japanese A5 Wagyu · 4 oz", 120, false, ["chef", "gf"], "wagyu",
    "Miyazaki prefecture, seared on a hot stone, flaky salt and fresh wasabi."],

  // From land & sea
  ["maine-lobster", "mains", "Butter-Poached Maine Lobster", 68, false, ["signature", "gf"], "lobster",
    "Two-pound lobster, drawn butter, charred lemon, herb salad."],
  ["chilean-sea-bass", "mains", "Miso Chilean Sea Bass", 52, false, ["gf"], "sea-bass",
    "Crispy-skin sea bass, spring pea velouté, pickled shallot."],
  ["scottish-salmon", "mains", "Scottish Salmon Piccata", 39, false, [], "salmon",
    "Lemon-caper beurre blanc over hand-cut tagliolini."],
  ["colorado-rack-of-lamb", "mains", "Colorado Rack of Lamb", 58, false, ["gf"], "rack-of-lamb",
    "Rosemary and garlic crust, mint gremolata, lamb jus."],
  ["braised-short-rib", "mains", "Red Wine Braised Short Rib", 46, false, ["gf"], "short-rib",
    "Twelve-hour braise in Napa cabernet, horseradish gremolata."],
  ["roasted-half-chicken", "mains", "Roasted Half Chicken", 36, false, ["gf"], "roast-chicken",
    "Bell & Evans chicken, whipped potatoes, natural jus."],
  ["black-truffle-risotto", "mains", "Black Truffle Risotto", 38, true, ["gf"], "truffle-risotto",
    "Carnaroli rice, wild mushrooms, mascarpone, shaved Périgord truffle."],
  ["cb-wagyu-burger", "mains", "The CB Wagyu Burger", 29, false, ["signature"], "wagyu-burger",
    "American wagyu, aged cheddar, caramelized onion, brioche, truffle fries."],

  // Sides
  ["truffle-parmesan-fries", "sides", "Truffle Parmesan Fries", 14, true, [], "truffle-fries",
    "Hand-cut, white truffle oil, Parmigiano, parsley."],
  ["lobster-mac", "sides", "Lobster Mac & Cheese", 26, false, ["signature"], "lobster-mac",
    "Cavatappi, four-cheese Mornay, half a lobster tail, toasted crumb."],
  ["whipped-potatoes", "sides", "Whipped Yukon Potatoes", 13, true, ["gf"], "whipped-potatoes",
    "Cultured butter, cream, chives."],
  ["bacon-asparagus", "sides", "Bacon-Wrapped Asparagus", 15, false, ["gf"], "asparagus",
    "Applewood bacon, lemon hollandaise."],
  ["crispy-brussels", "sides", "Crispy Brussels Sprouts", 14, true, ["vegan", "gf"], "brussels-sprouts",
    "Flash-fried, hot honey, toasted almonds, lime."],
  ["creamed-spinach", "sides", "Creamed Spinach", 13, true, ["gf"], null,
    "Steakhouse classic with nutmeg and Parmesan."],

  // Desserts
  ["new-york-cheesecake", "desserts", "New York Cheesecake", 15, true, ["signature"], "cheesecake",
    "Vanilla-bean cheesecake, graham crust, sour cherry compote."],
  ["molten-chocolate-cake", "desserts", "Molten Chocolate Cake", 16, true, [], "lava-cake",
    "Valrhona dark chocolate, salted caramel, Tahitian vanilla ice cream. Allow 15 minutes."],
  ["creme-brulee", "desserts", "Vanilla Crème Brûlée", 14, true, ["gf"], "creme-brulee",
    "Madagascar vanilla custard, burnt sugar, fresh raspberry."],
  ["key-lime-pie", "desserts", "Key Lime Pie", 14, true, [], "key-lime-pie",
    "Florida key lime, graham cracker crust, whipped cream."],
  ["warm-apple-tart", "desserts", "Warm Apple Tart", 15, true, ["seasonal"], "apple-tart",
    "Hudson Valley apples, puff pastry, cinnamon ice cream.", false],

  // Bar
  ["cb-old-fashioned", "bar", "CB Old Fashioned", 21, true, ["signature", "vegan"], "old-fashioned",
    "Single-barrel bourbon, demerara, Angostura and orange bitters, smoked orange peel."],
  ["classic-martini", "bar", "Classic Martini", 20, true, ["vegan"], "martini",
    "Gin or vodka, dry vermouth, stirred ice-cold. Olive or twist."],
  ["espresso-martini", "bar", "Espresso Martini", 20, true, [], "espresso-martini",
    "Vodka, coffee liqueur, fresh-pulled espresso, three beans."],
  ["champagne-glass", "bar", "Champagne · Glass", 26, true, ["vegan"], "champagne",
    "Brut Grande Réserve, Champagne, France."],
  ["napa-cabernet", "bar", "Napa Valley Cabernet · Glass", 24, true, ["vegan"], "cabernet",
    "Oakville, 2021. Black cherry, cassis, cedar."],
  ["garden-spritz", "bar", "Berry & Thyme Spritz", 13, true, ["vegan", "new"], "spritz",
    "Zero-proof. Blackberry, lemon, thyme, sparkling water."],
  ["cappuccino", "bar", "Cappuccino", 7, true, [], "cappuccino",
    "Double shot, whole or oat milk."],
];

export const SEED_ITEMS: MenuItem[] = ROWS.map((row, index) => {
  const [id, categoryId, name, price, isVeg, tags, photoSlug, description, available = true] = row;
  return { id, categoryId, name, description, price, isVeg, tags, image: photoSlug ? photo(photoSlug) : null, isAvailable: available, sort: index + 1 };
});

/** Featured on the home page. */
export const SIGNATURE_IDS = ["bone-in-ribeye", "maine-lobster", "grand-seafood-tower", "new-york-cheesecake"];
