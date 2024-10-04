const conversions = {"tbsp/tsp": 1/3, "tsp/tbsp": 3, "c/tsp": 1/48, "tsp/c": 48, "c/tsp": 1/48, "c/tbsp": 1/16, "tbsp/c": 16, "medium/large": 1, "large/medium": 1, "sprig/tsp": 5/2, "tsp/sprig": 2/5, "sprig/tbsp": 15/2, "tbsp/sprig": 2/15, "small/medium": 1, "medium/small": 1, "large/small": 1, "small/large": 1};

const weight_volume_conv = {"gram/tablespoon": 14, "tablespoon/gram": 1/14, "gram/tbsp": 14, "tbsp/gram": 1/14, "gram/teaspoon": 14/3, "teaspoon/gram": 3/14, "gram/tsp": 14/3, "tsp/gram": 3/14, "gram/cup": 224/1, "cup/gram": 1/224}

export const conv_unit = {
		"teaspoon": "tsp", "ounce": "oz", "tablespoon": "tbsp", "pound": "lb", "gram": "g",
		"cup": "c", "pint": "pt", "quart": "qt", "gallon": "gal", "milliliter": "ml",
		"liter": "l", "kilogram": "kg", "inch": "in", "fluid ounce": "fl oz",
		"milligram": "mg", "centimeter": "cm", "millimeter": "mm"
	};

    const get_conversion_rates = (a_unit, b_unit) => {
        const i_unit = (conv_unit[a_unit]) ? conv_unit[a_unit] : a_unit;
        const j_unit = (conv_unit[b_unit]) ? conv_unit[b_unit] : b_unit;
        let conv_index_a = `${j_unit}/${i_unit}`;
        let conv_index_b = `${i_unit}/${j_unit}`;
        // console.log("conv_index",conv_index_a, conv_index_b);
        let amount = null;
        let unit = null;
        let conv_a;
        let conv_b;
        if ((!conversions[conv_index_a] || !conversions[conv_index_a])){
            conv_a = (weight_volume_conv[conv_index_a]) ? weight_volume_conv[conv_index_a] : conversions[conv_index_a];
            conv_b = (weight_volume_conv[conv_index_b]) ? weight_volume_conv[conv_index_b] : conversions[conv_index_b];
        } else {
            conv_a = conversions[conv_index_a];
            conv_b = conversions[conv_index_b];
        }
        if (conv_a || conv_b) {
            return {a:conv_a, b:conv_b};
        } else {
            return false;
        }
    }