<script>
    import { afterUpdate, onMount } from 'svelte';
    import GroceryList from "/src/lib/components/grocery_list.svelte";
    import { currentUser, pb } from '/src/lib/pocketbase';
    import { page } from '$app/stores';
    import { get_grocery_list } from '/src/lib/merge_ingredients.js';
    import { get_servings, get_total_time } from '/src/lib/recipe_util.js';
    import { createEventDispatcher } from 'svelte';
    import Plus from "/src/lib/icons/Plus.svelte";



    export let menu;
    export let id = null;
    export let mults;
    export let sub_recipes;
    let tab = "recipe_list";
    let grocery_list = [];
    let num_servings = 0;
    let total_time = 0;
    const dispatch = createEventDispatcher();
    let overflow_len = ``;
    let basic_words = ['and', 'the', 'of', 'with', 'recipe'];
    let delay_timer;

    onMount(async () => {
        overflow_len = ($page.url.pathname == "/menu") ? `max-h-[60vh]` : `max-h-[60vh]`;
    });

    afterUpdate(() => {
        clearTimeout(delay_timer);
        grocery_list = [];

        if (!menu.length){
            if (document.getElementById('save_btn')) document.getElementById('save_btn').disabled = true;
            return;
        } else {
            if (document.getElementById('save_btn')) document.getElementById('save_btn').disabled = false;
        }
        grocery_list = get_grocery_list(menu, mults, sub_recipes);

        total_time = get_total_time(menu);

        update_sub_recipes();

        num_servings = get_servings(menu, sub_recipes, mults);

        if (!menu.title || menu.title == "New Menu"){
            menu.title = "New Menu";
            if (menu.length > 1) menu.title = generate_menu_title();
        }
        
    });

    function update_sub_recipes(){
        if (!sub_recipes){
            //create sub_recipes object
            sub_recipes = {};
            for (let i = 0; i < menu.length; i++){
                if (!sub_recipes[menu[i].id]){
                    sub_recipes[menu[i].id] = [];
                    sub_recipes[menu[i].id].push({ingr_id: null, recipe_id: null});
                }
            }
        } else {
            // add new sub_recipe instance if needed
            for (let key in sub_recipes){
                let found_unset_sub_recipe = false;
                for (let j = 0; j < sub_recipes[key].length; j++){
                    if (sub_recipes[key][j].ingr_id === null || sub_recipes[key][j].recipe_id === null){
                        found_unset_sub_recipe = true;
                        break;
                    }
                }
                if (!found_unset_sub_recipe && Object.keys(sub_recipes).length - 1 > sub_recipes[key].length) {
                    sub_recipes[key].push({ingr_id: null, recipe_id: null});
                }
            }
        }

        // add new instance for each recipe added to a menu
        for (let i = 0; i < menu.length; i++){
            if (!(menu[i].id in sub_recipes)){
                sub_recipes[menu[i].id] = [];
                sub_recipes[menu[i].id].push({ingr_id: null, recipe_id: null});
            }
        }

        // set sub_recipe values in each recipe object, data for sub_recipes, is_sub_recipe flag
        for (let i = 0; i < menu.length; i++){
            for (let k in sub_recipes){
                for (let j = 0; j < sub_recipes[k].length; j++){
                    // add recipe data to parent recipe object
                    if (k == menu[i].id && sub_recipes[k][j].recipe_id && sub_recipes[k][j].ingr_id){
                        if (!menu[i].sub_recipe_data) menu[i].sub_recipe_data = [];
                        for (let l = 0; l < menu.length; l++){
                            if (menu[l].id == sub_recipes[k][j].recipe_id){
                                if (!menu[i].sub_recipe_data.includes(menu[l])){
                                    menu[i].sub_recipe_data.push(menu[l]);
                                }
                            }
                        }
                    }
                    //set an is_sub_recipe flag for each recipe
                    for (let l = 0; l < sub_recipes[k].length; l++){
                        if (sub_recipes[k][l].recipe_id == menu[i].id){
                            menu[i].is_sub_recipe = true;
                        }
                    }
                }
            }
        }
    }

    function generate_menu_title(){
        let output = "";
        for(let i = 0; i < menu.length; i++){
            let temp_recipe_title = menu[i].title.replace(/ *\([^)]*\) */g, "");
            let temp_recipe_title_array = temp_recipe_title.split(' ');
            let temp_recipe_length = temp_recipe_title_array.length;
            let menu_section_length = Math.ceil(temp_recipe_length/menu.length);
            for (let j = i; j < i+menu_section_length; j++){
                if (output != "") output = output + " ";
                if (output && basic_words.includes(output.split(' ')[output.length-2])){
                    for (let k = j; k < 50; k++){
                        if (!basic_words.includes(temp_recipe_title_array[k%temp_recipe_title_array.length])){
                            output = output + " " + temp_recipe_title_array[k%temp_recipe_title_array.length];
                            break;
                        }
                    }
                }else {
                    output = output + temp_recipe_title_array[j%temp_recipe_title_array.length];
                }
            }
        }
        return output;
    }

    function switch_tab(e){
        let siblings = e.srcElement.parentNode.children;
        for (let curr of siblings){
            if (curr != e.srcElement && curr.classList.contains("tab-active")) {
                curr.classList.remove("tab-active");
            }
        }
        e.srcElement.classList.add("tab-active");
        tab = e.srcElement.id;
    }

    async function save_menu(e){
        e.srcElement.innerHTML = '<span class="loading loading-dots loading-md mx-7"></span>';
        let recipe_ids = [];
        let made = {};
        for (let i = 0; i < menu.length; i++){
            recipe_ids.push(menu[i].id);
            made[menu[i].id] = 0;
        }
        const data = {
            "recipes": recipe_ids,
            "user": $currentUser.id,
            "today": false,
            "title": menu.title,
            "servings": mults,
            "made": made,
            "sub_recipes": sub_recipes
        };
        const record = await pb.collection('menus').create(data);
        id = record.id;
        e.srcElement.innerHTML = 'save menu';
        e.srcElement.disabled = true;
    }
    
    async function set_todays_menu(e){
        const resultList = await pb.collection('menus').getList(1, 1, {
            filter: `user = '${$currentUser.id}' && today = True`,
            expand: `grocery_list`
        });
        if (resultList.items.length){
            const false_record = await pb.collection('menus').update(resultList.items[0].id, { "today": false, grocery_list: null });
            if (resultList.items[0].grocery_list){
                const grocery_list_id = resultList.items[0].grocery_list;
                const grocery_list_record = await pb.collection('groceries').update(grocery_list_id, { "menu": null, active: false });
            }
        }
        const true_record = await pb.collection('menus').update(id, { "made": null, "grocer_list":null, "today": true });
        window.location.href = "/today";
    }

    function close_modal(){
        dispatch('close_modal');
    }

    function update_mult(e){
        dispatch('update_mult', {id: e.srcElement.id, mult: e.srcElement.value});
    }

    function show_subrecipe_selector(e){
        e.currentTarget.classList.add("hidden");
        e.currentTarget.nextElementSibling.classList.remove("hidden");
    }

