<script>
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import Edit from "/src/lib/icons/EditIcon.svelte";
    import { afterUpdate, onMount } from 'svelte';
    import { update_fave_made, update_notes } from '/src/lib/save_recipe.js';
    import { update_made, log_made } from '/src/lib/groceries.js'
    import { update_image_upload, update_recipe_image } from '/src/lib/save_recipe.js';
    import EditRecipe from "/src/lib/components/edit_recipe.svelte";
    import Timer from "/src/lib/components/timer.svelte";

    
    /** @type {import('./$types').PageData} */
    export let data;
    const scroll_size = 425;
    let user_logged_in = false;
    let todays_menu;
    let recipe_ready = false;
    let delay_timer;
    let toast = {info: null, success: null, error: null};
    $: timers = {};


    onMount(async () => {
        if ($currentUser && $currentUser.id == data.post.recipe.user) {
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
        for (let i = 0; i < data.post.recipe.directions.length; i++){
            let timeMatch = data.post.recipe.directions[i].match(/(\d+) (minutes|hours|minute|hour|mins|min|hr|hrs)/);
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
        const notes = data.post.recipe.expand.notes;
        if (notes){
            notes.sort(function(a, b) {
                return new Date(a.updated) - new Date(b.updated);
            });
            data.post.recipe.expand.notes = notes
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
        update_made(todays_menu.made, todays_menu.id);
    }

    const update_recipe_ready = function() {
        let curr_sub_recipes = [];
        if (todays_menu.sub_recipes && todays_menu.sub_recipes[data.post.recipe.id]){
            for (let j = 0; j < todays_menu.sub_recipes[data.post.recipe.id].length; j++) {
                curr_sub_recipes.push(todays_menu.sub_recipes[data.post.recipe.id][j].recipe_id);
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

    const get_quantity = function(quantity){
        if (isNaN(data.post.recipe.servings) || isNaN(data.post.servings)){
            return quantity;
        }
        if (quantity){
            let output = quantity * (parseFloat(data.post.servings) / parseFloat(data.post.recipe.servings));
            return output.toFixed(2) * 1;
        } else {
            return "";
        }
    }

    async function update_fave_made_pre(){
        await update_fave_made([{id: data.post.recipe.id, favorite: data.post.recipe.favorite, made: data.post.recipe.made}]);
    }

    async function update_notes_action(e){
        clearTimeout(delay_timer);
        delay_timer = setTimeout(async () => {
            toast.info = "saving...";
            const new_note = document.getElementById("new_note").value;
            let notes_result = null;
            if (new_note){
                notes_result = await update_notes(data.post.recipe.expand.notes, new_note, data.post.recipe.id);
                data.post.recipe.expand.notes = notes_result;
            } else {
                notes_result = await update_notes(data.post.recipe.expand.notes, null, data.post.recipe.id);
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
        data.post.recipe.image = await update_image_upload(e);
        update_recipe_image(data.post.recipe.image, data.post.recipe.id);
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

</script>

    <div id="cook_recipe" class="flex flex-col md:m-2 pb-4 md:pb-10">
        <div class="img_info_container flex flex-col md:flex-row items-center justify-center">
            <div class="img_container w-full md:w-auto flex flex-col">
                <img src={data.post.recipe.image} alt={data.post.recipe.title} class="max-h-52 max-w-52 md:max-w-96 md:max-h-96 rounded-xl m-auto"/>
            </div>
            <div class="info_container w-full md:w-1/2 flex flex-col m-1 space-y-2 md:space-y-4">
                <div class="title_container mx-auto my-2">
                    <div class="title w-full text-sm md:text-xl">{data.post.recipe.title}</div>
                </div>
                <div class="description_container m-auto w-5/6">
                    <div class="desc text-xs md:text-sm" >{data.post.recipe.description}</div>
                </div>
                <div class="misc flex justify-evenly">
                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                        <div class="auth">{data.post.recipe.author}</div>
                    </div>
                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                        <div class="time">{data.post.recipe.time}</div>
                    </div>
                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                        <div>{data.post.servings} servings</div>
                    </div>
                </div>
                <div class="misc flex justify-evenly">
                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                        <div class="cat">{data.post.recipe.category}</div>
                    </div>
                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                        <div class="cuisine">{data.post.recipe.cuisine}</div>
                    </div>
                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                        <div class="country">{data.post.recipe.country}</div>
                    </div>
                </div>
                <div class="flex justify-evenly items-center">
                    {#if data.post.recipe.url}
                        <div class=" flex justify-center mt-1"><a class="btn btn-secondary btn-xs md:btn-sm" href={data.post.recipe.url} target="_blank">original recipe</a></div>
                    {/if}    
                    {#if user_logged_in}
                        {#if recipe_ready}
                            {#if todays_menu.made && todays_menu.made[data.post.recipe.id]}
                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={data.post.recipe.id} bind:checked={todays_menu.made[data.post.recipe.id]} on:click|stopPropagation={toggle_made}>
                            {:else}
                                <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={data.post.recipe.id} on:click|stopPropagation={log_made(data.post.recipe.id, $currentUser.id)}>
                            {/if}
                        {:else}
                            not ready
                        {/if}
                        <button class="btn btn-xs md:btn-sm p-1 btn-ghost made flex content-center" on:click={()=>{data.post.recipe.made = !data.post.recipe.made; update_fave_made_pre();}}><ThumbUp color={(data.post.recipe.made) ? "fill-primary" : "fill-neutral"}/></button>
                        <button class="btn btn-xs md:btn-sm p-1 btn-ghost favorite flex content-center" on:click={()=>{data.post.recipe.favorite = !data.post.recipe.favorite; update_fave_made_pre();}}><Heart color={(data.post.recipe.favorite) ? "fill-primary" : "fill-neutral"}/></button>
                        <button class="btn btn-xs md:btn-sm btn-secondary w-8 md:w-10" on:click={() => {my_modal_3.showModal(); document.getElementById('modal_content').classList.remove('hidden');}}><Edit/></button>
                    {:else if $currentUser}
                        <input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1" id={data.post.recipe.id} on:click|stopPropagation={log_made(data.post.recipe.id, $currentUser.id)}>
                    {/if}
                </div>    
            </div>
        </div>
        <div class="ingr_directions_container flex flex-col md:flex-row mt-2 my-1 items-center">
            <div id="ingredient_list" class="flex flex-col h-fit w-full md:w-2/5 m-2 max-h-[calc(33vh)] md:max-h-[calc(64vh)] overflow-y-auto border border-primary rounded-md py-1 md:py-4">
                {#each data.post.recipe.expand.ingr_list as ingr}
                    {#if ingr}
                        <div class="ingr_row flex items-center ml-2 md:ml-4 mr-1 gap-x-1 md:gap-x-2" on:click={(e) => {e.currentTarget.classList.toggle('blur'); }}>
                            <div class="ingr_amount text-xs md:text-sm text-center">{get_quantity(ingr.quantity)}</div>
                            <div class="ingr_unit text-center text-xs md:text-sm">{ingr.unit ? ingr.unit : ""}</div>
                            <div class="ingr_name text-center text-xs md:text-sm">{ingr.ingredient}</div>
                        </div>
                        {#if data.post.recipe.expand.ingr_list[data.post.recipe.expand.ingr_list.length-1] != ingr}
                            <div class="divider my-px md:my-1 "></div>
                        {/if}
                    {/if}
                {/each}
            </div>
        
            <div class="flex flex-col directions_list md:w-3/5 h-fit  max-h-[calc(33vh)] md:max-h-[calc(64vh)] overflow-y-auto border border-primary rounded-md cursor-pointer">
                {#each data.post.recipe.directions as curr, i}
                <div class="flex justify-between items-center mr-2">
                    <div class="step flex items-center justify-left gap-x-1 md:gap-x-3 md:mx-2 p-1 w-fit" on:click={(e) => {e.currentTarget.classList.toggle('blur'); }}>
                        <label for="directions" class="flex md:text-right text-xs md:text-sm whitespace-nowrap">Step {i+1}</label>
                        <p class="directions flex m-1 p-1 text-xs md:text-sm border-l border-neutral md:pl-3 {timers[i] && timers[i].sec ? "w-64 md:w-full" : ""}">{curr}</p>
                    </div>
                    {#if timers[i] && timers[i].show}
                        <div class="my-1 flex md:w-1/5 max-w-[150px]">
                            <Timer countdown={timers[i].sec}/>
                        </div>
                    {:else if timers[i] && timers[i].sec}
                        <div id={i} class="btn btn-xs md:btn-sm btn-primary my-1" on:click={(e)=>{timers[e.currentTarget.id].show = true}}>{formatTime(timers[i].sec)}</div>
                    {/if}
                </div>
                    {#if data.post.recipe.directions[data.post.recipe.directions.length-1] != curr}
                            <div class="divider my-px md:my-1 "></div>
                    {/if}
                {/each}
            </div>
        </div>
        <div class="notes_container form-control m-2 md:mt-5 md:mx-5 space-y-2 flex items-center">
            {#if user_logged_in}
                <div id="new_note_btn" class="btn btn-primary btn-xs w-26 self-end" on:click={edit_note}>new note</div>
                <textarea name="notes" id="new_note" class="hidden textarea textarea-bordered border-primary h-24 w-full md:w-1/2" placeholder="Notes" on:input={update_notes_action}></textarea>
            {/if}
            {#if data.post.recipe.expand.notes}
                {#each data.post.recipe.expand.notes as note, i}
                    <p class="m-2 text-xs md:text-base" on:click={edit_note}>{note.content}</p>
                    <textarea name="notes" class="hidden textarea textarea-bordered border-primary h-24 w-full md:w-1/2" placeholder="Notes" bind:value={note.content} on:input={update_notes_action}></textarea>
                {/each}
            {/if}
        </div>
    </div>
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
                        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" on:click={() => {document.getElementById('modal_content').classList.add('hidden')}}>✕</button>
                    </form>
                    <div id="modal_content" class="hidden">
                        <EditRecipe recipe={data.post.recipe} on:update_recipe={(e) => {data.post.recipe = e.detail.recipe}}/>
                    </div>
                </div>
            </dialog>
        {/if}