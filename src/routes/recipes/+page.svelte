<script>
  
	import {onMount} from "svelte";
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import InfiniteScroll from "/src/lib/components/infinite_scroll.svelte";
    import Alerts from "../../lib/components/alerts.svelte";
    import RecipeCard from "../../lib/components/recipe_card.svelte";
    import SearchInput from "../../lib/components/search.svelte";
    import Sort from "../../lib/components/sort.svelte";
    import SkeletonCard from "../../lib/components/skeleton_card.svelte";
    import CatCarousel from "../../lib/components/cat_carousel.svelte";


	
	// if the api (like in this example) just have a simple numeric pagination
    let page = 1;
	// but most likely, you'll have to store a token to fetch the next page
	let nextUrl = '';

    let page_size = 30
	// store all the data here.
    // store the new batch of data here.
	let newBatch = $state([]);
    let sort_val = $state("Most Recent");
	let data = $state([]);
	
    let categories = $state([]);
    let display_categories = $state([]);
    let countries = $state([]);
    let display_countries = $state([]);
    let cuisines = $state([]);
    let display_cuisines = $state([]);
    let authors = $state([]);
    let display_authors = $state([]);
    let delay_timer;


    let selected_categories = $state([]);
  
    let selected_countries = $state([]);
  
    let selected_cuisines = $state([]);
  
    let selected_authors = $state([]);
  

    let loading = $state(false);
    let refresh_loading = $state(true);
    let recipes_have_more = $state(true);
  
    let ingr_has_more = $state(true);
  
    let has_more = $derived(recipes_have_more || ingr_has_more);
    let no_results = $state(false);
  
  
    let search_val = $state("");
  
    let max_results = $state(0);
  
    let just_copied = $state(false);
  
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    
    let total_recipes_num = $state(0);

	async function fetchData() {
        
        if (search_val){
            
            //get recipes with title
            const recipes = await pb.collection('recipes').getList(page, page_size/2, {
                filter: get_filter(),
                expand: `notes, ingr_list`,
                sort: get_sort()
            });
            
            recipes_have_more = page < recipes.totalPages; 
            const ingr_recipes = await get_ingr_recipes(search_val);

            
            // compile both lists of recipes
            let final_recipes = [];
            let final_recipe_ids = [];
            for (let i = 0; i < recipes.items.length; i++){
                if (!final_recipe_ids.includes(recipes.items[i].id)){
                    final_recipe_ids.push(recipes.items[i].id);
                    final_recipes.push(recipes.items[i]);
                }
            }
            for (let i = 0; i < ingr_recipes.items.length; i++){
                if (!final_recipe_ids.includes(ingr_recipes.items[i].id)){
                    final_recipe_ids.push(ingr_recipes.items[i].id);
                    final_recipes.push(ingr_recipes.items[i]);
                }
            }
            
            if (!final_recipes && has_more){
                page++;
                fetchData();
            }
            total_recipes_num = ingr_recipes.totalItems ? ingr_recipes.totalItems : recipes.totalItems;
            if (final_recipes.length > total_recipes_num) total_recipes_num = final_recipes.length;
            newBatch = final_recipes;
            data = [...data, ...newBatch];
        } else {
            ingr_has_more = false;
            const recipes = await pb.collection('recipes').getList(page, page_size, {
                filter: get_filter(),
                expand: `notes, ingr_list`,
                sort: get_sort()
            });
            
            recipes_have_more = page < recipes.totalPages; 
            
            total_recipes_num = recipes.totalItems;
            newBatch = recipes.items;
            data = [...data, ...newBatch];1
        }
	};

    async function get_ingr_recipes(){ 
        const ingredients = await pb.collection('ingredients').getList(page, page_size, {
            expand: `recipe, recipe.ingr_list`,
            filter: `ingredient~"${search_val}" && recipe:length > 0`,
            sort: `-created`
        });
        ingr_has_more = page < ingredients.totalPages;
        

        

        const recipe_ids = getUniqueIds(data, 'id');

        let ingr_recipes = [];
        for (let i = 0; i < ingredients.items.length; i++){
            if (ingredients.items[i].expand.recipe){
                
                for (let j = 0; j < ingredients.items[i].expand.recipe.length; j++){
                    
                    if (!ingr_recipes.includes(ingredients.items[i].expand.recipe[j]) && !recipe_ids.includes(ingredients.items[i].expand.recipe[j].id)){
                        // TODO
                        // if ((!selected_category || ingredients.items[i].expand.recipe[j].category == selected_category) &&
                        //     (!selected_country || ingredients.items[i].expand.recipe[j].country == selected_country) &&
                        //     (!selected_cuisine || ingredients.items[i].expand.recipe[j].cuisine == selected_cuisine) &&
                        //     (!selected_author || ingredients.items[i].expand.recipe[j].author == selected_author) &&
                        //     ingredients.items[i].expand.recipe[j]){
                        //     ingr_recipes.push(ingredients.items[i].expand.recipe[j]);
                        // }
                    }
                }
            }
        }

        if (ingr_recipes) return {items: ingr_recipes, totalItems: ingredients.totalItems};
        else return {items: [], totalItems: 0};
    }

    function getUniqueIds(objects, idKey) {
        // Create a new Set to store unique IDs
        const uniqueIdSet = new Set();

        // Filter the objects and add their IDs to the Set
        const uniqueObjects = objects.filter(obj => {
            const id = obj[idKey];
            if (!uniqueIdSet.has(id)) {
            uniqueIdSet.add(id);
            return true;
            }
            return false;
        });

        // Map the unique objects to their IDs
        const uniqueIds = uniqueObjects.map(obj => obj[idKey]);

        return uniqueIds;
    }

    function get_filter(){
        // TODO
        let output = "";
        output = cat_filter_string("category", selected_categories, output);
        output = cat_filter_string("cuisine", selected_cuisines, output);
        output = cat_filter_string("country", selected_countries, output);
        output = cat_filter_string("author", selected_authors, output);
        
        if (['Least Time', 'Most Time'].includes(sort_val)) output += (!output) ? `time_new!=0` : ` && time_new!=0`;
        if (search_val) output += (!output) ? `title~"${search_val}"` : ` && title~"${search_val}"`;
        output += (!output) ? `made=true` : ` && made=true`;
        return output;
    }

    function cat_filter_string(type, selected, curr_string){
        if (selected.length == 0) return curr_string;
        for (let i = 0; i < selected.length; i++){
            if (i == 0){
                if (curr_string) curr_string += " && ";
                curr_string += `(${type}="${selected[i]}"`;
            }
            else curr_string += ` || ${type}="${selected[i]}"`;
            if (i == selected.length - 1) curr_string += ")";
        }
        return curr_string;
    }

    function get_sort(){
        if (sort_val == "Least Recent") return `+created`;
        else if (sort_val == "Most Ingredients") return `-ingr_num`;
        else if (sort_val == "Least Servings") return `+servings`;
        else if (sort_val == "Most Servings") return `-servings`;
        else if (sort_val == "Least Time") return `+time_new`;
        else if (sort_val == "Most Time") return `-time_new`;
        else if (sort_val == "Least Ingredients") return `+ingr_num`;
        else  return `-created`;
    }
	
	onMount(async ()=> {
		// load first batch onMount
        if ($currentUser) await pb.collection('users').authRefresh();
		await fetchData();
        max_results = total_recipes_num;
        categories = await pb.collection('categories').getFullList({sort: `+id`});
        display_categories = categories.map(c => c.id);
        countries = await pb.collection('countries').getFullList({sort: `+id`});
        display_countries = countries.map(c => c.id);
        cuisines = await pb.collection('cuisines').getFullList({sort: `+id`});
        display_cuisines = cuisines.map(c => c.id);
        authors = await pb.collection('authors').getFullList({sort: `+id`});
        display_authors = authors.map(a => a.id);
        refresh_loading = false;
	});

  async function select_cat(e){
    // TODO
    refresh_loading = true;
    toggle_cat(e.currentTarget.id, e.currentTarget.innerHTML);
    page = 1; 
    
    newBatch = [];
    data = [];
    await fetchData();
    await  update_display_cats();
    refresh_loading = false;
    if (!newBatch.length){
        no_results = true;
    } else {
        no_results = false;
    }
  }

  async function update_display_cats(){
    if (!selected_categories.length) display_categories = await update_display_categories();
    if (!selected_cuisines.length) display_cuisines = await update_display_cuisines();
    if (!selected_countries.length) display_countries = await update_display_countries();
    if (!selected_authors.length) display_authors = await update_display_authors();
  }


  function toggle_cat(type, val){
    switch (type) {
        case "category":
            if (selected_categories.includes(val)) {
                selected_categories = selected_categories.filter(category => category !== val);
            } else {
                selected_categories.push(val);
            }
            break;
        case "country":
            if (selected_countries.includes(val)) {
                selected_countries = selected_countries.filter(country => country !== val);
            } else {
                selected_countries.push(val);
            }
            break;
        case "cuisine":
            if (selected_cuisines.includes(val)) {
                selected_cuisines = selected_cuisines.filter(cuisine => cuisine !== val);
            } else {
                selected_cuisines.push(val);
            }
            break;
        case "author":
            if (selected_authors.includes(val)) {
                selected_authors = selected_authors.filter(author => author !== val);
            } else {
                selected_authors.push(val);
            }
            break;
        default:
            break;
    }
  }

  async function load_more(){
    loading = true;
    page++;
    await fetchData();
    loading = false;
  }

  async function update_display_categories(){
    const records = await pb.collection('recipes').getFullList({
        filter: get_filter(),
        fields: 'category'
    });

    const uniqueCategory = [...new Set(records.map(record => record.category))].filter(category => category !== "");
    return uniqueCategory;
  }

  async function update_display_countries(){
    const records = await pb.collection('recipes').getFullList({
        filter: get_filter(),
        fields: 'country'
    });

    const uniqueCountries = [...new Set(records.map(record => record.country))].filter(country => country !== "");
    return uniqueCountries;
  }

  async function update_display_cuisines(){
    const records = await pb.collection('recipes').getFullList({
        filter: get_filter(),
        fields: 'cuisine'
    });

    const uniqueCuisines = [...new Set(records.map(record => record.cuisine))].filter(cuisine => cuisine !== "");
    return uniqueCuisines;
  }

  async function update_display_authors(){
    const records = await pb.collection('recipes').getFullList({
        filter: get_filter(),
        fields: 'author'
    });

    const uniqueAuthors = [...new Set(records.map(record => record.author))].filter(author => author !== "");
    return uniqueAuthors;
  }

    async function update_sort(e){
        refresh_loading = true;
        document.activeElement.blur();
        sort_val = e.currentTarget.innerHTML;
        newBatch = [];
        page = 1; 
        
        newBatch = [];
        data = [];
        await fetchData();
        refresh_loading = false;
    }

    async function update_search(e){
        refresh_loading = true;
        search_val = e.val;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            page = 1; 
            
            newBatch = [];
            data = [];
            await fetchData();
            refresh_loading = false;
            await  update_display_cats();
            document.activeElement.blur();
        }, 250);
    }

    const cook_recipe = (e) => {
        let recipe = data.filter(recipe => recipe.id == e.id)[0];
        window.location = `/cook_recipe/${recipe.url_id}/${recipe.servings}`
    }

    function show_alert(msg, type, title){
        
        alert.show = true;
        alert.msg = msg;
        alert.type = type;
        alert.title = title;
    }
