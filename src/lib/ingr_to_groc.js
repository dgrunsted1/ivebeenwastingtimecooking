import nlp from 'compromise'

const descriptiveWords = [
    'fresh', 'freshly', 'whole', 'chopped', 'diced', 'sliced',
    'minced', 'crushed', 'grated', 'shredded', 'boneless', 'skinless',
    'large', 'medium', 'small', 'extra-virgin', 'extra', 'coarse', 'fine', 'thick-cut', 'thick', 'thin',
    'room temperature', 'chilled', 'frozen', 'thawed', 'ripe', 'unripe', 'warm', 'packed'
];

const measurements = [
    'cup', 'cups', 'c', 'tablespoon', 'tablespoons', 'tbsp', 'tsp', 
    'teaspoon', 'teaspoons', 'ounce', 'ounces', 'oz', 'pound', 'pounds', 
    'lb', 'lbs', 'gram', 'grams', 'g', 'kilogram', 'kg', 'liter', 'l',
    'milliliter', 'ml', 'pint', 'pints', 'quart', 'quarts', 'gallon'
];

nlp.extend({
    words: {
        'turmeric': 'Noun',
        'baking soda': 'Noun',
        'baking powder': 'Noun',
        'half and half': 'Noun',
        'can': 'Noun',
        'canned': 'Noun',
        'juice': 'Noun'
    }
});

export function normalizeItemName(name) {
  if (!name) return '';
  
  // Initial cleaning
  let cleaned = name.toLowerCase().trim();
  
  // Remove parenthetical content
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Remove quotes and fractions
  cleaned = cleaned.replace(/["""''½⅓⅔¼¾⅛⅜⅝⅞]/g, '');
  
  // Remove numbers
  cleaned = cleaned.replace(/[\d+|.\d+]/g, '');
  
  // Remove common descriptors
  cleaned = cleaned.replace(/\b(fresh|organic|raw|cooked|dried|frozen|canned|whole|chopped|diced|sliced|ground)\b/g, '');
  
  // Remove measurements
  measurements.forEach(measure => {
    cleaned = cleaned.replace(new RegExp(`\\b${measure}s?\\b`, 'gi'), '');
  });
  
  // Remove descriptive words
  descriptiveWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  // Remove commas, semicolons, periods and everything after them
  cleaned = cleaned.replace(/[,;.].*/g, '');
  
  // Extract nouns using NLP
  let textc = nlp(cleaned).nouns().out('text');
  
  // Clean up extra whitespace
  textc = textc.replace(/\s\s+/g, ' ').trim();
  
  // Handle garlic variations
  textc = normalizeGarlicName(textc);
  
  // Handle plurals
  textc = textc
    .replace(/ies$/, 'y')
    .replace(/s$/, '');
  
  // Final cleanup
  textc = textc.replace(/\s+/g, ' ').trim();
  
  // Return the normalized name or original if nothing remains
  return textc || name;
}

// Normalize garlic-related ingredient names
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

export function merge_grocery_items(ingr_list){
    let groc_list = [];
    ingr_list.forEach(ingr => {
        let groc_name = get_grocery_item_name(ingr.name);
        let found = false;
        groc_list.forEach(groc => {
            if (groc.name === groc_name){
                groc.count += 1;
                found = true;
            }
        });
        if (!found){
            groc_list.push({name: groc_name, count: 1});
        }
    });
    return groc_list;
}

export function combine_items(items) {
  // Base case: empty array or single item
  if (items.length <= 1) {
    return items;
  }
  
  // Take the first item as our reference
  const [first, ...rest] = items;
  
  // Find all items with the same name as the first item
  const sameNameItems = rest.filter(item => item.name === first.name);
  const differentNameItems = rest.filter(item => item.name !== first.name);
  
  // If no items have the same name, recursively process the rest
  if (sameNameItems.length === 0) {
    return [first, ...combine_items(rest)];
  }
  
  // Combine all items with the same name
  let combinedItem = { ...first };
  
  // Merge ingr_ids (assuming they should be combined as arrays)
  const allIngrIds = [
    ...(Array.isArray(first.ingr_ids) ? first.ingr_ids : [first.ingr_ids]),
    ...sameNameItems.flatMap(item => 
      Array.isArray(item.ingr_ids) ? item.ingr_ids : [item.ingr_ids]
    )
  ];
  combinedItem.ingr_ids = [...new Set(allIngrIds.filter(id => id != null))];
  
  // Convert all quantities to the same unit (using the first item's unit as reference)
  const baseUnit = first.unit;
  let totalQuantity = first.quantity;
  
  for (const item of sameNameItems) {
    try {
      // Attempt to convert the item's quantity to the base unit
      const convertedQuantity = convert(item.quantity, item.unit).to(baseUnit);
      totalQuantity += convertedQuantity;
    } catch (error) {
      // If conversion fails, we have incompatible units
      // In this case, you might want to handle this differently
      // For now, we'll keep them as separate items
      console.warn(`Cannot convert ${item.unit} to ${baseUnit} for ${item.name}`);
      differentNameItems.push(item);
    }
  }
  
  combinedItem.quantity = totalQuantity;
  
  // Recursively process the remaining items with different names
  return [combinedItem, ...combine_items(differentNameItems)];
}

export function group_items_by_name(items) {
  // Base case: empty array
  if (items.length === 0) {
    return [];
  }
  
  // Base case: single item
  if (items.length === 1) {
    return [items];
  }
  
  // Take the first item as our reference
  const [first, ...rest] = items;
  
  // Find all items with the same name as the first item
  const sameNameItems = rest.filter(item => item.name === first.name);
  const differentNameItems = rest.filter(item => item.name !== first.name);
  
  // Create a group with the first item and all items with the same name
  const currentGroup = [first, ...sameNameItems];
  
  // Recursively process the remaining items with different names
  const remainingGroups = group_items_by_name(differentNameItems);
  
  // Combine current group with remaining groups
  const allGroups = [currentGroup, ...remainingGroups];
  
  // Sort groups by length (longest to shortest)
  return allGroups.sort((a, b) => b.length - a.length);
}