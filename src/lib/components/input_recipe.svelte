<script>
export let name;
export let index;
import { createEventDispatcher } from 'svelte';
import { invalidateAll} from '$app/navigation';
import { deserialize } from '$app/forms';
import EditRecipe from "/src/lib/components/edit_recipe.svelte";
import { process_recipe_old } from '/src/lib/process_recipe.js'


const dispatch = createEventDispatcher();
let recipe;

let multiplier = 1;

function forward_input(e) {
    let items = process_recipe_old(e.srcElement.value.split("\n"));
	dispatch('recipe_edited', {
        items: items, 
        multiplier: multiplier,
        index: index
    });
}

function update_recipe(e){
    recipe = e.detail.recipe;
    multiplier = e.detail.multiplier;
    dispatch('recipe_edited', {
        items: recipe.expand.ingr_list, 
        multiplier: multiplier,
        index: index
    });
}

async function fetch_recipe(e){
    const data = new FormData(this);

    const response = await fetch(this.action, {
        method: 'POST',
        body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());
    if (result.data.err) {
        alert(result.data.err);
        e.srcElement.value = "";
    } else if (result.type === 'success') {
        result.data.expand.ingr_list = process_recipe_old(result.data.expand.ingr_list);
        result.data.url = e.srcElement.value;
        recipe = result.data;
        dispatch('recipe_edited', {
            items: result.data.expand.ingr_list, 
            multiplier: multiplier,
            index: index
        });
        // re-run all `load` functions, following the successful update
        await invalidateAll();
    }
    
    
    // applyAction(result);
}

</script>
<div id="main" class="flex flex-col">
    
    {#if recipe}
        <EditRecipe {recipe} {index} on:update_recipe={update_recipe}/>
    {:else}
        <div class="link">
            <form method='POST' on:input|preventDefault={fetch_recipe}>
                <input placeholder="Link to recipe" name="url" type="text" class="input input-bordered input-xs w-full text-center input-accent"/>
            </form>
        </div>
        <div class="divider">OR</div>
        <div class="flex justify-center">
            <textarea id="ingr_list_input" cols="60" rows="10" class="textarea textarea-primary" placeholder="Paste ingredient list here" on:input|preventDefault={forward_input} on:delete|preventDefault={forward_input}></textarea>
        </div>
    {/if}
</div>


