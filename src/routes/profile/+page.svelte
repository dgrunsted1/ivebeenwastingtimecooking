<script>
    import { onMount } from 'svelte';
    import { pb, currentUser } from '/src/lib/pocketbase.js';
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import Menu from "/src/lib/components/menu.svelte";
    import { page } from '$app/stores';

    let main_recipes = [];
    let dessert_recipes = [];
    let breakfast_recipes = [];
    let other_recipes = [];
    let recipe_rec = {};
    let main_recs = [];
    let dessert_rec = {};
    let breakfast_rec = {};
    let other_rec = {};
    let menus = [];
    let edit_profile = false;
    let edit_billing = false;
    let rec_mults = {};
    let menu_rec = [];

    onMount(async () => {
        await pb.collection('users').authRefresh();
        if (!$currentUser){
            window.location.href = "/login";
            return;
        }
        const recipe_result = await pb.collection('recipes').getList(1, 250, {
            fields: `id, category`,
            filter: `user="${$currentUser.id}"`,
        });
        main_recipes = recipe_result.items.filter(item => item.category == 'Main').map(item => item.id);
        main_recs = await get_main_recs(main_recipes);
        dessert_rec = await get_random_recipe(recipe_result.items.filter(item => item.category == 'Dessert').map(item => item.id));
        breakfast_rec = await get_random_recipe(recipe_result.items.filter(item => item.category == 'Breakfast').map(item => item.id));
        other_rec = await get_random_recipe(recipe_result.items.filter(item => !['Main', 'Dessert', 'Breakfast'].includes(item.category)).map(item => item.id));
        recipe_rec = await get_random_recipe(recipe_result.items.map(item => item.id));
        menu_rec = main_recs.concat(dessert_rec).concat(other_rec).concat(breakfast_rec);
        rec_mults = get_mults();
    });

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
</script>
<div class="flex flex-col items-center space-y-6">
    <h1>Profile</h1>
    <div class="flex space-x-4 flex-col items-center md:flex-row">
        {#if !$currentUser}
            <div class="flex"><span class="loading loading-bars loading-lg"></span></div>
        {:else}
            <div class="flex flex-col w-24 md:w-56">
                {#if $currentUser.avatar != ""}
                    <img src={$currentUser.avatar} alt="avatar" class="" />
                {:else}
                    <img src="https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/w27w7eusm0jjeb4/unknown_3_sc7jpHPrHp.png?token=" alt="avatar" class="profile-avatar border rounded-xl" />
                {/if}
            </div>
            <div class="flex md:space-x-4">
                <div class="flex flex-col space-y-2 my-5">
                    {#if !edit_profile}
                        <div class="text">name: {$currentUser.name}</div>
                        <div class="text">email: {$currentUser.email}</div>
                        <div class="text">username: {$currentUser.username}</div>
                        <div class="text">user since: {get_local_time($currentUser.created)}</div>
                        {#if $currentUser.verified}
                            <div class="text flex space-x-2 items-center"><CheckMark color="fill-primary"/><p>Email Verified</p></div>
                        {:else}
                            <div class="text flex justify-center w-full"><div class="btn btn-primary btn-xs" on:click={send_verify_email} on:keydown={send_verify_email}>resend verification email</div></div>
                        {/if}
                        <div class="btn btn-primary btn-xs" on:click={() => {edit_profile = true}} on:keydown={() => {edit_profile = true}}>edit profile</div>
                    {:else}
                        <div class="flex space-x-2"><label for="name">name:</label><input type="text" name="name" bind:value={$currentUser.name} class="input input-bordered input-xs w-full"/></div>
                        <div class="flex space-x-2"><label for="email">email:</label><input type="text" name="email" bind:value={$currentUser.email} class="input input-bordered input-xs w-full"/></div>
                        <div class="flex space-x-2"><label for="username">username:</label><input type="text" name="username" bind:value={$currentUser.username} class="input input-bordered input-xs w-full"/></div>
                        <div class="text flex justify-center w-full"></div><div class="btn btn-primary btn-xs" on:click={save_profile_edits} on:keydown={save_profile_edits}>save</div>
                    {/if}
                </div>
                <div class="flex flex-col space-y-2 my-5 h-full">
                    {#if !edit_billing}
                        <div class="text">next bill: {get_local_time($currentUser.last_bill_date)}</div>
                        <div class="text">last bill: {get_local_time($currentUser.last_bill_date)}</div>
                        <div class="text">credit card: ************0006</div>
                        <div class="btn btn-primary btn-xs self-end" on:click={() => {edit_billing = true}} on:keydown={() => {edit_billing = true}} disabled>edit billing</div>
                    {:else}
                    <div class="text">next bill: {get_local_time($currentUser.last_bill_date)}</div>
                    <div class="text">last bill: {get_local_time($currentUser.last_bill_date)}</div>
                        <div class="flex space-x-2"><label for="credit_card_num">credit card:</label><input type="text" name="username" value="************0006" class="input input-bordered input-xs"/></div>
                        <div class="text flex justify-center w-full"></div><div class="btn btn-primary btn-xs" on:click={save_profile_edits} on:keydown={save_profile_edits}>save</div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
    <div class="flex md:space-x-4 flex-col items-center">
        <p class="text-4xl text-primary">What to cook</p>
        {#if recipe_rec.id}
            <div id="cook_recipe" class="flex flex-col md:m-2 pb-4 md:pb-10">
                <div class="img_info_container flex flex-col md:flex-row items-center justify-center">
                    <div class="img_container w-full md:w-auto flex flex-col">
                        <img src={recipe_rec.image} alt={recipe_rec.title} class="max-h-52 max-w-52 md:max-w-96 md:max-h-96 rounded-xl m-auto"/>
                    </div>
                    <div class="info_container w-full md:w-1/2 flex flex-col m-1 space-y-2 md:space-y-4">
                        <div class="title_container mx-auto my-2">
                            <div class="title w-full text-sm md:text-xl">{recipe_rec.title}</div>
                        </div>
                        <div class="description_container m-auto w-5/6">
                            <div class="desc text-xs md:text-sm" >{recipe_rec.description}</div>
                        </div>
                        <div class="misc flex justify-evenly">
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
                        <div class="misc flex justify-evenly">
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
                            <div class=" flex justify-center mt-1"><div class="btn btn-primary btn-xs" on:click={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`} on:keydown={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`}>cook</div></div>
                            <div class=" flex justify-center mt-1"><div class="btn btn-primary btn-xs" on:click={window.location = `/menu/${recipe_rec.id}`} on:keydown={window.location = `/cook_recipe/${recipe_rec.url_id}/${recipe_rec.servings}`}>create menu</div></div>
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
        <div class="flex md:w-1/2">
            {#if menu_rec.length}
                <Menu title="New Menu" menu={menu_rec} mults={rec_mults} page={page}/>
            {/if}
        </div>
    </div>
</div>
