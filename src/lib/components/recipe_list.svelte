<script>
    import RecipeCard from "./recipe_card.svelte";
    import SearchInput from "./search.svelte";
    import { pb } from '/src/lib/pocketbase';
    import { update_fav_made } from '/src/lib/save_recipe.js';
    import { sort_recipes } from '/src/lib/sort.js';
    import Sort from "../../lib/components/sort.svelte";
    import CatCarousel from "../../lib/components/cat_carousel.svelte";
    import { page } from '$app/stores';

    let { 
        recipes = $bindable(),
        menu_recipes = $bindable(),
        card_click,
        reset_mode,
        check_item,
        update_recipe,
    } = $props();

    const get_categories = () => {
        let out = {cuisines:[], countries:[], cats:[]};
        for (let i = 0; i < recipes.length; i++){
            if (!out.cuisines.includes(recipes[i].cuisine) && recipes[i].cuisine) out.cuisines.push(recipes[i].cuisine);
            if (!out.countries.includes(recipes[i].country) && recipes[i].country) out.countries.push(recipes[i].country);
            if (!out.cats.includes(recipes[i].category) && recipes[i].category) out.cats.push(recipes[i].category);
        }
        return out;
    }

    let categories = $derived(get_categories());
    let selected_cats = $state({cuisines:[], countries:[], cats:[]});
    let sort_val = $state("Most Recent");
    let search_val = $state("");
    let display_recipes = $derived(sort_recipes(sort_val, filter_recipes(search(search_val))));
    let delay_timer;
    let scroll_size = $derived($page.url.pathname.includes(`/today`) ? `h-[calc(80svh-120px)] md:h-[calc(80svh-120px)]` : `h-[calc(100svh-160px)] md:h-[calc(100svh-135px)]`);

    
    let display_cats = $derived(update_diplay_cats());
    let loading = $state(true);

    function view(e) {
        card_click({index: e.id});
    }

    function scroll_to_top(){
        document.getElementById('recipes').scrollTop = 0;
    }

    async function delete_recipe(e){
        e.stopPropagation();
        let tmp = []
        for (let recipe of recipes){
            if (recipe.id == e.id) {
                let delete_recipe = confirm(`Are you sure you want to delete your recipe "${recipe.title}"?`);
                if (delete_recipe){
                    await pb.collection('recipes').delete(e.id);
                }
            } else {
                tmp.push(recipe);
            }
            recipes = tmp;
        }
    }

    function update_selected_cats(selected_cat, clicked, type_cat){
        if (clicked){
            if (!selected_cats[type_cat].includes(selected_cat) || ["thumb_up", "heart"].includes(selected_cat)){
                selected_cats[type_cat].push(selected_cat);
                selected_cats = selected_cats;
            }
        } else {
            let tmp_cats = [];
            for (let [key, value] of Object.entries(selected_cats)){
                if (key == type_cat){
                    for (let curr_cat of value){
                        if (curr_cat != selected_cat){
                            tmp_cats.push(curr_cat);
                        }
                    }
                    selected_cats[key] = tmp_cats;
                }
            }
        }
    }

    function update_diplay_cats(){
        let output = {cuisines:[], countries:[], cats:[]};
        if (!selected_cats.cats.length && !selected_cats.cuisines.length && !selected_cats.countries.length){
            return categories;
        }
        let has_heart_or_thumb = (selected_cats.cats.includes("heart") || selected_cats.cats.includes("thumb_up"));
        if (selected_cats.cats.length){
            for (let i = 0; i < selected_cats.cats.length; i++){
                for (let j = 0; j < recipes.length; j++){
                    if (["heart","thumb_up"].includes(selected_cats.cats[i])){
                        if (selected_cats.cats[i] == "heart" && recipes[j].favorite){
                            if (recipes[j].cuisine && !output.cuisines.includes(recipes[j].cuisine)) output.cuisines.push(recipes[j].cuisine);
                            if (recipes[j].category && !output.cats.includes(recipes[j].category)) output.cats.push(recipes[j].category);
                            if (recipes[j].cuisine && !output.countries.includes(recipes[j].country)) output.countries.push(recipes[j].country);
                        } else if (selected_cats.cats[i] == "thumb_up" && recipes[j].made) {
                            if (recipes[j].cuisine && !output.cuisines.includes(recipes[j].cuisine)) output.cuisines.push(recipes[j].cuisine);
                            if (recipes[j].category && !output.cats.includes(recipes[j].category)) output.cats.push(recipes[j].category);
                            if (recipes[j].country && !output.countries.includes(recipes[j].country)) output.countries.push(recipes[j].country);
                        }
                    }else if (recipes[j].category == selected_cats.cats[i]){
                        if (recipes[j].cuisine && !output.cuisines.includes(recipes[j].cuisine)) output.cuisines.push(recipes[j].cuisine);
                        if (recipes[j].country && !output.countries.includes(recipes[j].country)) output.countries.push(recipes[j].country);
                    }
                }
            }
        } else {
            output.countries = categories.countries;
            output.cuisines = categories.cuisines;
        }
        
        if (!has_heart_or_thumb) output.cats = categories.cats;
        return output;
    }

    function filter_recipes(recipes_in){
        if (selected_cats.cats.length || selected_cats.countries.length || selected_cats.cuisines.length){
            let new_display = [];
            // update new display array
            for (let curr_recipe of recipes_in){
                for (let [key, value] of Object.entries(selected_cats)){
                    // cats handled after this loop (including heart and thumb)
                    if (key == 'cats') continue;
                    for (let curr_cat of value){
                        if (key == 'cuisines') {
                            key = 'cuisine';
                        } else if (key == 'countries') {
                            key = 'country';
                        }
                        if (curr_recipe[key] == curr_cat){
                            if (!new_display.includes(curr_recipe)){
                                let cat_found = (!selected_cats.cats.length) ? true : false;
                                for (let cat of selected_cats.cats){
                                    if (cat == curr_recipe.category ||
                                        cat == "heart" && curr_recipe.favorite || 
                                        cat == "thumb_up" && curr_recipe.made){
                                        cat_found = true;
                                    }
                                }
                                if (cat_found) new_display.push(curr_recipe);
                            }
                        }
                    }
                }
            }
            if (!new_display.length){
                for (let recipe of recipes_in){
                    for (let cat of selected_cats.cats){
                        if (recipe.category == cat){
                            if (selected_cats.cats.includes("heart") || selected_cats.cats.includes("thumb_up")){
                                if ((selected_cats.cats.includes("heart") && recipe.favorite) || (selected_cats.cats.includes("thumb_up") && recipe.made)) {
                                    if (!new_display.includes(recipe)) new_display.push(recipe);
                                }
                            }else if (!new_display.includes(recipe)) {
                                if (!new_display.includes(recipe)) new_display.push(recipe);
                            }
                            
                        }else if (cat =="heart"){
                            if (selected_cats.cats.length == 1 && selected_cats.cats[0] == "heart"){
                                if (recipe.favorite && !new_display.includes(recipe)) new_display.push(recipe);
                            }else if (selected_cats.cats.length == 2 && (selected_cats.cats.includes("heart") && selected_cats.cats.includes("thumb_up"))){
                                if (recipe.favorite && !new_display.includes(recipe)) new_display.push(recipe);
                            }
                        }else if (cat == "thumb_up"){
                            if (selected_cats.cats.length == 1 && selected_cats.cats[0] == "thumb_up"){
                                if (recipe.made && !new_display.includes(recipe)) new_display.push(recipe);
                            }else if (selected_cats.cats.length == 2 && (selected_cats.cats.includes("heart") && selected_cats.cats.includes("thumb_up"))){
                                if (recipe.made && !new_display.includes(recipe)) new_display.push(recipe);
                            }
                        }
                    }
                }
            }

            return new_display;
        }else{
            return recipes_in;
        }
    }

    function get_cat_name(classes){
        let type_cat;
        if (classes.includes('cuisine')){
            type_cat = 'cuisines';
        }else if (classes.includes('country')){
            type_cat = 'countries';
        }else if (classes.includes('category')){
            type_cat = 'cats';
        }
        return type_cat;
    }

    function select_cat(e){
        let delay_time = (e.srcElement.tagName != "INPUT") ? 0 : 1000;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(() => {

            if (e.srcElement.tagName != "INPUT"){
                let classes = Array.from(e.srcElement.classList);
                let clicked = false;
                if (["heart", "thumb_up"].includes(e.srcElement.id)){
                    clicked = Array.from(e.srcElement.firstChild.classList).includes('fill-neutral');
                } else {
                    clicked = classes.includes('bg-base-300');
                }
                
                //select type of category selected
                let selected_cat = (["heart", "thumb_up"].includes(e.srcElement.id)) ? e.srcElement.id : e.srcElement.textContent;
                let type_cat = get_cat_name(classes);
                
                update_selected_cats(selected_cat, clicked, type_cat);
            }

            reset_mode();
            scroll_to_top();
        }, delay_time);
    }

    function search(search_text){
        let recipes_with_ingr = [];
        for (let i = 0; i < recipes.length; i ++){
            for (let j = 0; j < recipes[i].expand.ingr_list.length; j++){
                if (recipes[i].expand.ingr_list[j].ingredient.toUpperCase().includes(search_text.toUpperCase()) ||
                    recipes[i].title.toUpperCase().includes(search_text.toUpperCase())) {
                    recipes_with_ingr.push(recipes[i]);
                    break;
                }
            }
        }
        return recipes_with_ingr;
    }

    async function update_fav(e){
        let val;
        
        for (let i = 0; i < recipes.length; i++){
            if (recipes[i].id == e.id){
                val = !recipes[i].favorite;
                break;
            }
        }
        const result = await update_fav_made(e.id, "favorite", val);
        update_recipe({recipe: result});
    }

    async function update_made(e){
        let val;
        for (let i = 0; i < recipes.length; i++){
            if (recipes[i].id == e.id){
                val = !recipes[i].made;
                break;
            }
        }
        const result = await update_fav_made(e.id, "made", val);
        update_recipe({recipe: result});
    }

    function handle_check(e){
        check_item({index: e.id});
    }

    function is_checked(id){
        const items = menu_recipes.filter((item) => item.id == id);
        if (items.length > 0){
            return true;
        } else {
            return false;
        }
    }

    function update_search(e) {
        search_val = e.val;
        scroll_to_top();
    }

    async function update_sort(e){
        loading = true;
        sort_val = e.currentTarget.innerHTML; 
        document.activeElement.blur();
        scroll_to_top();
        loading = false;
    }
