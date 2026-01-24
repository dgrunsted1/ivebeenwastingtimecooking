<script>
    let {
        sort_val,
        update_sort,
        type
    } = $props();

    let sort_opts_recipes = ["Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let sort_opts_menus = ["Least Recipes", "Most Recipes", "Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let sort_opts = $derived((type == "menu") ? sort_opts_menus : sort_opts_recipes);

    $effect(() => {
        document.getElementById("label").innerHTML = sort_val;
    });
</script>

<div class="dropdown dropdown-top dropdown-end md:dropdown-bottom">
    <label tabindex="-1" for="sort_mobile" id="label" class="btn m-0 btn-primary btn-xs md:btn-sm">{sort_val}</label>
    <ul tabindex="-1" name="sort_mobile" class="dropdown-content z-100 menu bg-transparent rounded-box w-max space-y-1">
        {#each sort_opts as opt}
            <li class="btn btn-xs {opt == sort_val ? 'btn-primary text-primary-content': 'btn-neutral text-neutral-content'}"><button onclick={update_sort} data-id={opt}>{opt}</button></li>
        {/each}
    </ul>
</div>