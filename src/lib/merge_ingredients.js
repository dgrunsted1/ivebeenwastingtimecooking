import { get_parent_recipe } from '/src/lib/menu_utils.js';
import { get_conversion_rates, conv_unit } from '/src/lib/unit_conversions.js';
import convert from "convert";
import { get_grocery_item_name } from '$lib/ingr_to_groc.js';

// remove exact words
const prepositions = ["of", "with", "to", "in", "on", "at", "for", "by", "from", "into", "over", "under", "through", "around", "beside", "between", "among", "towards", "room", "very", "more for serving", "for serving", "melon baller", "a", "press", "freshly ground", "crack", "seeded", "pit"];

const conjunctions = ["and", "or", "nor", "but", "yet", "so"];
const remove_when_matching = ["(optional)"];

let conversions_missing = [];
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

export const merge_v1 = function(ingrs) {
	console.log("Merging", ingrs);
    let grocery_list = [];
    let skipped = [];
	for(let item of ingrs){
		if (!item.name) continue;
		let match = false;
		let conv_match = false;
		if (grocery_list) {
			for (let i = 0; i < grocery_list.length; i++) {
				if (((item.unit && item.qty && grocery_list[i].unit && grocery_list[i].qty) || (!item.unit && !item.qty && !grocery_list[i].unit && !grocery_list[i].qty)) && ((strip_parens(grocery_list[i].name) === strip_parens(item.name)) || 
				   (grocery_list[i].name.includes(item.name) && !grocery_list[i].name.includes("un" + item.name) && !grocery_list[i].name.includes(item.name + "ed") && grocery_list[i].name !== "sugar" && grocery_list[i].name !== "powdered sugar") || 
				   (item.name.includes(grocery_list[i].name) && !item.name.includes("un" + grocery_list[i].name) && !item.name.includes(grocery_list[i].name + "ed") && item.name !== "sugar" && item.name !== "powdered sugar"))) {
					conv_match = get_conversion_rates(item.unit, grocery_list[i].unit);
					if (conv_match) {
						match = grocery_list[i];
						break;
					}
				}
			}
				
		}
		

		if (match && !(["small", "medium", "large"].includes(match.unit) ^ ["small", "medium", "large"].includes(item.unit))
						&& !(match.unit == "clove" ^ item.unit == "clove") && !(match.unit == "whole" ^ item.unit == "whole") &&
						conv_match) {
			if (!item.ingrs) item.ingrs = [];
			let tmp = { checked: false,
						qty: 0,
						unit: 0,
						name: null,
						ingrs: match.ingrs.concat(item.ingrs),
						expand: { ingrs: match.expand.ingrs.concat(item.expand.ingrs)}
					};
			if (match.unit != item.unit && conv_unit[match.unit] != item.unit && conv_unit[item.unit] != match.unit) {
				let conv = combine(match, item);
				tmp.qty = conv.amount;
				tmp.unit = conv.unit;
			} else {
				tmp.qty = match.qty + round_amount(item.qty);
				tmp.unit = match.unit;
			}
			if (match.name.length >= item.name.length){
				tmp.name = match.name;
			}else {
				tmp.name = item.name;
			}
			grocery_list.splice(grocery_list.indexOf(match), 1);
			console.log("combining", match, "with", item, "to get", tmp);
			grocery_list.push(tmp);
		}else {
			let tmp = {};
				try{
					if (item.qty && item.unit){
						tmp = { checked: false,
							qty: round_amount(item.qty),
							unit: item.unit,
							name: item.name,
							ingrs: (item.ingrs) ?  item.ingrs : [],
							expand: { ingrs: item.expand.ingrs}
						};
					} else {
						tmp = { checked: false,
							qty: round_amount(item.qty),
							unit: item.unit,
							name: item.name,
							ingrs: (item.ingrs) ?  item.ingrs : [],
							expand: { ingrs: item.expand.ingrs}
						};
					}
				} catch (err) {
					tmp = { checked: false,
						qty: round_amount(item.qty),
						unit: item.unit,
						name: item.name,
						ingrs: (item.ingrs) ?  item.ingrs : [],
						expand: { ingrs: item.expand.ingrs}
					};
				}

			grocery_list.push(tmp);
		}
	}
    return grocery_list;
}



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

export const get_grocery_list = function(menu, mults, sub_recipes) {

	let grocery_list = [];
	menu = (menu.expand && menu.expand.recipes) ? menu.expand.recipes : menu;
	menu.forEach((recipe, i) => {
		let mult = 1;

		if (recipe.is_sub_recipe){
			// get parent servings to use
			const parent_recipe = get_parent_recipe(recipe.id, menu, sub_recipes);
			if (menu.servings) mult = parseFloat(menu.servings[parent_recipe.id]) / parseFloat(recipe.servings);
			else if (mults && mults[parent_recipe.id]) mult = parseFloat(mults[parent_recipe.id]) / parseFloat(recipe.servings);
		} else {
			if (menu.servings) mult = parseFloat(menu.servings[recipe.id]) / parseFloat(recipe.servings);
			else if (mults && mults[recipe.id]) mult = parseFloat(mults[recipe.id]) / parseFloat(recipe.servings);
		}
		
		if (recipe.expand.ingr_list) {
			for (let i = 0; i < recipe.expand.ingr_list.length; i++) {
				let temp_item = {...recipe.expand.ingr_list[i]};
				grocery_list.push({
					"qty": recipe.expand.ingr_list[i].quantity * mult,
					"unit": recipe.expand.ingr_list[i].unit,
					"unit_plural": recipe.expand.ingr_list[i].unit_plural,
					"name": get_grocery_item_name(recipe.expand.ingr_list[i].ingredient),
					"checked": false,
					"ingrs": [
						recipe.expand.ingr_list[i].id
					],
					"expand": {
						"ingrs": [
							recipe.expand.ingr_list[i]
						]
					},
					"active": true
				});
			}
		} 
	});
	const out = groupBySimilarity(merge(grocery_list));
	return out;
}

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

