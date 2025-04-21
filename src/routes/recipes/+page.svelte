<script>
  
	import {onMount} from "svelte";
    import { pb, currentUser, auth_refresh, pb_url } from '/src/lib/pocketbase.js';
    import InfiniteScroll from "/src/lib/components/infinite_scroll.svelte";
    import Alerts from "../../lib/components/alerts.svelte";
    import RecipeCard from "../../lib/components/search_recipe_card.svelte";
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
    let just_copied = $state("");


    let selected_categories = $state([]);
  
    let selected_countries = $state([]);
  
    let selected_cuisines = $state([]);
  
    let selected_authors = $state([]);
  

    let loading = $state(false);
    let refresh_loading = $state(true);
    let recipes_have_more = $state(true);
  
    let no_results = $state(false);
  
  
    let search_val = $state("");
  
    let max_results = $state(0);
  
  
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    
    let total_recipes_num = $state(0);
    let flags = $state({});

	async function fetchData() {
        const result = await search_recipes();
        recipes_have_more = result.page < result.totalPages;
        total_recipes_num = result.totalItems;
        newBatch = result.recipes;
        data = [...data, ...newBatch];
        display_authors = result.authors.map(a => a.id);
        authors = display_authors;
        display_cuisines = result.cuisines.map(a => a.id);
        cuisines = display_cuisines;
        display_countries = result.countries.map(a => a.id);
        countries = display_countries;
        display_categories = result.categories.map(a => a.id);
        categories = display_categories;
	};
	
	onMount(async ()=> {
		// load first batch onMount
        if ($currentUser){
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            } else {
                const flag_result = await pb.collection('flags').getFirstListItem(`user="${$currentUser.id}"`);
                flags = flag_result;
            }
        }
		await fetchData();
        max_results = total_recipes_num;
        refresh_loading = false;
	});

    async function select_cat(e){
        // TODO
        refresh_loading = true;
        scroll_to_top();
        toggle_cat(e.currentTarget.id, e.currentTarget.innerHTML);
        page = 1; 
        
        newBatch = [];
        data = [];
        await fetchData();
        refresh_loading = false;
        if (!newBatch.length){
            no_results = true;
        } else {
            no_results = false;
        }
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

    async function update_sort(e){
        refresh_loading = true;
        scroll_to_top();
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
        scroll_to_top();
        search_val = e.val;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            page = 1; 
            
            newBatch = [];
            data = [];
            await fetchData();
            refresh_loading = false;
        }, 500);
    }

    const cook_recipe = (e) => {
        let recipe = data.filter(recipe => recipe.id == e.id)[0];
        window.location = `/cook_recipe/${recipe.url_id}/${recipe.servings}`
    }

    function show_error(title){
        show_alert("", "error", title);
    }

    function show_alert(msg, type, title){
        alert.show = true;
        alert.msg = msg;
        alert.type = type;
        alert.title = title;
    }

    function scroll_to_top(){
        document.getElementById('recipes').scrollTop = 0;
    }

    async function search_recipes(){
        const body = JSON.stringify({
                    search_val,
                    sort_val,
                    page,
                    selected_categories,
                    selected_countries,
                    selected_cuisines,
                    selected_authors,
                    per_page: 20
                });
        try {
            const response = await fetch(`${pb_url}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    async function copy_recipe(e){
        console.log($currentUser);
        if (!$currentUser){
            if (window.confirm("you must login to add this recipe to your list. Do you want to sign in?")) {
                window.open(`/login`, "Thanks for Visiting!");
            }
        } else if (!$currentUser.verified){
            show_alert("Please verify your email to add recipes", "error", "Please verify your email");
            return;
        } else {
            const body = JSON.stringify({
                        recipe_id: e.id,
                        user_id: $currentUser.id
                    });
            try {
                const response = await fetch(`${pb_url}/api/copy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: body
                });
                just_copied = e.id;
                clearTimeout(delay_timer);
                delay_timer = setTimeout(async () => {
                    just_copied = "";
                }, 2000);
                return;
            } catch (error) {
                console.log(error);
            }
        }
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
    <div class="hidden md:flex flex-row md:flex-col m-2">
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
                <ul id="recipes" class="flex flex-col w-full space-y-2 md:space-y-4 h-[calc(100svh-130px)] md:h-[calc(100svh-180px)] overflow-y-auto px-1">
                    {#if data.length && !refresh_loading}
                        {#each data as item}
                            <RecipeCard 
                                recipe={item}
                                type="recipes"
                                servings={item.servings}
                                {flags}
                                card_click={cook_recipe}
                                add_click={copy_recipe}
                                {just_copied}
                            />
                        {/each}
                        <div class="flex w-full h-full justify-center">
                            <span class="{recipes_have_more ? "" : "hidden"} loading loading-bars loading-lg mx-7 self-center"></span>
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
                    has_more={recipes_have_more}
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