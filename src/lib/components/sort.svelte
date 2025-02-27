<script>
    let {
        sort_val,
        update_sort,
        type
    } = $props();

    let sort_opts_recipes = ["Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let sort_opts_menus = ["Least Recipes", "Most Recipes", "Least Ingredients", "Most Ingredients", "Least Servings", "Most Servings", "Least Time", "Most Time", "Most Recent", "Least Recent"];
    let sort_opts = $derived((type == "menu") ? sort_opts_menus : sort_opts_recipes);
</script>

<div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
    <label tabindex="-1" for="sort_mobile" class="btn m-0 btn-primary btn-xs md:btn-sm">{sort_val}</label>
    <ul tabindex="-1" name="sort_mobile" class="dropdown-content z-[100] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
        {#each sort_opts as opt}
            <li class="btn btn-xs {opt == sort_val ? 'btn-neutral': 'btn-primary'}"><button onclick={update_sort}>{opt}</button></li>
        {/each}
    </ul>
</div>