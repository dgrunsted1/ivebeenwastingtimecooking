<script>
    import { afterUpdate, beforeUpdate, onMount } from 'svelte';
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { merge, trim_verbs, groupBySimilarity } from '/src/lib/merge_ingredients.js';

    $: results = [];
    $: passed = 0;
    $: failed = 0;
    $: is_auth_user = false;
    $: verify_email = "";
    $: unset_cat = [];
    $: categories = [];
    $: unset_cuis = [];
    $: cuisines = [];
    $: grocery_list_test = [];

    const tables = ["menus_strict", "grocery_lists", "ingredients_strict", "menu_log_strict", "grocery_items", "recipes_log_strict", "recipes_strict", "sub_recipes"];

    onMount(async () => {
        if ($currentUser) await pb.collection('users').authRefresh();
        if (!$currentUser || $currentUser.id != "67gxu7xk6x46gjy"){
            window.location.href = "/";
            return;
        } else {
            is_auth_user = true;
        }
        unset_cat = await get_unset_category_recipes();
        categories = await pb.collection('categories').getFullList({sort: `+id`});
        unset_cuis = await get_unset_cuisines_recipes();
        cuisines = await pb.collection('cuisines').getFullList({sort: `+id`});
    });

    beforeUpdate(async () => {
        if (!$currentUser || $currentUser.id != "67gxu7xk6x46gjy"){
            window.location.href = "/";
        } else {
            is_auth_user = true;
        }
    });

    const update_cats = async function(){
        let perc = 0;
        for (let i = 0; i < unset_cat.length; i++){
            const data = { "category": unset_cat[i].category };
            const updated_record = await pb.collection('recipes').update(unset_cat[i].id, data);
            perc = (i / unset_cat.length) * 100;
        }
        perc = 100;
    }

    const update_cuis = async function(e){
        e.srcElement.innerHTML = `0%`;
        for (let i = 0; i < unset_cuis.length; i++){
            const data = { "cuisine": unset_cat[i].cuisine };
            const updated_record = await pb.collection('recipes').update(unset_cuis[i].id, data);
            e.srcElement.innerHTML = `${(i / unset_cuis.length) * 100}%`;
        }
        e.srcElement.innerHTML = `100%`;
    }

    const get_unset_category_recipes = async function(){
        let result = await pb.collection('recipes').getList(1, 250, {
            filter: `category = ""`,
        });
        return result.items;
    }

    const get_unset_cuisines_recipes = async function(){
        let result = await pb.collection('recipes').getList(1, 250, {
            filter: `cuisine = ""`,
        });
        return result.items;
    }
        
    const update_recipe_url_ids = async function (){
        return;
        const recipes = await pb.collection('recipes').getFullList({sort: `-created`});
        for (let i = 0; i < recipes.length; i++){
            const url_id = await get_url_id(recipes[i]);
            const data = { "url_id": url_id };
            const updated_record = await pb.collection('recipes').update(recipes[i].id, data);
        }

            
    }

    const get_url_id = async function (recipe){
        let url_id = recipe.title.trim();
        url_id = url_id.replaceAll(" ", "_");
        let new_url_id = "";
        try {
            new_url_id = url_id;
            let same_url_id = await pb.collection('recipes').getFirstListItem(`url_id="${new_url_id}"`);
            let cnt = 1;
            while (true){
                new_url_id = url_id+`_${cnt}`;
                same_url_id = await pb.collection('recipes').getFirstListItem(`url_id="${new_url_id}"`);
                cnt++;
            }
        } catch (e){
            return new_url_id;
        }
    }

    const time_to_minutes = async function (){
        return;
        const recipes = await pb.collection('recipes').getFullList({sort: `-created`});
        for (let i = 0; i < recipes.length; i++){
            let mins = 0;
            let min_result = recipes[i].time.match(/(\d+) [mins|minutes]/);
            if (min_result){
                mins += parseInt(min_result[1]);
            }

            let hr_result = recipes[i].time.match(/(\d+) [hrs|hours|hour|hr]/);
            if (hr_result){
                mins += parseInt(hr_result[1]) * 60;
            }
            const data = { "time_new": mins };
            const updated_record = await pb.collection('recipes').update(recipes[i].id, data);
            results.push(updated_record.title+" "+updated_record.time+" "+updated_record.time_new);
            results = results;
        }
    }

    const fill_ingr_num = async function (){
        return;
        const recipes = await pb.collection('recipes').getFullList({sort: `-created`});
        for (let i = 0; i < recipes.length; i++){

            const data = { "ingr_num": recipes[i].ingr_list.length };
            
            const updated_record = await pb.collection('recipes').update(recipes[i].id, data);
            console.log(updated_record);
            results.push(recipes[i].ingr_list.length);
            results = results;
        }
    }

    const compare_ingr_recipes = async function (){
        const recipes = await pb.collection('recipes').getFullList({expand: 'ingr_list'});
        console.log(recipes);
        for (let i = 0; i < recipes.length; i++){
            let recipe_id = recipes[i].id;
            for (let j = 0; j < recipes[i].ingr_list.length; j++){
                let ingr = recipes[i].ingr_list[j];
                const update_result = await pb.collection('ingredients').update(ingr, {recipe_id: `+${recipe_id}`});
                console.log(ingr == update_result.id, recipe_id == update_result.recipe);
                if (ingr == update_result.id && recipe_id == update_result.recipe) {
                    passed++;
                } else {
                    failed++;
                }
                // console.log(`Ingredient ${ingr} linked to recipe ${recipe_id}`);
            }
        }
    }

    const migrate_recipes = async function(){
        const recipes = await pb.collection('recipes').getFullList({expand: 'ingr_list'});
        console.log("recipes in", recipes.length, {recipes});
        for (let i = 0; i < recipes.length; i++){
            // const recipe_was_uploaded = await pb.collection('recipes_strict').getFirstListItem(`title="${recipes[i].title}" && author="${recipes[i].author}"`);
            // if (recipe_was_uploaded.items && recipe_was_uploaded.items.length > 0){
            //     console.log("recipe was uploaded");
            //     continue;
            // }
            const data = {
                "title": recipes[i].title,
                "description": recipes[i].description,
                "original_web_page": recipes[i].url,
                "author": recipes[i].author,
                "time_in_min": recipes[i].time_new,
                "directions": recipes[i].directions,
                "user": recipes[i].user,
                "main_image": recipes[i].image,
                "servings": recipes[i].servings_new,
                "cuisine_country": (recipes[i].cuisine) ? recipes[i].cuisine : (recipes[i].country) ? recipes[i].country : "",
                "url_id": recipes[i].url_id,
                "made": recipes[i].made,
                "favorite": recipes[i].favorite,
                "active": true
            };
            console.log('recipes_strict', i, recipes.length, data)
            const new_strict_recipe = await pb.collection('recipes_strict').create(data);
            if (new_strict_recipe.code > 200){
                console.log("error uploading recipe");
            } else {
                let ingr_ids = [];
                for (let j = 0; j < recipes[i].expand.ingr_list.length; j++){
                    const ingr = recipes[i].expand.ingr_list[j];
                    if (ingr.ingredient == ""){
                        continue;
                    }
                    const ingr_data = {
                        "name": ingr.ingredient,
                        "qty": validate_number(ingr.quantity),
                        "unit": ingr.unit,
                        "active": true,
                        "recipe": new_strict_recipe.id
                    };
                    console.log('ingredients_strict', j, recipes[i].expand.ingr_list.length, ingr_data)
                    const new_ingr = await pb.collection('ingredients_strict').create(ingr_data);
                    if (new_ingr.code > 200){
                        console.log("error uploading ingr");
                    } else {
                        ingr_ids.push(new_ingr.id);
                    }
                }

                if (ingr_ids.length > 0){
                    const ingr_id_data = {
                        "ingr_list": ingr_ids
                    };
                    console.log({ingr_id_data})
                    const updated_ingr_ids_in_recipe = await pb.collection('recipes_strict').update(new_strict_recipe.id, ingr_id_data);
                    console.log(updated_ingr_ids_in_recipe);
                }
            }
        }
    }

    const migrate_menus = async function(e){
        const menus = await pb.collection('menus').getFullList({
            sort: '-created',
        });
        e.srcElement.textContent = `Migrating... 0%`;
        for (let i = 0; i < menus.length; i++){
            let recipe_id_match = {};
            let recipe_ids = [];
            for (let j = 0; j < menus[i].recipes.length; j++){
                console.log()
                let recipe_match = await get_new_recipe(menus[i].recipes[j]);
                recipe_id_match[menus[i].recipes[j]] = recipe_match;
                recipe_ids.push(recipe_match.id)
            }

            const servings = build_servings(menus[i].servings, recipe_id_match);
            
            let made = {};
            for (let j = 0; j < recipe_ids.length; j++){
                made[recipe_ids[j]] = false;
            }

            const sub_recipes = await build_sub_recipes(menus[i].sub_recipes, recipe_id_match);

            const grocery_list = await build_grocery_list(recipe_id_match);


            const new_menu_data = {
                "title": menus[i].title,
                "owner": menus[i].user,
                "shared_users": [],
                "active": true,
                "todays_menu": menus[i].today,
                "servings": servings,
                "description": menus[i].description,
                "notes": {},
                "grocery_list": grocery_list,
                "made": made,
                "sub_recipes": sub_recipes,
                "recipes": recipe_ids
            };
            console.log('menus_strict', i, menus.length, new_menu_data)
            const new_menu = await pb.collection('menus_strict').create(new_menu_data);

            const groc_list_check = await pb.collection('grocery_lists').getOne(grocery_list, {});

            const menu_check = await pb.collection('menus_strict').getOne(new_menu.id, {});

            const updated_menu = await pb.collection('grocery_lists').update(grocery_list, {
                "menu": new_menu.id
            });
            e.srcElement.textContent = `Migrating... ${Math.floor(((i+1)/menus.length)*100)}%`;
        }
        e.srcElement.textContent = `Done Migrating`;
    }

    const build_sub_recipes = async function(in_sub_recipes, match){
        let out_sub_recipes = [];
        for (let key in in_sub_recipes){

            if (!in_sub_recipes[key].ingr_id || !in_sub_recipes[key].recipe_id){
                continue;
            }

            const new_ingr = get_new_ingredient(in_sub_recipes[key].ingr_id);
            const sub_recipe_data = {
                "ingr": new_ingr.id,
                "active": true,
                "parent": match[key].id,
                "recipe": match[in_sub_recipes[key].recipe_id].id
            };
            console.log('sub_recipes', sub_recipe_data);
            const record = await pb.collection('sub_recipes').create(sub_recipe_data);
            out_sub_recipes.push(record.id);
        }
        return out_sub_recipes;
    }

    const build_grocery_list = async function(recipes_in){
        // compile list of ingredients
        let grocery_items = [];
        let output = "";
        for (let key in recipes_in){
            for (let j = 0; j < recipes_in[key].expand.ingr_list.length; j++){
                const ingr = recipes_in[key].expand.ingr_list[j];
                if (ingr.name == ""){
                    continue;
                }
                const ingr_data = {
                    "qty": validate_number(ingr.qty),
                    "unit": ingr.unit,
                    "unit_plural": ingr.unit_plural,
                    "name": ingr.name,
                    "checked": false,
                    "ingrs": [
                        ingr.id
                    ],
                    "active": true
                };
                console.log('grocery_items', ingr_data)
                const record = await pb.collection('grocery_items').create(ingr_data);
                grocery_items.push(record.id);
            }
        }
        const data = {
            "items": grocery_items,
            "active": true
        };
        console.log('grocery_lists', data)
        const list_record = await pb.collection('grocery_lists').create(data);
        output = list_record.id;
        return output;
    }

    const validate_number = function(in_val){
        if (typeof in_val == "float" || typeof in_val == "int" || typeof in_val == "double"){
            return in_val;
        }
        return parseFloat(in_val);
    }

    const build_servings = function(in_serv, match){
        let out_serv = {};
        for (let key in in_serv){
            if (!match[key]){
                continue;
            }
            out_serv[match[key].id] = in_serv[key];
        }
        return out_serv;
    }

    const get_new_recipe = async function(in_id){
        const old_recipe = await pb.collection('recipes').getOne(in_id, {
        });
        const new_recipe = await pb.collection('recipes_strict').getList(1, 50, {
            filter: `title = "${old_recipe.title}"`,
            expand: `ingr_list`
        });
        if (new_recipe.items.length == 1){
            return new_recipe.items[0];
        }else if (!new_recipe.items.length){
            console.log(`no recipe match found for ${old_recipe.title}`);
        } else {
            // more than one with this title
            console.log({new_recipe});
        }
    }

    const get_new_ingredient = async function(in_id){
        const old_ingr = await pb.collection('recipes').getOne(in_id, {
        });

        const new_ingr = await pb.collection('recipes_strict').getList(1, 50, {
            filter: `name = "${old_ingr.ingredient}" && unit = "${old_ingr.unit}" && qty = ${old_ingr.quantity}`,
        });
        if (new_ingr.items.length == 1){
            return new_ingr.items[0];
        }else if (!new_ingr.length){
            console.log(`no recipe match found for ${old_ingr.ingredient}`);
        } else {
            // more than one with this title
            console.log({new_ingr});
        }
    }

    // const migrate_menus = async function(){
    //     const menus = await pb.collection('menus').getFullList({expand: 'grocery_list, recipes, recipes.ingr_list'});
    //     console.log("menus in", menus.length, {menus});
    //     for (let i = 0; i < menus.length; i++){
    //         let made = {};
    //         console.log(menus[i].made);
    //         if (menus[i].made){
    //             made = menus.made;
    //         } else {
    //             let filter = "";
    //             for (let j = 0; j < menus[i].expand.recipes.length; j++){
    //                 if (filter != "") {
    //                     filter += " || ";
    //                 }
    //                 if (menus[i].expand.recipes[j].title) {
    //                     filter += `title="${menus[i].expand.recipes[j].title}"`;
    //                 }
    //             }
    //             const strict_recipes = await pb.collection('recipes_strict').getFirstListItem(filter);
    //             made[`${strict_recipes.id}`] = false;
    //         }
    //         console.log({made});
    //         const data = {
    //             "title": menus[i].title ? menus[i].title : "new menu",
    //             "owner": menus[i].user,
    //             "shared_users": [],
    //             "active": true,
    //             "todays_menu": menus[i].today,
    //             "servings": menus[i].servings,
    //             "description": menus[i].description,
    //             "notes": menus[i].notes,
    //             "made": made,
    //         };
    //         console.log({new_strict_menu})
    //         const new_strict_menu = await pb.collection('menus_strict').create(data);
    //         if (new_strict_menu.code > 200){
    //             console.log("error uploading recipe");
    //         } else {
    //             let ingr_ids = [];
    //             for (let k = 0; k < menus[i].expand.recipes; k++)
    //             for (let j = 0; j < recipes[i].expand.ingr_list.length; j++){
    //                 const ingr = recipes[i].expand.ingr_list[j];
    //                 if (ingr.ingredient == ""){
    //                     continue;
    //                 }
    //                 const ingr_data = {
    //                     "name": ingr.ingredient,
    //                     "qty": ingr.quantity,
    //                     "unit": ingr.unit,
    //                     "active": true,
    //                     "recipe": new_strict_menu.id
    //                 };
    //                 console.log({ingr_data})
    //                 const new_ingr = await pb.collection('ingredients_strict').create(ingr_data);
    //                 if (new_ingr.code > 200){
    //                     console.log("error uploading ingr");
    //                 } else {
    //                     ingr_ids.push(new_ingr.id);
    //                 }
    //             }

    //             if (ingr_ids.length > 0){
    //                 const ingr_id_data = {
    //                     "ingr_list": ingr_ids
    //                 };
    //                 console.log({ingr_id_data})
    //                 const updated_ingr_ids_in_recipe = await pb.collection('recipes_strict').update(new_strict_menu.id, ingr_id_data);
    //                 console.log(updated_ingr_ids_in_recipe);
    //             }
    //         }
    //     }
    // }

    const delete_table = async function (e, table) {
        
        if (confirm(`are you sure you want to delete all the records in ${table}`)){
            const records = await pb.collection(table).getFullList({
                sort: '-created',
            });
            const count = records.length;
            let percent_done = 0;
            e.srcElement.textContent = `deleting... ${percent_done}%`;
            for (let i = 0; i < records.length; i++){

                if (records[i] && records[i].id){
                    await pb.collection(table).delete(records[i].id);
                }
                if (i > 0){
                    
                    percent_done = Math.round((i / count) * 100);
                    console.log(percent_done, i, count);
                }
                e.srcElement.textContent = `deleting... ${percent_done}%`;
            }
            e.srcElement.textContent = `${table} deleted`;
            e.srcElement.disabled = true;
        }
    }

    const send_verify_email = async function() {
        await pb.collection('users').requestVerification(verify_email);
    }

    const test_merge = async function(id){
        const ingrs = await pb.collection('ingredients').getFullList();
        let list = [];
        for (let i = 0; i < ingrs.length; i++) {
            let temp_item = {...ingrs[i]};
            list.push({
                "id": ingrs[i].id,
                "qty": ingrs[i].quantity,
                "unit": ingrs[i].unit,
                "unit_plural": ingrs[i].unit_plural,
                "name": trim_verbs(ingrs[i].ingredient),
                "checked": false,
                "ingrs": [ingrs[i].id],
                "active": true,
                "matches": [ingrs[i]]
            });
        }
        grocery_list_test = groupBySimilarity(merge(list).sort(sort_by_matches)).sort(sort_by_matches);
    } 

    const sort_by_matches = function(a, b){
        return b.ingrs.length - a.ingrs.length;
    }
