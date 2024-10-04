import { get_parent_recipe } from '/src/lib/menu_utils.js';
import { get_conversion_rates, conv_unit } from '/src/lib/unit_conversions.js';

// remove exact words
const prepositions = ["of", "with", "to", "in", "on", "at", "for", "by", "from", "into", "over", "under", "through", "around", "beside", "between", "among", "towards", "room", "very", "more for serving", "melon baller", "a"];

const conjunctions = ["and", "or", "nor", "but", "yet", "so"];
const remove_when_matching = ["(optional)", "for serving"];

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
		if (!item.name) continue;
		let match = false;
		// console.log({item});
		if (grocery_list) {
			grocery_list.forEach(element => {
				// console.log({element, item});
				if (((item.unit && item.qty && element.unit && element.qty) || (!item.unit && !item.qty && !element.unit && !element.qty)) && ((strip_parens(element.name) === strip_parens(item.name)) || 
				   (element.name.includes(item.name) && !element.name.includes("un" + item.name) && !element.name.includes(item.name + "ed") && element.name !== "sugar" && element.name !== "powdered sugar") || 
				   (item.name.includes(element.name) && !item.name.includes("un" + element.name) && !item.name.includes(element.name + "ed") && item.name !== "sugar" && item.name !== "powdered sugar"))) {
					match = element;
					// console.log({match});
					return;
				}
			});
		}
		const conv_match = get_conversion_rates(item.unit, match.unit);
		if (match && !(["small", "medium", "large"].includes(match.unit) ^ ["small", "medium", "large"].includes(item.unit))
						&& !(match.unit == "clove" ^ item.unit == "clove") && !(match.unit == "whole" ^ item.unit == "whole") &&
						conv_match) {
			
			// console.log(match, item);
			let tmp = { checked: false,
						qty: 0,
						unit: 0,
						name: null,
						ingrs: match.ingrs.concat(item.ingrs),
						matches: match.matches.concat(item.matches),
					};
			if (match.unit != item.unit && conv_unit[match.unit] != item.unit && conv_unit[item.unit] != match.unit) {
				let conv = combine(match, item, conv_match);
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
			// console.log(tmp);
			grocery_list.push(tmp);
		}else {
			let tmp = { checked: false,
						qty: item.qty,
						unit: item.unit,
						name: item.name,
						ingrs: item.ingrs,
						matches: item.matches
					};
			tmp.qty = round_amount(item.qty);
			grocery_list.push(tmp);
		}
	}
	if (skipped.length) console.log({skipped});
	// console.log({grocery_list});
	console.log(conversions_missing);
    return grocery_list;
}



const combine = (i, j, conv) => {
	// console.log({i, j});
	const amount_a = conv.a * i.qty + j.qty;
	const amount_b = conv.b * i.qty + j.qty;
	let unit;
	let amount;
	// console.log("conv", conv_a, conv_b);
    if (Math.abs(amount_a - 1) < Math.abs(amount_b - 1)) {
        unit = j.unit;
        amount = amount_a;
    } else {
        unit = i.unit;
        amount = amount_b;
    }
	if (isNaN(amount)) {
		// console.log(i, j, conv_a, conv_b, conv_index_a, conv_index_b);
		if (!conversions_missing.includes(conv_index_b) && !conversions_missing.includes(conv_index_a)) conversions_missing.push(conv_index_a);
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


export const trim_verbs = function(ingr_string) {
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


const strip_parens = function(string) {
    // console.log({string});
    let out = string;
    const regex = /(\([\w+]\))/g;
    const matches = string.match(regex);
    // console.log({matches});
    if (matches) {
        matches.forEach(match => {
            out = out.replace(match, '');
        });
    }
    // console.log({out});
    return out.trim();
}