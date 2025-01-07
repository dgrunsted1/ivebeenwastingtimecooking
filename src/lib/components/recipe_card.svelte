<script>
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import { page } from '$app/stores';
    import Plus from "/src/lib/icons/Plus.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";


    let { 
        recipe = $bindable(),
        checked = $bindable(),
        servings = $bindable(),
        type = $bindable(),
        toggle_check_box,
        toggle_heart,
        card_click,
        delete_recipe,
        toggle_thumb,
        edit_servings
    } = $props();

    let just_copied = $state(false);
    let fave_btn = $derived(!$page.params.user_name && (type == "today" || type == "menu") && (!$page.url.pathname.includes("/today") && type == "menu"));
    let check_box = $derived(type == "today" || (type == "menu" && !$page.url.pathname.includes("/today")));
    let add_btn = $derived(type == "recipes");
    let delete_btn = $derived(((type == "menu" && !$page.url.pathname.includes("/today")) || (type == "menu_component" && $page.url.pathname != "/profile")));
    let thumb_btn = $derived(type == "menu" && (!$page.url.pathname.includes("/today") && type == "menu"));
    let edit_serv = $state(type == "menu_component");

    const handle_click = (e) => {
        e.stopPropagation();
        card_click({id: recipe.id});
    }

    async function add_recipe(e){
        e.stopPropagation();
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

    const toggle_made = (e) => {
        e.stopPropagation();
        toggle_check_box({id: recipe.id});
    }

    const toggle_favorite = (e) => {
        e.stopPropagation();
        toggle_heart({id: recipe.id});
    }

    const handle_thumb = (e) => {
        e.stopPropagation();
        toggle_thumb({id: recipe.id});
    }

    const handle_delete = (e) => {
        e.stopPropagation();
        delete_recipe({id: recipe.id});
    }

    const handle_servings = (e) => {
        e.stopPropagation();
        edit_servings({id: recipe.id, val: e.currentTarget.value});
    }
</script>

    <!-- svelte-ignore a11y_no_static_element_interactions-->
    <div class="card card-side bg-base-200 h-24 md:h-28 card-bordered border-primary cursor-pointer mx-1" onkeydown={handle_click} onclick={handle_click}>
        <figure class="w-1/4 bg-cover bg-no-repeat bg-center" style="background-image: url('{recipe.image}')"></figure>
        <div class="card-body h-full flex flex-row p-1 w-1/2 justify-between">
            <div class="flex flex-col justify-between md:p-1 w-full">
                <h2 id={recipe.id} class="card-title text-sm text-ellipsis overflow-hidden line-clamp-2">{recipe.title}</h2>
                {#if edit_serv}
                    <div class="flex items-center space-x-1">
                        <input type="text" name="servings" class="input input-xs input-bordered input-primary w-12 text-center p-0" value={servings} onblur={handle_servings}/><label for="servings" class="text-sm ">servings</label>
                    </div>
                {/if}
                <div class="flex w-full">
                    {#if !edit_serv}
                        <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">
                            {#if isNaN(recipe.servings)}
                                {servings}
                            {:else}
                                {servings} servings
                            {/if}
                        </div>
                        <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow">
                            {#if recipe.time}
                                {recipe.time}
                            {:else}
                                no time
                            {/if}
                        </div>
                    {:else}
                        <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">
                            {#if recipe.time}
                                {recipe.time}
                            {:else}
                                no time
                            {/if}
                        </div>
                    {/if}
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow">
                        {recipe.expand.ingr_list.length} ingredients
                    </div>
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit pl-1 text-nowrap text-center basis-12 grow rounded-tr rounded-br">
                        {recipe.directions.length} steps
                    </div>
                </div>
            </div>
        </div>
        <div class="card-actions flex flex-col justify-evenly items-end items-center py-1 pr-1 max-w-1/4">
            {#if add_btn && (!$currentUser || $currentUser.id != recipe.user)}
                <button id={recipe.id} class="btn btn-primary btn-xs h-8 m-1 md:m-3" onclick={add_recipe} onkeydown={add_recipe}>
                    {#if just_copied == recipe.id}
                        <CheckMark color=""/>
                    {:else}
                        <Plus/>
                    {/if}
                </button>
            {/if}
            {#if fave_btn || thumb_btn}
                <div class="flex flex-w-fit space-x-1">
                    {#if fave_btn}<button class="btn btn-xs p-1 favorite flex content-center" onclick={toggle_favorite}><Heart color={(recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>{/if}
                    {#if thumb_btn}<button class="btn btn-xs  p-1 made flex content-center" onclick={handle_thumb}><ThumbUp color={(recipe.made) ? "fill-primary" : "fill-neutral"}/></button>{/if}
                </div>
            {/if}
            {#if delete_btn || check_box}
                <div class="flex w-fit space-x-2">
                    {#if check_box}<input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" bind:checked={checked} onclick={toggle_made}>{/if}
                    {#if delete_btn}<button class="btn btn-sm p-1 btn-accent {recipe.id} " onclick={handle_delete}><DeleteIcon/></button>{/if}
                </div>
            {/if}
        </div>
    </div>