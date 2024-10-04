const conversions = {"tbsp/tsp": 1/3, "tsp/tbsp": 3, "c/tsp": 1/48, "tsp/c": 48, "c/tsp": 1/48, "c/tbsp": 1/16, "tbsp/c": 16, "medium/large": 1, "large/medium": 1, "sprig/tsp": 5/2, "tsp/sprig": 2/5, "sprig/tbsp": 15/2, "tbsp/sprig": 2/15, "small/medium": 1, "medium/small": 1, "large/small": 1, "small/large": 1};

const weight_volume_conv = {"gram/tablespoon": 14, "tablespoon/gram": 1/14, "gram/tbsp": 14, "tbsp/gram": 1/14, "gram/teaspoon": 14/3, "teaspoon/gram": 3/14, "gram/tsp": 14/3, "tsp/gram": 3/14, "gram/cup": 224/1, "cup/gram": 1/224}

const conv_unit = {
		"teaspoon": "tsp", "ounce": "oz", "tablespoon": "tbsp", "pound": "lb", "gram": "g",
		"cup": "c", "pint": "pt", "quart": "qt", "gallon": "gal", "milliliter": "ml",
		"liter": "l", "kilogram": "kg", "inch": "in", "fluid ounce": "fl oz",
		"milligram": "mg", "centimeter": "cm", "millimeter": "mm"
	};