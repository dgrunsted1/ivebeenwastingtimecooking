<script>
    import { stopPropagation } from 'svelte/legacy';

    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { onMount } from 'svelte';
    import Menu from "/src/lib/components/menu.svelte";
    import { get_grocery_list, trim_verbs } from '/src/lib/merge_ingredients.js';
    import Clear from "/src/lib/icons/Clear.svelte";
    import { get_servings } from '/src/lib/recipe_util.js';
    import { update_menu_mults, get_total_time } from '/src/lib/menu_utils.js';
    import MenuCard from "/src/lib/components/menu_card.svelte";

    
    let user_menus = $state([]);
    
    let modal_menu = $state({});
    
    let loading = $state(true);
    
    let sort_val = $state("Most Recent");
    let total_servings = $derived((!modal_menu.expand) ? 0 : get_servings(modal_menu.expand.recipes, {}, modal_menu.servings));
    let delay_timer;
    let sort_opts = ["Least Recipes", "Most Recipes", "Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let search_val = $state("");
    
    let no_results_found = $state(false);
    

    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        else await pb.collection('users').authRefresh();
        const result_list = await pb.collection('menus').getList(1, 250, {
            filter: `user="${$currentUser.id}" && recipes:length > 0`,
            expand: `recipes,recipes.ingr_list`,
            sort: `-created`
        });
        user_menus = result_list.items;
        loading = false;
    });

    function show_menu_modal(e){
        const is_mobile = (window.getComputedStyle(document.getElementById("desktop_menu")).display == "none") ? true : false;
        let id = e.detail.id;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id == id){
                modal_menu = user_menus[i];
                // total_servings = get_servings(modal_menu.expand.recipes, {}, modal_menu.servings);
            }
        }
        if (is_mobile) my_modal_2.showModal();
    }

    async function delete_menu(e){
        let tmp_menus = [];
        let menu;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id != e.detail.id) tmp_menus.push(user_menus[i]);
            else menu = user_menus[i];
        }
        if (menu && confirm(`Are you sure you want to delete your "${menu.title}" menu?`)) {
            const resultList = await pb.collection('grocery_lists').getList(1, 50, {
                filter: `menu = "${e.detail.id}"`,
            });
            if (resultList.items.length > 0){
                for (let i = 0; i < resultList.items.length; i++){
                    await pb.collection('grocery_lists').update(resultList.items[i].id, { "menu": null });
                }
            }
            const resultListLog = await pb.collection('menu_log').getList(1, 50, {
                filter: `menu = "${e.detail.id}"`,
            });
            if (resultListLog.items.length > 0){
                for (let i = 0; i < resultListLog.items.length; i++){
                    await pb.collection('menu_log').update(resultListLog.items[i].id, { "menu": null });
                }
            }
            await pb.collection('menus').delete(e.detail.id);
            user_menus = tmp_menus;
        }
    }
    
    async function search(){
        no_results_found = false;
        loading = true;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            
            let search_str = search_val;
            let recipe_ids = [];
            if (search_str == ""){
                const result_list = await pb.collection('menus').getList(1, 250, {
                    filter: `user="${$currentUser.id}"`,
                    expand: `recipes,recipes.ingr_list`
                });
                user_menus = result_list.items;
                sort_menus();
                return;
            }
            const result_ingr = await pb.collection('ingredients').getList(1, 250, {
                filter: `ingredient ~ '${search_str}' && recipe.user="${$currentUser.id}"`,
                expand: `recipe`
            });
            for (let i = 0; i < result_ingr.items.length; i++){
                for (let j = 0; j < result_ingr.items[i].recipe.length; j++){
                    if (!recipe_ids.includes(result_ingr.items[i].recipe[j])) recipe_ids.push(result_ingr.items[i].recipe[j]);
                }
            }
            const result_recipe = await pb.collection('recipes').getList(1, 250, {
                filter: `title ~ '${search_str}' && user="${$currentUser.id}"`,
            });
            for (let i = 0; i < result_recipe.items.length; i++){
                if (!recipe_ids.includes(result_recipe.items[i].id)) recipe_ids.push(result_recipe.items[i].id);
            }
            let recipe_id_string = "";
            for (let i = 0; i < recipe_ids.length; i++){
                recipe_id_string += ` || recipes ~ '${recipe_ids[i]}'`;
            }
            const result_menu = await pb.collection('menus').getList(1, 250, {
                filter: `title ~ '${search_str}'${recipe_id_string} && user="${$currentUser.id}"`,
                expand: `recipes,recipes.ingr_list`
            });
            if (result_menu.items.length == 0){
                loading = false;
                no_results_found = true;
                user_menus = [];
                return;
            }
            user_menus = result_menu.items;
            sort_menus();
            loading = false;
        }, 1000);
    }

    function sort_menus(){
        loading = true;
        switch (sort_val) {
            case "Least Recipes":
                user_menus = user_menus.sort(compare_recipe_amounts_asc);
                break;
            case "Most Recipes":
                user_menus = user_menus.sort(compare_recipe_amounts_dsc);
                break;
            case "Least Ingredients":
                user_menus = user_menus.sort(compare_ingr_amounts_asc);
                break;
            case "Most Ingredients":
                user_menus = user_menus.sort(compare_ingr_amounts_dsc);
                break;
            case "Least Time":
                user_menus = user_menus.sort(compare_time_amounts_asc);        
                break;
            case "Most Time":
                user_menus = user_menus.sort(compare_time_amounts_dsc);
                break;
            case "Least Servings":
                user_menus = user_menus.sort(compare_serving_amounts_asc);
                break;
            case "Most Servings":
                user_menus = user_menus.sort(compare_serving_amounts_dsc);
                break;
            case "Least Recent":
                user_menus = user_menus.sort(compare_recent_asc);
                break;
            case "Most Recent":
                user_menus = user_menus.sort(compare_recent_dsc);
                break;
            default:
                break;
        }
        document.activeElement.blur();
        loading = false;
    }

    function compare_recipe_amounts_asc(a, b){
        if ( a.expand.recipes.length < b.expand.recipes.length ){
            return -1;
        }
        if ( a.expand.recipes.length > b.expand.recipes.length ){
            return 1;
        }
        return 0;
    }

    function compare_recipe_amounts_dsc(a, b){
        if ( a.expand.recipes.length > b.expand.recipes.length ){
            return -1;
        }
        if ( a.expand.recipes.length < b.expand.recipes.length ){
            return 1;
        }
        return 0;
    }

    function compare_ingr_amounts_asc(a, b){
        if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length < get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
            return -1;
        }
        if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length > get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
            return 1;
        }
        return 0;
    }

    function compare_ingr_amounts_dsc(a, b){
        if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length > get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
            return -1;
        }
        if ( get_grocery_list(a.expand.recipes, a.servings, a.sub_recipes).length < get_grocery_list(b.expand.recipes, b.servings, b.sub_recipes).length ){
            return 1;
        }
        return 0;
    }

    function compare_serving_amounts_asc(a, b){
        if ( get_servings(a.expand.recipes) < get_servings(b.expand.recipes) ){
            return -1;
        }
        if ( get_servings(a.expand.recipes) > get_servings(b.expand.recipes) ){
            return 1;
        }
        return 0;
    }

    function compare_serving_amounts_dsc(a, b){
        if ( get_servings(a.expand.recipes) > get_servings(b.expand.recipes) ){
            return -1;
        }
        if ( get_servings(a.expand.recipes) < get_servings(b.expand.recipes) ){
            return 1;
        }
        return 0;
    }

    function compare_time_amounts_asc(a, b){
        if ( get_total_time(a.expand.recipes).val < get_total_time(b.expand.recipes).val ){
            return -1;
        }
        if ( get_total_time(a.expand.recipes).val > get_total_time(b.expand.recipes).val ){
            return 1;
        }
        return 0;
    }

    function compare_time_amounts_dsc(a, b){
        if ( get_total_time(a.expand.recipes).val > get_total_time(b.expand.recipes).val ){
            return -1;
        }
        if ( get_total_time(a.expand.recipes).val < get_total_time(b.expand.recipes).val ){
            return 1;
        }
        return 0;
    }

    function compare_recent_asc(a, b){
        if ( a.created < b.created ){
            return -1;
        }
        if ( a.created > b.created ){
            return 1;
        }
        return 0;
    }

    function compare_recent_dsc(a, b){
        if ( a.created > b.created ){
            return -1;
        }
        if ( a.created < b.created ){
            return 1;
        }
        return 0;
    }

    async function update_mult(e){
        const newServings = { ...modal_menu.servings };
        newServings[e.detail.id] = e.detail.mult;
        modal_menu.servings = await update_menu_mults(modal_menu.id, newServings);
    }

    async function remove_from_menu(e){
        e.stopPropagation();
        let tmp = []
        let delete_msg = "";
        for (let recipe of modal_menu.expand.recipes){
            if (recipe.id == e.detail.index) {
                delete_msg = `Are you sure you want to remove "${recipe.title}" from "${modal_menu.title}"?`;
            } else {
                tmp.push(recipe);
            }
        }

        let delete_recipe = confirm(delete_msg);
        if (delete_recipe){
            const result = await pb.collection('menus').update(modal_menu.id, {"recipes-": e.detail.index}, {expand: `recipes,recipes.ingr_list`});
            for (let i = 0; i < user_menus.length; i++){
                if (user_menus[i].id == modal_menu.id){
                    user_menus[i] = result;
                    modal_menu = user_menus[i];
                }
            }
        }
    }
