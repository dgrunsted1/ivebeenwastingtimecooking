import { get_conversion_rates } from '/src/lib/unit_conversions.js';
import convert from "convert";
import { normalizeItemName } from '$lib/ingr_to_groc.js';

// remove exact words
const prepositions = ["of", "with", "to", "in", "on", "at", "for", "by", "from", "into", "over", "under", "through", "around", "beside", "between", "among", "towards", "room", "very", "more for serving", "for serving", "melon baller", "a", "press", "freshly ground", "crack", "seeded", "pit"];

const conjunctions = ["and", "or", "nor", "but", "yet", "so"];

// remove words where the string is contained
const verbs = [
		"acidulate",
		"add",
		"allow",
		"alternate",
		"arrange",
		"bake",
		"barrel",
		"baste",
		"beat",
		"bind",
		"blanch",
		"blend",
		"blister",
		"blow",
		"boil",
		"bone",
		"bottle",
		"braid",
		"braise",
		"break",
		"brine",
		"broil",
		"brown",
		"bruise",
		"brush",
		"caramelize",
		"carry",
		"carve",
		"chafe",
		"chill",
		"chop",
		"churn",
		"circle",
		"clarify",
		"clean",
		"coat",
		"coddle",
		"coil",
		"collar",
		"collect",
		"color",
		"combine",
		"complete",
		"continue",
		"cook",
		"cool",
		"core",
		"count",
        "coarsely",
		"cover",
		"crease",
		"crisscross",
		"cross",
		"crush",
		"cut",
		"decorate",
		"deglaze",
		"dice",
		"dilute",
		"discard",
		"dish",
		"dissolve",
		"distill",
		"dot",
		"drain",
		"dredge",
		"drop",
		"dust",
		"dye",
		"eat",
		"empty",
		"emulsify",
		"eviscerate",
		"fasten",
		"feathers",
		"filet",
		"fill",
		"fire",
		"fit",
		"flake",
		"flame",
		"flatten",
		"flavor",
		"flay",
		"flip",
		"fold",
		"force",
		"form",
		"freeze",
		"frost",
		"froth",
		"fry",
		"garnish",
		"gas",
		"gash",
		"gild",
		"glaze",
		"grate",
		"grease",
		"grill",
		"grind",
		"hack",
        "halved",
		"hands",
		"hang",
		"hard-boil",
		"heat",
		"hold",
		"hollow",
		"hull",
		"husk",
		"indent",
		"insert",
		"julienne",
		"keep",
		"knead",
		"lard",
		"lay",
		"layer",
		"leaven",
		"light",
		"line",
		"make",
		"marinate",
		"mash",
		"mask",
		"measure",
		"melt",
		"mince",
		"mix",
		"moisten",
		"mold",
		"ornament",
		"oven",
		"pack",
		"parboil",
		"pare",
		"pat",
		"peeled",
		"pick",
		"pickle",
		"pierce",
		"pile",
		"pinch",
		"pipe",
		"place",
		"plank",
		"plunge",
		"poach",
		"pound",
		"pour",
		"prepare",
		"preserve",
		"prick",
		"pull",
		"pulverize",
		"purée",
		"push",
		"put",
        "quartered",
		"reduce",
		"reheat",
		"remove",
		"rinse",
		"rise",
		"rub",
		"rusty",
		"sauté",
		"saw",
		"scald",
		"scale",
		"schedule",
		"scoop",
		"scotch",
		"scour",
		"scrape",
		"seal",
		"sear",
		"season",
		"seasonal",
		"separate",
		"serve",
		"set",
		"sew",
		"shake",
		"shape",
		"shave",
		"shell",
		"shovel",
		"shred",
		"sift",
		"simmer",
		"singe",
		"skewer",
		"skim",
		"skin",
		"slash",
		"slice",
		"slit",
		"sliver",
		"smoke",
		"smooth",
		"snip",
		"soak",
		"souse",
		"sow",
		"spit",
		"splat",
		"split",
		"spread",
		"sprinkle",
		"squeeze",
		"stack",
		"stamp",
		"stand",
		"steam",
		"steep",
        "stemmed",
		"stew",
		"stick",
		"stir",
		"store",
		"strain",
		"strew",
		"strip",
		"stuff",
		"substitute",
		"surround",
		"sweeten",
		"swing",
		"syringe",
		"take",
		"taste",
		"temperature",
		"thicken",
		"thin",
		"throw",
		"tie",
		"toast",
		"top",
		"toss",
		"trail",
		"trim",
		"truss",
		"try",
		"turn",
		"unmold",
		"use",
		"variation",
		"warm",
		"wash",
		"weigh",
		"weight",
		"whip",
		"whisk",
		"wipe",
		"work",
		"wrap",
		"wring",
        "finely",
        "rings",
        "deveined",
        "tails removed",
        "diagonal",
        "the",
        "wedge",
        "morton",
        "kosher",
        "store-bought",
        "homemade"
	];

