<script>
    import { onMount } from 'svelte';
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { get_servings, get_total_time } from '/src/lib/recipe_util.js';
    import EditRecipe from "/src/lib/components/edit_recipe.svelte";
    import DisplayRecipe from "/src/lib/components/display_recipe.svelte";
    import RecipeList from "/src/lib/components/recipe_list.svelte";
    import Menu from "/src/lib/components/menu.svelte";
    import { page } from '$app/stores';


    $: user_recipes = {};
    let menu_recipes = [];
    let mults = {};
    let mode = "menu";
    let view_recipe;
    let edit_recipe;
    let edit_modal_recipe = false;
    $: loading = true;


    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        const result_list = await pb.collection('recipes').getList(1, 250, {
            filter: `user="${$currentUser.id}"`,
            expand: `notes, ingr_list`,
            sort: `-created`
        });
        user_recipes = result_list;
        loading = false;
    });

    function update_edit(e){
        view_recipe = null;
        if (e.detail.index != -1) {
            for (let curr of user_recipes.items){
                if (curr.id == e.detail.index){
                    edit_recipe = curr;
                    continue;
                }
            }
            my_modal_3.showModal();
            mode = "edit";
        }else {
            edit_recipe = null;
            mode = "menu";
        }
    }

    function update_view(e){
        edit_recipe = null;
        if (e.detail.index != -1){
            for (let curr of user_recipes.items){
                if (curr.id == e.detail.index){
                    view_recipe = curr;
                    continue;
                }
            }
            mode = "view";
        }else {
            view_recipe = null;
            mode = "menu";
        }
    }

    function remove_from_menu(e){
        let remove = -1;
        let cnt = 0;
        for (let recipe of menu_recipes){
            if (recipe.id == e.detail.index){
                remove = cnt;
            }
            cnt++;
        }
        if (remove > -1){
            let tmp_mults = {};
            for (let key of Object.keys(mults)){
                if (key != e.detail.index) tmp_mults[key] = mults[key];
            }
            mults = tmp_mults;
            menu_recipes.splice(remove, 1);
            menu_recipes = menu_recipes;
        }
    }

    function add_to_menu(e){
        for (let recipe of user_recipes.items){
            if (recipe.id == e.detail.index){
                recipe.checked = true;
                menu_recipes.push(recipe);
                mults[recipe.id] = recipe.servings;
            }
        }
        menu_recipes = menu_recipes;
    }

    function reset_mode(){
        mode = "menu";
        view_recipe = null;
        edit_recipe = null;
    }

    function update_mult(e){
        mults[e.detail.id] = e.detail.mult;
    }
</script>
<div id="main" class="p-1 md:p-3">
        {#if (user_recipes && user_recipes.items && user_recipes.items.length > 0) || loading}
            <div id="content" class="flex flex-col md:flex-row   mt-0 md:space-x-3 md:w-full">
                <div id="left_column" class="md:w-1/2">
                    <RecipeList recipes={user_recipes.items} 
                        on:update_view={update_view} on:update_edit={update_edit}
                        on:remove_from_menu={remove_from_menu}
                        on:add_to_menu={add_to_menu} on:reset_mode={reset_mode}/>
                </div>
                <details class="md:hidden collapse bg-base-200 md:bg-base-100 collapse-arrow mt-1 w-full md:w-1/2">
                    <summary class="collapse-title text-xl font-medium">
                        {#if menu_recipes.length > 0}
                            <div class="flex justify-around m-1 items-center">
                                <p class="text-xs">{menu_recipes.length} recipes</p>
                                <p class="text-xs">{get_servings(menu_recipes, mults)} servings</p>
                                <p class="text-xs">{get_total_time(menu_recipes)}</p>
                            </div>
                        {:else}
                            Your Menu
                        {/if}
                    </summary>
                    <div id="right_column" class="collapse-content w-full">
                        {#if menu_recipes.length}
                            <Menu title="New Menu" menu={menu_recipes} {mults} {page} on:update_mult={update_mult}/>
                        {:else}
                            <h2>select recipes to add to your menu</h2>
                        {/if}
                    </div>
                </details>
                <div id="right_column" class="hidden md:flex md:w-1/2">
                    {#if menu_recipes.length}
                        <Menu title="New Menu" menu={menu_recipes} {mults} {page} on:update_mult={update_mult}/>
                    {:else}
                        <h2>select recipes to add to your menu</h2>
                    {/if}
                </div>
                <dialog id="my_modal_3" class="modal">
                        <div class="modal-box max-w-full md:w-2/3 p-1 h-[80vh]">
                            <form method="dialog">
                                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" on:click={()=>{edit_recipe = null}}>✕</button>
                            </form>
                            {#if edit_recipe}
                                {#if edit_modal_recipe}
                                    <EditRecipe recipe={edit_recipe} on:update_edit={update_edit} on:done_editing={() => edit_modal_recipe = false}/>
                                {:else}
                                    <DisplayRecipe recipe={edit_recipe} on:edit_recipe={()=>{edit_modal_recipe = true}}/>
                                {/if}
                            {/if}
                        </div>
                </dialog>
            </div>
        {:else}
            <div class="flex flex-col justify-center items-center space-y-5 bg-base-200 mx-2 md:mx-auto p-16 border-2 border-base-300 rounded-md shadow-md  md:text-4xl mt-[30vh] max-w-5xl">
                <h2>You have no recipes yet</h2>
                <div class="flex flex-row items-center space-x-1">
                    <h3>Click </h3><a href="/add_recipe" class="btn btn-primary btn-sm p-2 flex content-center">here</a><h3> to add a new recipe</h3>
                </div>
            </div>
        {/if}
</div>


