<script>
    import { get_grocery_list } from '/src/lib/merge_ingredients.js';
    import { get_servings } from '/src/lib/recipe_util.js';
    import { get_total_time, format_date } from '/src/lib/menu_utils.js';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";


    let { 
            menu = $bindable(),
            delete_menu,
            card_click
        } = $props();

    
    const handle_delete = (e) => {
        e.stopPropagation();
        delete_menu({id: menu.id});
    }

    const handle_click = (e) => {
        e.stopPropagation();
        card_click({id: menu.id});
    }
</script>
{#if menu?.expand?.recipes}
    <!-- svelte-ignore a11y_no_static_element_interactions-->
    <div id={menu.id} class="card md:card-side card-bordered border-primary bg-base-200 h-24 my-1.5 mx-1 cursor-pointer" onclick={handle_click} onkeypress={handle_click}>
        <figure class="h-24 w-full md:w-1/2 shrink-0 flex overflow-hidden">
            {#each menu.expand.recipes.slice(0,6) as recipe, j}
                {#if menu.expand.recipes[j].image}
                    <img class="h-24 flex-1 min-w-0 object-cover" src={menu.expand.recipes[j].image} alt={menu.expand.recipes[j].title}/>
                {/if}
            {/each}
        </figure>
        <div class="card-body flex flex-row justify-evenly content-center p-1 w-1/2 grow-0">
            <div class="flex flex-col justify-between content-center h-full">
                <div class="flex flex-row justify-evenly text-xs md:text-md items-center h-full space-x-2 md:space-x-5">
                    <div class="text-center max-h-4 md:max-h-16 line-clamp-1 md:line-clamp-4 shrink">{menu.title}</div>
                    <div class="text-center min-w-16 md:w-20 shrink-0 line-clamp-1">{format_date(menu.created)}</div>
                </div>
                <div class="flex flex-row justify-evenly">
                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tl rounded-bl">{menu.expand.recipes.length} recipes</p>
                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{get_grocery_list(menu, menu.servings, menu.sub_recipes).length} ingredients</p>
                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden">{get_servings(menu.expand.recipes, menu.sub_recipes, menu.servings)} servings</p>
                    <p class="text-center text-[10px] xl:text-[12px] border border-primary px-1 text-ellipsis whitespace-nowrap text-nowrap overflow-hidden rounded-tr rounded-br">{get_total_time(menu.expand.recipes).display}</p>
                </div>
            </div>
            <div class="flex conten-center items-center w-1/5">
                <button id={menu.id} class="btn btn-sm p-1 btn-accent"  onclick={handle_delete}><DeleteIcon/></button>
            </div>
        </div>
    </div>
{/if}