<script>
    import EditRecipe from "/src/lib/components/edit_recipe.svelte";
    import alerts from "/src/lib/components/alerts.svelte";
    import { page } from '$app/stores';
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { process_recipe_old } from '/src/lib/process_recipe.js';
    import { deserialize } from '$app/forms';
    import { onMount } from "svelte";
    import Alerts from "../../lib/components/alerts.svelte";

    let recipe = {
        author: "",
        category: "",
        collectionId: "",
        collectionName: "",
        country: "",
        created: "",
        cuisine: "",
        description: "",
        directions: [],
        expand: {ingr_list:[]},
        id: "",
        image: "",
        notes: [],
        servings: "",
        time: "",
        title: "",
        updated: "",
        url: "",
        user: ""
    };

    let alert = {show: false, msg: "", title: "", type: "warning"};

    onMount(() => {
        if (!$currentUser) window.location.href = "/login";
    });

    async function fetch_recipe(e){
        document.getElementById('loading').classList.remove('hidden');
        const data = new FormData(this);

        const response = await fetch(this.action, {
            method: 'POST',
            body: data
        });

        /** @type {import('@sveltejs/kit').ActionResult} */
        const result = deserialize(await response.text());
        if (result.data.err) {
            show_alert(result.data.err.msg, "error", result.data.err.title);
            e.srcElement.value = "";
        } else if (result.type === 'success') {
            result.data.expand.ingr_list = process_recipe_old(result.data.expand.ingr_list);
            result.data.url = e.srcElement.value;
            recipe = result.data;
            const recipe_exist = await check_recipe_exists(recipe.title);
            if (recipe_exist){
                show_alert("You have already added this recipe", "warning", "Recipe already exists");
            }
        }
        document.getElementById('loading').classList.add('hidden');
    }

    function show_alert(msg, type, title){
        alert.show = true;
        alert.msg = msg;
        alert.type = type;
        alert.title = title;
    }

    async function check_recipe_exists(title){
        let result = await pb.collection('recipes').getList(1, 1, {filter: `user = '${$currentUser.id}' && title = '${title}'`});
        if (result.items.length) return true;
        return false;
    }

</script>
<div class="flex flex-col max-w-5xl px-1 space-y-5 mb-5 w-full m-auto">
    <div class="link mt-5">
        <form method='POST' on:input|preventDefault={fetch_recipe} class="text-center w-full">
            <input placeholder="Link to recipe" name="url" type="text" class="input input-bordered input-xs w-full text-center input-accent"/>
        </form>
    </div>
    <div class="h-5 flex justify-center">
        <span id="loading" class="loading loading-dots loading-lg hidden"></span>
    </div>
    <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
    <EditRecipe {recipe} index=0 save={true} show_alert={alert.show}/>
</div>