export const groupBySimilarity = function(strings) {
    // Split each string into words
    strings = strings.sort((a, b) => b.length - a.length);
    let stringWords = strings.map(s => removePunctuationSymbolsParentheses(s.name).split(' '));

    let groups = [];
    for (let i = 0; i < strings.length; i++) {
        const str1Words = stringWords[i];
    //   // Check if this string belongs in an existing group
        let maxSimilarity = 0;
        let maxGroup;
        let maxIndex;
        for (let j = 0; j < groups.length; j++) {
            for (let k = 0; k < groups[j].length; k++) {
                let intersection = 0;
                const str2Words = removePunctuationSymbolsParentheses(groups[j][k].name).split(' ');
                str1Words.forEach(word => {
                if (str2Words.includes(word)) {
                    intersection++;
                }
                });
                // const min_length = (str1Words.length > str2Words.length) ? str2Words.length : str1Words.length ;
                const similarity = intersection / str1Words.length;
                if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                maxGroup = j;
                maxIndex = k;
                }
            }
        }
        
        // If no suitable group, create a new one
        if (maxGroup && maxSimilarity > .25) {
            groups[maxGroup] = [...groups[maxGroup].slice(0, maxIndex), strings[i], ...groups[maxGroup].slice(maxIndex)];
        } else {
            groups.push([strings[i]]);
        }
}




let flattened = [];
Array.from(groups.values()).sort((a, b) => b.length - a.length).forEach(subarr => {
    flattened.push(...subarr);
});

return flattened;
}


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


// Helper function to normalize item names for comparison
const normalizeItemName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove common descriptors that shouldn't prevent matching
    .replace(/\b(fresh|organic|raw|cooked|dried|frozen|canned|whole|chopped|diced|sliced|ground)\b/g, '')
    // Remove parenthetical content
    .replace(/\([^)]*\)/g, '')
    // Handle plurals
    .replace(/ies$/, 'y')
    .replace(/s$/, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

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

// Check if units are compatible for merging
const areUnitsCompatible = (unit1, unit2) => {
  if (!unit1 || !unit2) return !unit1 && !unit2; // Both must be empty
  
  // Exact match
  if (unit1 === unit2) return true;
  
  // Check conversion compatibility
  const conv_match = get_conversion_rates(unit1, unit2);
  if (conv_match) return true;
  
  // Special cases that shouldn't be merged
  const incompatibleUnits = [
    ['small', 'medium', 'large'],
    ['clove'],
    ['whole']
  ];
  
  for (const group of incompatibleUnits) {
    const unit1InGroup = group.includes(unit1);
    const unit2InGroup = group.includes(unit2);
    if (unit1InGroup !== unit2InGroup) return false;
  }
  
  return false;
};

export const merge = function(ingrs) {
//   console.log("Merging", ingrs);
  let grocery_list = [];
  
  for (let item of ingrs) {
    if (!item.name) continue;
    
    let matchIndex = -1;
    let bestMatch = null;
    let bestSimilarity = 0;
    
    // Find the best matching item
    for (let i = 0; i < grocery_list.length; i++) {
      const existing = grocery_list[i];
      
      // Check if items are similar and units are compatible
      if (areItemsSimilar(item, existing) && areUnitsCompatible(item.unit, existing.unit)) {
        const similarity = calculateSimilarity(
          normalizeItemName(item.name), 
          normalizeItemName(existing.name)
        );
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = existing;
          matchIndex = i;
        }
      }
    }
    
    if (bestMatch) {
      // Merge the items
      const mergedItem = {
        checked: false,
        active: bestMatch.active || item.active,
        qty: 0,
        unit: bestMatch.unit,
        name: bestMatch.name.length >= item.name.length ? bestMatch.name : item.name,
        ingrs: [...(bestMatch.ingrs || []), ...(item.ingrs || [])],
        expand: { 
          ingrs: [...(bestMatch.expand?.ingrs || []), ...(item.expand?.ingrs || [])]
        }
      };
      
      // Calculate combined quantity
      if (bestMatch.unit !== item.unit && bestMatch.unit && item.unit) {
        try {
          const conv = combine(bestMatch, item);
          mergedItem.qty = conv.amount;
          mergedItem.unit = conv.unit;
        } catch (err) {
          // Fallback to simple addition if conversion fails
          mergedItem.qty = (bestMatch.qty || 0) + round_amount(item.qty || 0);
        }
      } else {
        mergedItem.qty = (bestMatch.qty || 0) + round_amount(item.qty || 0);
      }
      
      // Replace the existing item
      grocery_list[matchIndex] = mergedItem;
      console.log("Combining", bestMatch, "with", item, "to get", mergedItem);
      
    } else {
      // Add as new item
      const newItem = {
        checked: false,
        active: item.active,
        qty: round_amount(item.qty),
        unit: item.unit,
        name: item.name,
        ingrs: item.ingrs || [],
        expand: { 
          ingrs: item.expand?.ingrs || []
        }
      };
      
      grocery_list.push(newItem);
    }
  }
  
  return grocery_list;
};