</script>
<div class="hidden md:flex flex-col w-full">
    <CatCarousel
        display_categories={display_cats.cats}
        display_cuisines={display_cats.cuisines}
        display_countries={display_cats.countries}
        selected_categories={selected_cats.cats}
        selected_cuisines={selected_cats.cuisines}
        selected_countries={selected_cats.countries}
        categories={categories.cats}
        cuisines={categories.cuisines}
        countries={categories.countries}
        {select_cat}
        enable_thumb={true}
        enable_heart={true}
        cnt={0}
    />
    <div class="form-control flex flex-row justify-between w-full items-center">
        <SearchInput 
            {update_search}
        />
        <p class="mx-5 text-xs md:text-sm">{display_recipes ? display_recipes.length+" Recipes" : ""}</p>
        <Sort
            {sort_val}
            {update_sort} 
            type="recipe" 
        />
    </div>
</div>

<div id="recipes" class="{scroll_size} overflow-y-auto space-y-2 rounded-md md:border-none py-2">
    {#if display_recipes && display_recipes.length}
        {#each display_recipes as curr, i}
        <RecipeCard 
            recipe={display_recipes[i]} 
            checked={is_checked(display_recipes[i].id)} 
            servings={display_recipes[i].servings}
            type="menu"
            toggle_check_box={handle_check} 
            toggle_heart={update_fav}
            delete_recipe={delete_recipe}
            toggle_thumb={update_made}
            card_click={view}
        />
        {/each}
        <div class="flex justify-center m-3">
            <a class="btn btn-primary btn-xs" href="/add_recipe">Add New Recipes</a>
        </div>
    {:else if loading}
        <div id="menu_loading" class="w-full flex justify-center content-center h-full">
            <span class="loading loading-bars loading-lg"></span>
        </div>
    {:else}
        <div class="w-full flex justify-center items-center h-full">
            no results
        </div>
    {/if}
</div>

<div class="flex flex-col md:hidden">
    <div class="form-control flex flex-row justify-between w-full items-center">
        <SearchInput 
            {update_search}
        />

        <p class="mx-5 text-xs md:text-sm">{display_recipes ? display_recipes.length+" Recipes" : ""}</p>
        <Sort
            {sort_val}
            {update_sort} 
            type="recipe" 
        />
    </div>
    <CatCarousel
        display_categories={display_cats.cats}
        display_cuisines={display_cats.cuisines}
        display_countries={display_cats.countries}
        selected_categories={selected_cats.cats}
        selected_cuisines={selected_cats.cuisines}
        selected_countries={selected_cats.countries}
        categories={categories.cats}
        cuisines={categories.cuisines}
        countries={categories.countries}
        {select_cat}
        enable_thumb={true}
        enable_heart={true}
        cnt={0}
    />
</div>