export const combine = (i, j) => {
	const tmp = convert(i.qty, i.unit).to(j.unit);
	const amount = convert(tmp+j.qty, j.unit).to("best", "imperial");
	let out = {unit: amount.unit, amount: round_amount(amount.quantity)}
    return out;
}

function round_amount(in_amount, mult){
    if (!mult) return Math.round((in_amount + Number.EPSILON) * 100) / 100
    let result = 0;
    if (typeof in_amount != "string"){
        result = in_amount * mult;
    } else {
        result = parseFloat(in_amount) * mult;
    }
    return Math.round((result + Number.EPSILON) * 100) / 100;
}
  
function removePunctuationSymbolsParentheses(text) {
	// Remove punctuation
	text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"']/g,"");

	// Remove symbols
	const symbols = "!@#$%^&*()_+`-={}|[]\:';\"<>,.?/`";
	for (let i = 0; i < symbols.length; i++) {
		text = text.replace(new RegExp("\\" + symbols[i], 'g'), ''); 
	}

	// Remove parentheses and their contents
	text = text.replace(/\([^)]*\)/g, '');

	return text;
}

/**
 * Generates a grocery list from a menu, calculating quantities based on servings multipliers
 */
export const get_grocery_list = (menu, mults, sub_recipes) => {
  const recipes = menu.expand?.recipes || menu;
  const grocery_list = [];

  recipes.forEach(recipe => {
    const mult = calculateServingsMultiplier(recipe, menu, mults, sub_recipes);
    const ingredients = recipe.expand?.ingr_list || [];

    ingredients.forEach(ingredient => {
      grocery_list.push({
        qty: ingredient.quantity * mult,
        unit: ingredient.unit,
        unit_plural: ingredient.unit_plural,
        name: normalizeItemName(ingredient.ingredient),
        checked: false,
        ingrs: [ingredient.id],
        expand: { ingrs: [ingredient] },
        active: true
      });
    });
  });
  const merged = merge(grocery_list);
  const out = groupBySimilarity(merged);
  return out;
};

const trim_punctuation = function(ingr_string) {
    const out = ingr_string.replace(/^[\s.,]+|[\s.,]+$/gu, '').trim();
    return out;
}


export const trim_verbs = function(ingr_string) {
    let out = ingr_string;
    
    verbs.sort((a, b) => b.length - a.length);
    for (let i = 0; i <  verbs.length; i++) {
        const verb = verbs[i];
        if (out.toLowerCase().includes(verb)) {
            out = out.replace(new RegExp(`\\b\\w*${verb}\\w*\\b`, 'gi'), "").trim();
        }
    }
    return trim_prepositions(out.trim());
}

