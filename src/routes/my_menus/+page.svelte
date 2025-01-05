<script>
    import SearchInput from "/src/lib/components/search.svelte";
    import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
    import { onMount } from 'svelte';
    import Menu from "/src/lib/components/menu.svelte";
    import { get_servings } from '/src/lib/recipe_util.js';
    import { sort_menus } from '/src/lib/sort.js';
    import { update_menu_mults, get_total_time } from '/src/lib/menu_utils.js';
    import MenuCard from "/src/lib/components/menu_card.svelte";
    import Sort from "../../lib/components/sort.svelte";
    import Alerts from "../../lib/components/alerts.svelte";
    import NoteCard from "../../lib/components/note_card.svelte";
    
    let user_menus = $state([]);
    
    let modal_menu = $state({});
    
    let loading = $state(true);
    
    let sort_val = $state("Most Recent");
    let total_servings = $derived((!modal_menu.expand) ? 0 : get_servings(modal_menu.expand.recipes, {}, modal_menu.servings));
    let delay_timer;
    let search_val = $state("");
    
    let no_results_found = $state(false);
    let alert = $state({show: false, msg: "", title: "", type: "warning"});

    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        else{
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
        const result_list = await pb.collection('menus').getList(1, 250, {
            filter: `user="${$currentUser.id}" && recipes:length > 0`,
            expand: `recipes,recipes.ingr_list`,
            sort: `-created`
        });
        user_menus = result_list.items;
        loading = false;
    });

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }

    function show_menu_modal(e){
        const is_mobile = (window.getComputedStyle(document.getElementById("desktop_menu")).display == "none") ? true : false;
        let id = e.id;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id == id){
                modal_menu = user_menus[i];
            }
        }
        if (is_mobile) my_modal_2.showModal();
    }

    async function delete_menu(e){
        let tmp_menus = [];
        let menu;
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id != e.id) tmp_menus.push(user_menus[i]);
            else menu = user_menus[i];
        }
        if (menu && confirm(`Are you sure you want to delete your "${menu.title}" menu?`)) {
            const resultList = await pb.collection('grocery_lists').getList(1, 50, {
                filter: `menu = "${e.id}"`,
            });
            if (resultList.items.length > 0){
                for (let i = 0; i < resultList.items.length; i++){
                    await pb.collection('grocery_lists').update(resultList.items[i].id, { "menu": null });
                }
            }
            const resultListLog = await pb.collection('menu_log').getList(1, 50, {
                filter: `menu = "${e.id}"`,
            });
            if (resultListLog.items.length > 0){
                for (let i = 0; i < resultListLog.items.length; i++){
                    await pb.collection('menu_log').update(resultListLog.items[i].id, { "menu": null });
                }
            }
            await pb.collection('menus').delete(e.id);
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
                user_menus = sort_menus(user_menus, sort_val);
                loading = false;
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
                loading = false;
                return;
            }
            user_menus = result_menu.items;
            user_menus = sort_menus(user_menus, sort_val);
            loading = false;
        }, 1000);
    }

    

    async function update_mult(e){
        const newServings = { ...modal_menu.servings };
        newServings[e.id] = e.mult;
        modal_menu.servings = await update_menu_mults(modal_menu.id, newServings);
    }

    async function remove_from_menu(e){
        e.stopPropagation();
        let tmp = []
        let delete_msg = "";
        for (let recipe of modal_menu.expand.recipes){
            if (recipe.id == e.index) {
                delete_msg = `Are you sure you want to remove "${recipe.title}" from "${modal_menu.title}"?`;
            } else {
                tmp.push(recipe);
            }
        }

        let delete_recipe = confirm(delete_msg);
        if (delete_recipe){
            const result = await pb.collection('menus').update(modal_menu.id, {"recipes-": e.index}, {expand: `recipes,recipes.ingr_list`});
            for (let i = 0; i < user_menus.length; i++){
                if (user_menus[i].id == modal_menu.id){
                    user_menus[i] = result;
                    modal_menu = user_menus[i];
                }
            }
        }
    }

    async function update_title(e){
        const result = await pb.collection('menus').update(e.id, {"title": e.title}, {expand: `recipes,recipes.ingr_list`});
        for (let i = 0; i < user_menus.length; i++){
            if (user_menus[i].id == result.id){
                user_menus[i] = result;
            }
        }
    }

    async function update_search(e) {
        search_val = e.val;
        await search();
    }

    async function update_sort(e){
        loading = true;
        sort_val = e.currentTarget.innerHTML; 
        document.activeElement.blur();
        user_menus = sort_menus(user_menus, sort_val); 
        loading = false;
    }
</script>

<svelte:head>
    <meta property="og:title" content="My Menus" />
    <meta property="og:description" content="Choose a Menu to Cook" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/my_menus" />
    <meta property="og:type" content="website" />
</svelte:head>

<div class="flex flex-col w-full md:flex-row">
    {#if user_menus.length > 0 || loading || no_results_found}
        <div class="flex flex-col w-full md:w-1/2">
            <div class="hidden md:flex justify-between mx-4">
                <div class="flex w-fit space-x-6 items-center">
                    <SearchInput 
                        {update_search}
                    />
                    <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
                </div>
                <Sort
                    {sort_val}
                    {update_sort},
                    type="menu"  
                />
            </div>
            <div id="menus" class="h-[calc(100svh-55px)] md:h-[calc(100svh-90px)] overflow-y-auto rounded-md md:border-none w-full space-y-2">
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
                            bind:menu={user_menus[i]}
                            {delete_menu}
                            card_click={show_menu_modal}
                        />
                    {/each}
                {/if}
            </div>
            <div class="flex md:hidden justify-between">
                <div class="flex w-fit space-x-6 items-center">
                    <SearchInput 
                        {update_search}
                    />
                    <div class="w-full flex space-x-1 text-xs"><div id="user_menus_length">{user_menus.length}</div><div>Menus</div></div>
                </div>
                
                <Sort
                    {sort_val}
                    {update_sort}
                    type="menu" 
                />
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
                            bind:menu_title={modal_menu.title} 
                            {total_servings} 
                            {update_mult}
                            {remove_from_menu}
                            {update_title}
                        />
                    </form>
                    <form method="dialog" class="modal-backdrop">
                        <button>close</button>
                    </form>
                {/if}
            </dialog>
        </div>
        <div id="desktop_menu" class="hidden md:flex w-1/2">
            {#if modal_menu.id}
                <Menu 
                    title={modal_menu.title} 
                    bind:menu={modal_menu.expand.recipes} 
                    bind:mults={modal_menu.servings} 
                    bind:menu_title={modal_menu.title} 
                    sub_recipes={modal_menu.sub_recipes} 
                    id={modal_menu.id}
                    {total_servings}
                    {update_mult}
                    {remove_from_menu}
                    {update_title}
                />
            {/if}
        </div>
    {:else}
        <NoteCard msg={`No menus found`} action={() => window.location.href = `/menu`} btn_name={"create a new menu"} />
    {/if}
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</div>