</script>







<div>
    {#if is_auth_user}
        <div class="flex flex-auto flex-wrap justify-around items-center space-y-96 md:space-y-12 pt-36 pb-16 md:pt-0 md:pb-0 h-full">
                <!-- <button id="compare_parsers_btn" class="btn btn-primary w-56" on:click={update_recipe_url_ids} disabled>
                    update url_ids
                </button> -->

                <!-- <button id="compare_parsers_btn" class="btn btn-primary w-56" on:click={time_to_minutes}>
                    time to minutes
                </button> -->

                <!-- <button id="compare_parsers_btn" class="btn btn-primary w-56" on:click={fill_ingr_num}>
                    fill ingr_num
                </button> -->

                <button id="compare_parsers_btn" class="btn btn-primary w-56" on:click={migrate_recipes}>
                    migrate recipes
                </button>

                <button id="compare_parsers_btn" class="btn btn-primary w-56" on:click={migrate_menus}>
                    migrate menus
                </button>
                {#each tables as table}
                    <button id="compare_parsers_btn" class="btn btn-xs btn-error" on:click={(e) => {delete_table(e, table)}}>
                        {table}
                    </button>
                {/each}
                <div>
                    {#each results as curr}
                        <p>{curr}</p>
                    {/each}
                </div>
                <div>
                    passed: {passed}
                </div>
                <div>
                    failed: {failed}
                </div>
        </div>
        <div class="my-10 mx-5 flex">
            <form on:submit|preventDefault={send_verify_email} class="border rounded-lg p-5">
                <input placeholder="email" name="email" type="text" bind:value={verify_email} class="input input-bordered input-xs w-56 text-center input-accent"/>
                <button type="submit" class="btn btn-primary">send verification email</button>
            </form>
            <div class="flex flex-col justify-center items-center space-y-10 m-auto">
                <div class="btn btn-primary btn-sm" on:click={update_cuis} on:keydown={update_cuis}>update cuisines</div>
                {#each unset_cuis as cuis}
                    <div class="flex justify-center items-center space-x-5">
                        <p>{cuis.title}</p>
                        <!-- <input placeholder="category" name="category" type="text" bind:value={cuis.category} class="input input-bordered input-xs w-56 text-center input-accent"/> -->
                        <div class="dropdown w-1/2 flex">
                            <input type="text" id="cuisine" placeholder="cuisine" tabindex="0" class="input input-bordered input-xs m-1 cursor-text w-full" bind:value={cuis.cuisine}/>
                            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box mt-8">
                                <div class="flex flex-col max-w-52 max-h-[50svh] overflow-y-scroll">
                                    {#each cuisines as cuisine}
                                        <li class="cursor-pointer" on:click={()=>{cuis.cuisine = cuisine.id; document.activeElement.blur();}}>{cuisine.id}</li>
                                    {/each}
                                </div>
                            </ul>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        <div>
            <div class="flex m-10 flex-col p-10 border rounded-lg">
                <div class="btn btn-primary btn-sm" on:click={test_merge} on:keydown={test_merge}>test merge</div>
                <div class="flex flex-col">
                    <!-- <div class="text text-sm bg-error text-black px-2 m-2">qty:4 | unit:cup | name:all-purpose flour</div> -->
                    {#each grocery_list_test as curr}
                    <div class="flex my-1 rounded-lg justify-center items-center{curr.ingrs.length > 1 ? " bg-info text-black" : ""}">
                        <div class="text text-sm px-2 m-2{isNaN(curr.qty) ? " bg-error text-black" : ""}">qty:{curr.qty} | unit:{curr.unit} | name:{curr.name}</div>
                        <div class="flex flex-col">
                            {#if curr.ingrs.length > 1}
                                {#each curr.expand.ingrs as match}
                                    <div class="text text-sm px-2 m-2{isNaN(match.qty) ? " bg-error text-black" : ""}">qty:{match.qty} | unit:{match.unit} | name:{match.name}</div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>