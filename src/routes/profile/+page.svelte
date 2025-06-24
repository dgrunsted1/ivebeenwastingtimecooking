<script>
    import { onMount } from 'svelte';
    import { pb, currentUser, auth_refresh } from '/src/lib/pocketbase.js';
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import { get_servings } from '/src/lib/recipe_util.js';
    import Menu from "/src/lib/components/menu.svelte";
    import Alerts from "../../lib/components/alerts.svelte";
	import { flagsStore } from '/src/lib/stores.js';

    let main_recipes = $state([]);
    let recipes = $state([]);
    let dessert_recipes = [];
    let breakfast_recipes = [];
    let other_recipes = [];
    let recipe_rec = $state({});
    let main_recs = [];
    let dessert_rec = {};
    let breakfast_rec = {};
    let other_rec = {};
    let menus = [];
    let edit_profile = $state(false);
    let edit_billing = false;
    let rec_mults = $state({});
    let menu_rec = $state([]);
    let loading = $state({
        user: true,
        menu: true,
        recipe: true
    });
    let total_servings = $derived(get_servings(menu_rec, {}, rec_mults));
    let menu_title = $state("New Menu");
    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let fave = $state({});
    let avg_recipes = $state(0);
    let month_menus = $state(0);
    let tab = $state("info"); // info, stats, recipe, menu
    let most_freq_cuisine = $state("");

    onMount(async () => {
        if (!$currentUser){
            window.location.href = "/login";
            return;
        } else {
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
        loading.user = false;
        const recipe_log_result = await pb.collection('recipe_log').getList(1, 250, {
            filter: `user = "${$currentUser.id}"`,
            expand: `recipe`,
            sort: `-created`
        });
        fave = getMostFrequent(recipe_log_result.items);
        avg_recipes = get_avg_recipes(recipe_log_result.items);
        most_freq_cuisine = get_most_frequent_cuisine(recipe_log_result.items);
        console.log(most_freq_cuisine);
        const menu_log_result = await pb.collection('menu_log').getList(1, 250, {
            filter: `user = "${$currentUser.id}" && date_completed > "${last_month()}"`,
            expand: `menu`,
            sort: `-date_completed`
        });
        month_menus = menu_log_result.items.length;
        const recipe_result = await pb.collection('recipes').getList(1, 250, {
            fields: `id, category`,
            filter: `user="${$currentUser.id}"`,
        });
        recipes = recipe_result.items;
        recipe_rec = await get_random_recipe(recipe_result.items.map(item => item.id));
        loading.recipe = false;
        roll_menu();
    });

    async function roll_menu(){
        loading.menu = true;
        main_recipes = recipes.filter(item => item.category == 'Main').map(item => item.id);
        main_recs = await get_main_recs(main_recipes);
        dessert_rec = await get_random_recipe(recipes.filter(item => item.category == 'Dessert').map(item => item.id));
        breakfast_rec = await get_random_recipe(recipes.filter(item => item.category == 'Breakfast').map(item => item.id));
        other_rec = await get_random_recipe(recipes.filter(item => !['Main', 'Dessert', 'Breakfast'].includes(item.category)).map(item => item.id));
        menu_rec = main_recs.concat(dessert_rec).concat(other_rec).concat(breakfast_rec);
        rec_mults = get_mults();
        loading.menu = false;
    }

    function get_most_frequent_cuisine(recipes){
        const frequencyMap = new Map();
        let maxItem = recipes[0];
        let maxCount = 1;

        for (const item of recipes) {
            const count = (frequencyMap.get(item.expand.recipe.cuisine) || 0) + 1;
            frequencyMap.set(item.expand.recipe.cuisine, count);
            if (count > maxCount) {
                maxCount = count;
                maxItem = item.expand.recipe.cuisine;
            }
        }
        console.log(frequencyMap);
        console.log(maxCount);
        return maxItem;
    }

    function last_month(){
        const today = new Date()
        today.setMonth(today.getMonth() - 1)
        return today.toISOString().split('T')[0]
    }

    function get_avg_recipes(list){
        let start = new Date()
        start.setMonth(start.getMonth() - 6);
        const a = new Date(list[0].created);
        let cnt = 1;
        for (let i = 1; i < list.length; i++){
            cnt++;
            if (new Date(list[i].created) < start){
                break;
            }
        }
        return Math.round(cnt / 24);
    }

    function getMostFrequent(list) {
        const frequencyMap = new Map();
        let maxItem = list[0];
        let maxCount = 1;

        for (const item of list) {
            const count = (frequencyMap.get(item.recipe) || 0) + 1;
            frequencyMap.set(item.recipe, count);
            if (count > maxCount) {
                maxCount = count;
                maxItem = item;
            }
        }

        return {item: maxItem, cnt: maxCount};
    }

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }

    function get_mults(){
        let output = {};
        for (let i = 0; i < menu_rec.length; i++){
            
            output[menu_rec[i].id] = menu_rec[i].servings;
        }
        return output;
    }

    async function get_main_recs(options){
        let output = [];
        output.push(await get_random_recipe(options));
        while (output.length < 2){
            let temp = await get_random_recipe(options);
            if (!output.includes(temp)) output.push(await get_random_recipe(options));
        }
        return output;
    }

    async function get_random_recipe(in_recipes){
        let rand_recipe = in_recipes[Math.floor(Math.random() * in_recipes.length)];
        let output = await pb.collection('recipes').getOne(rand_recipe, { expand: `notes, ingr_list` });
        return output;
    }

    function get_local_time(utc_code){
        const event = new Date(utc_code);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };

        return event.toLocaleDateString(undefined, options);
    }

    const send_verify_email = async function() {
        await pb.collection('users').requestVerification($currentUser.email);
    }

    const save_profile_edits = async function() {
        await pb.collection('users').update($currentUser.id, {
            username: $currentUser.username,
            name: $currentUser.name,
            bio: $currentUser.bio,
            avatar: $currentUser.avatar
        });
        edit_profile = false;
    }

    function update_mult(e){
        rec_mults[e.id] = e.mult;
    }

    function update_title(e){
        menu_title = e.title;
    }

    function toggle_compact(){
        pb.collection('flags').update($flagsStore.id, {
            is_compact: !$flagsStore.is_compact
        });
    }

    function switch_tab(e){
        tab = e.target.id;
    }
