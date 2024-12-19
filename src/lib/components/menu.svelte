<script>
    import { onMount, tick } from 'svelte';
    import GroceryList from "/src/lib/components/grocery_list.svelte";
    import { currentUser, pb } from '/src/lib/pocketbase';
    import { page } from '$app/stores';
    import { get_grocery_list } from '/src/lib/merge_ingredients.js';
    import { get_servings, get_total_time } from '/src/lib/recipe_util.js';
    import { createEventDispatcher } from 'svelte';
    import Plus from "/src/lib/icons/Plus.svelte";
    import RecipeCard from './recipe_card.svelte';



    /**
     * @typedef {Object} Props
     * @property {any} menu
     * @property {any} [id]
     * @property {any} mults
     * @property {any} sub_recipes
     */

    /** @type {Props} */
    let {
        menu = $bindable(),
        id = $bindable(null),
        mults = $bindable(),
        sub_recipes = $bindable(),
        menu_title = $bindable(),
        total_servings = $bindable()
    } = $props();
    let tab = $state("recipe_list");
    let grocery_list = $derived(get_grocery_list(menu, mults, sub_recipes));
    // let num_servings = $derived(get_servings(menu, sub_recipes, mults));
    let total_time = $derived(get_total_time(menu));
    const dispatch = createEventDispatcher();
    let overflow_len = ``;
    let basic_words = ['and', 'the', 'of', 'with', 'recipe'];
    let delay_timer;
    let title_lock = $state(false);
    let save_menu_load = $state(false);
    let save_menu_today_load = $state(false);
    let set_todays_menu_load = $state(false);

    onMount(async () => {
        overflow_len = ($page.url.pathname == "/menu") ? `max-h-[60vh]` : `max-h-[60vh]`;
    });

    $effect(() => {
        if (!menu_title || menu_title == "New Menu" || !title_lock){
            let title = (menu.length < 2) ? "New Menu" : generate_menu_title();
            dispatch("update_title", {title: title});
        }
    });

    function update_sub_recipes(){
        let out = {};
        if (!out){
            //create out object
            out = {};
            for (let i = 0; i < menu.length; i++){
                if (!out[menu[i].id]){
                    out[menu[i].id] = [];
                    out[menu[i].id].push({ingr_id: null, recipe_id: null});
                }
            }
        } else {
            // add new sub_recipe instance if needed
            for (let key in out){
                let found_unset_sub_recipe = false;
                for (let j = 0; j < out[key].length; j++){
                    if (out[key][j].ingr_id === null || out[key][j].recipe_id === null){
                        found_unset_sub_recipe = true;
                        break;
                    }
                }
                if (!found_unset_sub_recipe && Object.keys(out).length - 1 > out[key].length) {
                    out[key].push({ingr_id: null, recipe_id: null});
                }
            }
        }

        // add new instance for each recipe added to a menu
        for (let i = 0; i < menu.length; i++){
            if (!(menu[i].id in out)){
                out[menu[i].id] = [];
                out[menu[i].id].push({ingr_id: null, recipe_id: null});
            }
        }

        // set sub_recipe values in each recipe object, data for out, is_sub_recipe flag
        for (let i = 0; i < menu.length; i++){
            for (let k in out){
                for (let j = 0; j < out[k].length; j++){
                    // add recipe data to parent recipe object
                    if (k == menu[i].id && out[k][j].recipe_id && out[k][j].ingr_id){
                        if (!menu[i].sub_recipe_data) menu[i].sub_recipe_data = [];
                        for (let l = 0; l < menu.length; l++){
                            if (menu[l].id == out[k][j].recipe_id){
                                if (!menu[i].sub_recipe_data.includes(menu[l])){
                                    menu[i].sub_recipe_data.push(menu[l]);
                                }
                            }
                        }
                    }
                    //set an is_sub_recipe flag for each recipe
                    for (let l = 0; l < out[k].length; l++){
                        if (out[k][l].recipe_id == menu[i].id){
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

    async function save_and_set_today(e){
        save_menu_today_load = true;
        await save_menu(e);
        await set_todays_menu();
        window.location.href = "/today";
    }

    async function save_menu_handle(e) {
        save_menu_load = true;
        await save_menu(e);
        save_menu_load = false;
    }

    async function save_menu(e){
        let recipe_ids = [];
        let made = {};
        for (let i = 0; i < menu.length; i++){
            recipe_ids.push(menu[i].id);
            made[menu[i].id] = false;
        }
        const data = {
            "recipes": recipe_ids,
            "user": $currentUser.id,
            "today": false,
            "title": menu_title,
            "servings": mults,
            "made": made,
            "sub_recipes": sub_recipes
        };
        const record = await pb.collection('menus').create(data);
        id = record.id;
    }
    
    async function set_today_handle(e){
        set_todays_menu_load = true;
        await set_todays_menu();
        set_todays_menu_load = false;
    }
    
    async function set_todays_menu(){
        const resultList = await pb.collection('menus').getList(1, 1, {
            filter: `user = '${$currentUser.id}' && today = True`,
            expand: ``
        });
        if (resultList.items.length){
            const false_record = await pb.collection('menus').update(resultList.items[0].id, { "today": false});
        }
        let made_menu = {};
        for (let i = 0; i < menu.length; i++){
            made_menu[menu[i].id] = false;
        }
        const true_record = await pb.collection('menus').update(id, { "made": made_menu, "grocery_list":null, "today": true });
        const menu_log_data = {
            "menu": true_record.id,
            "user": $currentUser.id,
            "complete": false
        };
        const menu_log_result = await pb.collection('menu_log').create(menu_log_data);
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

    function remove_from_menu(e){
        console.log("remove from menu");
        dispatch('remove_from_menu', {id: e.detail.id});
    }

</script>

<div id="menu" class="h-3/4 md:h-full w-full cursor-default">
    <div class="flex items-center p-3 justify-between">
        <input type="text" class="input input-bordered border-primary input-xs w-2/3" value={menu_title} oninput={() => {title_lock = true}}/>
        {#if $page.url.pathname == "/menu" || $page.url.pathname == "/profile"}
            <div class="dropdown dropdown-end">
                <label tabindex="-1" for="save_menu" class="btn m-1 btn-primary btn-xs md:btn-sm">save menu</label>
                <ul tabindex="-1" name="save_menu" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                    <li class="btn btn-xs btn-primary p-0"><button class="p-0" onclick={save_menu_handle}>
                        {#if save_menu_load}
                            <span class="loading loading-dots loading-md mx-7"></span>
                        {:else}
                            save menu
                        {/if}
                        </button></li>
                    <li class="btn btn-xs btn-primary p-0"><button class="p-0" onclick={save_and_set_today}>
                        {#if save_menu_today_load}
                            <span class="loading loading-dots loading-md mx-7"></span>
                        {:else}
                            save and set today
                        {/if}
                        </button></li>
                </ul>
            </div>
        {:else if $page.url.pathname == "/my_menus"}
            <button class="btn btn-primary self-end btn-xs md:btn-sm" id="today_btn" onclick={set_today_handle}>
                {#if set_todays_menu_load}
                    <span class="loading loading-dots loading-md mx-5"></span>
                {:else}
                    set today
                {/if}
            </button>
        {/if}
    </div>
    <div class="flex content-center">
        <div class="tabs tabs-boxed w-fit mx-auto flex items-center bg-base-300 md:bg-base-200">
            <div id="recipe_list" class="tab tab-active tab-xs" onclick={switch_tab}>Recipes</div> 
            <div id="grocery_list" class="tab tab-xs" onclick={switch_tab}>Grocery List</div>
        </div>
    </div>
    <div class="flex justify-around m-1 items-center">
        <p class="text-xs">{menu.length} recipes</p>
        <p class="text-xs">{total_servings} servings</p>
        <p class="text-xs">{total_time}</p>
    </div>
    
    {#if tab == "recipe_list"}
        <div class="h-[calc(100svh-210px)] md:h-[calc(100svh-160px)] overflow-y-auto border border-primary rounded-md md:border-none flex flex-col space-y-2">
            {#if menu.length}    
                {#each menu as recipe}
                    {#if !recipe.is_sub_recipe}
                        <RecipeCard
                            recipe={recipe} 
                            servings={mults[recipe.id]}
                            type="menu_component"
                            on:delete_recipe={remove_from_menu} 
                        />
                        {#if recipe.sub_recipe_data}
                            <div class="collapse bg-base-200 my-3.5 mx-5 w-auto">
                                <input type="checkbox" /> 
                                <div class="collapse-title text-xs md:text-base flex items-center">
                                    show sub recipes
                                </div>
                                <div class="collapse-content"> 
                                    {#each recipe.sub_recipe_data as sub_recipe}
                                        <div class="img_serv_container card card-bordered card-side flex flex-row w-auto items-center bg-base-200">
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