</script>
<svelte:head>
    <meta property="og:title" content="Recipes" />
    <meta property="og:description" content="See What Others are Cooking" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/recipes" />
    <meta property="og:type" content="website" />
</svelte:head>

<main class="flex flex-col w-full justify-center items-center">
  <h4>See what others are cooking</h4>
  <div class="flex w-full justify-center flex-col md:mt-2 space-y-1 md:space-y-2">
    <div class="hidden md:flex flex-row md:flex-col w-full">
        <CatCarousel
            {display_categories}
            {display_cuisines}
            {display_countries}
            {display_authors}
            {selected_categories}
            {selected_cuisines}
            {selected_countries}
            {selected_authors}
            {categories}
            {cuisines}
            {countries}
            {authors}
            {select_cat}
            enable_thumb={false}
            enable_heart={false}
            cnt={40}
        />
    </div>
    <div class="flex w-full justify-center">
        <div class="flex flex-col w-full md:max-w-[1000px] space-y-1 md:space-y-2 content-center">
            <div class="hidden md:flex justify-between items-center mx-1">
                <SearchInput 
                    {update_search}
                />
                <div class="mx-1 text-xs md:text-base">{(total_recipes_num > max_results) ? max_results : total_recipes_num} recipes</div>
                <Sort
                    {sort_val}
                    {update_sort} 
                    type="recipe" 
                />
                </div>
                <ul class="flex flex-col w-full space-y-2 md:space-y-4 h-[calc(100svh-130px)] md:h-[calc(100svh-160px)] overflow-y-auto">
                    {#if data.length && !refresh_loading}
                        {#each data as item}
                            <RecipeCard 
                                recipe={item}
                                type="recipes"
                                servings={item.servings}
                                card_click={cook_recipe}
                            />
                        {/each}
                        <div class="flex w-full h-full justify-center">
                            <span class="{has_more ? "" : "hidden"} loading loading-bars loading-lg mx-7 self-center"></span>
                        </div>
                    {:else if data.length == 0 && !refresh_loading}
                        <div class="{no_results ? "" : "hidden"} w-full flex justify-center items-center h-full">
                            no results
                        </div>
                    {:else}
                        <SkeletonCard 
                            cnt={10} 
                        />
                    {/if}
                <InfiniteScroll
                    {has_more}
                    threshold={100}
                    {load_more} 
                />
            </ul>
            <div class="flex justify-between items-center mx-1 my-0 md:hidden">
                <SearchInput 
                    {update_search}
                />
                <div class="mx-1 text-xs md:text-base">{(total_recipes_num > max_results) ? max_results : total_recipes_num} recipes</div>
                    <Sort
                        {sort_val}
                        {update_sort}
                        type="recipe"
                    />
                </div>
            </div>
        </div>
        <div class="flex md:hidden flex-row md:flex-col mx-1 space-x-1 md:space-x-0 md:space-y-2">
            <CatCarousel    
                {display_categories}
                {display_cuisines}
                {display_countries}
                {display_authors}
                {selected_categories}
                {selected_cuisines}
                {selected_countries}
                {selected_authors}
                {categories}
                {cuisines}
                {countries}
                {authors}
                {select_cat}
                enable_thumb={false}
                enable_heart={false}
                cnt={40}
            />
            </div>
        </div>
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</main>