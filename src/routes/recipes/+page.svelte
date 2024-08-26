<script>
	import {afterUpdate, onMount} from "svelte";
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import InfiniteScroll from "/src/lib/components/infinite_scroll.svelte";
    import Clear from "/src/lib/icons/Clear.svelte";
    import {sort_recipes} from "/src/lib/sort.js";
    import Plus from "/src/lib/icons/Plus.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";

	
	// if the api (like in this example) just have a simple numeric pagination
    let page = 1;
	// but most likely, you'll have to store a token to fetch the next page
	let nextUrl = '';

    let page_size = 30
	// store all the data here.
	let data = [];
	// store the new batch of data here.
	let newBatch = [];
    let categories = [];
    let countries = [];
    let cuisines = [];
    let authors = [];
    let sort_opts = ["Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let web_sites = [];
    let delay_timer;


    $: selected_category = null;
    $: selected_country = null;
    $: selected_cuisine = null;
    $: selected_author = null;

    $: loading = true;
    $: recipes_have_more = true;
    $: ingr_has_more = true;
    $: has_more = recipes_have_more || ingr_has_more;
    $: no_results = false;
    $: sort_val = "Most Recent";
    $: search_val = "";
    $: max_results = 0;
    $: just_copied = false;
    
    let total_recipes_num = 0;
	
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
                        if ((!selected_category || ingredients.items[i].expand.recipe[j].category == selected_category) &&
                            (!selected_country || ingredients.items[i].expand.recipe[j].country == selected_country) &&
                            (!selected_cuisine || ingredients.items[i].expand.recipe[j].cuisine == selected_cuisine) &&
                            (!selected_author || ingredients.items[i].expand.recipe[j].author == selected_author) &&
                            ingredients.items[i].expand.recipe[j]){
                            ingr_recipes.push(ingredients.items[i].expand.recipe[j]);
                        }
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
        let output = "";
        if (selected_category) output += `category="${selected_category}"`;
        if (selected_country) output += (!output) ? `country="${selected_country}"` : ` && country="${selected_country}"`;
        if (selected_cuisine) output += (!output) ? `cuisine="${selected_cuisine}"` : `&& cuisine="${selected_cuisine}"`;
        if (selected_author) output += (!output) ? `author="${selected_author}"` : `&& author="${selected_author}"`;
        if (['Least Time', 'Most Time'].includes(sort_val)) output += (!output) ? `time_new!=0` : `&& time_new!=0`;
        if (search_val) output += (!output) ? `title~"${search_val}"` : `&& title~"${search_val}"`;
        output += (!output) ? `made=true` : `&& made=true`;
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
		await fetchData();
        max_results = total_recipes_num;
        categories = await pb.collection('categories').getFullList({sort: `+id`});
        countries = await pb.collection('countries').getFullList({sort: `+id`});
        cuisines = await pb.collection('cuisines').getFullList({sort: `+id`});
        authors = await pb.collection('authors').getFullList({sort: `+id`});
        loading = false;
	});

  $: data = sort_recipes(sort_val, [
		...data,
    ...newBatch
  ]);

  async function select_cat(e){
    loading = true;
    if (e.currentTarget.firstChild.innerHTML == 'category') {
        if (e.currentTarget.value == "null") selected_category = null;
        else selected_category = e.currentTarget.value;
    } else if (e.currentTarget.firstChild.innerHTML == 'country') {
        if (e.currentTarget.value == "null") selected_country = null;
        else selected_country = e.currentTarget.value;
    } else if (e.currentTarget.firstChild.innerHTML == 'cuisine') {
        if (e.currentTarget.value == "null") selected_cuisine = null;
        else selected_cuisine = e.currentTarget.value;
    } else if (e.currentTarget.firstChild.innerHTML == 'author') {
        if (e.currentTarget.value == "null") selected_author = null;
        else selected_author = e.currentTarget.value;
    }
    if (e.currentTarget.value == "null") e.currentTarget.value = null;
    page = 1; 
    data = []; 
    newBatch = [];
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

    async function update_sort(e){
        loading = true;
        sort_val = e.srcElement.innerHTML;
        newBatch = [];
        page = 1; 
        data = []; 
        newBatch = [];
        await fetchData();
        loading = false;
        document.activeElement.blur();
    }

    async function update_search(e){
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            loading = true;
            page = 1; 
            data = []; 
            newBatch = [];
            await fetchData();
            loading = false;
            document.activeElement.blur();
        }, 2000);
    }

    async function add_recipe(e){
        if (!$currentUser){
            if (window.confirm("you must login to add this recipe to your list. Do you want to sign in?")) {
                window.open(`login`, "Thanks for Visiting!");
            }
        }else {
            const recipe_to_add = data.filter((curr) => curr.id == e.currentTarget.id)[0];
            console.log({recipe_to_add});
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
            console.log({recipe_in});
            let recipe_result = await pb.collection('recipes').create(recipe_in);
            console.log({recipe_result});
            just_copied = true;
            clearTimeout(delay_timer);
            delay_timer = setTimeout(function() {
                just_copied = false;
            }, 2000);
        }
    }