const trim_prepositions = function(ingr_string) {
    let out = ingr_string;
	prepositions.sort((a,b) => b.length - a.length);
    for (let i = 0; i <  prepositions.length; i++) {
        const preposition = prepositions[i];
        const regex = new RegExp(`\\b${preposition}\\b`, 'gi');
        if (regex.test(out)) {
            out = out.replace(regex, "");
        }
    }
    
        
    // Trim conjunctions from the beginning and end
    const trimConjunctions = (str) => {
        let trimmed = str;
        for (const conjunction of conjunctions) {
            const startRegex = new RegExp(`^${conjunction}\\s+`, 'i');
            const endRegex = new RegExp(`\\s+${conjunction}$`, 'i');
            trimmed = trimmed.replace(startRegex, '').replace(endRegex, '');
        }
        return trimmed.trim();
    };
    
    out = trimConjunctions(out);
    
    out = trim_punctuation(out);
    return out;
}

/**
 * Groups grocery items by name similarity and returns flattened sorted array
 */
export const groupBySimilarity = (items) => {
  const sorted = [...items].sort((a, b) => b.name.length - a.name.length);
  const groups = [];

  sorted.forEach(item => {
    const itemWords = removePunctuationSymbolsParentheses(item.name).split(' ');
    const { groupIndex, insertIndex } = findBestGroup(itemWords, item.name, groups);

    if (groupIndex !== -1) {
      groups[groupIndex].splice(insertIndex, 0, item);
    } else {
      groups.push([item]);
    }
  });

  return groups.flat();
};

const strip_parens = function(string) {
	if (!string) return string;
    let out = string;
    const regex = /(\([\w+]\))/g;
    const matches = string.match(regex);
    if (matches) {
        matches.forEach(match => {
            out = out.replace(match, '');
        });
    }
    return out.trim();
}

// Calculate similarity between two strings using Levenshtein distance
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Check if two items are similar enough to merge
const areItemsSimilar = (item1, item2, threshold = 0.8) => {
  const name1 = normalizeItemName(item1.name);
  const name2 = normalizeItemName(item2.name);
  
  // Exact match after normalization
  if (name1 === name2) return true;
  
  // One contains the other (but avoid false positives like "sugar" vs "powdered sugar")
  const minLength = Math.min(name1.length, name2.length);
  if (minLength >= 4) { // Only for reasonably long words
    if (name1.includes(name2) || name2.includes(name1)) {
      // Avoid problematic matches
      const problematicPairs = [
        ['sugar', 'powdered sugar'],
        ['salt', 'sea salt'],
        ['pepper', 'bell pepper'],
        ['milk', 'coconut milk']
      ];
      
      const isPproblematic = problematicPairs.some(([a, b]) => 
        (name1.includes(a) && name2.includes(b)) || 
        (name1.includes(b) && name2.includes(a))
      );
      
      if (!isPproblematic) return true;
    }
  }
  
  // Fuzzy matching using similarity score
  const similarity = calculateSimilarity(name1, name2);
  return similarity >= threshold;
};

const normalizeGarlicName = (name) => {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  
  // Match variations of garlic
  const garlicPatterns = [
    /^garlic\s+cloves?$/,
    /^cloves?\s+garlic$/,
    /^garlic$/
  ];
  
  if (garlicPatterns.some(pattern => pattern.test(lower))) {
    return 'garlic';
  }
  
  return name;
};

// Check if units are compatible for merging
const areUnitsCompatible = (unit1, unit2) => {
  if (!unit1 || !unit2) return !unit1 && !unit2; // Both must be empty
  
  // Exact match
  if (unit1 === unit2) return true;
  
  // Check conversion compatibility
  const conv_match = get_conversion_rates(unit1, unit2);
  if (conv_match) return true;
  
  // Special cases that shouldn't be merged
  const incompatibleUnits = ['small', 'medium', 'large', 'clove', 'whole'];
  
	const unit1InGroup = incompatibleUnits.includes(unit1);
	const unit2InGroup = incompatibleUnits.includes(unit2);
  
  return unit1InGroup == unit2InGroup;
};

/**
 * Calculates the servings multiplier for a recipe
 */
const calculateServingsMultiplier = (recipe, menu, mults, sub_recipes) => {
  const targetRecipe = recipe.is_sub_recipe 
    ? get_parent_recipe(recipe.id, menu, sub_recipes)
    : recipe;

  if (!targetRecipe) return 1;

  const targetServings = menu.servings?.[targetRecipe.id] || mults?.[targetRecipe.id];
  return targetServings ? parseFloat(targetServings) / parseFloat(recipe.servings) : 1;
};

