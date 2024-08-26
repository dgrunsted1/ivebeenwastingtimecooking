export const get_servings = function(recipes, sub_recipes, mults){
    let sub_recipe_id_list = [];
    for (let k in sub_recipes){
        for (let i = 0; i < sub_recipes[k].length; i++){
            if (sub_recipes[k][i].recipe_id && !sub_recipe_id_list.includes(sub_recipes[k][i].recipe_id)) sub_recipe_id_list.push(sub_recipes[k][i].recipe_id);
        }
    }
    let total_serv = 0;
    for (let i = 0; i < recipes.length; i++){
        if (!sub_recipe_id_list.includes(recipes[i].id)) total_serv += parseInt(recipes[i].servings);
    }
    return total_serv;
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
    let hours = parseInt(mins/60);
    mins = mins % 60;
    total_time = hours + "hrs " + mins + "mins";
    return total_time;
}