<script>
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { afterUpdate, onMount } from 'svelte';
    import Menu from "/src/lib/components/menu.svelte";
    import { merge } from '/src/lib/merge_ingredients.js';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import Clear from "/src/lib/icons/Clear.svelte";
    import { get_servings } from '/src/lib/recipe_util.js';


    
    $: user_menus = [];
    $: modal_menu = [];
    $: loading = true;
    $: sort_val = "Most Recent";
    let delay_timer;
    let sort_opts = ["Least Recipes", "Most Recipes", "Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    $: search_val = "";
    $: no_results_found = false;

    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        const result_list = await pb.collection('menus').getList(1, 250, {
            filter: `user="${$currentUser.id}"`,
            expand: `recipes,recipes.ingr_list`,
            sort: `-created`
        });
        user_menus = result_list.items;
        loading = false;
    });

    function show_menu_modal(e){
        const is_mobile = (window.getComputedStyle(document.getElementById("desktop_menu")).display == "none") ? true : false;
        let id = e.currentTarget.id;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id == id){
                modal_menu = user_menus[i];
            }
        }
        if (is_mobile) my_modal_2.showModal();
    }

    function get_total_time(recipes){
        let total_time = 0;
        let mins = 0;
        for (let i = 0; i < recipes.length; i++){
            let min_result = recipes[i].time.match(/(\d+) [mins|minutes]/);
            if (min_result){
                mins += parseInt(min_result[1]);
            }

            let hr_result = recipes[i].time.match(/(\d+) [hrs|hours|hour|hr]/);
            if (hr_result){
                mins += parseInt(hr_result[1]) * 60;
            }
        }
        let total_mins = mins;
        let hours = parseInt(mins/60);
        mins = mins % 60;
        total_time = hours + " hrs " + mins + " mins";
        return {display: total_time, val: total_mins};
    }

    async function delete_menu(e){
        let tmp_menus = [];
        let menu;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id != e.srcElement.id) tmp_menus.push(user_menus[i]);
            else menu = user_menus[i];
        }
        if (menu && confirm(`Are you sure you want to delete your ${menu.title} menu?`)) {
            await pb.collection('menus').delete(e.srcElement.id);
            user_menus = tmp_menus;
        }
    }

    function format_date(in_date){
        const day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let output = "";
        let menu_date = new Date(in_date);
        let menu_day = menu_date.getDate();
        let menu_month = menu_date.getMonth();
        let menu_year = menu_date.getFullYear();
        let today = new Date();
        if (menu_year == today.getFullYear()){
            if (menu_month == today.getMonth()){
                if (menu_day == today.getDate()){
                    output = "Today";
                } else if (today.getDate() - menu_day < 7){
                    output = day_names[menu_date.getDay()];
                } else {
                    output = menu_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric' });
                }
            } else {
                output = menu_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric' });
            } 
        } else {
            output = menu_date.toLocaleDateString(undefined, {year: '2-digit', month: 'short', day: 'numeric' });
        }
        return output;
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
                filter: `ingredient ~ '${search_str}'`,
                expand: `recipe`
            });
            for (let i = 0; i < result_ingr.items.length; i++){
                for (let j = 0; j < result_ingr.items[i].recipe.length; j++){
                    if (!recipe_ids.includes(result_ingr.items[i].recipe[j])) recipe_ids.push(result_ingr.items[i].recipe[j]);
                }
            }
            const result_recipe = await pb.collection('recipes').getList(1, 250, {
                filter: `title ~ '${search_str}'`,
            });
            for (let i = 0; i < result_recipe.items.length; i++){
                if (!recipe_ids.includes(result_recipe.items[i].id)) recipe_ids.push(result_recipe.items[i].id);
            }
            let recipe_id_string = "";
            for (let i = 0; i < recipe_ids.length; i++){
                recipe_id_string += ` || recipes ~ '${recipe_ids[i]}'`;
            }
            const result_menu = await pb.collection('menus').getList(1, 250, {
                filter: `title ~ '${search_str}'${recipe_id_string}`,
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
        if ( merge(a.expand.recipes).grocery_list.length < merge(b.expand.recipes).grocery_list.length ){
            return -1;
        }
        if ( merge(a.expand.recipes).grocery_list.length > merge(b.expand.recipes).grocery_list.length ){
            return 1;
        }
        return 0;
    }

    function compare_ingr_amounts_dsc(a, b){
        if ( merge(a.expand.recipes).grocery_list.length > merge(b.expand.recipes).grocery_list.length ){
            return -1;
        }
        if ( merge(a.expand.recipes).grocery_list.length < merge(b.expand.recipes).grocery_list.length ){
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
</script>

<div class="flex">
    <div class="flex flex-col w-full md:w-1/2">
        <div class="hidden md:flex justify-between mx-4">
            <div class="flex w-fit space-x-6 items-center">
                <div class="form-control w-full max-w-xs">
                    <label class="input input-bordered input-sm input-primary flex items-center gap-2 pr-2">
                        <input type="text" class="input h-full p-0" placeholder="Search" on:keyup={search} bind:value={search_val}/>
                        <div class="w-5" on:click={()=>{search_val = ""; search();}}>
                            {#if search_val}
                                <Clear size="w-4 h-4"/>
                            {/if}
                        </div>
                    </label>
                </div>
                <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
            </div>
            
            <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn m-1 btn-primary btn-xs md:btn-sm">Sort</label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                    {#each sort_opts as opt}
                        {#if opt == sort_val}
                        <li class="btn btn-xs btn-secondary"><a>{opt}</a></li>
                        {:else}
                        <li class="btn btn-xs btn-primary"><a on:click={(e) => {sort_val = e.currentTarget.innerHTML; sort_menus();}}>{opt}</a></li>
                        {/if}
                    {/each}
                </ul>
            </div>
        </div>
    {#if user_menus.length > 0 || loading || no_results_found}
        <div id="menus" class="h-[81vh] md:h-[calc(100svh-90px)] overflow-y-auto border border-primary rounded-md md:border-none w-full">
            {#if no_results_found}
                <div class="flex flex-col justify-center items-center space-y-5 bg-base-200 mx-2 md:mx-auto p-16 border-2 border-base-300 rounded-md shadow-md  md:text-4xl mt-[30vh] max-w-md">
                    <div class="w-full flex justify-center content-center h-full">
                        no results
                    </div>
                </div>
            {:else if loading}
                <div class="text-center flex flex-col justify-center items-center space-y-5 mx-2 md:mx-auto md:text-4xl h-full w-full"><span class="loading loading-bars loading-lg"></span></div>
            {:else}
                {#each user_menus as curr, i}
                    <div id={user_menus[i].id} class="card md:card-side card-bordered bg-base-200 shadow-xl max-h-24 my-1.5 mx-1 cursor-pointer" on:click={show_menu_modal} on:keypress={show_menu_modal}>
                        <figure class="md:w-2/3">
                            {#each user_menus[i].expand.recipes as recipe, j}
                                    <img class="w-16 md:w-20" src={user_menus[i].expand.recipes[j].image} alt={user_menus[i].expand.recipes[j].title}/>
                            {/each}
                        </figure>
                        <div class="card-body flex flex-row justify-evenly content-center p-1 w-full">
                            <div class="flex flex-col w-full justify-between content-center h-full">
                                <div class="flex flex-row justify-center text-xs md:text-md">
                                    <p class="text-center">{user_menus[i].title}</p>
                                    <p class="text-center md:w-20">{format_date(user_menus[i].created)}</p>
                                </div>
                                <div class="flex flex-row justify-evenly w-full">
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tl rounded-bl">{user_menus[i].expand.recipes.length} recipes</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{merge(user_menus[i].expand.recipes).grocery_list.length} ingredients</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{get_servings(user_menus[i].expand.recipes, user_menus[i].sub_recipes)} servings</p>
                                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tr rounded-br">{get_total_time(user_menus[i].expand.recipes).display}</p>
                                </div>
                            </div>
                            <div class="flex conten-center items-center">
                                <button id={user_menus[i].id} class="btn btn-sm p-1 btn-accent"  on:click|stopPropagation={delete_menu}><DeleteIcon/></button>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
        <div class="flex md:hidden justify-between">
            <div class="flex w-fit space-x-6 items-center">
                <div class="form-control w-full max-w-xs">
                    <label class="input input-bordered input-xs input-primary flex items-center gap-2 pr-0">
                        <input type="text" class="input h-full p-0" placeholder="Search" on:keyup={search} bind:value={search_val}/>
                        <div class="w-5" on:click={()=>{search_val = ""; search();}}>
                            {#if search_val}
                                <Clear size="w-3 h-3"/>
                            {/if}
                        </div>
                    </label>
                </div>
                <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
            </div>
            
            <div class="dropdown dropdown-top dropdown-end">
                <label tabindex="0" class="btn m-1 btn-primary btn-xs md:btn-sm">Sort</label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                    {#each sort_opts as opt}
                        {#if opt == sort_val}
                        <li class="btn btn-xs btn-secondary"><a>{opt}</a></li>
                        {:else}
                        <li class="btn btn-xs btn-primary"><a on:click={(e) => {sort_val = e.currentTarget.innerHTML; sort_menus();}}>{opt}</a></li>
                        {/if}
                    {/each}
                </ul>
            </div>
        </div>
        <dialog id="my_modal_2" class="modal">
            {#if modal_menu.id}
                <form method="dialog" class="modal-box max-w-full md:w-2/3 p-1">
                    <button class="btn btn-xs p-2 flex content-center fixed top-1 right-1">x</button>
                    <Menu title={modal_menu.title} menu={modal_menu.expand.recipes} mults={modal_menu.servings} sub_recipes={modal_menu.sub_recipes} id={modal_menu.id}/>
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
            <Menu title={modal_menu.title} menu={modal_menu.expand.recipes} mults={modal_menu.servings} sub_recipes={modal_menu.sub_recipes} id={modal_menu.id}/>
        {/if}
    </div>
</div>
