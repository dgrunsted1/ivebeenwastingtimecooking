<script>
    import { get_grocery_list } from '/src/lib/merge_ingredients.js';
    import { get_servings } from '/src/lib/recipe_util.js';
    import { get_total_time, format_date } from '/src/lib/menu_utils.js';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import { flagsStore } from "/src/lib/stores.js";


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
    {#if $flagsStore === undefined || $flagsStore.is_compact}
        <!-- svelte-ignore a11y_no_static_element_interactions-->
        <div id={menu.id} class="card lg:card-side card-bordered border-primary bg-base-200 h-24 mx-1 cursor-pointer" onclick={handle_click} onkeypress={handle_click}>
            <figure class="h-1/2 lg:h-24 w-full lg:w-1/2 shrink-0 flex overflow-hidden">
                {#each menu.expand.recipes.slice(0,6) as recipe, j}
                    {#if menu.expand.recipes[j].image}
                        <img class="lg:h-full flex-1 min-w-0 object-cover" src={menu.expand.recipes[j].image} alt={menu.expand.recipes[j].title}/>
                    {/if}
                {/each}
            </figure>
            <div class="card-body flex flex-row justify-between h-full content-center p-1 w-full lg:w-1/2 shrink lg:shrink-0 pt-0">
                <div class="flex w-full space-x-1">
                    <div class="flex flex-col justify-between content-center lg:h-full mt-0 basis-full min-w-0">
                        <div class="flex flex-row justify-evenly text-xs lg:text-md items-center h-full min-w-0">
                            <div class="card-title text-xs lg:text-sm text-ellipsis overflow-hidden line-clamp-3 max-h-4 lg:max-h-16 min-w-0">{menu.title}</div>
                            <div class="text-center line-clamp-1 min-w-16 shrink-0">{format_date(menu.created)}</div>
                        </div>
                        <div class="flex w-full">
                            <p class="text-[10px] lg:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-5 grow rounded-tl rounded-bl">{menu.expand.recipes.length} recipes</p>
                            <p class="text-[10px] lg:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-5 grow shrink">{get_grocery_list(menu, menu.servings, menu.sub_recipes).length} ingredients</p>
                            <p class="text-[10px] lg:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-5 grow shrink">{get_servings(menu.expand.recipes, menu.sub_recipes, menu.servings)} servings</p>
                            <p class="text-[10px] lg:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-5 grow shrink rounded-tr rounded-br">{get_total_time(menu.expand.recipes).display}</p>
                        </div>
                    </div>
                    <div class="flex conten-center items-center mr-1">
                        <button id={menu.id} class="btn btn-sm p-1 btn-accent"  onclick={handle_delete}><DeleteIcon/></button>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions-->
        <div id={menu.id} class="card card-bordered border-primary bg-base-200 h-[100vw] md:h-[30vw] mx-1 cursor-pointer" onclick={handle_click} onkeypress={handle_click}>
            <figure class="h-full absolute w-full shrink-0 flex overflow-hidden">
                {#each menu.expand.recipes.slice(0,6) as recipe, j}
                    {#if menu.expand.recipes[j].image}
                        <img class="h-full flex-1 min-w-0 object-cover" src={menu.expand.recipes[j].image} alt={menu.expand.recipes[j].title}/>
                    {/if}
                {/each}
            </figure>
            <div class="card-body flex flex-row justify-between h-full content-center p-1 w-full pt-0 z-10">
                <div class="flex w-full space-x-1">
                    <div class="flex flex-col justify-between content-center lg:h-full mt-0 basis-full min-w-0">
                        <div class="flex flex-row justify-evenly text-xs lg:text-md items-center h-full min-w-0">
                            <div class="card-title text-ellipsis overflow-hidden line-clamp-2 text-white w-fit px-1 bg-black/50 rounded-lg">{menu.title}</div>
                            <div class="text-base text-ellipsis overflow-hidden line-clamp-2 text-white w-fit px-1 bg-black/50 rounded-lg">{format_date(menu.created)}</div>
                        </div>
                        <div class="flex w-full bg-black/50 rounded-lg">
                            <p class="text-base text-white border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">{menu.expand.recipes.length} recipes</p>
                            <p class="text-base text-white border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow">{get_grocery_list(menu, menu.servings, menu.sub_recipes).length} ingredients</p>
                            <p class="text-base text-white border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow">{get_servings(menu.expand.recipes, menu.sub_recipes, menu.servings)} servings</p>
                            <p class="text-base text-white border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow rounded-tr rounded-br">{get_total_time(menu.expand.recipes).display}</p>
                        </div>
                    </div>
                    <div class="flex conten-center items-center mr-1">
                        <button id={menu.id} class="btn btn-sm p-1 btn-accent"  onclick={handle_delete}><DeleteIcon/></button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{/if}