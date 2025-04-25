<script>
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import { update_made } from "/src/lib/groceries.js";
    import { update_fave } from "/src/lib/save_recipe.js";


    let { 
        recipe = $bindable(),
        done_editing
    } = $props();

</script>

<div id="recipe" class="flex flex-col m-auto py-2 space-y-6 cursor-default mt-5 md:mt-0">
    <div class="img_info_container flex items-center justify-evenly flex-col md:flex-row space-y-2 md:space-y-0">
        <div class="img_container md:w-1/2">
            <img src={recipe.image} alt={recipe.title} class="max-h-52 md:max-h-96 rounded-xl m-auto"/>
        </div>
        <div class="info_container w-full md:w-1/2 flex flex-col space-y-2 md:p-2">
                <div class="title_container flex justify-around w-full my-1">
                    <input type="text" class="input w-full md:w-4/5 input-lg md:input-xl leading-none text-[16px] md:text-xl h-fit p-0 text-center md:text-left" placeholder="title" bind:value={recipe.title}/>
                </div>
                <hr class="m-3"/>
                <div class="h-fit w-full">
                    <textarea class="input w-full text-xs md:text-sm text-center md:text-left" bind:value={recipe.description} placeholder="description"></textarea>
                </div>
                <hr class="m-3"/>
            <div class="flex justify-evenly text-xs">
                <div class="w-1/3">
                    <input type="text" class=" input w-full text-xs h-fit p-0 text-center" bind:value={recipe.author} placeholder="author"/>
                </div>
                <div class="w-1/3">
                    <input type="text" class=" input w-full text-xs h-fit p-0 text-center" bind:value={recipe.time} placeholder="time"/>
                </div>
                <div class="w-1/3">
                    <div class="flex space-x-1 justify-center" onclick={(e) => {e.target.firstChild.focus()}}><input type="text" class="input text-xs h-fit p-0 w-5 text-center" bind:value={recipe.servings}/> servings</div>
                </div>
            </div>
            <hr class="m-3"/>
            <div class="flex justify-evenly text-xs">
                <div class="text-center w-1/3">
                    <input type="text" class="input w-full text-xs h-fit p-0 text-center" placeholder="category" bind:value={recipe.category}/>
                </div>
                <div class="text-center w-1/3">
                    <input type="text" class="input w-full text-xs h-fit p-0 text-center" placeholder="cuisine" bind:value={recipe.cuisine}/>
                </div>
                <div class="text-center w-1/3">
                    <input type="text" class="input w-full text-xs h-fit p-0 text-center" placeholder="country" bind:value={recipe.country}/>
                </div>
            </div>
            <hr class="m-3"/>
            <div class="w-full flex justify-evenly content-center mt-1">
                {#if recipe.url}
                    <a class="btn btn-primary btn-xs" href={recipe.url} target="_blank">original recipe</a>
                {/if}
                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center"><ThumbUp color={(recipe.made) ? "fill-primary" : "fill-neutral"}/></button>
                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center"><Heart color={(recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                <button class="btn btn-primary btn-xs md:btn-sm" onclick={done_editing}><CheckMark/></button>
            </div>
        </div>
    </div>
    <div class="ingr_directions_container flex flex-col md:w-4/5 m-auto space-y-6">
        <div>
            <div class="text-sm">Ingredients</div>
            <div id="ingredient_list" class="flex flex-col m-2 border rounded-md w-fit m-auto py-1">
                {#if recipe.expand && recipe.expand.ingr_list}
                    {#each recipe.expand.ingr_list as ingr, i}
                        {#if ingr}
                            <div class="ingr_row flex w-full space-x-1 items-center px-5">
                                <input type="text" class="input w-7 text-xs h-fit p-0 text-center" placeholder="quantity" bind:value={ingr.quantity}/>
                                <input type="text" class="input w-12 text-xs h-fit p-0 text-center" placeholder="unit" bind:value={ingr.unit}/>
                                <input type="text" class="input w-full text-xs h-fit p-0" placeholder="name" bind:value={ingr.ingredient}/>
                            </div>
                        {/if}
                        {#if i < recipe.expand.ingr_list.length - 1}
                            <hr class="mx-3"/>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>
        
        <div>
            <div class="text-sm">Directions</div>
            <div class="directions_list border rounded-md m-1 space-y-2">
                {#each recipe.directions as curr, i}
                    <div class="step flex items-center justify-center px-2 py-1 space-x-3">
                        <label for="directions" class="flex text-right w-fit text-xs basis-12 shrink-0 justify-end">Step {i+1}</label>
                        <textarea class="input flex grow h-fit text-xs md:text-sm">{curr}</textarea>
                    </div>
                    {#if i < recipe.directions.length - 1}
                        <hr class="mx-3"/>
                    {/if}
                {/each}
            </div>
        </div>
        
        {#if recipe.expand && recipe.expand.notes}
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