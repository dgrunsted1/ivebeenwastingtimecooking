<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<script>
    import { createEventDispatcher } from 'svelte';
    import { pb } from '/src/lib/pocketbase';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import { onMount } from "svelte";
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import Clear from "/src/lib/icons/Clear.svelte";
    import { update_fav_made } from '/src/lib/save_recipe.js';
    import { sort_recipes } from '/src/lib/sort.js';

    const dispatch = createEventDispatcher();
    let { recipes = $bindable() } = $props();
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

    
    let display_cats = $derived(update_diplay_cats());
    let sort_opts = ["Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let loading = $state(true);

    function view(e) {
        if (e.target.tagName != "INPUT" && e.target.tagName != "BUTTON") {
            let index = e.currentTarget.getElementsByTagName("h2")[0].id;
            for (let i = 0; i < display_recipes.length; i++){
                if (display_recipes[i].id == index){
                    dispatch(`update_edit`, {index: index});
                }
            }
        }
    }

    async function delete_recipe(e){
        e.stopPropagation();
        let delete_recipe = confirm("Are you sure you want to delete this recipe?");
        if (delete_recipe){
            await pb.collection('recipes').delete(e.srcElement.id);
            let tmp = []
            for (let recipe of recipes){
                if (recipe.id != e.srcElement.id) tmp.push(recipe);
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
            document.getElementById("menu_loading").classList.remove('hidden');

            if (e.srcElement.tagName != "INPUT"){
                let classes = Array.from(e.srcElement.classList);
                let clicked = false;
                if (["heart", "thumb_up"].includes(e.srcElement.id)){
                    clicked = Array.from(e.srcElement.firstChild.classList).includes('fill-black');
                } else {
                    clicked = classes.includes('btn-neutral');
                }
                
                //select type of category selected
                let selected_cat = (["heart", "thumb_up"].includes(e.srcElement.id)) ? e.srcElement.id : e.srcElement.textContent;
                let type_cat = get_cat_name(classes);
                
                update_selected_cats(selected_cat, clicked, type_cat);
            }

            dispatch(`reset_mode`);
            document.getElementById("menu_loading").classList.add('hidden');
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
        e.stopPropagation();
        console.log(e.currentTarget.id);
        console.log(e.target.id);
        console.log(e.srcElement.id);
        let val;
        
        for (let i = 0; i < recipes.length; i++){
            if (recipes[i].id == e.srcElement.id){
                val = !recipes[i].favorite;
                break;
            }
        }
        const result = await update_fav_made(e.srcElement.id, "favorite", val);
        dispatch("update_recipe", {recipe: result});
    }

    async function update_made(e){
        e.stopPropagation();
        console.log(e.currentTarget.id);
        console.log(e.target.id);
        console.log(e.srcElement.id);
        let val;
        for (let i = 0; i < recipes.length; i++){
            if (recipes[i].id == e.srcElement.id){
                val = !recipes[i].made;
                break;
            }
        }
        const result = await update_fav_made(e.srcElement.id, "made", val);
        console.log(result);
        dispatch("update_recipe", {recipe: result});
    }

    // function update_fav(e){
    //     const index = e.currentTarget.id;
    //     dispatch("update_fav", {index: index});
    // }

    // function update_made(e){
    //     const index = e.currentTarget.id;
    //     dispatch("update_made", {index: index});
    // }

    function check_item(e){
        const index = e.currentTarget.id;
        dispatch("check_item", {index: index});
    }
</script>
<div class="hidden md:flex flex-col w-full">
    <div class="w-full carousel carousel-center rounded-box space-x-1 border border-primary rounded-md p-1">
        <button id="thumb_up" class="btn btn-xs p-1 made flex content-center category btn-neutral" onclick={select_cat}><ThumbUp color={(selected_cats.cats.includes("thumb_up")) ? "fill-primary" : "fill-black"}/></button>
        <button id="heart" class="btn btn-xs p-1 made flex content-center category btn-neutral" onclick={select_cat}><Heart color={(selected_cats.cats.includes("heart")) ? "fill-primary" : "fill-black"}/></button>
        {#each display_cats.cats as cat}
            <button id="category" class="btn btn-xs {selected_cats.cats.includes(cat)?'btn-primary text-black':'btn-neutral text-black'} category" onclick={select_cat}>{cat}</button> 
        {/each}
        {#each display_cats.cuisines as cuisine}
            <button id="cuisine" class="btn btn-xs {selected_cats.cuisines.includes(cuisine)?'btn-primary text-black':'btn-neutral text-black'} cuisine" onclick={select_cat}>{cuisine}</button> 
        {/each}
        {#each display_cats.countries as country}
            <button id="country" class="btn btn-xs {selected_cats.countries.includes(country)?'btn-primary text-black':'btn-neutral text-black'} country" onclick={select_cat}>{country}</button> 
        {/each}
    </div>
    <div class="form-control flex flex-row justify-between w-full items-center">
        <div clas="flex flex-row content-center items-center">
            <label class="input input-bordered input-sm input-primary flex items-center gap-2 pr-2">
                <input type="text" class="input h-full p-0" placeholder="Search" bind:value={search_val}/>
                <button class="w-5" onclick={()=>{search_val = ""}} onkeydown={()=>{search_val = ""}}>
                    {#if search_val}
                        <Clear size="w-4 h-4"/>
                    {/if}
                </button>
            </label>
            <span id="menu_loading" class="hidden loading loading-dots loading-lg align-middle"></span>
        </div>
        <p class="mx-5 text-xs md:text-sm">{display_recipes ? display_recipes.length+" Recipes" : ""}</p>
        <div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
            <label tabindex="-1" for="sort" class="btn m-1 btn-primary btn-xs md:btn-sm">{sort_val}</label>
            <ul tabindex="-1" name="sort" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                {#each sort_opts as opt}
                    <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button onclick={() => {sort_val = opt; document.activeElement.blur();}}>{opt}</button></li>
                {/each}
            </ul>
        </div>
    </div>
</div>

<div id="recipes" class="h-[calc(100svh-160px)] md:h-[calc(100svh-135px)] overflow-y-auto space-y-2 border border-primary rounded-md md:border-none py-2">
    {#if display_recipes && display_recipes.length}
        {#each display_recipes as curr, i}
            <div class="card card-side bg-base-200 shadow-xl h-24 card-bordered cursor-pointer mx-1" onclick={view} onkeydown={view}>
                <figure class="w-1/4 bg-cover bg-no-repeat bg-center" style="background-image: url('{display_recipes[i].image}')"></figure>
                <div class="card-body h-full flex flex-row p-1 w-3/4 justify-between">
                    <div class="flex flex-col justify-between p-1 w-[70%]">
                        <h2 id={display_recipes[i].id} class="card-title text-sm text-ellipsis overflow-hidden">{display_recipes[i].title}</h2>
                        <div class="flex w-full">
                            <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">
                                {#if isNaN(display_recipes[i].servings)}
                                    {display_recipes[i].servings}
                                {:else}
                                    {display_recipes[i].servings} servings
                                {/if}
                            </div>
                            <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow">
                                {#if display_recipes[i].time}
                                    {display_recipes[i].time}
                                {:else}
                                    no time
                                {/if}
                            </div>
                            <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tr rounded-br">
                                {display_recipes[i].expand.ingr_list.length} ingredients
                            </div>
                        </div>
                    </div>
                    <div class="card-actions flex flex-col justify-evenly items-end items-center  py-1">
                        <div class="flex w-fit space-x-1">
                            <button id={display_recipes[i].id} class="btn btn-xs  p-1 made flex content-center" onclick={(e) => {update_made(e)}}><ThumbUp color={(display_recipes[i].made) ? "fill-primary" : "fill-neutral"}/></button>
                            <button id={display_recipes[i].id} class="btn btn-xs p-1 favorite flex content-center" onclick={(e) => {update_fav(e, "favorite")}}><Heart color={(display_recipes[i].favorite) ? "fill-primary" : "fill-neutral"}/></button>
                        </div>
                        <div class="flex w-fit space-x-2">
                            <input type="checkbox" onclick={check_item} class="checkbox checkbox-primary checkbox-lg p-1" id={display_recipes[i].id} checked={display_recipes[i].checked}>
                            <button class="btn btn-sm p-1 btn-accent {display_recipes[i].id} " onclick={delete_recipe} id={display_recipes[i].id}><DeleteIcon/></button>
                        </div>
                    </div>
                </div>
            </div>
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
        <div class="flex w-fit space-x-2 my-1">
            <label class="input input-bordered input-xs input-primary flex items-center gap-2 pr-0">
                <input type="text" class="input h-full p-0" placeholder="Search" bind:value={search_val}/>
                <button class="w-5" onclick={()=>{search_val = ""}}>
                    {#if search_val}
                        <Clear size="w-3 h-3"/>
                    {/if}
                </button>
            </label>
            <span id="menu_loading" class="hidden loading loading-dots loading-sm md:loading-lg align-middle"></span>
        </div>

        <p class="mx-5 text-xs md:text-sm">{display_recipes ? display_recipes.length+" Recipes" : ""}</p>
        <div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
            <label tabindex="-1" for="sort_mobile" class="btn m-1 btn-primary btn-xs md:btn-sm">Sort</label>
            <ul tabindex="-1" id="sort_mobile" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                {#each sort_opts as opt}
                    <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button tabindex="0" onclick={() => {sort_val = opt; document.activeElement.blur();}}>{opt}</button></li>
                {/each}
            </ul>
        </div>
    </div>
    <div class="w-full carousel carousel-center rounded-box space-x-1 border border-primary rounded-md p-1">
        <button id="thumb_up" class="btn btn-neutral btn-xs category" onclick={select_cat}><ThumbUp color={selected_cats.cats.includes("thumb_up")?'fill-primary':'fill-black'}/></button> 
        <button id="heart" class="btn btn-xs category btn-neutral" onclick={select_cat}><Heart color={selected_cats.cats.includes("heart")?'fill-primary':'fill-black'}/></button> 
        {#each display_cats.cats as cat}
            <button id="category" class="btn btn-xs {selected_cats.cats.includes(cat)?'btn-primary text-black':'btn-neutral text-black'} category" onclick={select_cat}>{cat}</button> 
        {/each}
        {#each display_cats.cuisines as cuisine}
            <button id="cuisine" class="btn btn-xs {selected_cats.cuisines.includes(cuisine)?'btn-primary text-black':'btn-neutral text-black'} cuisine" onclick={select_cat}>{cuisine}</button> 
        {/each}
        {#each display_cats.countries as country}
            <button id="country" class="btn btn-xs {selected_cats.countries.includes(country)?'btn-primary text-black':'btn-neutral text-black'} country" onclick={select_cat}>{country}</button> 
        {/each}
    </div>
</div>