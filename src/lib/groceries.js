import { pb } from '/src/lib/pocketbase';

export const create_grocery_list = async function(grocery_list, menu_id){
    
    const data = {
        "list": grocery_list,
        "active": true,
        "menu": menu_id
    };
    const record = await pb.collection('groceries').create(data);
    const menu_data = {
        "grocery_list": record.id
    };
    
    const record_menu = await pb.collection('menus').update(menu_id, menu_data);
    return record.id;
}

export const update_grocery_list = async function(grocery_list, id){
    const data = {
        "list": grocery_list
    };
    
    const record = await pb.collection('groceries').update(id, data);
}

export const update_made = async function(made, id){
    const data = {
        "made": made
    };
    
    const record = await pb.collection('menus').update(id, data);

    for (const [key, val] of Object.entries(made)){
        if (val){
            const ingr_data = {
                "made": true
            };
            const ingr_record = await pb.collection('recipes').update(key, ingr_data);
        }
    }
}


export const log_made = async function(recipe_id, user_id){
    const data = {
        "recipe": recipe_id,
        "user": user_id
    };
    
    const record = await pb.collection('recipe_log').create(data);
    if (record.code != 200){
        return false;
    }
    return true;
}