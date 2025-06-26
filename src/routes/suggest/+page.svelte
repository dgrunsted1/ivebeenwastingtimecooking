<script>
    import { onMount } from 'svelte';
    import { pb, currentUser, auth_refresh, post } from '/src/lib/pocketbase.js';
    import { get_servings } from '/src/lib/recipe_util.js';
    import RecipeCard from "/src/lib/components/recipe_card.svelte";
    import Alerts from "../../lib/components/alerts.svelte";

    let main_recipes = $state([]);
    let recipes = $state([]);
    let recipe_rec = $state({});
    let rec_mults = $state({});
    let menu_rec = $state([]);
    let cats = $state([{cat: "main", cuisine: "any", recipe: null}, {cat: "main", cuisine: "any", recipe: null},{cat: "main", cuisine: "any", recipe: null}, {cat: "breafast", cuisine: "any", recipe: null}, {cat: "dessert", cuisine: "any", recipe: null}]);
    let categories = $state([]);
    let loading = $state({
        user: true,
        menu: true,
        recipe: true
    });
    let total_servings = $derived(get_servings(menu_rec, {}, rec_mults));
    let menu_title = $state("New Menu");
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let tab = $state("menu"); // info, stats, recipe, menu
    let cuisines = $state([]);

    onMount(async () => {
        if (!$currentUser){
            window.location.href = "/login";
            return;
        } else {
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
        loading.user = false;
        const recipe_result = await pb.collection('recipes').getList(1, 250, {
            fields: `id, category`,
            filter: `user="${$currentUser.id}"`,
        });
        recipes = recipe_result.items;
        const cat_result = await pb.collection('categories').getFullList({sort: `+id`});
        categories.unshift(...cat_result.map((x) => x.id));
        const cuisine_result = await pb.collection('cuisines').getFullList({sort: `+id`});
        cuisines.unshift(...cuisine_result.map((x) => x.id));
        recipe_rec = await get_random_recipe(recipe_result.items.map(item => item.id));
        loading.recipe = false;
        roll_menu();
    });

    async function roll_menu(){
        loading.menu = true;
        for (let i = 0; i < cats.length; i++){
            let data = {...cats[i]};
            delete data.recipe;
            const result = await post(data, 'api/random_recipe');
            console.log(result);
        }
        // main_recipes = recipes.filter(item => item.category == 'Main').map(item => item.id);
        // main_recs = await get_main_recs(main_recipes);
        // dessert_rec = await get_random_recipe(recipes.filter(item => item.category == 'Dessert').map(item => item.id));
        // breakfast_rec = await get_random_recipe(recipes.filter(item => item.category == 'Breakfast').map(item => item.id));
        // other_rec = await get_random_recipe(recipes.filter(item => !['Main', 'Dessert', 'Breakfast'].includes(item.category)).map(item => item.id));
        // menu_rec = main_recs.concat(dessert_rec).concat(other_rec).concat(breakfast_rec);
        // rec_mults = get_mults();
        loading.menu = false;
    }

    // async function get_recipe(params){
    //     let rand_recipe = in_recipes[Math.floor(Math.random() * in_recipes.length)];
    //     let output = await pb.collection('recipes').getOne(rand_recipe, { expand: `notes, ingr_list` });
    //     return output;
    // }

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }

    function get_mults(){
        let output = {};
        for (let i = 0; i < menu_rec.length; i++){
            
            output[menu_rec[i].id] = menu_rec[i].servings;
        }
        return output;
    }

    async function get_main_recs(options){
        let output = [];
        output.push(await get_random_recipe(options));
        while (output.length < 2){
            let temp = await get_random_recipe(options);
            if (!output.includes(temp)) output.push(await get_random_recipe(options));
        }
        return output;
    }

    async function get_random_recipe(in_recipes){
        let rand_recipe = in_recipes[Math.floor(Math.random() * in_recipes.length)];
        let output = await pb.collection('recipes').getOne(rand_recipe, { expand: `notes, ingr_list` });
        return output;
    }
    
    function update_mult(e){
        rec_mults[e.id] = e.mult;
    }

    function update_title(e){
        menu_title = e.title;
    }

    function switch_tab(e){
        tab = e.target.id;
    }

    function update_cat(e){
        cats[e.target.id].cat = e.target.innerHTML;
        document.activeElement.blur();
        //get new recipe
    }

    function update_cuisine(e){
        cats[e.target.id].cuisine = e.target.innerHTML;
        document.activeElement.blur();
        //get new recipe
    }
</script>