</script>

<div class="flex flex-col items-center h-full">
    <h1>Profile</h1>
    <div class="tabs tabs-box mx-auto hidden items-center bg-base-300 md:bg-base-200 md:flex m-1 justify-center">
        <button id="info" class="tab tab-xs {(tab == "info") ? "tab-active" : ""}" onclick={switch_tab}>Info</button>
        <button id="settings" class="tab tab-xs {(tab == "settings") ? "tab-active" : ""}" onclick={switch_tab}>Settings</button>
        <button id="stats" class="tab {(tab == "stats") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Stats</button>
        <button id="recipe" class="tab {(tab == "recipe") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Recipe</button>
        <button id="menu" class="tab {(tab == "menu") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Menu</button>
        <button id="payment" class="tab {(tab == "payment") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Payment</button>
    </div>
    <div class="flex w-full">
        <div class="flex flex-col items-center md:flex-row w-full">
            {#if !$currentUser}
                <div class="flex h-[calc(100svh-110px)] md:h-[calc(100svh-125px)] justify-center w-full"><span class="loading loading-bars loading-lg"></span></div>
            {:else}
                <!-- info -->
                <div class="flex flex-col md:flex-row h-[calc(100svh-110px)] md:h-[calc(100svh-75px)] overflow-y-auto w-full justify-center md:gap-x-5 md:m-5 {tab == 'info' ? '' : 'hidden'}">
                    <div class="flex flex-col h-1/3 mx-auto md:mx-0 my-2">
                        {#if $currentUser.avatar != ""}
                            <img src={$currentUser.avatar} alt="avatar" class="" />
                        {:else}
                            <img src="https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/w27w7eusm0jjeb4/unknown_3_sc7jpHPrHp.png?token=" alt="avatar" class="profile-avatar border rounded-xl" />
                        {/if}
                    </div>
                    <div class="flex flex-col md:flex-row md:space-x-4 items-center m-2 h-full md:h-fit justify-end">
                        <div class="flex flex-col space-y-2 w-full md:w-auto space-y-5 md:my-5">
                            {#if !edit_profile}
                                <div class="text">name: {$currentUser.name}</div>
                                <div class="text">email: {$currentUser.email}</div>
                                <div class="text">username: {$currentUser.username}</div>
                                <div class="text">user since: {get_local_time($currentUser.created)}</div>
                                {#if $currentUser.verified}
                                    <div class="text flex space-x-2 items-center"><CheckMark color="fill-primary"/><p>Email Verified</p></div>
                                {:else}
                                    <div class="text flex justify-center self-end"><button class="btn btn-primary btn-xs" onclick={send_verify_email} onkeydown={send_verify_email}>resend verification email</button></div>
                                {/if}
                                <button class="btn btn-primary btn-xs self-end" onclick={() => {edit_profile = true}} onkeydown={() => {edit_profile = true}}>edit profile</button>
                            {:else}
                                <div class="flex space-x-2"><label for="name">name:</label><input type="text" name="name" bind:value={$currentUser.name} class="input input-bordered input-xs w-full"/></div>
                                <div class="flex space-x-2"><label for="email">email:</label><input type="text" name="email" bind:value={$currentUser.email} class="input input-bordered input-xs w-full"/></div>
                                <div class="flex space-x-2"><label for="username">username:</label><input type="text" name="username" bind:value={$currentUser.username} class="input input-bordered input-xs w-full"/></div>
                                <button class="btn btn-primary btn-xs self-end" onclick={save_profile_edits} onkeydown={save_profile_edits}>save</button>
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- settings -->
                <div class="flex h-[calc(100svh-110px)] md:max-h-[300px] overflow-y-auto w-full md:max-w-[600px] md:m-auto {tab == 'settings' ? '' : 'hidden'}">
                    <label class="label cursor-pointer space-x-2 mx-2">
                        <input type="checkbox" class="toggle toggle-primary" bind:checked={$flagsStore.is_compact} onclick={toggle_compact}/>
                        <span class="label-text">compact cards</span>
                    </label>
                </div>
                <!-- stats -->
                <div class="flex h-[calc(100svh-110px)] md:h-[300px] overflow-y-auto w-full md:max-w-[600px] m-auto {tab == 'stats' ? '' : 'hidden'}">
                    <div class="flex flex-col space-y-5 my-5 h-full min-w-56 items-start justify-center mx-2">
                        {#if fave.item}
                            <p>favorite recipe: {fave.item.expand.recipe.title} ({fave.cnt})</p>
                        {/if}
                        <p>you average {avg_recipes} recipes per week</p>
                        <p>you have completed {month_menus} menus in the last month</p>
                        <p>your favorite cuisine is {most_freq_cuisine}</p>
                    </div>
                </div>
                <!-- Recipe -->
                <div class="flex h-[calc(100svh-110px)] md:h-[calc(100svh-75px)] overflow-y-auto w-full {tab == 'recipe' ? '' : 'hidden'}">
                    {#if recipes.length > 5}
                        <div class="flex md:space-x-4 flex-col items-center h-full w-full">
                            <div class="flex justify-evenly flex-col md:flex-row h-full w-full">
                                {#if loading.recipe}
                                    <div class="flex flex-col items-center justify-center md:w-2/5 h-[500px]"><span class="loading loading-bars loading-lg"></span></div>
                                {:else}
                                    <div id="cook_recipe" class="flex flex-col md:m-2 md:pb-10 md:w-2/5 h-full">
                                        <div class="img_info_container flex flex-col items-center justify-evenly h-full">
                                            <div class="img_container md:w-auto h-1/2 mx-2">
                                                <img src={recipe_rec.image} alt={recipe_rec.title} class="h-full rounded-xl object-cover" />
                                            </div>
                                            <div class="info_container w-full flex flex-col m-1 space-y-2 md:space-y-4">
                                                <div class="title_container mx-auto my-2">
                                                    <div class="title w-full text-lg md:text-xl mx-2">{recipe_rec.title}</div>
                                                </div>
                                                <div class="description_container m-auto w-5/6">
                                                    <div class="desc text-xs md:text-sm line-clamp-5" >{recipe_rec.description}</div>
                                                </div>
                                                <div class="misc flex justify-evenly items-center">
                                                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="auth">{recipe_rec.author}</div>
                                                    </div>
                                                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="time">{recipe_rec.time}</div>
                                                    </div>
                                                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                                                        <div>{recipe_rec.servings} servings</div>
                                                    </div>
                                                </div>
                                                <div class="misc flex justify-evenly items-center">
                                                    <div class="author_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="cat">{recipe_rec.category}</div>
                                                    </div>
                                                    <div class="time_container text-center w-1/3 text-xs md:text-sm">
                                                        <div class="cuisine">{recipe_rec.cuisine}</div>
                                                    </div>
                                                    <div class="servings text-center w-1/3 text-xs md:text-sm">
                                                        <div class="country">{recipe_rec.country}</div>
                                                    </div>
                                                </div>
                                                <div class="flex justify-evenly items-center space-x-2">
                                                    {#if recipe_rec.url}
                                                        <div class=" flex justify-center mt-1"><a class="btn btn-primary btn-xs" href={recipe_rec.url} target="_blank">original recipe</a></div>
                                                    {/if}    
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`} onkeydown={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`}>cook</button></div>
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={window.location = `/menu/${recipe_rec.id}`} onkeydown={window.location = `/menu/${recipe_rec.url_id}/${recipe_rec.servings}`}>create menu</button></div>
                                                    <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={async ()=>{recipe_rec = await get_random_recipe(recipes.map(item => item.id))}}>Reroll</button></div>
                                                </div>    
                                            </div>
                                        </div>
                                        <div class="notes_container form-control m-2 md:mt-5 md:mx-5 space-y-2 flex items-center">
                                            {#if recipe_rec.expand.notes}
                                                {#each recipe_rec.expand.notes as note, i}
                                                    <p class="m-2 text-xs md:text-base">{note.content}</p>
                                                {/each}
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>   
                    {/if}
                </div>
                <!-- menu -->
                <div class="flex w-full {tab == 'menu' ? '' : 'hidden'}">
                    <div class="flex justify-center w-full md:max-w-[600px] m-auto flex-col">
                        {#if loading.menu}
                            <div class="flex h-[500px] items-center m-auto"><span class="loading loading-bars loading-lg md:loading-xl"></span></div>
                        {:else}
                            {#if menu_rec.length}
                                <div class=" flex justify-center mt-1"><button class="btn btn-primary btn-xs" onclick={roll_menu}>Reroll</button></div>
                                <Menu 
                                    bind:menu_title={menu_title} 
                                    menu={menu_rec} 
                                    mults={rec_mults} 
                                    {update_mult} 
                                    {update_title} 
                                    {total_servings}
                                    height={"h-[calc(100svh-280px)] md:h-[calc(100svh-300px)]"}
                                />
                            {/if}
                        {/if}
                    </div>
                </div>
                <!-- payment -->
                <div class="flex h-[calc(100svh-110px)] md:h-[calc(100svh-75px)] overflow-y-auto w-full {tab == 'payment' ? '' : 'hidden'}">
                    <div class="flex flex-col space-y-2 my-5 h-full min-w-56 items-center justify-center">
                        {#if !$currentUser.subscribed}
                                <a href="https://buy.stripe.com/00gdUb2g90fc4Tu4gg" class="btn btn-primary btn-md w-36">Subscribe</a>
                        {:else}
                            <div class="text">next bill: {get_local_time($currentUser.last_bill_date)}</div>
                            <div class="text">last bill: {get_local_time($currentUser.last_bill_date)}</div>
                            <div class="flex space-x-2"><label for="credit_card_num">credit card:</label><input type="text" name="username" value="************0006" class="input input-bordered input-xs"/></div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </div>
    <div class="tabs tabs-box w-full mx-auto flex items-center bg-base-300 md:bg-base-200 md:hidden m-1 justify-evenly">
        <button id="info" class="tab tab-xs px-1 {(tab == "info") ? "tab-active" : ""}" onclick={switch_tab}>Info</button>
        <button id="settings" class="tab tab-xs px-1 {(tab == "settings") ? "tab-active" : ""}" onclick={switch_tab}>Settings</button>
        <button id="stats" class="tab px-1 {(tab == "stats") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Stats</button>
        <button id="recipe" class="tab px-1 {(tab == "recipe") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Recipe</button>
        <button id="menu" class="tab px-1 {(tab == "menu") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Menu</button>
        <button id="payment" class="tab px-1 {(tab == "payment") ? "tab-active" : ""} tab-xs" onclick={switch_tab}>Payment</button>
    </div>
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
</div>
