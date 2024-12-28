import { get_servings } from '/src/lib/recipe_util.js';
import { get_grocery_list, trim_verbs } from '/src/lib/merge_ingredients.js';

export const sort_recipes = function(sort_val, display_recipes){
    
    
    switch (sort_val) {
        case "Least Ingredients":
            return display_recipes.sort(compare_ingr_amounts_asc);
        case "Most Ingredients":
            return display_recipes.sort(compare_ingr_amounts_dsc);
        case "Least Time":
            return display_recipes.sort(compare_time_amounts_asc);
        case "Most Time":
            return display_recipes.sort(compare_time_amounts_dsc);
        case "Least Servings":
            return display_recipes.sort(compare_serving_amounts_asc);
        case "Most Servings":
            return display_recipes.sort(compare_serving_amounts_dsc);
        case "Least Recent":
            return display_recipes.sort(compare_recent_asc);
        case "Most Recent":
            return display_recipes.sort(compare_recent_dsc);
        default:
            return display_recipes;
    }
}

function compare_ingr_amounts_asc(a, b){
    if ( a.expand.ingr_list.length < b.expand.ingr_list.length ){
        return -1;
    }
    if ( a.expand.ingr_list.length > b.expand.ingr_list.length ){
        return 1;
    }
    return 0;
}

function compare_ingr_amounts_dsc(a, b){
    if ( a.expand.ingr_list.length > b.expand.ingr_list.length ){
        return -1;
    }
    if ( a.expand.ingr_list.length < b.expand.ingr_list.length ){
        return 1;
    }
    return 0;
}

function compare_time_amounts_asc(a, b){
    if ( get_total_time(a).val > 0 && get_total_time(a).val < get_total_time(b).val ){
        return -1;
    }
    if ( get_total_time(a).val > get_total_time(b).val && get_total_time(b).val > 0 ){
        return 1;
    }
    return 0;
}

function compare_time_amounts_dsc(a, b){
    if ( get_total_time(a).val > get_total_time(b).val ){
        return -1;
    }
    if ( get_total_time(a).val < get_total_time(b).val ){
        return 1;
    }
    return 0;
}

function get_total_time(recipe){
    if (!recipe.time){
        return {display: "0", val: 0};
    }
    let total_time = 0;
    let mins = 0;
    let min_result = recipe.time.match(/(\d+) [mins|minutes]/);
    if (min_result){
        mins += parseInt(min_result[1]);
    }

    let hr_result = recipe.time.match(/(\d+) [hrs|hours|hour|hr]/);
    if (hr_result){
        mins += parseInt(hr_result[1]) * 60;
    }
    let total_mins = mins;
    let hours = parseInt(mins/60);
    mins = mins % 60;
    total_time = hours + " hrs " + mins + " mins";
    return {display: total_time, val: total_mins};
}

function compare_serving_amounts_asc(a, b){
    if ( parseInt(a.servings) < parseInt(b.servings) ){
        return -1;
    }
    if ( parseInt(a.servings) > parseInt(b.servings) ){
        return 1;
    }
    return 0;
}

function compare_serving_amounts_dsc(a, b){
    if ( parseInt(a.servings) > parseInt(b.servings) ){
        return -1;
    }
    if ( parseInt(a.servings) < parseInt(b.servings) ){
        return 1;
    }
    return 0;
}

function compare_recent_asc(a, b){
    if ( a.created < b.created ){
        return -1;
    }
    if ( a.created > b.created ){
        return 1;
    }
    return 0;
}

function compare_recent_dsc(a, b){
    if ( a.created > b.created ){
        return -1;
    }
    if ( a.created < b.created ){
        return 1;
    }
    return 0;
}

export const database_sort_recipes = async function(sort_val, display_recipes){
    switch (sort_val) {
        case "Least Ingredients":
            return display_recipes.sort(compare_ingr_amounts_asc);
        case "Most Ingredients":
            return display_recipes.sort(compare_ingr_amounts_dsc);
        case "Least Time":
            return display_recipes.sort(compare_time_amounts_asc);
        case "Most Time":
            return display_recipes.sort(compare_time_amounts_dsc);
        case "Least Servings":
            return display_recipes.sort(compare_serving_amounts_asc);
        case "Most Servings":
            return display_recipes.sort(compare_serving_amounts_dsc);
        case "Least Recent":
            return display_recipes.sort(compare_recent_asc);
        case "Most Recent":
            return display_recipes.sort(compare_recent_dsc);
        default:
            return display_recipes;
    }
}








