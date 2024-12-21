import { currentUser, pb } from '/src/lib/pocketbase.js';

export const get_parent_recipe = function(recipe_id, menu, sub_recipes){
    for (let i in sub_recipes){
        for (let j = 0; j < sub_recipes[i].length; j++){
            if (sub_recipes[i][j].recipe_id == recipe_id){
                for (let k = 0; k < menu.length; k++){
                    if (menu[k].id == i){
                        return menu[k];
                    }
                }
            }
        }
    }
}

export const update_menu_mults = async function(menu_id, mults){
    // console.log(menu_id, mults);
    const result = await pb.collection('menus').update(menu_id, {
        mults: mults
    });
    // console.log(result.servings);
    return result.servings;
}