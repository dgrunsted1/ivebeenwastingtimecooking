<script>
    import Clear from "/src/lib/icons/Clear.svelte";

    let { 
        update_search
    } = $props();
    
    let search_val = $state("");

    const update = () => {
        update_search({val: search_val});
    }

    const clear_val = () => {
        search_val = "";
        update();
    }
</script>

<div class="flex w-fit space-x-2 my-1">
    <label class="input input-bordered input-xs md:input-sm input-primary flex items-center gap-2 pr-0">
        <input type="text" class="input h-full p-0 w-28 md:w-36" placeholder="Search" bind:value={search_val} oninput={update}/>
        <button class="w-5" onclick={clear_val}>
            {#if search_val}
                <Clear size="w-3 h-3"/>
            {/if}
        </button>
    </label>
</div>