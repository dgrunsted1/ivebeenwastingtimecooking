<script>
    import { page } from '$app/stores';
    import { onDestroy, onMount } from 'svelte';
    import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
    import GroceryList from "/src/lib/components/grocery_list.svelte";
    import { get_grocery_list, groupBySimilarity } from '/src/lib/merge_ingredients.js'
    import { create_grocery_list, update_made, log_made, check_grocery_item, update_grocery_item } from '/src/lib/groceries.js'
    import { update_fave } from '/src/lib/save_recipe.js';
    import RecipeCard from "/src/lib/components/recipe_card.svelte";
    import Alerts from "/src/lib/components/alerts.svelte";
    import NoteCard from "/src/lib/components/note_card.svelte";
    import Plus from "/src/lib/icons/Plus.svelte";
    import RecipeList from "/src/lib/components/recipe_list.svelte";

    let todays_menu = $state({});
    let grocery_list = $state([]);
    let grocery_list_id = $state("");
    let grocery_list_status = $state("saved");
    let mode = "menu";
    let loading = $state(true);
    let tab = $state("grocery_list");
    let sub_recipe_ids = $state([]);
    let recipes_ready = $state([]);
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let user_recipes = $state([]);
    
    onMount(async () => {
        await handleAuth();
        const result_list = await fetchMenuData();
        
        if (result_list.items[0]){
            await pb.realtime.connect();
            pb.realtime.subscribe(`menus/${result_list.items[0].id}`, (data) => {
                const tmp = {...data.record, expand: todays_menu.expand};
                todays_menu = tmp;
            });
            todays_menu = result_list.items[0];
            for (let i in todays_menu.sub_recipes){
               for (let j in todays_menu.sub_recipes[i]){
                   if (todays_menu.sub_recipes[i][j].recipe_id && !sub_recipe_ids.includes(todays_menu.sub_recipes[i][j].recipe_id)) sub_recipe_ids.push(todays_menu.sub_recipes[i][j].recipe_id);
               }  
            }
            sub_recipe_ids = sub_recipe_ids;

            todays_menu.expand.recipes = todays_menu.expand.recipes.sort(sort_by_made);
            if (!todays_menu.expand.grocery_list || !todays_menu.expand.grocery_list.expand.items){
                grocery_list = get_grocery_list(todays_menu, todays_menu.servings, todays_menu.sub_recipes);
                grocery_list_id = create_grocery_list(grocery_list, todays_menu.id);
            } else {
                grocery_list = groupBySimilarity(todays_menu.expand.grocery_list.expand.items);
                grocery_list_id = todays_menu.expand.grocery_list.id;
            }
            pb.realtime.subscribe(`grocery_lists/${grocery_list_id}`, (data) => {
                const curr_item_ids = grocery_list.map(item => item.id);
                const new_item_ids = grocery_list.filter(item => !curr_item_ids.includes(item.id));
                if (new_item_ids.length > 0){
                    grocery_list = grocery_list.concat(new_item_ids.map(async item_id => await pb.collection('grocery_items').getOne(item_id, {expand: `ingrs`})));
                }
            });
            let checked = [];
            let unchecked = [];
            for (let i = 0; i < grocery_list.length; i++){
                pb.realtime.subscribe(`grocery_items/${grocery_list[i].id}`, async (data) => {
                    if (data.action != "delete"){
                        const tmp = await pb.collection('ingredients').getList(1, 50, {
                            filter: `id = '${data.record.ingrs.join(`' || id='`)}'`
                        });
                        grocery_list = grocery_list.map(item => {
                            if (item.id === data.record.id) {
                                return {
                                    ...data.record,
                                    expand: {
                                        ingrs: tmp.items
                                    }
                                };
                            }
                            return item;
                        });
                    } else {
                        grocery_list = grocery_list.filter(item => item.id != data.record.id);
                    }
                });
                if (grocery_list[i].checked){
                    checked.push(grocery_list[i]);
                } else {
                    unchecked.push(grocery_list[i]);
                }
            }
            grocery_list = unchecked.concat(checked);
            for (let i = 0; i < todays_menu.expand.recipes.length; i++){
                pb.realtime.subscribe(`recipes/${todays_menu.expand.recipes[i].id}`, async (data) => {
                    todays_menu.expand.recipes[i] = {...data.record, expand: todays_menu.expand.recipes[i].expand};                   
                });
                if (!todays_menu.made){
                    todays_menu.made = {};
                }
                if (!todays_menu.made[todays_menu.expand.recipes[i].id]){
                }
            }
            if (grocery_list.reduce((count, item) => count + (item.checked ? 1 : 0),0) / grocery_list.length > 0.8) {
                tab = "recipe_list";
            }
            
        } else {
            tab = "recipe_list";
        }
        loading = false;
        get_user_recipes();
    });

    async function get_user_recipes(){
        const user_filter = ($page.params.user_name) ? `user.username='${$page.params.user_name}'` : `user='${$currentUser.id}'`;
        const result = await pb.collection('recipes').getList(1, 250, {filter: user_filter, expand:`ingr_list`});
        user_recipes = result.items;
    }
    
    async function handleAuth() {
        if ($currentUser && $page.params.user_name == $currentUser.username) {
            window.location.href = `/today`;
            return;
        }
        if (!$page.params.user_name && !$currentUser) {
            window.location.href = "/login";
            return;
        }
        if (!$page.params.user_name) {
            const result = await auth_refresh;
            if (result.error) show_error(e.message);
        }
    }

    async function fetchMenuData() {
        const filter = $page.params.user_name 
            ? `user.username='${$page.params.user_name}' && today=true`
            : `user="${$currentUser.id}" && today=True`;
            
        return await pb.collection('menus').getList(1, 1, {
            filter,
            expand: `recipes,recipes.notes,recipes.ingr_list, grocery_list, grocery_list.items, grocery_list.items.ingrs${$page.params.user_name ? ', user' : ''}`
        });
    }

    onDestroy(() => {
        if (todays_menu.id){
            pb.collection('menus').unsubscribe(todays_menu.id);
        }
    });

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }

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
        for (let i = 0; i <  grocery_list.length; i++){
            if (grocery_list[i].id == e.id){
                const item_result = await update_grocery_item(grocery_list[i]);
                break;
            }
        }
        grocery_list_status = "saved";
    }

    async function reset_list(){
        grocery_list = get_grocery_list(todays_menu, todays_menu.servings, todays_menu.sub_recipes);
        grocery_list.id = await create_grocery_list(grocery_list, todays_menu.id);
    }

    async function toggle_made(e){
        const id = e.id;
        if (todays_menu.made){
            todays_menu.made[id] = !todays_menu.made[id];
        } else {
            todays_menu.made = {};
            todays_menu.made[id] = true;
        }
        const user = ($currentUser && $currentUser.id) ? $currentUser.id : todays_menu.user;
        if (todays_menu.made[id]) log_made(id, user);
        update_made(todays_menu.made, todays_menu.id, user);
    }

    async function update_fave_queue(e){
        const id = e.id;
        let favorite_val = false;
        for (let i = 0; i < todays_menu.expand.recipes.length; i++){
            if (todays_menu.expand.recipes[i].id == id){
                todays_menu.expand.recipes[i].favorite = !todays_menu.expand.recipes[i].favorite;
                favorite_val = todays_menu.expand.recipes[i].favorite;
            }
        }
        await update_fave([{id: id, favorite: favorite_val}]);
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

    const handle_check_item = async (e) => {
        check_grocery_item(e.id, e.value);
    }

    const cook_recipe = (e) => {
        let recipe = todays_menu.expand.recipes.filter(recipe => recipe.id == e.id)[0];
        window.location = `/cook_recipe/${recipe.url_id}/${todays_menu.servings[recipe.id]}`
    }

    const add_recipe_modal = (e) => {
        my_modal_3.showModal();
    }

    const add_to_today = async (e) => {
        my_modal_3.close();
        const new_recipe = user_recipes.filter(recipe => recipe.id == e.index)[0];
        let grocery_item_ids = [];
        for (let i = 0; i < new_recipe.expand.ingr_list.length; i++){
            const result = await update_grocery_item({
                qty: new_recipe.expand.ingr_list[i].quantity,
                unit: new_recipe.expand.ingr_list[i].unit,
                name: new_recipe.expand.ingr_list[i].ingredient,
                checked: false,
                ingrs: [new_recipe.expand.ingr_list[i].id]
            });
            grocery_item_ids.push(result.id);
        }
        let tmp_servings = {...todays_menu.servings};
        tmp_servings[new_recipe.id] = new_recipe.servings;
        let tmp_made = {...todays_menu.made};
        tmp_made[new_recipe.id] = false;
        const update_menu_data = {
            "recipes+": new_recipe.id,
            "servings": tmp_servings,
            "made": tmp_made
        };
        const menu_result = await pb.collection('menus').update(todays_menu.id, update_menu_data, {expand: `recipes,recipes.notes,recipes.ingr_list, grocery_list, grocery_list.items, grocery_list.items.ingrs${$page.params.user_name ? ', user' : ''}`});
        todays_menu = menu_result;
        const update_grocery_list_data = {"items+": grocery_item_ids};
        const grocery_list_result = await pb.collection('grocery_lists').update(grocery_list_id, update_grocery_list_data, {expand: `items, items.ingrs`});
        grocery_list = grocery_list_result.expand.items;
    }
</script>

<svelte:head>
    <meta property="og:title" content={$page.params.user_name ? `${$page.params.user_name}'s Menu` : `Menu`} />
    <meta property="og:description" content={$page.params.user_name ? `${$page.params.user_name}'s current recipes and grocery list.` : `Current recipes and grocery list.`} />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/recipes" />
    <meta property="og:type" content="website" />
</svelte:head>

    <div id="main">
        <div class="flex justify-center pb-1">
            
            <h1 class="text-xl h-6 text-ellipsis overflow-hidden text-center">
                {#if $page.params.user_name && todays_menu.expand}
                    {todays_menu.expand.user.username}'s
                {/if}
                {todays_menu.title ? todays_menu.title+` Menu` : "Menu"}
            </h1>
        </div>
        <div id="content" class="flex flex-col md:flex-row md:space-x-3 md:mx-2">
            {#if todays_menu.expand || loading}
            <div id="left_column" class="{tab == "recipe_list" ? "" : "hidden md:flex"}  md:w-1/2">
                <div id="recipes" class="h-[calc(100svh-113px)] md:h-[calc(100svh-75px)] overflow-y-auto w-full space-y-2">
                    {#if todays_menu.expand}
                        {#each todays_menu.expand.recipes as curr, i}
                            {#if !sub_recipe_ids.includes(curr.id)}
                                <!-- {#if todays_menu.sub_recipes}
                                    {#each todays_menu.sub_recipes[curr.id] as sub_recipe}
                                        {#each todays_menu.expand.recipes as curr_sub_recipe, i}
                                            {#if curr_sub_recipe.id === sub_recipe.recipe_id}
                                                <div class="flex justify-around items-center w-full">
                                                    <SubTask/>
                                                    <div class="card card-bordered sm:card-side {(todays_menu.made && todays_menu.made[curr_sub_recipe.id]) ? "bg-base-300" : "bg-base-200"} max-h-24 my-1.5 mx-1 w-4/5" onclick={window.location = `/cook_recipe/${curr_sub_recipe.url_id}/${todays_menu.servings[curr_sub_recipe.id]}`} onkeydown={window.location = `/cook_recipe/${curr_sub_recipe.url_id}/${todays_menu.servings[curr_sub_recipe.id]}`}>
                                                        <figure class="md:w-3/5 {(todays_menu.made && todays_menu.made[curr_sub_recipe.id]) ? "blur-xs" : ""}"><img src={curr_sub_recipe.image} alt={curr_sub_recipe.title}/></figure>
                                                        <div class="card-body max-h-full flex flex-row p-2 items-center w-full">
                                                            <p id={i} class="w-1/2 text-xs">{curr_sub_recipe.title}</p>
                                                            <div class="card-actions flex flex-row justify-evenly items-center">
                                                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={curr_sub_recipe.id} bind:checked={todays_menu.made[curr_sub_recipe.id]} onclick={stopPropagation(toggle_made)}>
                                                                <button id={curr_sub_recipe.id} class="btn btn-xs md:btn-sm p-1 favorite" onclick={stopPropagation((e)=>{curr_sub_recipe.favorite = !curr_sub_recipe.favorite; update_fave_queue(e);})}><Heart color={(curr_sub_recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    {/each}
                                {/if} -->
                                <RecipeCard
                                    bind:recipe={todays_menu.expand.recipes[i]}
                                    bind:checked={todays_menu.made[curr.id]}
                                    bind:servings={todays_menu.servings[curr.id]}
                                    type="today"
                                    toggle_check_box={toggle_made}
                                    toggle_heart={update_fave_queue}
                                    card_click={cook_recipe}
                                />
                            {/if}
                        {/each}
                        <button id="add" class="btn btn-xl ccontent-center btn-primary w-fit p-2 flex m-auto rounded-[20px]" onclick={add_recipe_modal}><Plus size={12}/></button>
                    {:else if loading}
                        <div id="menu_loading" class="w-full flex justify-center content-center h-full">
                            <span class="loading loading-bars loading-lg"></span>
                        </div>
                    {:else}
                        <div class="w-full flex justify-center content-center h-[calc(100svh-100px)]">
                            <NoteCard msg={`No menu set as today`} action={() => window.location.href = `/my_menus`} btn_name={"browse menus"} />
                        </div>
                    {/if}
                </div>
            </div>
            <div id="right_column" class="{tab == "grocery_list" ? "" : "hidden"} md:flex md:w-1/2 ml-1 mr-2">
                {#if todays_menu && mode == "menu"}
                    {#if grocery_list.length}
                        <GroceryList 
                            {grocery_list_id} 
                            bind:grocery_list={grocery_list} 
                            update_grocery_item={update_groceries}
                            list_owner={todays_menu.user}
                            bind:status={grocery_list_status}  
                            reset_grocery_list={reset_list} 
                            check_grocery_item={handle_check_item}
                        />
                    {:else if loading} 
                        <div id="menu_loading" class="w-full flex justify-center content-center h-[calc(100svh-113px)]">
                            <span class="loading loading-bars loading-lg"></span>
                        </div>
                    {:else}
                        <div id="menu_loading" class="w-full flex justify-center content-center h-[calc(100svh-113px)]">

                        </div>
                    {/if}
                {:else}
                    <h2>select recipes to add to your menu</h2>
                {/if}
            </div>
            {:else}
                <div class="w-full flex justify-center content-center h-[calc(100svh-100px)]">
                    <NoteCard msg={`No menu set as today`} action={() => window.location.href = `/my_menus`} btn_name={"browse menus"} />
                </div>
            {/if}
        </div>
        <div class="tabs tabs-box w-fit mx-auto flex items-center bg-base-300 md:bg-base-200 md:hidden my-1">
            <button id="recipe_list" class="tab tab-xs {(tab == "recipe_list") ? "tab-active" : ""}" onclick={switch_tab}>Recipes</button>
            <button id="grocery_list" class="tab {(tab == "grocery_list") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Grocery List</button>
        </div>
        <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
    </div>
    <dialog id="my_modal_3" class="modal">
        <div class="modal-box max-w-full md:w-2/3 p-1 h-[80svh]">
            <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <div class="mt-10">
                <RecipeList 
                    recipes={user_recipes}
                    menu_recipes={[]}
                    card_click={add_to_today}
                />
            </div>
        </div>
    </dialog>