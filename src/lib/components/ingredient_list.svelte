<script>
    import { ingrs_to_string } from '/src/lib/groceries.js'

    let { 
        grocery_list = $bindable([]),
        height = "h-[calc(100svh-210px)] md:h-[calc(100svh-210px)]"
    } = $props();

</script>

<div id="list" class="flex flex-col w-full">
    <div class="md:mx-3">
        <div class="grocery_list {height} overflow-y-auto px-2 py-4">
            {#if grocery_list.length > 0}
                {#each grocery_list as item, i}
                        <p class="text ml-2 md:ml-5">{ingrs_to_string([item])}</p>
                    {#if i != grocery_list.length-1}
                        <div class="divider my-0 h-3"></div>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>
</div>