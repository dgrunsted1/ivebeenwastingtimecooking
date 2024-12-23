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
    const result = await pb.collection('menus').update(menu_id, {
        servings: mults
    });
    return result.servings;
}

export const get_total_time = function(recipes){
    let total_time = 0;
    let mins = 0;
    for (let i = 0; i < recipes.length; i++){
        let min_result = recipes[i].time.match(/(\d+) [mins|minutes]/);
        if (min_result){
            mins += parseInt(min_result[1]);
        }

        let hr_result = recipes[i].time.match(/(\d+) [hrs|hours|hour|hr]/);
        if (hr_result){
            mins += parseInt(hr_result[1]) * 60;
        }
    }
    let total_mins = mins;
    let hours = parseInt(mins/60);
    mins = mins % 60;
    total_time = hours + " hrs " + mins + " mins";
    return {display: total_time, val: total_mins};
}

export const format_date = function(in_date){
    const day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let output = "";
    let menu_date = new Date(in_date);
    let menu_day = menu_date.getDate();
    let menu_month = menu_date.getMonth();
    let menu_year = menu_date.getFullYear();
    let today = new Date();
    if (menu_year == today.getFullYear()){
        if (menu_month == today.getMonth()){
            if (menu_day == today.getDate()){
                output = "Today";
            } else if (today.getDate() - menu_day < 7){
                output = day_names[menu_date.getDay()];
            } else {
                output = menu_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric' });
            }
        } else {
            output = menu_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric' });
        } 
    } else {
        output = menu_date.toLocaleDateString(undefined, {year: '2-digit', month: 'short', day: 'numeric' });
    }
    return output;
}