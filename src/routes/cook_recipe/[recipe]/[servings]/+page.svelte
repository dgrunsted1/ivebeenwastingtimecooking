<script>
    import { stopPropagation } from 'svelte/legacy';

    import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import Edit from "/src/lib/icons/EditIcon.svelte";
    import Grip from "/src/lib/icons/Grip.svelte";
    import { onMount } from 'svelte';
    import { update_fav_made, update_notes } from '/src/lib/save_recipe.js';
    import { update_made, log_made } from '/src/lib/groceries.js'
    import { update_image_upload, update_recipe_image } from '/src/lib/save_recipe.js';
    import EditRecipe from "/src/lib/components/edit_recipe.svelte";
    import Timer from "/src/lib/components/timer.svelte";
    import Alerts from "/src/lib/components/alerts.svelte";

    
    
    /**
     * @typedef {Object} Props
     * @property {import('./$types').PageData} data
     */

    /** @type {Props} */
    let { data = $bindable() } = $props();
    let recipe = $state(data.post.recipe);
    const scroll_size = 425;
    let user_logged_in = $state(false);
    let todays_menu = $state();
    let recipe_ready = $state(false);
    let delay_timer;
    let toast = $state({info: null, success: null, error: null});
    let timers = $state({});
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let servings = $state(data.post.servings);

    const get_quantity = function(quantity, servings){
        if (isNaN(recipe.servings) || isNaN(servings)){
            return quantity;
        }
        if (quantity){
            const temp_serv = parseFloat(servings) ? parseFloat(servings) : 1;
            let output = quantity * (parseFloat(temp_serv) / parseFloat(recipe.servings));
            return output.toFixed(2) * 1;
        } else {
            return "";
        }
    }

    let ingrs = $derived(recipe.expand.ingr_list.map((ingr) => {
        return {
            quantity: get_quantity(ingr.quantity, servings),
            unit: ingr.unit ? ingr.unit : "",
            ingredient: ingr.ingredient,
        }
    }));


    onMount(async () => {
        if ($currentUser){
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
        if ($currentUser && $currentUser.id == recipe.user) {
            user_logged_in = true;

            const result_menu = await pb.collection('menus').getList(1, 1, {
                filter: `user="${$currentUser.id}" && today=True`,
            });
            todays_menu = result_menu.items[0];
            update_recipe_ready();
        }
        sort_notes();
        set_timers();
    });

    function set_timers(){
        for (let i = 0; i < recipe.directions.length; i++){
            let timeMatch = recipe.directions[i].match(/(\d+) (minutes|hours|minute|hour|mins|min|hr|hrs)/);
            if (timeMatch) {
                if (timeMatch[2] === 'minutes' || timeMatch[2] === 'minute' ||
                    timeMatch[2] === 'min' || timeMatch[2] === 'mins') {
                    timers[i] = {sec: timeMatch[1] * 60, show: false};
                } else {
                    timers[i] = {sec: timeMatch[1] * 60 * 60, show: false};
                }
            } else {
                timers[i] = {sec: 0, show: false};
            }
        }
    }

    function sort_notes(){
        const notes = recipe.expand.notes;
        if (notes){
            notes.sort(function(a, b) {
                return new Date(a.updated) - new Date(b.updated);
            });
            recipe.expand.notes = notes
        }
    }

    function toggle_made(e){
        const id = e.srcElement.id;
        if (todays_menu.made){
            todays_menu.made[id] = !todays_menu.made[id];
        } else {
            todays_menu.made = {};
            todays_menu.made[id] = true;
        }
        if (todays_menu.made[id]) log_made(id, $currentUser.id);
        update_made(todays_menu.made, todays_menu.id, $currentUser.id);
    }

    const update_recipe_ready = function() {
        let curr_sub_recipes = [];
        if (todays_menu.sub_recipes && todays_menu.sub_recipes[recipe.id]){
            for (let j = 0; j < todays_menu.sub_recipes[recipe.id].length; j++) {
                curr_sub_recipes.push(todays_menu.sub_recipes[recipe.id][j].recipe_id);
            }
            curr_sub_recipes = curr_sub_recipes;
            if (curr_sub_recipes.length){
                let is_ready = true;
                for (let i in todays_menu.made){
                    if (curr_sub_recipes.includes(i) && !todays_menu.made[i]) {
                        is_ready = false;
                        break;
                    }
                }
                recipe_ready = is_ready;
            } else {
                recipe_ready = true;
            }
        } else {
            recipe_ready = true;
        }
    }

    

    async function update_fave_made_pre(){
        await update_fav_made(recipe.id);
    }

    async function update_fav(e){
        e.stopPropagation();
        const val = !recipe.favorite;
        const result = await update_fav_made(recipe.id, "favorite", val);
        recipe = result;
    }

    async function update_made_2(e){
        e.stopPropagation();
        const val = !recipe.made;
        const result = await update_fav_made(recipe.id, "made", val);
        recipe = result;
    }

    async function update_notes_action(e){
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            toast.info = "saving...";
            const new_note = document.getElementById("new_note").value;
            let notes_result = null;
            if (new_note){
                notes_result = await update_notes(recipe.expand.notes, new_note, recipe.id);
                recipe.expand.notes = notes_result;
            } else {
                notes_result = await update_notes(recipe.expand.notes, null, recipe.id);
            }
            toast.info = null;
            if (notes_result){
                toast.success = "saved!";
                e.srcElement.value = "";
                e.srcElement.classList.toggle("hidden");
                e.srcElement.previousElementSibling.classList.toggle("hidden");
                document.getElementById("new_note_btn").classList.remove("hiddden");
            } else {
                toast.error = "error saving note";
            }
            clearTimeout(delay_timer);
            delay_timer = setTimeout(async () => {
                toast.success = null;
            }, 2000);
        }, 5000); 
    }

    function edit_note(e){
        const el = e.currentTarget;
        el.classList.toggle("hidden");
        el.nextElementSibling.classList.toggle("hidden");
        el.nextElementSibling.focus();
    }

    async function new_recipe_image(e){
        recipe.image = await update_image_upload(e);
        update_recipe_image(recipe.image, recipe.id);
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        let timeString = '';

        if (hours > 0) {
            timeString += `${hours} hr${hours > 1 ? 's' : ''} `;
        }

        if (minutes > 0) {
            timeString += `${minutes} min${minutes > 1 ? 's' : ''} `;
        }

        if (secs > 0) {
            timeString += `${secs} sec${secs > 1 ? 's' : ''}`;
        }

        return timeString.trim();
    }

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }
</script>

    <svelte:head>
        <meta property="og:title" content={recipe.title} />
        <meta property="og:description" content={recipe.description} />
        <meta property="og:image" content={recipe.image} />
        <meta property="og:url" content={`https://www.ivebeenwastingtimecooking.com/cook_recipe/${recipe.url_id}/${recipe.servings}`} />
        <meta property="og:type" content="website" />
    </svelte:head>

    <div id="cook_recipe" class="flex flex-col md:m-2 md:pb-10">
        <div class="img_info_container flex flex-col md:flex-row items-center justify-center">
            <div class="img_container w-full md:w-auto flex flex-col">
                <img src={recipe.image} alt={recipe.title} class="max-h-52 max-w-52 md:max-w-96 md:max-h-96 rounded-xl m-auto"/>
            </div>
            <div class="info_container w-full md:w-1/2 flex flex-col m-1 space-y-2 md:space-y-4">
                <div class="title_container mx-auto my-2">
                    <div class="title w-full md:text-xl">{recipe.title}</div>
                </div>
                <div class="description_container m-auto w-5/6">
                    <div class="desc text-xs md:text-sm" >{recipe.description}</div>
                </div>
                <div class="misc flex justify-evenly content-center">
                    <div class="content-center">{recipe.author}</div>
                    <div class="content-center">{recipe.time}</div>
                    <div class="content-center"><input type="text" class="input input-primary input-sm w-10 p-1 mx-2 text-center" bind:value={servings} />servings</div>
                </div>
                <div class="flex justify-evenly">
                    <div class="content-center">{recipe.category}</div>
                    <div class="content-center">{recipe.cuisine}</div>
                    <div class="content-center">{recipe.country}</div>
                </div>
                <div class="flex justify-evenly items-center">
                    {#if recipe.url}
                        <div class=" flex justify-center mt-1"><a class="btn btn-primary btn-xs md:btn-sm" href={recipe.url} target="_blank">original recipe</a></div>
                    {/if}    
                    {#if user_logged_in}
                        {#if recipe_ready}
                            {#if todays_menu.made && todays_menu.made[recipe.id] !== undefined}
                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={recipe.id} bind:checked={todays_menu.made[recipe.id]} onclick={stopPropagation(toggle_made)}>
                            {:else}
                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={recipe.id} onclick={stopPropagation(log_made(recipe.id, $currentUser.id))}>
                            {/if}
                        {:else}
                            not ready
                        {/if}
                        <button class="btn btn-xs md:btn-sm p-1 btn-ghost made flex content-center" onclick={update_made_2}><ThumbUp color={(recipe.made) ? "fill-primary" : "fill-neutral"}/></button>
                        <button class="btn btn-xs md:btn-sm p-1 btn-ghost favorite flex content-center" onclick={update_fav}><Heart color={(recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                        <button class="btn btn-xs md:btn-sm btn-primary w-8 md:w-10" onclick={() => {my_modal_3.showModal(); document.getElementById('modal_content').classList.remove('hidden');}}><Edit/></button>
                    {:else if $currentUser}
                        <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={recipe.id} onclick={stopPropagation(log_made(recipe.id, $currentUser.id))}>
                    {/if}
                </div>    
            </div>
        </div>
        <div class="ingr_directions_container flex flex-col md:flex-row justify-center w-full items-center">
            <div id="ingredient_list" class="flex flex-col h-fit w-full md:w-2/5 m-2 mb-0 max-h-[calc(40vh)] md:max-h-[calc(64vh)] overflow-y-auto border border-primary rounded-md pt-5 md:py-4">
                {#if ingrs}
                    {#each ingrs as ingr}
                        {#if ingr}
                            <button class="ingr_row flex items-center ml-2 md:ml-4 mr-1 gap-x-1 md:gap-x-2" onclick={(e) => {e.currentTarget.classList.toggle('blur'); }}>
                                <div class="ingr_amount text-sm text-center">{ingr.quantity}</div>
                                <div class="ingr_unit text-center text-sm">{ingr.unit}</div>
                                <div class="ingr_name text-center text-sm">{ingr.ingredient}</div>
                            </button>
                            {#if ingrs[ingrs.length-1] != ingr}
                                <div class="divider my-1 "></div>
                            {/if}
                        {/if}
                    {/each}
                {/if}
            </div>
            <div class="flex md:hidden"><Grip/></div>
            <div class="flex flex-col directions_list md:w-3/5 h-fit  max-h-[calc(40vh)] md:max-h-[calc(64vh)] overflow-y-auto border border-primary rounded-md cursor-pointer py-5">
                {#each recipe.directions as curr, i}
                <div class="flex justify-between items-center mr-2">
                    <button class="step flex items-center justify-left gap-x-1 md:gap-x-3 md:mx-2 p-1 w-fit" onclick={(e) => {e.currentTarget.classList.toggle('blur'); }} onkeydown={(e) => {e.currentTarget.classList.toggle('blur'); }}>
                        <label for="directions" class="flex md:text-right text-xs md:text-sm whitespace-nowrap">Step {i+1}</label>
                        <p class="directions flex m-1 p-1 text-sm border-l border-neutral md:pl-3 text-left{timers[i] && timers[i].sec ? " w-64 md:w-full" : ""}">{curr}</p>
                    </button>
                    {#if timers[i] && timers[i].show}
                        <div class="my-1 flex md:w-1/5 max-w-[150px]">
                            <Timer countdown={timers[i].sec}/>
                        </div>
                    {:else if timers[i] && timers[i].sec}
                        <button id={i} class="btn btn-xs md:btn-sm btn-primary my-1" onclick={(e)=>{timers[e.currentTarget.id].show = true}}>{formatTime(timers[i].sec)}</button>
                    {/if}
                </div>
                    {#if recipe.directions[recipe.directions.length-1] != curr}
                            <div class="divider my-px md:my-1 "></div>
                    {/if}
                {/each}
            </div>
        </div>
        <div class="notes_container form-control m-2 md:mt-5 md:mx-5 space-y-2 flex items-center">
            {#if user_logged_in}
                <button id="new_note_btn" class="btn btn-primary btn-xs w-26 self-end" onclick={edit_note}>new note</button>
                <textarea name="notes" id="new_note" class="hidden textarea textarea-bordered border-primary h-24 w-full md:w-1/2" placeholder="Notes" oninput={update_notes_action}></textarea>
            {/if}
            {#if recipe.expand.notes}
                {#each recipe.expand.notes as note, i}
                    <button class="m-2 text-xs md:text-base" onclick={edit_note}>{note.content}</button>
                    <textarea name="notes" class="hidden textarea textarea-bordered border-primary h-24 w-full md:w-1/2" placeholder="Notes" bind:value={note.content} oninput={update_notes_action}></textarea>
                {/each}
            {/if}
        </div>
    </div>
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
    <div class="toast toast-center">
        {#if toast.info}
            <div class="alert alert-info">
                <span>{toast.info}</span>
            </div>
        {:else if toast.success}
            <div class="alert alert-success">
                <span>{toast.success}</span>
            </div>
        {:else if toast.error}
            <div class="alert alert-error">
                <span>{toast.error}</span>
            </div>
        {/if}
      </div>
      {#if user_logged_in}
            <dialog id="my_modal_3" class="modal">
                <div class="modal-box max-w-full md:w-2/3 p-1 h-[80vh] z-0">
                    <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <div id="modal_content">
                        <EditRecipe
                            recipe={recipe}
                            update_recipe={(e) => {recipe = e.recipe}}
                        />
                    </div>
                </div>
            </dialog>
        {/if}