</script>

<main class="flex flex-col w-full justify-center items-center">
  <h4>See what others are cooking</h4>
  <div class="flex w-full justify-center flex-col md:flex-row mt-2 space-y-1 md:space-y-2">
    <div class="flex flex-row md:flex-col mx-1 space-x-1 md:space-x-0 md:space-y-2">
        <select bind:value={selected_category} on:change={select_cat} class="select select-sm select-bordered border-primary w-full max-w-xs pl-1">
            <option value={null}>category</option>
            {#each categories as curr}
                <option>{curr.id}</option>
            {/each}
        </select>
        <select bind:value={selected_country} on:change={select_cat} class="select select-sm select-bordered border-primary w-full max-w-xs pl-1">
            <option value={null}>country</option>
            {#each countries as curr}
                <option>{curr.id}</option>
            {/each}
        </select>
        <select bind:value={selected_cuisine} on:change={select_cat} class="select select-sm select-bordered border-primary w-full max-w-xs pl-1">
            <option value={null}>cuisine</option>
            {#each cuisines as curr}
                <option>{curr.id}</option>
            {/each}
        </select>
        <select bind:value={selected_author} on:change={select_cat} class="select select-sm select-bordered border-primary w-full max-w-xs pl-1">
            <option value={null}>author</option>
            {#each authors as curr}
                <option>{curr.id}</option>
            {/each}
        </select>

    </div>
    <div class="flex flex-col w-full md:w-3/4 max-w-3xl space-y-1 md:space-y-2">
        <div class="flex justify-between items-center mx-1">
            <div class="form-control md:w-auto md:max-w-xs">
                <label class="input input-bordered input-sm input-primary flex items-center gap-2 pr-0">
                    <input type="text" class="input h-full p-0 w-28" placeholder="Search" on:keyup={update_search} bind:value={search_val}/>
                    <div class="w-5" on:click={()=>{search_val = ""; update_search();}} on:keydown={()=>{search_val = ""; update_search();}}>
                        {#if search_val}
                            <Clear size="w-3 h-3"/>
                        {/if}
                    </div>
                </label>
            </div>
            <div class="mx-1 text-xs md:text-base">{(total_recipes_num > max_results) ? max_results : total_recipes_num} recipes</div>
            <div class="dropdown dropdown-end">
                  <label tabindex="0" class="btn m-1 btn-primary btn-xs md:btn-sm">{sort_val}</label>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                      {#each sort_opts as opt}
                          <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><a on:click={update_sort}>{opt}</a></li>
                      {/each}
                  </ul>
              </div>
        </div>
      <ul class="flex flex-col w-full max-w-3xl space-y-2 md:space-y-4 h-[calc(100svh-135px)] md:h-[calc(100svh-125px)] overflow-y-auto">
          {#each data as item}
              <div class="card card-side bg-base-200 shadow-xl h-24 card-bordered border-primary cursor-pointer mx-1" on:keydown={window.location = `/cook_recipe/${item.url_id}/${item.servings}`} on:click={window.location = `/cook_recipe/${item.url_id}/${item.servings}`}>
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
                                <div id={item.id} class="btn btn-primary btn-xs w-6 ml-2 p-0" on:click|stopPropagation={add_recipe} on:keydown|stopPropagation={add_recipe}>
                                    {#if just_copied}
                                        <CheckMark/>
                                    {:else}
                                        <Plus/>
                                    {/if}
                                </div>
                              {/if}
                          </div>
                      </div>
                  </div>
              </div>
          {/each}
          <span class="{loading ? "" : "hidden"} loading loading-dots loading-md mx-7 self-center"></span>
          <div class="{no_results ? "" : "hidden"} w-full flex justify-center items-center h-full">
                no results
            </div>
          <InfiniteScroll
          hasMore={has_more}
          threshold={100}
          on:loadMore={load_more} />
      </ul>
    </div>
  </div>
</main>