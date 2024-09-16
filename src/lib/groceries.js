import { pb } from '/src/lib/pocketbase';

export const create_grocery_list = async function(grocery_list, menu_id){
    let items = [];
    for (let i = 0; i < grocery_list.length; i++) {
        const data_item = {
            "qty": grocery_list[i].qty,
            "unit": grocery_list[i].unit,
            "unit_plural": grocery_list[i].unit_plural,
            "name": grocery_list[i].name,
            "checked": grocery_list[i].checked,
            "ingrs": grocery_list[i].ingrs,
            "active": true
        };
    
        const record_item = await pb.collection('grocery_items').create(data_item);
        items.push(record_item.id);
    }
    const data_list = {
        "items": items,
        "active": true,
        "menu": menu_id
    };
    
    const record_list = await pb.collection('grocery_lists').create(data_list);
    const menu_data = {
        "grocery_list": record_list.id
    };
    
    const record_menu = await pb.collection('menus').update(menu_id, menu_data);
    return record_menu.id;
}

export const update_grocery_list = async function(grocery_list, id){
    let item_ids = [];
    let new_items = [];
    let item_filter = "";
    // get ids of currently store items and create new items
    for (let i = 0; i < grocery_list.length; i++) {
        if (grocery_list[i].id){
            item_ids.push(grocery_list[i].id);
            item_filter += (item_filter) ? ` || id = '${grocery_list[i].id}'` : `id = '${grocery_list[i].id}'`;
        } else {
            const data_item = {
                "qty": grocery_list[i].qty,
                "unit": grocery_list[i].unit,
                "unit_plural": grocery_list[i].unit_plural,
                "name": grocery_list[i].name,
                "checked": grocery_list[i].checked,
                "ingrs": [
                    grocery_list[i].id
                ],
                "active": true
            };
        
            const record_item = await pb.collection('grocery_items').create(data_item);
            new_items.push(record_item.id);
        }
    }
    const items_result = await pb.collection('grocery_items').getList(1, 50, {filter:item_filter})
    for (let i = 0; i < items_result.items.length; i++) {
        for (let j = 0; j < grocery_list.length; j++) {
            if (grocery_list[j].id == items_result.items[i].id){
                let data_item = {};
                if (grocery_list[j].qty != items_result.items[i].qty){
                    data_item.qty = grocery_list[j].qty;
                }
                if (grocery_list[j].unit != items_result.items[i].unit){
                    data_item.unit = grocery_list[j].unit;
                }
                if (grocery_list[j].unit_plural != items_result.items[i].unit_plural){
                    data_item.unit_plural = grocery_list[j].unit_plural;
                }
                if (grocery_list[j].name != items_result.items[i].name){
                    data_item.name = grocery_list[j].name;
                }
                if (grocery_list[j].checked != items_result.items[i].checked){
                    data_item.checked = grocery_list[j].checked;
                }
                if (grocery_list[j].ingrs !== items_result.items[i].ingrs){
                    data_item.ingrs = grocery_list[j].ingrs;
                }
                if (Object.keys(data_item).length) {
                    const record_item = await pb.collection('grocery_items').update(items_result.items[i].id, data_item);
                }
            }
        }
    }
    const menu_upsate_result = await pb.collection('grocery_lists').update(id, {"items+": new_items});
}

export const update_grocery_item = async function(item){
    if (!item) return item;
    const data = {
        "qty": item.qty,
        "unit": item.unit,
        "unit_plural": item.unit_plural,
        "name": item.name,
        "checked": item.checked,
        "ingrs": item.ingrs,
        "active": true
    };
    if (item.id){
        const updated_record = await pb.collection('grocery_items').update(item.id, data);
        return updated_record;
    } else {
        const new_record = await pb.collection('grocery_items').create(data);
        return new_record;
    }
}

export const delete_grocery_item = async function(id){
    const record = await pb.collection('grocery_items').delete(id);
    return record;
}

export const update_made = async function(made, id, user_id){
    const data = {
        "made": made
    };
    
    const record = await pb.collection('menus').update(id, data);
    let menu_completed = true;
    for (const [key, val] of Object.entries(made)){
        if (val){
            const ingr_data = {
                "made": true
            };
            const ingr_record = await pb.collection('recipes').update(key, ingr_data);
        } else {
            menu_completed = false;
        }
    }
    if (menu_completed){
        const menu_log_row = await pb.collection('menu_log').getList(1, 1, {filter: `user = '${user_id}' && menu = '${id}'`, sort: `-created`});
        if (menu_log_row.items.length){
            const menu_log_data = {
                "complete": true,
                "date_completed": new Date().toISOString()
            };
            const menu_log_result = await pb.collection('menu_log').update(menu_log_row.items[0].id, menu_log_data);
        } else {
            const menu_log_data = {
                "menu": true_record.id,
                "user": $currentUser.id,
                "complete": true,
                "date_completed": new Date().toISOString()
            };
            const menu_log_result = await pb.collection('menu_log').create(menu_log_data);
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