</script>

<svelte:head>
    <meta property="og:title" content="My Menus" />
    <meta property="og:description" content="Choose a Menu to Cook" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/my_menus" />
    <meta property="og:type" content="website" />
</svelte:head>

<div class="flex">
    <div class="flex flex-col w-full md:w-1/2">
        <div class="hidden md:flex justify-between mx-4">
            <div class="flex w-fit space-x-6 items-center">
                <div class="form-control w-full max-w-xs">
                    <label class="input input-bordered input-sm input-primary flex items-center gap-2 pr-2">
                        <input type="text" class="input h-full p-0 w-28" placeholder="Search" onkeyup={search} bind:value={search_val}/>
                        <button class="w-5" onclick={()=>{search_val = ""; search();}} onkeydown={()=>{search_val = ""; search();}}>
                            {#if search_val}
                                <Clear size="w-4 h-4"/>
                            {/if}
                        </button>
                    </label>
                </div>
                <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
            </div>
            <div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
                <label tabindex="-1" for="sort" class="btn m-1 btn-primary btn-xs md:btn-sm">{sort_val}</label>
                <ul tabindex="-1" name="sort" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                    {#each sort_opts as opt}
                        <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button onclick={() => {sort_val = opt; document.activeElement.blur(); sort_menus()}}>{opt}</button></li>
                    {/each}
                </ul>
            </div>
        </div>
    {#if user_menus.length > 0 || loading || no_results_found}
        <div id="menus" class="h-[calc(100svh-55px)] md:h-[calc(100svh-90px)] overflow-y-auto rounded-md md:border-none w-full">
            {#if loading}
                <div class="text-center flex flex-col justify-center items-center space-y-5 mx-2 md:mx-auto md:text-4xl h-full w-full"><span class="loading loading-bars loading-lg"></span></div>
            {:else if no_results_found}
                <div class="flex flex-col justify-center items-center space-y-5 bg-base-200 mx-2 md:mx-auto p-16 border-2 border-base-300 rounded-md shadow-md  md:text-4xl mt-[30vh] max-w-md">
                    <div class="w-full flex justify-center content-center h-full">
                        no results
                    </div>
                </div>
            {:else}
                {#each user_menus as curr, i}
                    <MenuCard
                        menu={curr}
                        on:delete_menu={delete_menu}
                        on:card_click={show_menu_modal}
                    />
                    <!-- svelte-ignore a11y_no_static_element_interactions-->
                    <!-- <div id={user_menus[i].id} class="card md:card-side card-bordered border-primary bg-base-200 h-24 my-1.5 mx-1 cursor-pointer" onclick={show_menu_modal} onkeypress={show_menu_modal}>
                        <figure class="h-24 w-full md:w-2/3 flex overflow-hidden">
                            {#each user_menus[i].expand.recipes.slice(0,6) as recipe, j}
                                {#if user_menus[i].expand.recipes[j].image}
                                    <img class="h-24 flex-1 min-w-0 object-cover" src={user_menus[i].expand.recipes[j].image} alt={user_menus[i].expand.recipes[j].title}/>
                                    {/if}
                            {/each}
                        </figure>
                        <div class="card-body flex flex-row justify-evenly content-center p-1 w-full">
                            <div class="flex flex-col w-full justify-between content-center h-full">
                                <div class="flex flex-row justify-evenly text-xs md:text-md items-center h-full space-x-2 md:space-x-5">
                                    <div class="text-center max-h-4 md:max-h-16 line-clamp-1 md:line-clamp-4">{user_menus[i].title}</div>
                                    <div class="text-center md:w-20">{format_date(user_menus[i].created)}</div>
                                </div>
                                <div class="flex flex-row justify-evenly max-w-full">
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tl rounded-bl">{user_menus[i].expand.recipes.length} recipes</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{get_grocery_list(user_menus[i], user_menus[i].servings, user_menus[i].sub_recipes).length} ingredients</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{get_servings(user_menus[i].expand.recipes, user_menus[i].sub_recipes, user_menus[i].servings)} servings</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tr rounded-br">{get_total_time(user_menus[i].expand.recipes).display}</p>
                                </div>
                            </div>
                            <div class="flex conten-center items-center">
                                <button id={user_menus[i].id} class="btn btn-sm p-1 btn-accent"  onclick={stopPropagation(delete_menu)}><DeleteIcon/></button>
                            </div>
                        </div>
                    </div> -->
                {/each}
            {/if}
        </div>
        <div class="flex md:hidden justify-between">
            <div class="flex w-fit space-x-6 items-center">
                <div class="form-control w-full max-w-xs">
                    <label class="input input-bordered input-xs input-primary flex items-center gap-2 pr-0">
                        <input type="text" class="input h-full p-0 w-28" placeholder="Search" onkeyup={search} bind:value={search_val}/>
                        <button class="w-5" onclick={()=>{search_val = ""; search();}}>
                            {#if search_val}
                                <Clear size="w-3 h-3"/>
                            {/if}
                        </button>
                    </label>
                </div>
                <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
            </div>
            
            <div class="dropdown dropdown-top dropdown-end">
                <label tabindex="-1" for="sort" class="btn m-1 btn-primary btn-xs md:btn-sm">{sort_val}</label>
                <ul tabindex="-1" name="sort" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                    {#each sort_opts as opt}
                        {#if opt == sort_val}
                        <li class="btn btn-xs btn-secondary"><div>{opt}</div></li>
                        {:else}
                        <li class="btn btn-xs btn-primary"><button onclick={(e) => {sort_val = e.currentTarget.innerHTML; sort_menus();}}>{opt}</button></li>
                        {/if}
                    {/each}
                </ul>
            </div>
        </div>
        <dialog id="my_modal_2" class="modal">
            {#if modal_menu.id}
                <form method="dialog" class="modal-box max-w-full md:w-2/3 p-1">
                    <button class="btn btn-xs p-2 flex content-center fixed top-1 right-1">x</button>
                    <Menu 
                        title={modal_menu.title} 
                        bind:menu={modal_menu.expand.recipes} 
                        bind:mults={modal_menu.servings} 
                        sub_recipes={modal_menu.sub_recipes} 
                        id={modal_menu.id} 
                        menu_title={modal_menu.title} 
                        {total_servings} 
                        on:update_mult={update_mult}
                        on:remove_from_menu={remove_from_menu}
                    />
                </form>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            {/if}
        </dialog>
    {:else}
        <div class="flex flex-col justify-center items-center space-y-5 bg-base-200 mx-2 md:mx-auto p-16 border-2 border-base-300 rounded-md shadow-md  md:text-4xl mt-[30vh] max-w-5xl">
            <h2>You have no menus yet</h2>
            <div class="flex flex-row items-center space-x-1">
                <h3>Click </h3><a href="/menu" class="btn btn-primary btn-sm p-2 flex content-center">here</a><h3> to create a new menu</h3>
            </div>
        </div>
    {/if}
    </div>
    <div id="desktop_menu" class="hidden md:flex w-1/2">
        {#if modal_menu.id}
            <Menu 
                title={modal_menu.title} 
                bind:menu={modal_menu.expand.recipes} 
                bind:mults={modal_menu.servings} 
                menu_title={modal_menu.title} 
                sub_recipes={modal_menu.sub_recipes} 
                id={modal_menu.id}
                {total_servings}
                on:update_mult={update_mult}
                on:remove_from_menu={remove_from_menu}
            />
        {/if}
    </div>
</div>
