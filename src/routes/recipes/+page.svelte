<script>
  import { run, stopPropagation } from 'svelte/legacy';

	import {onMount} from "svelte";
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import InfiniteScroll from "/src/lib/components/infinite_scroll.svelte";
    import Clear from "/src/lib/icons/Clear.svelte";
    import {sort_recipes} from "/src/lib/sort.js";
    import Plus from "/src/lib/icons/Plus.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import Alerts from "../../lib/components/alerts.svelte";


	
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
    let sort_opts = ["Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let delay_timer;


    let selected_categories = $state([]);
  
    let selected_countries = $state([]);
  
    let selected_cuisines = $state([]);
  
    let selected_authors = $state([]);
  

    let loading = $state(true);
  
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
        if (selected_categories.length){
            for (let i = 0; i < selected_categories.length; i++){
                if (i == 0) output += `(category="${selected_categories[i]}"`;
                else output += ` || category="${selected_categories[i]}"`;
                if (i == selected_categories.length - 1) output += ")";
            }
        }
        if (selected_countries.length){
            for (let i = 0; i < selected_countries.length; i++){
                if (i == 0){
                    if (output) output += " && ";
                    output += `(country="${selected_countries[i]}"`;
                }
                else output += ` || country="${selected_countries[i]}"`;
                if (i == selected_countries.length - 1) output += ")";
            }
        }
        if (selected_cuisines.length){
            for (let i = 0; i < selected_cuisines.length; i++){
                if (i == 0){
                    if (output) output += " && ";
                    output += `(cuisine="${selected_cuisines[i]}"`;
                }
                else output += ` || cuisine="${selected_cuisines[i]}"`;
                if (i == selected_cuisines.length - 1) output += ")";
            }
        }
        if (selected_authors.length){
            for (let i = 0; i < selected_authors.length; i++){
                if (i == 0){
                    if (output) output += " && ";
                    output += `(author="${selected_authors[i]}"`;
                }
                else output += ` || author="${selected_authors[i]}"`;
                if (i == selected_authors.length - 1) output += ")";
            }
        }
        if (['Least Time', 'Most Time'].includes(sort_val)) output += (!output) ? `time_new!=0` : ` && time_new!=0`;
        if (search_val) output += (!output) ? `title~"${search_val}"` : ` && title~"${search_val}"`;
        output += (!output) ? `made=true` : ` && made=true`;
        console.log(output);
        return output;
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
        loading = false;
	});

  async function select_cat(e){
    // TODO
    loading = true;
    if (e.currentTarget.id == "category"){
        console.log("add to categories", e.currentTarget.innerHTML);
        if (!selected_categories.includes(e.currentTarget.innerHTML)) {
            selected_categories.push(e.currentTarget.innerHTML);
        } else {
            selected_categories = selected_categories.filter(category => category !== e.currentTarget.innerHTML);
        }
        display_countries = await update_display_countries();
        display_cuisines = await update_display_cuisines();
        display_authors = await update_display_authors();
    } else if (e.currentTarget.id == "country"){
        if (!selected_countries.includes(e.currentTarget.innerHTML)) {
            selected_countries.push(e.currentTarget.innerHTML);
        } else {
            selected_countries = selected_countries.filter(category => category !== e.currentTarget.innerHTML);
        }
        display_categories = await update_display_categories();
        display_cuisines = await update_display_cuisines();
        display_authors = await update_display_authors();
    } else if (e.currentTarget.id == "cuisine"){
        if (!selected_cuisines.includes(e.currentTarget.innerHTML)) {
            selected_cuisines.push(e.currentTarget.innerHTML);
        } else {
            selected_cuisines = selected_cuisines.filter(category => category !== e.currentTarget.innerHTML);
        }
        display_countries = await update_display_countries();
        display_categories = await update_display_categories();
        display_authors = await update_display_authors();
    } else if (e.currentTarget.id == "author"){
        if (!selected_authors.includes(e.currentTarget.innerHTML)) {
            selected_authors.push(e.currentTarget.innerHTML);
        } else {
            selected_authors = selected_authors.filter(category => category !== e.currentTarget.innerHTML);
        }
        display_countries = await update_display_countries();
        display_cuisines = await update_display_cuisines();
        display_categories = await update_display_categories();
    }
    page = 1; 
    
    newBatch = [];
    data = [];
    await fetchData();
    loading = false;
    if (!newBatch.length){
        no_results = true;
    } else {
        no_results = false;
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
        loading = true;
        sort_val = e.srcElement.innerHTML;
        newBatch = [];
        page = 1; 
        
        newBatch = [];
        data = [];
        await fetchData();
        loading = false;
        document.activeElement.blur();
    }

    async function update_search(e){
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            loading = true;
            page = 1; 
            
            newBatch = [];
            data = [];
            await fetchData();
            loading = false;
            document.activeElement.blur();
        }, 2000);
    }

    async function add_recipe(e){
        
        if (!$currentUser){
            if (window.confirm("you must login to add this recipe to your list. Do you want to sign in?")) {
                window.open(`/login`, "Thanks for Visiting!");
            }
        } else if (!$currentUser.verified){
            show_alert("Please verify your email to add recipes", "error", "Please verify your email");
            return;
        } else {
            const recipe_to_add = data.filter((curr) => curr.id == e.currentTarget.id)[0];
            
            const recipe_in = {
                "title": recipe_to_add.title,
                "description": recipe_to_add.description,
                "url": recipe_to_add.url,
                "author": recipe_to_add.author,
                "time": recipe_to_add.time,
                "directions": recipe_to_add.directions,
                "user": $currentUser.id,
                "image": recipe_to_add.image,
                "servings": recipe_to_add.servings,
                "cuisine": recipe_to_add.cuisine,
                "country": recipe_to_add.country,
                "notes": recipe_to_add.notes,
                "ingr_list": recipe_to_add.ingr_list,
                "category": recipe_to_add.category,
                "url_id": recipe_to_add.url_id,
                "made": false,
                "favorite": false,
                "time_new": recipe_to_add.time_new,
                "ingr_num": recipe_to_add.ingr_num
            };
            
            let recipe_result = await pb.collection('recipes').create(recipe_in);
            
            just_copied = recipe_to_add.id;
            clearTimeout(delay_timer);
            delay_timer = setTimeout(function() {
                just_copied = false;
            }, 2000);
        }
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
        <div class="carousel carousel-center rounded-box space-x-1 border border-primary rounded-md p-1 mx-2">
            <!-- <button id="thumb_up" class="btn btn-xs p-1 made flex content-center category bg-transparent border-none" onclick={select_cat}><ThumbUp color={(selected_cats.cats.includes("thumb_up")) ? "fill-primary" : "fill-neutral"}/></button>
            <button id="heart" class="btn btn-xs p-1 made flex content-center category  bg-transparent border-none" onclick={select_cat}><Heart color={(selected_cats.cats.includes("heart")) ? "fill-primary" : "fill-neutral"}/></button> -->
            {#each display_categories as cat}
                <button id="category" class="btn btn-xs {selected_categories.includes(cat)?'btn-primary text-black':'bg-base-300 text-neutral'} category" onclick={select_cat}>{cat}</button> 
            {/each}
            {#each display_cuisines as cuisine}
                <button id="cuisine" class="btn btn-xs {selected_cuisines.includes(cuisine)?'btn-primary text-black':'bg-base-300 text-neutral'} cuisine" onclick={select_cat}>{cuisine}</button> 
            {/each}
            {#each display_authors as author}
                <button id="author" class="btn btn-xs {selected_authors.includes(author)?'btn-primary text-black':'bg-base-300 text-neutral'} cuisine" onclick={select_cat}>{author}</button> 
            {/each}
            {#each display_countries as country}
                <button id="country" class="btn btn-xs {selected_countries.includes(country)?'btn-primary text-black':'bg-base-300 text-neutral'} country" onclick={select_cat}>{country}</button> 
            {/each}
        </div>
    </div>
    <div class="flex w-full justify-center">
        <div class="flex flex-col w-full md:w-3/4 max-w-3xl space-y-1 md:space-y-2 content-center">
            <div class="hidden md:flex justify-between items-center mx-1">
                <div class="form-control md:w-auto md:max-w-xs">
                    <label class="input input-bordered input-sm input-primary flex items-center gap-2 pr-0">
                        <input type="text" class="input h-full p-0 w-28" placeholder="Search" onkeyup={update_search} bind:value={search_val}/>
                        <button class="w-5" onclick={()=>{search_val = ""; update_search();}} onkeydown={()=>{search_val = ""; update_search();}}>
                            {#if search_val}
                                <Clear size="w-3 h-3"/>
                            {/if}
                        </button>
                    </label>
                </div>
                <div class="mx-1 text-xs md:text-base">{(total_recipes_num > max_results) ? max_results : total_recipes_num} recipes</div>
                <div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
                      <label tabindex="-1" for="sort" class="btn m-1 btn-primary btn-xs md:btn-sm">{sort_val}</label>
                      <ul tabindex="-1" name="sort" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                          {#each sort_opts as opt}
                              <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button onclick={update_sort} onkeydown={update_sort}>{opt}</button></li>
                          {/each}
                      </ul>
                  </div>
                </div>
            <ul class="flex flex-col w-full max-w-3xl space-y-2 md:space-y-4 h-[calc(100svh-130px)] md:h-[calc(100svh-125px)] overflow-y-auto">
              {#each data as item}
                  <div class="card card-side bg-base-200 h-24 card-bordered border-primary cursor-pointer mx-1" onkeydown={window.location = `/cook_recipe/${item.url_id}/${item.servings}`} onclick={window.location = `/cook_recipe/${item.url_id}/${item.servings}`}>
                      <figure class="w-1/4 bg-cover bg-no-repeat bg-center" style="background-image: url('{item.image}')"></figure>
                      <div class="card-body h-full flex flex-row p-1 w-3/4 justify-between">
                          <div class="flex flex-col justify-between p-1 md:p-3 w-full">
                              <h2 id={item.id} class="card-title text-sm text-ellipsis overflow-hidden">{item.title}</h2>
                              <div class="flex w-full items-center">
                                  <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">
                                      {#if isNaN(item.servings)}
                                          {item.servings}
                                      {:else}
                                          {item.servings} servings
                                      {/if}
                                  </div>
                                  <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow">
                                      {#if item.time}
                                          {item.time}
                                      {:else}
                                          no time
                                      {/if}
                                  </div>
                                  <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tr rounded-br">
                                      {item.expand.ingr_list.length} ingredients
                                  </div>
                                  {#if !$currentUser || $currentUser.id != item.user}
                                    <button id={item.id} class="btn btn-primary btn-xs w-6 ml-2 p-0" onclick={stopPropagation(add_recipe)} onkeydown={stopPropagation(add_recipe)}>
                                        {#if just_copied == item.id}
                                            <CheckMark color=""/>
                                        {:else}
                                            <Plus/>
                                        {/if}
                                    </button>
                                  {/if}
                              </div>
                          </div>
                      </div>
                  </div>
              {/each}
              <div class="flex w-full h-full justify-center">
                <span class="{has_more ? "" : "hidden"} loading loading-bars loading-lg mx-7 self-center"></span>
              </div>
              <div class="{no_results ? "" : "hidden"} w-full flex justify-center items-center h-full">
                    no results
                </div>
              <InfiniteScroll
              hasMore={has_more}
              threshold={100}
              on:loadMore={load_more} />
          </ul>
          <div class="flex justify-between items-center mx-1 my-0 md:hidden">
            <div class="form-control md:w-auto md:max-w-xs">
                <label class="input input-bordered input-xs input-primary flex items-center gap-2 pr-0">
                    <input type="text" class="input h-full p-0 w-28" placeholder="Search" onkeyup={update_search} bind:value={search_val}/>
                    <button class="w-5" onclick={()=>{search_val = ""; update_search();}} onkeydown={()=>{search_val = ""; update_search();}}>
                        {#if search_val}
                            <Clear size="w-3 h-3"/>
                        {/if}
                    </button>
                </label>
            </div>
            <div class="mx-1 text-xs md:text-base">{(total_recipes_num > max_results) ? max_results : total_recipes_num} recipes</div>
            <div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
                  <label tabindex="-1" for="sort_mobile" class="btn m-0 btn-primary btn-xs md:btn-sm">{sort_val}</label>
                  <ul tabindex="-1" name="sort_mobile" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                      {#each sort_opts as opt}
                          <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button onclick={update_sort}>{opt}</button></li>
                      {/each}
                  </ul>
              </div>
            </div>
        </div>
    </div>
    <div class="flex md:hidden flex-row md:flex-col mx-1 space-x-1 md:space-x-0 md:space-y-2">
        <div class="carousel carousel-center rounded-box space-x-1 border border-primary rounded-md p-1">
            <!-- <button id="thumb_up" class="btn btn-xs p-1 made flex content-center category bg-transparent border-none" onclick={select_cat}><ThumbUp color={(selected_cats.cats.includes("thumb_up")) ? "fill-primary" : "fill-neutral"}/></button>
            <button id="heart" class="btn btn-xs p-1 made flex content-center category  bg-transparent border-none" onclick={select_cat}><Heart color={(selected_cats.cats.includes("heart")) ? "fill-primary" : "fill-neutral"}/></button> -->
            {#each display_categories as cat}
                <button id="category" class="btn btn-xs {selected_categories.includes(cat)?'btn-primary text-black':'bg-base-300 text-neutral'} category" onclick={select_cat}>{cat}</button> 
            {/each}
            {#each display_cuisines as cuisine}
                <button id="cuisine" class="btn btn-xs {selected_cuisines.includes(cuisine)?'btn-primary text-black':'bg-base-300 text-neutral'} cuisine" onclick={select_cat}>{cuisine}</button> 
            {/each}
            {#each display_authors as author}
                <button id="cuisine" class="btn btn-xs {selected_authors.includes(author)?'btn-primary text-black':'bg-base-300 text-neutral'} cuisine" onclick={select_cat}>{author}</button> 
            {/each}
            {#each display_countries as country}
                <button id="country" class="btn btn-xs {selected_countries.includes(country)?'btn-primary text-black':'bg-base-300 text-neutral'} country" onclick={select_cat}>{country}</button> 
            {/each}
        </div>
    </div>
  </div>
  <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</main>