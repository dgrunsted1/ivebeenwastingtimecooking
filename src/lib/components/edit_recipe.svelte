<script>
    import { currentUser, pb } from '/src/lib/pocketbase';
    import { createEventDispatcher,afterUpdate, onMount } from 'svelte';
    import { page } from '$app/stores';
    import { save_recipe, update_image_upload } from '/src/lib/save_recipe.js';
    import { process_recipe_old } from '/src/lib/process_recipe.js';
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";
    import Edit from "/src/lib/icons/EditIcon.svelte";


    export let recipe;
    export let index;
    export let save = false;
    export let show_alert;
    let dispatch = createEventDispatcher();
    $: categories = [];
    $: display_categories = [];
    $: cuisines = [];
    $: display_cuisines = [];
    const countries = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", 
        "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", 
        "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", 
        "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", 
        "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", 
        "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", 
        "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", 
        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)", 
        "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", 
        "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", 
        "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", 
        "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", 
        "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", 
        "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", 
        "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", 
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", 
        "North Macedonia (formerly Macedonia)", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", 
        "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", 
        "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
        "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
        "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", 
        "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", 
        "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", 
        "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", 
        "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", 
        "Zimbabwe"
    ];
    $: display_countries = countries;

    onMount(async () => {
        let cuisines_result = await pb.collection('recipes').getList(1, 1000, {field: `cuisine`});
        for (let i = 0; i < cuisines_result.items.length; i++) if (!cuisines.includes(cuisines_result.items[i].cuisine) && cuisines_result.items[i].cuisine) cuisines.push(cuisines_result.items[i].cuisine);
        cuisines = cuisines;
        display_cuisines = cuisines;

        let categories_result = await pb.collection('recipes').getList(1, 1000, {field: `category`});
        for (let i = 0; i < categories_result.items.length; i++) if (!categories.includes(categories_result.items[i].category) && categories_result.items[i].category) categories.push(categories_result.items[i].category);
        categories = categories;
        display_categories = categories;
    })

    afterUpdate(() => {
        let textareas = document.getElementsByTagName("textarea");
        for (let i = 0; i < textareas.length; i++) {
            resizeIt(textareas[i]);
        }
        if ( recipe.title && recipe.expand.ingr_list.length && recipe.directions.length){
            let save_btns = document.getElementsByClassName("save_btn");
            for (let i = 0; i < save_btns.length; i++) {
                save_btns[i].disabled = false;
                save_btns[i].innerHTML = "save recipe";
            }
        }else {
            let save_btns = document.getElementsByClassName("save_btn");
            for (let i = 0; i < save_btns.length; i++) {
                save_btns[i].disabled = true;
            }
        }
    });

    async function save_recipe_v2(e){
        save = false;
        reset_checks();
        document.getElementById("new_note").value = "";
        const recipe_result = await save_recipe(e, recipe, $currentUser, document.getElementById("new_note").value);
        dispatch("update_recipe", {recipe: recipe_result});
    }

    function reset_checks(){
        Array.from(document.querySelectorAll(".removed input[type='checkbox']")).forEach(curr => {
            curr.checked = false;
        });
    }

    function check_item(e){
        let ingr;
        let is_removed = false;
        if (e.srcElement.type != "checkbox"){
            original = e.target.firstChild.id;
            if (e.target.firstChild.checked){
                e.target.firstChild.checked = false;
            }else{
                e.target.firstChild.checked = true;
                is_removed = true;
            }
        }else{
            ingr = e.srcElement.id;
            is_removed = e.srcElement.checked;
        }
        let temp = [];
        for (let i = 0; i < recipe.expand.ingr_list.length; i++){
            if (recipe.expand.ingr_list[i].ingredient == ingr){
                recipe.expand.ingr_list[i].removed = is_removed;
            }
        }
    }

    function update_multiplier(e){
        const servings_in_recipe = e.srcElement.parentElement.parentElement.getElementsByClassName("recipe_servings")[0].value;
        let desired_servings = servings_in_recipe;
        if (e.srcElement.parentElement.parentElement.getElementsByClassName("desired_servings")[0]){
            desired_servings = e.srcElement.parentElement.parentElement.getElementsByClassName("desired_servings")[0].value;
        }
        // multiplier = desired_servings / servings_in_recipe;
        dispatch("update_multiplier", {
            multiplier: desired_servings / servings_in_recipe,
            index: index
        });
    }


    function add_ingr(){
        recipe.expand.ingr_list[recipe.expand.ingr_list.length] = {amount: 1, unit: "", name: "", original:[""]};
    }

    function add_dir(e){
        recipe.directions = recipe.directions.toSpliced(e.srcElement.id, 0, "");
    }

    function remove_dir(e){
        let output = [];
        for (let i = 0; i < recipe.directions.length; i++){
            if (i != e.srcElement.id) output.push(recipe.directions[i]);
        }
        recipe.directions = output;
    }

    function remove_note(e){
        let note_id = e.srcElement.id;
        let output = [];
        for (let note of recipe.expand.notes){
            if (note.id != note_id) output.push(note);
        }
        recipe.expand.notes = output;
    }

    function get_local_time(utc_code){
        const event = new Date(utc_code);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        return event.toLocaleDateString(undefined, options);
    }

    function resizeIt(element) {
        let str = element.value;
        if (!str) return;
        let cols = ($page.url.pathname == "/add_recipe") ? element.cols * 10 : element.cols * 2.8;
        element.rows = Math.ceil( str.length / cols ) + 1;
    };

    function filter_cuisines(e){
        display_cuisines = [];
        for (let i = 0; i < cuisines.length; i++){
            if (!display_cuisines.includes(cuisines[i]) && cuisines[i].toLowerCase().includes(recipe.cuisine.toLowerCase())){
                display_cuisines.push(cuisines[i]);
            }
        }
        display_cuisines = display_cuisines;
    }

    function filter_countries(e){
        display_countries = [];
        for (let i = 0; i < countries.length; i++){
            if (!display_countries.includes(countries[i]) && countries[i].toLowerCase().includes(recipe.country.toLowerCase())){
                display_countries.push(countries[i]);
            }
        }
        display_countries = display_countries;
    }

    async function filter_categories(e){
        display_categories = [];
        for (let i = 0; i < categories.length; i++){
            if (!display_categories.includes(categories[i]) && categories[i].toLowerCase().includes(recipe.category.toLowerCase())){
                display_categories.push(categories[i]);
            }
        }
        display_categories = display_categories;
    }

    const parse_ingredients = function(e) {
        let ingr_list = process_recipe_old(e.data.split("\n"));
        recipe.expand.ingr_list = ingr_list;
    }

    const parse_directions = function(e){
        recipe.directions = e.data.split("\n");
    }
    
    const done_editing = function(){
        dispatch("done_editing");
    }