export const sort_menus = (user_menus, sort_val) => {
    console.log("user_menus", user_menus);
    console.log("sort_menus", sort_val);
    switch (sort_val) {
        case "Least Recipes":
            user_menus = user_menus.sort(compare_recipe_amounts_asc);
            break;
        case "Most Recipes":
            user_menus = user_menus.sort(compare_recipe_amounts_dsc);
            break;
        case "Least Ingredients":
            user_menus = user_menus.sort(compare_menu_ingr_amounts_asc);
            break;
        case "Most Ingredients":
            user_menus = user_menus.sort(compare_menu_ingr_amounts_dsc);
            break;
        case "Least Time":
            user_menus = user_menus.sort(compare_menu_time_amounts_asc);        
            break;
        case "Most Time":
            user_menus = user_menus.sort(compare_menu_time_amounts_dsc);
            break;
        case "Least Servings":
            user_menus = user_menus.sort(compare_menu_serving_amounts_asc);
            break;
        case "Most Servings":
            user_menus = user_menus.sort(compare_menu_serving_amounts_dsc);
            break;
        case "Least Recent":
            user_menus = user_menus.sort(compare_menu_recent_asc);
            break;
        case "Most Recent":
            user_menus = user_menus.sort(compare_menu_recent_dsc);
            break;
        default:
            break;
    }

    return user_menus;
}

function compare_recipe_amounts_asc(a, b){
    if ( a.expand.recipes.length < b.expand.recipes.length ){
        return -1;
    }
    if ( a.expand.recipes.length > b.expand.recipes.length ){
        return 1;
    }
    return 0;
}

function compare_recipe_amounts_dsc(a, b){
    if ( a.expand.recipes.length > b.expand.recipes.length ){
        return -1;
    }
    if ( a.expand.recipes.length < b.expand.recipes.length ){
        return 1;
    }
    return 0;
}

function compare_menu_ingr_amounts_asc(a, b){
    if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length < get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
        return -1;
    }
    if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length > get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
        return 1;
    }
    return 0;
}

function compare_menu_ingr_amounts_dsc(a, b){
    if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length > get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
        return -1;
    }
    if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length < get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
        return 1;
    }
    return 0;
}

function compare_menu_serving_amounts_asc(a, b){
    if ( get_servings(a.expand.recipes) < get_servings(b.expand.recipes) ){
        return -1;
    }
    if ( get_servings(a.expand.recipes) > get_servings(b.expand.recipes) ){
        return 1;
    }
    return 0;
}

function compare_menu_serving_amounts_dsc(a, b){
    if ( get_servings(a.expand.recipes) > get_servings(b.expand.recipes) ){
        return -1;
    }
    if ( get_servings(a.expand.recipes) < get_servings(b.expand.recipes) ){
        return 1;
    }
    return 0;
}

function compare_menu_time_amounts_asc(a, b){
    if ( get_total_time(a.expand.recipes).val < get_total_time(b.expand.recipes).val ){
        return -1;
    }
    if ( get_total_time(a.expand.recipes).val > get_total_time(b.expand.recipes).val ){
        return 1;
    }
    return 0;
}

function compare_menu_time_amounts_dsc(a, b){
    if ( get_total_time(a.expand.recipes).val > get_total_time(b.expand.recipes).val ){
        return -1;
    }
    if ( get_total_time(a.expand.recipes).val < get_total_time(b.expand.recipes).val ){
        return 1;
    }
    return 0;
}

function compare_menu_recent_asc(a, b){
    if ( a.created < b.created ){
        return -1;
    }
    if ( a.created > b.created ){
        return 1;
    }
    return 0;
}

function compare_menu_recent_dsc(a, b){
    if ( a.created > b.created ){
        return -1;
    }
    if ( a.created < b.created ){
        return 1;
    }
    return 0;
}