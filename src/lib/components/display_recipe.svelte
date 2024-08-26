<script>
    import EditIcon from "/src/lib/icons/EditIcon.svelte";
    import { createEventDispatcher,afterUpdate, onMount } from 'svelte';
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";


    export let recipe;
    let dispatch = createEventDispatcher();


    function get_local_time(utc_code){
        const event = new Date(utc_code);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        return event.toLocaleDateString(undefined, options);
    }

    function edit_groceries(){
        dispatch("edit_recipe");
    }

</script>

<div id="recipe" class="flex flex-col m-auto py-2 space-y-6 cursor-default mt-5 md:mt-0">
    <div class="img_info_container flex items-center justify-evenly flex-col md:flex-row space-y-2 md:space-y-0">
        <div class="img_container md:w-1/2">
            <img src={recipe.image} alt={recipe.title} class="max-h-52 md:max-h-96 rounded-xl m-auto"/>
        </div>
        <div class="info_container w-full md:w-1/2 flex flex-col space-y-2 pl-2">
            {#if recipe.title}
                <div class="title_container flex justify-around">
                    <div class="title md:w-4/5 text-md md:text-xl">{recipe.title}</div>
                </div>
                <hr class="m-3"/>
            {/if}
            {#if recipe.description}
                <div class="h-fit w-full">
                    <div class="desc text-xs md:text-sm text-center md:text-left" >{recipe.description}</div>
                </div>
                <hr class="m-3"/>
            {/if}
            <div class="flex justify-evenly text-xs">
                {#if recipe.author}
                    <div class="text-center w-1/3">
                        <div class="auth">{recipe.author}</div>
                    </div>
                {/if}
                {#if recipe.time}
                    <div class="text-center w-1/3">
                        <div class="time">{recipe.time}</div>
                    </div>
                {/if}
                {#if recipe.servings}
                    <div class="text-center w-1/3">
                        <div>{recipe.servings} servings</div>
                    </div>
                {/if}
            </div>
            <hr class="m-3"/>
            <div class="flex justify-evenly text-xs">
                {#if recipe.category}
                    <div class="text-center w-1/3">
                        <div class="auth">{recipe.category}</div>
                    </div>
                {/if}
                {#if recipe.cuisine}
                    <div class="text-center w-1/3">
                        <div class="time">{recipe.cuisine}</div>
                    </div>
                {/if}
                {#if recipe.country}
                    <div class="text-center w-1/3">
                        <div class="time">{recipe.country}</div>
                    </div>
                {/if}
            </div>
            <hr class="m-3"/>
            <div class="w-full flex justify-evenly content-center mt-1">
                {#if recipe.url}
                    <a class="btn btn-secondary btn-xs" href={recipe.url} target="_blank">original recipe</a>
                {/if}
                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center" on:click={()=>{recipe.made = !recipe.made}}><ThumbUp color={(recipe.made) ? "fill-primary" : "fill-neutral"}/></button>
                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center" on:click={()=>{recipe.favorite = !recipe.favorite}}><Heart color={(recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                <button class="btn btn-xs md:btn-sm btn-secondary" on:click={edit_groceries}><EditIcon/></button>
            </div>
        </div>
    </div>
    <div class="ingr_directions_container flex flex-col md:w-4/5 m-auto space-y-6">
        <div>
            <div class="text-sm">Ingredients</div>
            <div id="ingredient_list" class="flex flex-col m-2 border rounded-md w-fit m-auto py-1">
                
                {#each recipe.expand.ingr_list as ingr, i}
                    {#if ingr}
                        <div class="ingr_row flex w-full space-x-1 items-center px-5">
                            <div class="ingr_amount text-xs md:text-sm my-1 text-center md:w-9">{ingr.quantity ? ingr.quantity : ""}</div>
                            <div class="ingr_unit md:w-24 text-center text-xs md:text-sm my-1">{ingr.unit ? ingr.unit : ""}</div>
                            <div class="ingr_name md:w-7/10 text-xs md:text-sm">{ingr.ingredient ? ingr.ingredient : ""}</div>
                        </div>
                    {/if}
                    {#if i < recipe.expand.ingr_list.length - 1}
                        <hr class="mx-3"/>
                    {/if}
                {/each}
            </div>
        </div>
        
        <div>
            <div class="text-sm">Directions</div>
            <div class="directions_list border rounded-md m-1 space-y-2">
                {#each recipe.directions as curr, i}
                    <div class="step flex items-center justify-center px-2 py-1 space-x-3">
                        <label for="directions" class="flex text-right w-fit text-xs basis-12 shrink-0 justify-end">Step {i+1}</label>
                        <p class="directions flex grow h-fit text-xs md:text-sm">{curr}</p>
                    </div>
                    {#if i < recipe.directions.length - 1}
                        <hr class="mx-3"/>
                    {/if}
                {/each}
            </div>
        </div>
        
        {#if recipe.expand.notes}
            <div>Notes</div>
            {#each recipe.expand.notes as note, i}
                <div class="notes_container flex items-center justify-center">
                    <div class="notes flex grow m-1 w-4/5 h-fit text-xs md:text-sm">{get_local_time(note.updated)}</div>
                    <div class="notes flex grow m-1 w-4/5 h-fit text-xs md:text-sm">{note.content}</div>
                </div>
            {/each}
        {/if}
    </div>
</div>