</script>

<div id="menu" class="h-3/4 md:h-full w-full cursor-default">
    <div class="flex items-center p-3 justify-between">
        <input type="text" class="input input-bordered border-primary input-xs w-2/3" bind:value={menu.title}/>
        {#if $page.url.pathname == "/menu"}
            <button class="btn btn-secondary self-end btn-xs md:btn-sm" id="save_btn" on:click={save_menu}>save menu</button>
        {:else if $page.url.pathname == "/my_menus"}
            <button class="btn btn-secondary self-end btn-xs md:btn-sm" id="today_btn" on:click={set_todays_menu}>set today</button>
        {/if}
    </div>
    <div class="flex content-center">
        <div class="tabs tabs-boxed w-fit mx-auto flex items-center bg-base-300 md:bg-base-200">
            <a id="recipe_list" class="tab tab-active tab-xs" on:click={switch_tab}>Recipes</a> 
            <a id="grocery_list" class="tab tab-xs" on:click={switch_tab}>Grocery List</a>
        </div>
    </div>
    <div class="flex justify-around m-1 items-center">
        <p class="text-xs">{menu.length} recipes</p>
        <p class="text-xs">{num_servings} servings</p>
        <p class="text-xs">{total_time}</p>
    </div>
    
    {#if tab == "recipe_list"}
        <div class="{overflow_len} md:max-h-[calc(100svh-160px)] overflow-y-auto border rounded-md md:border-none">
            {#if menu.length}    
                {#each menu as recipe}
                    {#if !recipe.is_sub_recipe}
                        <div class="img_serv_container card card-bordered card-side flex flex-row w-auto items-center my-3.5 mx-3 shadow-xl bg-base-300 md:bg-base-200">
                            <figure class="image w-1/3 h-full">
                                <img class="h-full" src={recipe.image} alt={recipe.title}/>
                            </figure>
                            <div class="servings_time_container flex flex-col w-2/3 ml-2.5 space-y-1 mb-2">
                                <p class="title text-xs bold md:text-xl">{recipe.title}</p>
                                <p class="time text-xs">{recipe.time}</p>
                                <div class="servings_container text-xs">
                                    servings:<input type="text" class="servings input input-bordered input-xs px-1 mr-1 w-8" 
                                                id={recipe.id} bind:value={mults[recipe.id]} 
                                                on:input={update_mult}>
                                </div>
                                <p class="description text-xs">{recipe.description}</p>
                                {#if sub_recipes && sub_recipes[recipe.id] && $page.url.pathname == "/menu"}
                                    <div class="flex flex-col space-y-2">
                                        {#each sub_recipes[recipe.id] as curr}
                                            <div class="btn btn-xs btn-primary px-0 w-6 h-fit" on:click={show_subrecipe_selector}><Plus/></div>
                                            <div class="hidden flex flex-row items-center space-x-1 w-full">
                                                <select bind:value={curr.ingr_id} class="flex select select-xs w-20">
                                                    <option value={null}>ingredient</option>
                                                    {#each recipe.expand.ingr_list as item}
                                                        
                                                        <option class="" value={item.id}>{item.ingredient}</option>
                                                    {/each}
                                                </select>
                                                <div class="text-xs">to swap for a</div>
                                                <select bind:value={curr.recipe_id} class="flex select select-xs w-20">
                                                    <option value={null}>recipe</option>
                                                    {#each menu as recipe_swap}
                                                        {#if recipe.id != recipe_swap.id}
                                                            <option value={recipe_swap.id}>{recipe_swap.title}</option>
                                                        {/if}
                                                    {/each}
                                                </select>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>  
                        {#if recipe.sub_recipe_data}
                            <div class="collapse bg-base-200 my-3.5 mx-5 w-auto">
                                <input type="checkbox" /> 
                                <div class="collapse-title text-xs md:text-base flex items-center">
                                    show sub recipes
                                </div>
                                <div class="collapse-content"> 
                                    {#each recipe.sub_recipe_data as sub_recipe}
                                        <div class="img_serv_container card card-bordered card-side flex flex-row w-auto items-center bg-base-300 md:bg-base-200">
                                            <figure class="image w-1/4 h-full">
                                                <img class="h-full" src={sub_recipe.image} alt={sub_recipe.title}/>
                                            </figure>
                                            <div class="servings_time_container w-2/3 ml-2.5">
                                                <p class="title text-xs bold md:text-xl">{sub_recipe.title}</p>
                                                <p class="time text-xs">{sub_recipe.time}</p>
                                                <p class="description text-xs overflow-hidden">{sub_recipe.description}</p>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/if}
                {/each}
            {/if}
        </div>
    {:else if tab == "grocery_list"}
        <GroceryList status="none" {grocery_list}/>
    {/if}
</div>