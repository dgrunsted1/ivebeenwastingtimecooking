import { parse } from 'recipe-ingredient-parser-v3';

const measurements = [
    "teaspoon", "cup", "tablespoon", "pound", "gram", "g", "large", 
    "medium", "small", "clove", "whole", "ounce", "pint", "inch", "ear",
    "oz", "tsp", "tbsp", "lb", "sprig", "bunch", "quart", "pinch"
];

const conv_frac = {
    "¼": .25, "½": .5, "¾": .75, "⅐": .142857, "⅑": .111111, "⅒": .1, "⅓": .333333, "⅔": .666667, "⅕": .2, 
    "⅖": .4, "⅗": .6, "⅘": .8, "⅙": .166667, "⅚": .833333, "⅛": .125, "⅜": .375, "⅝": .625, "⅞": .875
};

const reg_exp = {
    replace: {
        "$2": /^(\*)([A-z0-9 ()/’,-.ñ;è'\t]+)/,
        "$1 $2": /^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+)([A-z|(])/,
        "": /about/i,
        "$2 $3": /^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+) to (\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+)([A-z|(])/
    }, 
    match: [
        //  6 medium tomatillos (about 1 1/2 pounds, 0.7kg), husks removed and halved
        //  1 medium onion, thinly sliced (about 6 ounces; 170g)
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+|\d\/\d|\d+ \d\/\d|\d+.\d+) ([A-zñ]+)(.*)/, amnt: 1, opp:"none", unit: 2, name: 3},
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+|\d\/\d|\d+ \d\/\d|\d+.\d+) to (\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d+|\d\/\d|\d \d\/\d) ([A-zñ]+)(.*)/, amnt: [1,2], opp:"avg", unit: 3, name: 4},
        //  1 cup/200 grams granulated sugar
        //  ¼ cup/30 grams confectioners’ sugar
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d|\d\/\d|\d+ \d\/\d|\d+.\d+) ([A-z]+)\/(\d+) ([A-z]+) (.*)/, amnt: 1, opp:"none", unit: 2, name: 5},
        //  amount unit (something in parenthasis) name
        //  1 tablespoon (15ml) vegetable oil
        //  1 1/4 cup (60ml) vegetable oil
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d|\d\/\d|\d+ \d\/\d|\d+.\d+) ([A-z]+) (\(\w+\)) (.*)/, amnt: 1, opp:"none", unit: 2, name: 4},
        //  1 (14 ounce; 396g) block firm tofu, cut into 1- by 2- by 1/2-inch squares
        //  1 (1-inch) knob ginger, peeled, roughly chopped
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d|\d\/\d|\d+ \d\/\d|\d+.\d+) \((\d+)[ -](\w+)(|[; ,] \d+\w+)\) ([A-z]+) (.*)/, amnt: [1,2], opp:"mult", unit: 3, name: [5,6]},
        //  1 1-lb. bag frozen spinach
        {exp:/^(\d[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E]|\d|\d\/\d|\d+ \d\/\d|\d+.\d+) (\d+)-(\w+)[.] ([A-z]+) (.*)/, amnt: [1,2], opp:"mult", unit: 3, name: [4,5]}
    ]
};

export const process_recipe = function(in_lines){
    let result = [];
    for(let ingr of in_lines){
        if (ingr) result.push(parse(ingr, 'eng'));
    }
    return result;
}

export const process_recipe_old = function(in_lines) {
    let plus_match = in_lines[0].match(/([^>]+) plus ([^>]+)/);
    if (plus_match){
        if (plus_match[1].split(" ").length > 2 && plus_match[2].split(" ").length > 2){
            in_lines[0] = plus_match[1];
            in_lines.splice(1, 0, plus_match[2]);
        }
    }

    for (let key in reg_exp.replace){
        in_lines[0] = in_lines[0].replace(reg_exp.replace[key],key).trim();
    }
    
    let ingr = false;
    let cnt = 0
    for (let match of reg_exp.match){
        let curr = in_lines[0].match(match.exp);
        if (curr){
            // log_match(curr, cnt);
            let amount;
            let name = "";
            let unit = "";
            if (typeof match.amnt == "number"){
                amount = curr[match.amnt];
            }else{ 
                if (match.opp == "avg"){
                    amount = (parseFloat(curr[match.amnt[0]]) + parseFloat(curr[match.amnt[1]])) / 2;
                }else{
                    amount = curr[match.amnt[0]] * curr[match.amnt[1]];   
                }
            }
            if (typeof match.name == "number"){ 
                name = curr[match.name];
            }else{ 
                name = curr[match.name[0]] + " " + curr[match.name[1]];
            }
            if (typeof match.unit == "number") {
                unit = curr[match.unit];
            }else{
                for (let i = 0; i < match.unit.length; i++){
                    if (curr[match.unit[i]]) {
                        unit += " "+curr[match.unit[i]];
                    }
                }
            }
            ingr = {
                    amount: convert_amount(amount), 
                    unit: make_singular(unit), 
                    name: trim_name(name.trim()),
                    original: [in_lines[0]]
            };
        }
        curr = false;
        cnt++;
    }

    if (ingr && !ingr.unit.includes("can") && !ingr.unit.includes("block") && !measurements.includes(ingr.unit)) {
        ingr.name = ingr.unit+" "+ingr.name;
        ingr.unit = "whole";
    }

    if (in_lines[0]) {
        ingr = {
                quantity: ingr.amount ?? null,
                unit: ingr.unit ?? null,
                unitPlural: null,
                symbol: null,
                ingredient: ingr.name ?? in_lines[0],
                minQty: null,
                maxQty: null,
                original: [in_lines[0]]
            };
    }
    if (ingr && plus_match && in_lines[1] && in_lines[1].includes("more")){
        in_lines[1] = ingr.ingredient + " " + in_lines[1];
    }
    if (in_lines.slice(1).length) return [ingr].concat(process_recipe_old(in_lines.slice(1)));
    else return ingr;
}

function convert_amount(in_amount) {
    let result = 0;
        if (typeof in_amount != "string") return in_amount;
        if (in_amount.match(/^[\u00BC-\u00BE\u2150-\u215E]/)){
            result = conv_frac[in_amount];
        } else if (in_amount.match(/\d[\u00BC-\u00BE\u2150-\u215E]/)) {
            result = parseInt(in_amount.charAt(0)) + conv_frac[in_amount.charAt(1)];
        } else if (in_amount.match(/^\d\/\d/)) {
            result = eval(in_amount);
        } else if (in_amount.match(/\d \d\/\d/)) {
            let tmp = in_amount.split(" ");
            result = parseInt(tmp[0]) + eval(tmp[1]);
        } else {
            result = parseFloat(in_amount);
        }
        return Math.round((result + Number.EPSILON) * 100) / 100
    }

function trim_name(in_name) {
    let out = in_name.replace(/\(([^\)]+)\)/, "");
    out = in_name.replace(/^[ .]+/, "");
    out = out.trim();
    // if (out.indexOf("s") == out.length - 1) out = out.substring(0, out.length - 1);
    return out
}

function log_match(match_arr, loop_num){
    console.log("loop", loop_num);
    let cnt = 0;
    match_arr.forEach(element => {
        console.log(cnt++, element);
    });
}

function make_singular(unit) {
    unit = unit.toLowerCase();
    return (unit.substring(unit.length-1) == "s") ? unit.substring(0, unit.length-1) : unit;
}
