import { get_parent_recipe } from '/src/lib/menu_utils.js';

const conversions = {"tablespoon/teaspoon": 1/3, "teaspoon/tablespoon": 3, "tbsp/tsp": 1/3, "tsp/tbsp": 3, "cup/teaspoon": 1/48, "teaspoon/cup": 48, "cup/tsp": 1/48, "tsp/cup": 48, "cup/tablespoon": 1/16, "tablespoon/cup": 16, "cup/tbsp": 1/16, "tbsp/cup": 16};

const weight_volume_conv = {"gram/tablespoon": 14, "tablespoon/gram": 1/14, "gram/tbsp": 14, "tbsp/gram": 1/14, "gram/teaspoon": 14/3, "teaspoon/gram": 3/14, "gram/tsp": 14/3, "tsp/gram": 3/14, "gram/cup": 224/1, "cup/gram": 1/224}

// remove exact words
const prepositions = ["of", "and", "with", "to", "in", "on", "at", "for", "by", "from", "into", "over", "under", "through", "around", "beside", "between", "among", "towards"];

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
		"continue",
		"cook",
		"cool",
		"core",
		"count",
        "coarsely",
		"cover",
		"crack",
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
		"dry",
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
		"pit",
		"place",
		"plank",
		"plunge",
		"poach",
		"pound",
		"pour",
		"prepare",
		"preserve",
		"press",
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
		"roast",
		"roll",
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
		"seed",
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

export const merge = function(ingrs) {
    let grocery_list = [];
    let skipped = [];
	// console.log(ingrs);
	for(let item of ingrs){
		if (!item) continue;
		let match = false;
		// console.log({grocery_list});
		if (grocery_list) {
			grocery_list.forEach(element => {
				// console.log({element, item});
				if (element.name === item.name || element.name.includes(item.name) || item.name.includes(element.name)){
					match = element;
					// console.log({match});
					return;
				}
			});
		}
		if (match && !(["small", "medium", "large"].includes(match.unit) ^ ["small", "medium", "large"].includes(item.unit))
						&& !(match.unit == "clove" ^ item.unit == "clove") && !(match.unit == "whole" ^ item.unit == "whole")) {
			
			console.log({match, item});
			let tmp = { checked: false,
						qty: 0,
						unit: 0,
						name: null
					};
			if (match.unit != item.unit) {
				let qty = round_amount(item.qty);
				let conv = combine(match, item);
				tmp.qty = conv.amount;
				tmp.unit = conv.unit;
			} else {
				tmp.qty = match.qty + round_amount(item.qty);
				tmp.unit = match.unit;
			}
			if (match.name.length <= item.name.length){
				tmp.name = match.name;
			}else {
				tmp.name = item.name;
			}

			grocery_list.splice(grocery_list.indexOf(match), 1);
			console.log({tmp});
			grocery_list.push(tmp);
		}else {
			let tmp = { name: item.name,
						qty: item.qty,
						unit: item.unit,
						name: item.name
					};
			tmp.qty = round_amount(item.qty);
			grocery_list.push(tmp);
		}
	}
	if (skipped.length) console.log({skipped});
	// console.log({grocery_list});
    return grocery_list;
}

const combine = (i, j) => {
	// console.log({i, j});
    let conv_index_a = `${j.unit}/${i.unit}`;
    let conv_index_b = `${i.unit}/${j.unit}`;
	// console.log(conv_index_a, conv_index_b);
    let amount = null;
    let unit = null;
    let conv_a;
    let conv_b;
    if ((!conversions[conv_index_a] || !conversions[conv_index_a]) && ((j.name.includes('salt') && j.name.includes('salt')) || (i.name.includes('sugar') || i.name.includes('sugar')) || (i.name.includes('oil') || i.name.includes('oil')))){
        conv_a = weight_volume_conv[conv_index_a];
        conv_b = weight_volume_conv[conv_index_b];
    } else {
        conv_a = conversions[conv_index_a];
        conv_b = conversions[conv_index_b];
    }
	// console.log(conv_a, conv_b);
    if (conv_a < conv_b){
        unit = j.unit;
        amount = conv_a * i.qty + j.qty;
    }else {
        unit = i.unit;
        amount = conv_b * j.qty + i.qty;
    }
	// console.log({unit: unit, amount: round_amount(amount)});
    return {unit: unit, amount: round_amount(amount)};
}

function round_amount(in_amount, mult){
	// console.log({in_amount, mult});
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
	text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

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
    // console.log("get_grocery_list---------------------------------------");
let grocery_list = [];
menu = (menu.expand && menu.expand.recipes) ? menu.expand.recipes : menu;
menu.forEach((recipe, i) => {
    let mult = 1;

    if (recipe.is_sub_recipe){
        // get parent servings to use
        const parent_recipe = get_parent_recipe(recipe.id, menu, sub_recipes);
        if (menu.servings) mult = parseFloat(menu.servings[parent_recipe.id]) / parseFloat(recipe.servings);
        else if (mults[parent_recipe.id]) mult = parseFloat(mults[parent_recipe.id]) / parseFloat(recipe.servings);
    } else {
        if (menu.servings) mult = parseFloat(menu.servings[recipe.id]) / parseFloat(recipe.servings);
        else if (mults[recipe.id]) mult = parseFloat(mults[recipe.id]) / parseFloat(recipe.servings);
    }
    
    if (recipe.expand.ingr_list) {
        for (let i = 0; i < recipe.expand.ingr_list.length; i++) {
            let temp_item = {...recipe.expand.ingr_list[i]};
            grocery_list.push({
                "qty": recipe.expand.ingr_list[i].quantity * mult,
                "unit": recipe.expand.ingr_list[i].unit,
                "unit_plural": recipe.expand.ingr_list[i].unit_plural,
                "name": trim_verbs(recipe.expand.ingr_list[i].ingredient),
                "checked": false,
                "ingrs": [
                    recipe.expand.ingr_list[i].id
                ],
                "active": true
            });
        }
    } 
});
	// console.log({grocery_list});
	// return merge(grocery_list);
	return groupBySimilarity(merge(grocery_list));
}

const trim_punctuation = function(ingr_string) {
    // console.log(ingr_string.match(/^[\s.,]+|[\s.,]+$/gu, ''));
    const out = ingr_string.replace(/^[\s.,]+|[\s.,]+$/gu, '').trim();
    // console.log("end", out);
    return out;
}


const trim_verbs = function(ingr_string) {
    // console.log("start", ingr_string);
    let out = ingr_string;
    
    verbs.sort((a, b) => b.length - a.length);
    // console.log({verbs});
    for (let i = 0; i <  verbs.length; i++) {
        const verb = verbs[i];
        // console.log({verb});
        if (out.toLowerCase().includes(verb)) {
            // console.log({verb});
            out = out.replace(new RegExp(`\\b\\w*${verb}\\w*\\b`, 'gi'), "").trim();
            // console.log({out});
        }
    }
    // console.log("verb", out.trim());
    return trim_prepositions(out.trim());
}

const trim_prepositions = function(ingr_string) {
    // console.log({ingr_string});
    let out = ingr_string;
    for (let i = 0; i <  prepositions.length; i++) {
        const preposition = prepositions[i];
        const regex = new RegExp(`\\b${preposition}\\b`, 'gi');
        if (regex.test(out)) {
            // console.log({preposition});
            // console.log({regex});
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
    // console.log("prepositions", out);
    return out;
}

export const groupBySimilarity = function(strings) {
	// console.log({strings});
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
