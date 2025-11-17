<script>
    import SkeletonBtn from "../../lib/components/skeleton_btn.svelte";
    import ThumbUp from "/src/lib/icons/ThumbUp.svelte";
    import Heart from "/src/lib/icons/Heart.svelte";

    let {
        display_categories,
        display_cuisines,
        display_countries,
        display_authors,
        selected_categories,
        selected_cuisines,
        selected_countries,
        selected_authors,
        categories,
        cuisines,
        countries,
        authors,
        select_cat,
        enable_thumb,
        enable_heart,
        cnt
    } = $props();
</script>

<div class="carousel carousel-center space-x-1 border border-primary rounded-md p-1 min-h-8 w-full">
    {#if enable_thumb}
        <button id="thumb_up" 
            class="btn btn-xs p-1 made flex content-center category bg-transparent border-none" 
            onclick={select_cat}>
                <ThumbUp color={(selected_categories.includes("thumb_up")) ? "fill-primary" : "fill-neutral"}/>
        </button>
    {/if}
    {#if enable_heart}
        <button id="heart" 
            class="btn btn-xs p-1 made flex content-center category  bg-transparent border-none" 
            onclick={select_cat}>
                <Heart color={(selected_categories.includes("heart")) ? "fill-primary" : "fill-neutral"}/>
        </button>
    {/if}
    {#each [...display_categories].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) as cat}
        <button id="category" 
            class="btn btn-xs {selected_categories.includes(cat)?'btn-primary text-black':'bg-base-300 text-neutral'} category" 
            onclick={select_cat}>
                {cat}
        </button> 
    {/each}
    {#each [...display_cuisines].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) as cuisine}
        <button id="cuisine" 
            class="btn btn-xs {selected_cuisines.includes(cuisine)?'btn-primary text-black':'bg-base-300 text-neutral'} cuisine" 
            onclick={select_cat}>
                {cuisine}
        </button> 
    {/each}
    {#if display_authors}
        {#each [...display_authors].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) as author}
            <button id="author" 
                class="btn btn-xs {selected_authors.includes(author)?'btn-primary text-black':'bg-base-300 text-neutral'} author" 
                onclick={select_cat}>
                    {author}
            </button> 
        {/each}
    {/if}
    {#each [...display_countries].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) as country}
        <button id="country" 
            class="btn btn-xs {selected_countries.includes(country)?'btn-primary text-black':'bg-base-300 text-neutral'} country" 
            onclick={select_cat}>
                {country}
        </button> 
    {/each}
    {#if !categories.length && !cuisines.length && !countries.length && (authors && !authors.length)}
        <SkeletonBtn 
            cnt={cnt} 
        />
    {/if}
</div>
