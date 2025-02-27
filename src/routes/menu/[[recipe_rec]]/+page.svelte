<script>
    import { onMount } from 'svelte';
    import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
    import { get_servings, get_total_time } from '/src/lib/recipe_util.js';
    import EditRecipe from "/src/lib/components/edit_recipe.svelte";
    import DisplayRecipe from "/src/lib/components/display_recipe.svelte";
    import RecipeList from "/src/lib/components/recipe_list.svelte";
    import Menu from "/src/lib/components/menu.svelte";
    import { page } from '$app/stores';
    import Alerts from "/src/lib/components/alerts.svelte";
    import NoteCard from "/src/lib/components/note_card.svelte";


    let user_recipes = $state([]);
    
    let menu_recipes = $derived(user_recipes.filter(r => r.checked));
    let mults = $state({});
    let mode = "menu";
    let edit_id = $state("");
    let edit_recipe = $derived(user_recipes.filter(r => r.id == edit_id)[0]);
    let edit_modal_recipe = $state(false);
    let loading = $state(true);
    let total_servings = $derived(get_servings(menu_recipes, {}, mults));
    let menu_title = $state("New Menu");
    let alert = $state({show: false, msg: "", title: "", type: "warning"});

    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        else{
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
        const result_list = await pb.collection('recipes').getList(1, 250, {
            filter: `user="${$currentUser.id}"`,
            expand: `notes, ingr_list`,
            sort: `-created`
        });
        user_recipes = result_list.items;
        
        if ($page.params.recipe_rec != ""){
            for (let i = 0; i < user_recipes.length; i++){
                if (user_recipes[i].id == $page.params.recipe_rec){
                    user_recipes[i].checked = true;
                    mults[user_recipes[i].id] = user_recipes[i].servings;
                }
            }
        }
        loading = false;
    });

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }

    function update_edit(e){
        if (e.index != -1) {
            edit_id = e.index;
            my_modal_3.showModal();
            mode = "edit";
        }else {
            edit_id = "";
            mode = "menu";
        }
    }

    function reset_mode(){
        mode = "menu";
        edit_id = "";
    }

    function update_mult(e){
        mults[e.id] = e.mult;
        $state.snapshot(mults);
    }

    

    function check_item(e){
        for (let recipe of user_recipes){
            if (recipe.id == e.index){
                recipe.checked = !recipe.checked;
                if (recipe.checked) mults[recipe.id] = recipe.servings;
                else delete mults[recipe.id];
            }
        }
    }

    function update_title(e){
        menu_title = e.title;
    }

    function update_recipe(e){
        for (let i = 0; i < user_recipes.length; i++){
            if (user_recipes[i].id == e.recipe.id){
                e.recipe.checked = user_recipes[i].checked;
                user_recipes[i] = e.recipe;
                break;
            }
        }
    }

    
</script>

<svelte:head>
    <meta property="og:title" content="Menu" />
    <meta property="og:description" content="Create a Menu" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/menu" />
    <meta property="og:type" content="website" />
</svelte:head>

<div id="main" class="p-1 md:p-3">
        {#if (user_recipes && user_recipes.length > 0) || loading}
            <div id="content" class="flex flex-col md:flex-row   mt-0 md:space-x-3 md:w-full">
                <div id="left_column" class="md:w-1/2">
                    <RecipeList 
                        recipes={user_recipes} 
                        menu_recipes={menu_recipes}
                        card_click={update_edit} 
                        {reset_mode} 
                        {check_item}
                        {update_recipe}
                    />
                </div>
                <!-- --------------
                MOBILE ONLY SECTION
                -------------- -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <details class="md:hidden collapse bg-base-200 md:bg-base-100 collapse-arrow mt-1 md:w-1/2" onclick={() => {window.scrollBy({ top: 700, left: 0, behavior: "smooth"});}}>
                    <summary class="collapse-title text-xl font-medium">
                        {#if menu_recipes.length > 0}
                            <div class="flex justify-around m-1 items-center">
                                <p class="text-xs">{menu_recipes.length} recipes</p>
                                <p class="text-xs">{total_servings} servings </p>
                                <p class="text-xs">{get_total_time(menu_recipes)}</p>
                            </div>
                        {:else}
                            Your Menu
                        {/if}
                    </summary>
                    <div id="right_column" class="collapse-content px-1">
                        {#if menu_recipes.length}
                            <Menu 
                                title="New Menu" 
                                menu={menu_recipes} 
                                bind:mults={mults} 
                                bind:menu_title={menu_title} 
                                {total_servings}
                                {update_mult} 
                                {update_title}
                                remove_from_menu={check_item}
                            />
                        {:else}
                            <NoteCard msg={`select recipes to add to your menu`}/>
                        {/if}
                    </div>
                </details>
                 <!-- --------------
                END MOBILE ONLY SECTION
                -------------- -->
                <div id="right_column" class="hidden md:flex md:w-1/2">
                    {#if menu_recipes.length}
                        <Menu 
                            title="New Menu" 
                            menu={menu_recipes} 
                            bind:mults={mults}
                            bind:menu_title={menu_title} 
                            {total_servings}
                            {update_mult}
                            {update_title}
                            remove_from_menu={check_item}
                        />
                    {:else}
                        <NoteCard msg={`select recipes to add to your menu`}/>
                    {/if}
                </div>
                <dialog id="my_modal_3" class="modal">
                        <div class="modal-box max-w-full md:w-2/3 p-1 h-[90svh]">
                            <form method="dialog">
                                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={()=>{edit_id = ""; edit_modal_recipe = false}}>✕</button>
                            </form>
                            {#if edit_recipe}
                                {#if edit_modal_recipe}
                                    <EditRecipe
                                        recipe={edit_recipe}
                                        {update_recipe}
                                        done_editing={() => edit_modal_recipe = false}
                                    />
                                {:else}
                                    <DisplayRecipe
                                        recipe={edit_recipe}
                                        {update_recipe}
                                        edit_recipe={()=>{edit_modal_recipe = true}}
                                    />
                                {/if}
                            {/if}
                        </div>
                </dialog>
            </div>
        {:else}
            <NoteCard msg={`No recipes Found`} action={() => window.location.href = `/add_recipe`} btn_name={"add a recipe"} />
        {/if}
        <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</div>