<div class="flex flex-col items-center h-full">
    <h1>Profile</h1>
    <div class="tabs tabs-box mx-auto hidden items-center bg-base-300 md:bg-base-200 md:flex m-1 justify-center">
        <button id="recipe" class="tab {(tab == "recipe") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Recipe</button>
        <button id="menu" class="tab {(tab == "menu") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Menu</button>
    </div>
    <div class="flex w-full">
        <div class="flex flex-col items-center md:flex-row w-full">
            {#if !$currentUser}
                <div class="flex h-[calc(100svh-110px)] md:h-[calc(100svh-125px)] justify-center w-full"><span class="loading loading-bars loading-lg"></span></div>
            {:else}
                <!-- Recipe -->
                <div class="flex h-[calc(100svh-110px)] md:h-[calc(100svh-75px)] overflow-y-auto w-full {tab == 'recipe' ? '' : 'hidden'}">
                    {#if recipes.length > 5}
                        <div class="flex md:space-x-4 flex-col items-center h-full w-full">
                            <div class="flex justify-evenly flex-col md:flex-row h-full w-full">
                                {#if loading.recipe}
                                    <div class="flex flex-col items-center justify-center md:w-2/5 h-[500px]"><span class="loading loading-bars loading-lg"></span></div>
                                {:else}
                                    <div id="cook_recipe" class="flex flex-col md:m-2 md:pb-10 md:w-2/5 h-full">
                                        <div class="img_info_container flex flex-col items-center justify-evenly h-full">
                                            <div class="img_container md:w-auto h-1/2 mx-2">
                                                <img src={recipe_rec.image} alt={recipe_rec.title} class="h-full rounded-xl object-cover" />
                                            </div>
                                            <div class="info_container w-full flex flex-col m-1 space-y-2 md:space-y-4">
                                                <div class="title_container mx-auto my-2">
                                                    <div class="title w-full text-lg md:text-xl mx-2">{recipe_rec.title}</div>
                                                </div>
                                                <div class="description_container m-auto w-5/6">
                                                    <div class="desc text-xs md:text-sm line-clamp-5" >{recipe_rec.description}</div>
                                                </div>
                                                <div class="misc flex justify-evenly items-center">
                                                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="auth">{recipe_rec.author}</div>
                                                    </div>
                                                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="time">{recipe_rec.time}</div>
                                                    </div>
                                                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                                                        <div>{recipe_rec.servings} servings</div>
                                                    </div>
                                                </div>
                                                <div class="misc flex justify-evenly items-center">
                                                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="cat">{recipe_rec.category}</div>
                                                    </div>
                                                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="cuisine">{recipe_rec.cuisine}</div>
                                                    </div>
                                                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                                                        <div class="country">{recipe_rec.country}</div>
                                                    </div>
                                                </div>
                                                <div class="flex justify-evenly items-center space-x-2">
                                                    {#if recipe_rec.url}
                                                        <div class=" flex justify-center mt-1"><a class="btn btn-primary btn-xs" href={recipe_rec.url} target="_blank">original recipe</a></div>
                                                    {/if}    
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`} onkeydown={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`}>cook</button></div>
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={window.location = `/menu/${recipe_rec.id}`} onkeydown={window.location = `/menu/${recipe_rec.url_id}/${recipe_rec.servings}`}>create menu</button></div>
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={async ()=>{recipe_rec = await get_random_recipe(recipes.map(item => item.id))}}>Reroll</button></div>
                                                </div>    
                                            </div>
                                        </div>
                                        <div class="notes_container form-control m-2 md:mt-5 md:mx-5 space-y-2 flex items-center">
                                            {#if recipe_rec.expand.notes}
                                                {#each recipe_rec.expand.notes as note, i}
                                                    <p class="m-2 text-xs md:text-base">{note.content}</p>
                                                {/each}
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>   
                    {/if}
                </div>
                <!-- menu -->
                <div class="flex flex-col space-y-2 w-full {tab == 'menu' ? '' : 'hidden'}">
                    {#each cats as curr, i}
                        <div class="flex w-full justify-evenly content-center">
                            <div class="dropdown dropdown-top dropdown-start md:dropdown-bottom">
                                <label tabindex="-1" for="sort_mobile" class="btn m-0 btn-primary btn-xs md:btn-sm">{curr.cat}</label>
                                <ul tabindex="-1" name="sort_mobile" class="dropdown-content z-100 menu bg-transparent rounded-box w-max space-y-1">
                                    {#each categories as opt}
                                        <li class="btn btn-xs {opt == curr.cat ? 'btn-primary text-primary-content': 'btn-neutral text-neutral-content'}"><button id={i} onclick={update_cat}>{opt}</button></li>
                                    {/each}
                                </ul>
                            </div>
                            <div class="dropdown dropdown-top dropdown-start md:dropdown-bottom">
                                <label tabindex="-1" for="sort_mobile" class="btn m-0 btn-primary btn-xs md:btn-sm">{curr.cuisine}</label>
                                <ul tabindex="-1" name="sort_mobile" class="dropdown-content z-100 menu bg-transparent rounded-box w-max space-y-1">
                                    {#each cuisines as opt}
                                        <li class="btn btn-xs {opt == curr.cuisine ? 'btn-primary text-primary-content': 'btn-neutral text-neutral-content'}"><button id={i} onclick={update_cuisine}>{opt}</button></li>
                                    {/each}
                                </ul>
                            </div>
                            {#if curr.recipe}
                                <RecipeCard 
                                    recipe={curr.recipe} 
                                    checked={is_checked(display_recipes[i].id)} 
                                    servings={display_recipes[i].servings}
                                    type="menu"
                                    toggle_check_box={handle_check} 
                                    toggle_heart={update_fav}
                                    delete_recipe={delete_recipe}
                                    toggle_thumb={update_made}
                                    card_click={view}
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    <div class="tabs tabs-box w-full mx-auto flex items-center bg-base-300 md:bg-base-200 md:hidden m-1 justify-evenly">
        <button id="recipe" class="tab px-1 {(tab == "recipe") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Recipe</button>
        <button id="menu" class="tab px-1 {(tab == "menu") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Menu</button>
    </div>
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</div>