/**
 * Finds the parent recipe for a sub-recipe
 */
export const get_parent_recipe = (recipe_id, menu, sub_recipes) => {
  for (const [parentId, subRecipeList] of Object.entries(sub_recipes)) {
    const hasMatch = subRecipeList.some(sub => sub.recipe_id == recipe_id);
    if (hasMatch) {
      return menu.find(recipe => recipe.id == parentId);
    }
  }
  return null;
};

/**
 * Merges similar grocery items, combining quantities and units
 */
export const merge = (ingrs) => {
  const grocery_list = [];

  for (const item of ingrs) {
    if (!item.name) continue;

    const bestMatch = findBestMatch(item, grocery_list);

    if (bestMatch) {
      mergeItems(bestMatch.item, item, grocery_list, bestMatch.index);
    } else {
      addNewItem(item, grocery_list);
    }
  }

  return grocery_list;
};

/**
 * Finds the best matching item in the grocery list
 */
const findBestMatch = (item, grocery_list) => {
  let bestMatch = null;
  let bestSimilarity = 0;
  let bestIndex = -1;

  grocery_list.forEach((existing, i) => {
    if (!areItemsSimilar(item, existing) || !areUnitsCompatible(item.unit, existing.unit)) {
      return;
    }

    const similarity = calculateSimilarity(
      normalizeItemName(item.name),
      normalizeItemName(existing.name)
    );

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = existing;
      bestIndex = i;
    }
  });

  return bestMatch ? { item: bestMatch, index: bestIndex } : null;
};

/**
 * Merges two items together
 */
const mergeItems = (existing, newItem, grocery_list, index) => {
  const merged = {
    checked: false,
    active: existing.active || newItem.active,
    qty: 0,
    unit: existing.unit,
    name: existing.name.length >= newItem.name.length ? existing.name : newItem.name,
    ingrs: [...(existing.ingrs || []), ...(newItem.ingrs || [])],
    expand: {
      ingrs: [...(existing.expand?.ingrs || []), ...(newItem.expand?.ingrs || [])]
    }
  };

  // Calculate combined quantity with unit conversion if needed
  if (existing.unit !== newItem.unit && existing.unit && newItem.unit) {
    try {
      const conv = combine(existing, newItem);
      merged.qty = conv.amount;
      merged.unit = conv.unit;
    } catch (err) {
      merged.qty = (existing.qty || 0) + round_amount(newItem.qty || 0);
    }
  } else {
    merged.qty = (existing.qty || 0) + round_amount(newItem.qty || 0);
  }

  grocery_list[index] = merged;
};

/**
 * Adds a new item to the grocery list
 */
const addNewItem = (item, grocery_list) => {
  grocery_list.push({
    checked: false,
    active: item.active,
    qty: round_amount(item.qty),
    unit: item.unit,
    name: item.name,
    ingrs: item.ingrs || [],
    expand: { ingrs: item.expand?.ingrs || [] }
  });
};

/**
 * Finds the best group for an item based on word similarity
 */
const findBestGroup = (itemWords, itemName, groups) => {
  const SIMILARITY_THRESHOLD = 0.25;
  let maxSimilarity = 0;
  let bestGroupIndex = -1;
  let bestInsertIndex = 0;

  groups.forEach((group, groupIdx) => {
    group.forEach((groupItem, itemIdx) => {
      const groupWords = removePunctuationSymbolsParentheses(groupItem.name).split(' ');
      const intersection = itemWords.filter(word => groupWords.includes(word)).length;
      const similarity = intersection / itemWords.length;

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestGroupIndex = groupIdx;
        bestInsertIndex = itemIdx;
      }
    });
  });

  return maxSimilarity > SIMILARITY_THRESHOLD
    ? { groupIndex: bestGroupIndex, insertIndex: bestInsertIndex }
    : { groupIndex: -1, insertIndex: 0 };
};