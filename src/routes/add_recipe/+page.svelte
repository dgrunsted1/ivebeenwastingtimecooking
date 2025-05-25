<script>
    import ImportRecipe from "/src/lib/components/import_recipe.svelte";
    import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
    import { process_ingr, process_directions } from '/src/lib/process_recipe.js';
    import { deserialize } from '$app/forms';
    import { onMount } from "svelte";
    import Alerts from "../../lib/components/alerts.svelte";

    let recipe = $state({
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
    });

    let alert = $state({show: false, msg: "", title: "", type: "warning"});

    let edit = $state(false);

    let loading = $state(false);

    onMount(async () => {
        if (!$currentUser) window.location.href = "/login";
        else {
            const result = await auth_refresh;
            if (result.error){
                show_error(e.message);
            }
        }
    });

    function show_error(title){
        alert.title = title;
        alert.type = "error";
        alert.show = true;
    }
    
    async function fetch_recipe(e){
        if (!$currentUser.verified){
            show_alert("Please verify your email to add recipes", "error", "Please verify your email");
            e.srcElement.value = "";
            return;
        }
        loading = true;
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
            result.data.expand.ingr_list = process_ingr(result.data.expand.ingr_list);
            result.data.url = e.srcElement.value;
            result.data.directions = process_directions(result.data.directions);
            recipe = result.data;
            const recipe_exist = await check_recipe_exists(recipe.title);
            if (recipe_exist){
                show_alert("You have already added this recipe", "warning", "Recipe already exists");
            }
            edit = true;
        }
        loading = false;
    }

    function show_alert(msg, type, title){
        alert.show = true;
        alert.msg = msg;
        alert.type = type;
        alert.title = title;
    }

    async function check_recipe_exists(title){
        try{
            let result = await pb.collection('recipes').getList(1, 1, {filter: `user = '${$currentUser.id}' && title = '${title}'`});
            if (result.items.length) return true;
            return false;
        } catch(e){
            return false;
        }
    }
</script>

<svelte:head>
    <meta property="og:title" content="Add Recipe" />
    <meta property="og:description" content="Add Recipe to Your List" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/add_recipe" />
    <meta property="og:type" content="website" />
</svelte:head>

<div class="flex flex-col max-w-5xl m-auto h-[95svh] px-2">
    {#if !edit}
        <div class="my-auto">
            <form method='POST' oninput={fetch_recipe} class="text-center w-full flex flex-col gap-5">
                <input placeholder="Link to recipe" name="url" type="text" class="input input-bordered input-xs text-center input-accent mx-2 no-underline"/>
                {#if !loading}
                    <p>or</p>
                    <button class="btn btn-primary btn-lg m-auto" onclick={()=>{edit = true}}>Input Recipe</button>
                {:else}
                    <div class="flex h-[110px] w-full justify-center items-center">
                        <span id="loading" class="loading loading-bars loading-lg"></span>
                    </div>
                {/if}
            </form>
        </div>
    {:else}
        <ImportRecipe
            {recipe}
            {show_alert}
        />
    {/if}
    <Alerts 
        msg={alert.msg}
        type={alert.type}
        bind:show={alert.show}
        title={alert.title}
    />
</div>