<script>
    import { onMount, afterUpdate } from 'svelte';
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import GroceryList from "/src/lib/components/grocery_list.svelte";
    import { page } from '$app/stores';
    import { get_grocery_list, groupBySimilarity } from '/src/lib/merge_ingredients.js'
    import { update_grocery_list, create_grocery_list, update_made, log_made } from '/src/lib/groceries.js'
    import Heart from "/src/lib/icons/Heart.svelte";
    import SubTask from "/src/lib/icons/subtask.svelte";
    import { update_fave } from '/src/lib/save_recipe.js';


    let todays_menu = {};
    let grocery_list = [];
    let grocery_list_id = "";
    let grocery_list_status = "saved";
    let mode = "menu";
    $: loading = true;
    let delay_timer;
    let update_fave_list = [];
    let tab = "recipe_list";
    let sub_recipe_ids = [];
    $: recipes_ready = [];


    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        const result_list = await pb.collection('menus').getList(1, 1, {
            filter: `user="${$currentUser.id}" && today=True`,
            expand: `recipes,recipes.notes,recipes.ingr_list, grocery_list`
        });
        if (result_list.items[0]){
            todays_menu = result_list.items[0];
            for (let i in todays_menu.sub_recipes){
               for (let j in todays_menu.sub_recipes[i]){
                   if (todays_menu.sub_recipes[i][j].recipe_id && !sub_recipe_ids.includes(todays_menu.sub_recipes[i][j].recipe_id)) sub_recipe_ids.push(todays_menu.sub_recipes[i][j].recipe_id);
               }  
            }
            sub_recipe_ids = sub_recipe_ids;

            todays_menu.expand.recipes = todays_menu.expand.recipes.sort(sort_by_made);
            if (!todays_menu.expand.grocery_list || !todays_menu.expand.grocery_list.list){
                grocery_list = get_grocery_list(todays_menu, todays_menu.servings, todays_menu.sub_recipes);
                grocery_list_id = create_grocery_list(grocery_list, todays_menu.id);
            } else {
                grocery_list = groupBySimilarity(todays_menu.expand.grocery_list.list);
                grocery_list_id = todays_menu.expand.grocery_list.id;
            }
            let checked = [];
            let unchecked = [];
            for (let i = 0; i < grocery_list.length; i++){
                if (grocery_list[i].checked){
                    checked.push(grocery_list[i]);
                } else {
                    unchecked.push(grocery_list[i]);
                }
            }
            grocery_list = unchecked.concat(checked);
            console.log("recipes", todays_menu.expand.recipes);
            console.log("todays_menu.made", todays_menu.made);
            for (let i = 0; i < todays_menu.expand.recipes.length; i++){
                if (!todays_menu.made){
                    todays_menu.made = {};
                }
                if (!todays_menu.made[todays_menu.expand.recipes[i].id]){
                    todays_menu.made[todays_menu.expand.recipes[i].id] = false;
                }
            }
            console.log("todays_menu.made2", todays_menu.made);
        }
        loading = false;
    });

    afterUpdate(() => {
        if (todays_menu.expand) update_recipes_ready();
        console.log(recipes_ready);
    });

    function update_recipes_ready(){
        recipes_ready = [];
        for (let recipe of todays_menu.expand.recipes) {
                if (!sub_recipe_ids.includes(recipe.id)) {
                    // get current recipes sub recipe ids 
                    let curr_sub_recipes = [];
                    if (todays_menu.sub_recipes){
                        for (let j = 0; j < todays_menu.sub_recipes[recipe.id].length; j++) {
                            curr_sub_recipes.push(todays_menu.sub_recipes[recipe.id][j].recipe_id);
                        }
                        curr_sub_recipes = curr_sub_recipes;
                    }
                    let is_ready = true;
                    for (let i in todays_menu.made){
                        if (curr_sub_recipes.includes(i) && !todays_menu.made[i]) {
                            is_ready = false;
                            break;
                        }
                    }
                    if (is_ready) {
                        recipes_ready.push(recipe.id);
                    }
                }
            }
            recipes_ready = recipes_ready;
    }

    function sort_by_made(a, b){
        if (a.made == b.made){
            return 0;
        }else {
            return a.made ? 1 : -1;
        }
    }

    async function update_groceries(e){
        grocery_list_status = "updating";
        await update_grocery_list(e.detail.grocery_list, grocery_list_id);
        grocery_list = e.detail.grocery_list;
        grocery_list_status = "saved";
    }

    async function reset_list(){
        grocery_list = get_grocery_list(todays_menu, todays_menu.servings, todays_menu.sub_recipes);
        await update_grocery_list(grocery_list, grocery_list_id);
    }

    async function toggle_made(e){
        const id = e.srcElement.id;
        if (todays_menu.made){
            todays_menu.made[id] = !todays_menu.made[id];
        } else {
            todays_menu.made = {};
            todays_menu.made[id] = true;
        }
        if (todays_menu.made[id]) log_made(id, $currentUser.id);
        update_made(todays_menu.made, todays_menu.id);
    }

    function update_fave_queue(e){
        update_fave_list.push(e.srcElement.id);
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            let id_update_list = [];
            for (let i = 0; i < todays_menu.expand.recipes.length; i++){
                if (update_fave_list.includes(todays_menu.expand.recipes[i].id)){
                    id_update_list.push({id: todays_menu.expand.recipes[i].id, favorite: todays_menu.expand.recipes[i].favorite});
                }
            }
            await update_fave(id_update_list);
            update_fave_list = [];

        }, 2000);
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
</script>

    <div id="main">
        <div class="flex justify-center pb-1">
            <h1 class="text-xl h-6">{todays_menu.title ? todays_menu.title : ""}</h1>
        </div>
        <div id="content" class="flex flex-col md:flex-row md:space-x-3 md:mx-2">
            <div id="left_column" class="{tab == "recipe_list" ? "" : "hidden"}  md:w-1/2">
                <div id="recipes" class="h-[77vh] md:h-[calc(100svh-75px)] overflow-y-auto border border-primary rounded-md md:border-none">
                    {#if todays_menu.expand}
                        {#each todays_menu.expand.recipes as curr, i}
                            {#if !sub_recipe_ids.includes(curr.id)}
                                {#if todays_menu.sub_recipes}
                                    {#each todays_menu.sub_recipes[curr.id] as sub_recipe}
                                        {#each todays_menu.expand.recipes as curr_sub_recipe, i}
                                            {#if curr_sub_recipe.id === sub_recipe.recipe_id}
                                                <div class="flex justify-around items-center w-full">
                                                    <SubTask/>
                                                    <div class="card card-bordered sm:card-side {(todays_menu.made && todays_menu.made[curr_sub_recipe.id]) ? "bg-base-300" : "bg-base-200"} shadow-xl max-h-24 my-1.5 mx-1 w-4/5" on:click={window.location = `/cook_recipe/${curr_sub_recipe.url_id}/${todays_menu.servings[curr_sub_recipe.id]}`} on:keydown={window.location = `/cook_recipe/${curr_sub_recipe.url_id}/${todays_menu.servings[curr_sub_recipe.id]}`}>
                                                        <figure class="md:w-3/5 {(todays_menu.made && todays_menu.made[curr_sub_recipe.id]) ? "blur-sm" : ""}"><img src={curr_sub_recipe.image} alt={curr_sub_recipe.title}/></figure>
                                                        <div class="card-body max-h-full flex flex-row p-2 items-center w-full">
                                                            <p id={i} class="w-1/2 text-xs">{curr_sub_recipe.title}</p>
                                                            <div class="card-actions flex flex-row justify-evenly items-center">
                                                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={curr_sub_recipe.id} bind:checked={todays_menu.made[curr_sub_recipe.id]} on:click|stopPropagation={toggle_made}>
                                                                <button id={curr_sub_recipe.id} class="btn btn-xs md:btn-sm p-1 favorite" on:click|stopPropagation={(e)=>{curr_sub_recipe.favorite = !curr_sub_recipe.favorite; update_fave_queue(e);}}><Heart color={(curr_sub_recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    {/each}
                                {/if}
                                <div class="card card-bordered sm:card-side bg-base-200 shadow-xl max-h-24 my-1.5 mx-1 cursor-pointer" on:click={ recipes_ready.includes(curr.id) ? window.location = `/cook_recipe/${curr.url_id}/${todays_menu.servings[curr.id]}` : ""} on:keydown={window.location = `/cook_recipe/${curr.url_id}/${todays_menu.servings[curr.id]}`}>
                                    <figure class="md:w-3/5 "><img src={curr.image} alt={curr.title}/></figure>
                                    <div class="card-body max-h-full flex flex-row p-2 items-center w-full">
                                        <p id={i} class="w-1/2 text-xs">{curr.title}</p>
                                        <div class="card-actions flex flex-row justify-evenly items-center">
                                                {#if recipes_ready.includes(curr.id)}
                                                    <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={curr.id} bind:checked={todays_menu.made[curr.id]} on:click|stopPropagation={toggle_made}>
                                                {:else}
                                                    not ready
                                                {/if}
                                            <button id={curr.id} class="btn btn-xs p-1 favorite flex content-center" on:click|stopPropagation={(e)=>{curr.favorite = !curr.favorite; update_fave_queue(e);}}><Heart color={(curr.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {:else}
                        <div id="menu_loading" class="w-full flex justify-center content-center h-full">
                            <span class="loading loading-bars loading-lg"></span>
                        </div>
                    {/if}
                </div>
            </div>
            <div id="right_column" class="{tab == "grocery_list" ? "" : "hidden"} md:flex md:w-1/2 ml-1 mr-2">
                {#if todays_menu && mode == "menu"}
                    <GroceryList bind:grocery_list={grocery_list} on:update_grocery_list={update_groceries} bind:status={grocery_list_status}  on:reset_grocery_list={reset_list}/>
                {:else}
                    <h2>select recipes to add to your menu</h2>
                {/if}
            </div>
        </div>
        <div class="tabs tabs-boxed w-fit mx-auto flex items-center bg-base-300 md:bg-base-200 md:hidden my-1">
            <a id="recipe_list" class="tab tab-active tab-xs" on:click={switch_tab}>Recipes</a> 
            <a id="grocery_list" class="tab tab-xs" on:click={switch_tab}>Grocery List</a>
        </div>
    </div>