</script>

<div id="recipe" class="flex flex-col">
    {#if $page.url.pathname == "/menu"}<button class="btn btn-xs btn-ghost absolute left-4 top-2" on:click={done_editing}>done</button>{/if}
    <div class="save_btn_container flex flex-col items-center mb-5 mt-1">
        <button class="save_btn btn btn-secondary btn-xs md:btn-md w-1/3" disabled="true" on:click={save_recipe_v2}>
            save recipe
        </button>
    </div>
    <div class="img_info_container flex flex-col md:flex-row w-full content-center justify-around">
        <div class="img_container flex md:w-1/2 content-center">
            <div class="w-full flex flex-col space-y-2">
                <div class="w-full flex flex-col relative">
                    {#if recipe.image}
                        <img src={recipe.image} alt={recipe.title} class="max-h-52 md:max-h-96 rounded-xl m-auto"/>
                        <input type="file" name="photo" id="photo" class="w-8 md:w-10 absolute bottom-5 self-center md:h-10 opacity-0 z-10" on:change={async(e) => {recipe.image = await update_image_upload(e)}}/>
                        <button class="btn btn-xs md:btn-sm btn-secondary w-8 md:w-10 absolute bottom-5 self-center"><Edit/></button>
                    {:else}
                        {#if !show_alert}
                            <input type="file" name="photo" id="photo" class="absolute max-w-[605px] w-23/25 h-[225px] opacity-0" on:change={async(e) => {recipe.image = await update_image_upload(e)}}/>
                        {/if}
                        <p class="h-52 text-center text-xl border-dashed border-2 border-primary">Drag your files here or click to browse</p>
                    {/if}
                    <div id="status"></div>
                </div>
                <input placeholder="Link to image" name="url" type="text" class="input input-bordered input-xs w-full text-center input-accent" bind:value={recipe.image}/>
            </div>
        </div>
        <div class="info_container md:w-1/2 mx-1">
            <div class="title_container form-control">
                <label for="title" class="label p-0"><span class="label-text-alt p-0">Title</span></label>
                <input type="text" class="title input input-bordered input-xs" bind:value={recipe.title}/>
            </div>
            <div class="decription_container form-control w-full">
                <label for="desc" class="label p-0"><span class="label-text-alt p-0">Description</span></label>
                <textarea class="desc textarea textarea-bordered" type="text" bind:value={recipe.description}></textarea>
            </div>
            <div class="title_container form-control">
                <label for="title" class="label p-0"><span class="label-text-alt p-0">link</span></label>
                <input type="text" class="title input input-bordered input-xs" bind:value={recipe.url}/>
            </div>
            <div class="misc w-full">
                <div class="flex flex-row">
                    <div class="author_container form-control w-1/2">
                        <label for="auth" class="label p-0"><span class="label-text-alt p-0">Author</span></label>
                        <input class="auth input input-bordered input-xs px-1 mr-1" type="text" bind:value={recipe.author}>
                    </div>
                    <div class="time_container form-control w-1/2">
                        <label for="time" class="label p-0"><span class="label-text-alt p-0">Time</span></label>
                        <input class="time input input-bordered input-xs px-1" type="text" bind:value={recipe.time}>
                    </div>
                </div>
                <div>
                    <div id="servings" class="flex flex-row justify-center content-center">
                        <div class="mr-1 form-control w-1/2">
                            <label for="recipe_servings" class="mx-1 label p-0"><span class="label-text-alt p-0">servings</span></label>
                            <input type="text" name="recipe_servings" id="recipe_servings" class="recipe_servings input input-bordered p-1 input-xs" bind:value={recipe.servings} on:input|preventDefault={update_multiplier} on:delete|preventDefault={update_multiplier} min=1>
                        </div>
                        {#if $page.url.pathname == "/prep"}
                            <div class="form-control w-1/2">
                                <label for="recipe_servings" class="mx-1 label p-0"><span class="label-text-alt p-0">desired servings</span></label>
                                <input type="text" name="desired_servings" id="desired_servings" class="desired_servings input input-bordered p-1 input-xs" bind:value={recipe.servings} on:input|preventDefault={update_multiplier} on:delete|preventDefault={update_multiplier} min=1 >
                            </div>
                        {/if}
                    </div>
                    <div class="flex justify-evenly content-center w-full my-1 space-x-1 flex-wrap">
                        <div class="flex w-full justify-around space-x-2 p-1">
                            <div class="dropdown w-1/2">
                                <input type="text" id="cuisine" placeholder="cuisine" tabindex="0" class="input input-bordered input-xs m-1 w-full cursor-text" bind:value={recipe.cuisine} on:input={filter_cuisines}/>
                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box">
                                    <div class="flex flex-col max-w-52 max-h-[50vh] overflow-y-scroll">
                                        {#each display_cuisines as cuisine}
                                            <li class="cursor-pointer" on:click={()=>{recipe.cuisine = cuisine; document.activeElement.blur();}}>{cuisine}</li>
                                        {/each}
                                    </div>
                                </ul>
                            </div>
                            <div class="dropdown dropdown-end w-1/2">
                                <input type="text" id="country" placeholder="country" tabindex="0" class="input input-bordered input-xs m-1 cursor-text w-full" bind:value={recipe.country} on:input={filter_countries}/>
                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box">
                                    <div class="flex flex-col max-w-52 max-h-[50vh] overflow-y-scroll">
                                        {#each display_countries as country}
                                            <li class="cursor-pointer" on:click={()=>{recipe.country = country; document.activeElement.blur();}}>{country}</li>
                                        {/each}
                                    </div>
                                </ul>
                            </div>
                        </div>
                        <div class="flex items-center w-full justify-around">
                            <div class="dropdown w-1/2 flex">
                                <input type="text" id="category" placeholder="category" tabindex="0" class="input input-bordered input-xs m-1 cursor-text w-full" bind:value={recipe.category} on:input={filter_categories}/>
                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box mt-8">
                                    <div class="flex flex-col max-w-52 max-h-[50vh] overflow-y-scroll">
                                        {#each display_categories as category}
                                            <li class="cursor-pointer" on:click={()=>{recipe.category = category; document.activeElement.blur();}}>{category}</li>
                                        {/each}
                                    </div>
                                </ul>
                            </div>
                            <div class="flex w-1/2 space-x-1 justify-evenly">
                                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center" on:click={()=>{recipe.made = !recipe.made}}><ThumbUp color={(recipe.made) ? "fill-primary" : "fill-black"}/></button>
                                <button class="btn btn-xs md:btn-sm p-1 btn-ghost flex content-center" on:click={()=>{recipe.favorite = !recipe.favorite}}><Heart color={(recipe.favorite) ? "fill-primary" : "fill-black"}/></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full flex justify-center mt-1"><a class="btn btn-accent btn-xs md:btn-sm" href={recipe.url} target="_blank">original recipe</a></div>
            </div>
        </div>
    </div>
    <div class="ingr_directions_container">
        <div class="badge badge-primary md:ml-14 mt-3">Ingredients</div>
        <div id="ingredient_list">
            {#if recipe.expand.ingr_list.length}
                {#each recipe.expand.ingr_list as ingr, i}
                    {#if ingr}
                        <div class="ingr_row flex flex-row justify-center items-center mt-1 " class:removed={ingr.removed}>
                            <input type="text" class="ingr_amount input input-bordered input-xs px-1 mr-1 w-10 text-center h-fit" bind:value={recipe.expand.ingr_list[i].quantity}>
                            <input type="text" class="ingr_unit input input-bordered input-xs px-1 mr-1 w-16 text-center h-fit" id="{recipe.expand.ingr_list[i].id}" bind:value={recipe.expand.ingr_list[i].unit}>
                            <input type="text" class="ingr_name input input-bordered input-xs px-1 mr-1 w-80 h-fit" bind:value={recipe.expand.ingr_list[i].ingredient}>
                            <input on:click={check_item} id={recipe.expand.ingr_list[i].ingredient} type="checkbox" class="checkbox checkbox-accent checkbox-sm"/>
                        </div>
                    {/if}
                {/each}
            {:else}
                <div class="flex justify-center w-4/5 m-auto h-52">
                    <textarea class="w-full textarea textarea-bordered" on:input|preventDefault={parse_ingredients}/>
                </div>
            {/if}
            <div class="flex justify-center mt-2">
                <button class="btn btn-secondary btn-xs" on:click={add_ingr}>add ingredient</button>
            </div>
        </div>

        <div class="directions_list w-full flex flex-col items-center">
            <div class="badge badge-primary mt-3 self-start">Directions</div>
            {#if recipe.directions.length}
                {#each recipe.directions as curr, i}
                    <div class="step w-full md:w-4/5">
                        <label for="directions" class="mx-1 label p-0 ">
                            <span class="label-text-alt p-0">Step {i+1}</span>
                            <div class="flex justify-center mt-2 space-x-1">
                                <button id={i} class="btn btn-xs my-1 bg-transparent" on:click={add_dir}>add</button>
                                <button id={i} class="btn btn-xs my-1 bg-transparent" on:click={remove_dir}>remove</button>
                            </div>
                        </label>
                        <textarea class="directions w-full textarea textarea-bordered" bind:value={recipe.directions[i]}/>
                    </div>
                {/each}
            {:else}
                <div class="flex justify-center w-4/5 m-auto h-52">
                    <textarea class="w-full textarea textarea-bordered" on:input|preventDefault={parse_directions}/>
                </div>
            {/if}
            
            <div class="flex justify-center mt-2">
                <button id={recipe.directions.length} class="btn btn-secondary btn-xs" on:click={add_dir}>add direction</button>
            </div>
        </div>

        <div class="notes_container p-1 w-full flex flex-col items-center">
            <div class="badge badge-primary mt-3 self-start">Notes</div>
            {#if recipe.expand && recipe.expand.notes}
                {#each recipe.expand.notes as note, i}
                    <div class="w-4/5">
                        <label for="directions" class="mx-1 label p-0 "><span class="label-text-alt p-0">{get_local_time(recipe.expand.notes[i].updated)}</span><button id={recipe.expand.notes[i].id} class="btn btn-xs my-1" on:click={remove_note}>remove</button></label>
                        <textarea class="notes textarea w-full textarea-bordered" bind:value={recipe.expand.notes[i].content}/>
                    </div>
                {/each}
            {/if}
            <div class="w-full md:w-4/5">
                <label for="directions" class="mx-1 label p-0 "><span class="label-text-alt p-0">New</span></label>
                <textarea id="new_note" class="notes textarea w-full textarea-bordered"></textarea>
            </div>
        </div>
        <div class="save_btn_container flex flex-col items-center">
            <button class="save_btn btn btn-secondary btn-xs md:btn-md w-1/3" disabled="true" on:click={save_recipe_v2}>
                save recipe
            </button>
        </div>
    </div>
</div>