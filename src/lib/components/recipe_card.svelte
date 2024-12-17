<script>
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import Plus from "/src/lib/icons/Plus.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";

    let { 
        recipe = $bindable()
    } = $props();

    let just_copied = $state(false);

    const card_click = () => {
        window.location = `/cook_recipe/${recipe.url_id}/${recipe.servings}`
    }

    async function add_recipe(e){
        e.stopPropagation();
        console.log($currentUser);
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

</script>

    <!-- svelte-ignore a11y_no_static_element_interactions-->
    <div class="card card-side bg-base-200 h-24 md:h-28 card-bordered border-primary cursor-pointer mx-1" onkeydown={card_click} onclick={card_click}>
        <figure class="w-1/4 bg-cover bg-no-repeat bg-center" style="background-image: url('{recipe.image}')"></figure>
        <div class="card-body h-full flex flex-row p-1 w-3/4 justify-between">
            <div class="flex flex-col justify-between p-1 md:p-3 w-full">
                <h2 id={recipe.id} class="card-title text-sm text-ellipsis overflow-hidden">{recipe.title}</h2>
                <div class="flex w-full recipes-center">
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tl rounded-bl">
                        {#if isNaN(recipe.servings)}
                            {recipe.servings}
                        {:else}
                            {recipe.servings} servings
                        {/if}
                    </div>
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow">
                        {#if recipe.time}
                            {recipe.time}
                        {:else}
                            no time
                        {/if}
                    </div>
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow">
                        {recipe.expand.ingr_list.length} ingredients
                    </div>
                    <div class="text-[10px] md:text-[12px] border border-primary text-ellipsis whitespace-nowrap overflow-hidden h-fit px-1 text-nowrap text-center basis-12 grow rounded-tr rounded-br">
                        {recipe.directions.length} steps
                    </div>
                    {#if !$currentUser || $currentUser.id != recipe.user}
                        <button id={recipe.id} class="btn btn-primary btn-xs w-6 ml-2 p-0" onclick={add_recipe} onkeydown={add_recipe}>
                            {#if just_copied == recipe.id}
                                <CheckMark color=""/>
                            {:else}
                                <Plus/>
                            {/if}
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>