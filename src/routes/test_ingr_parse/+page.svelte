<script>
    import { get_grocery_item_name, combine_items, group_items_by_name } from '$lib/ingr_to_groc.js';
    import { onMount } from 'svelte';
    import { pb } from '$lib/pocketbase.js';

    let ingrs = $state([]);
    let parsed = $state([]);
    let combined = $state([]);
    onMount(() => {
        pb.collection('ingredients').getList(1, 5000, {
            filter: "ingredient != ''",
            // filter: "ingredient ~ 'juice'",
        }).then((data) => {
            ingrs = data.items;
            
        // pb.collection('ingredients').getFullList().then((data) => {
        //     ingrs = data;
            parsed = ingrs.map((ingr) => {
                return {
                    id: ingr.id,
                    name: get_grocery_item_name(ingr.ingredient),
                    quantity: ingr.quantity,
                    unit: ingr.unit
                };
            });

            combined = group_items_by_name(parsed);
            console.log('combined', combined);
        });
    });
</script>



<h1 class="text-2xl font-bold text-center">Test Ingredient Parsing</h1>
<div class="flex">
    <div class="flex flex-col w-2/3">
        {#each ingrs as ingr, index}
            <div class="flex w-full">
                <p class="w-1/2 text-right">{ingr.ingredient}</p>|<p class="w-1/2">{parsed[index].name}</p>
                <!-- <p>Quantity: {ingr.quantity} {ingr.unit}</p> -->
            </div>
        {/each}
    </div>
    <div class="flex flex-col w-1/3">
        <ol class="flex w-full flex-col">
            <li class="w-full text-left flex justify-between"><div>unique:{combined.length}</div></li>
            {#each combined as item}
                <li class="w-full text-left flex justify-between"><div>{item[0].name}</div> <div>{item.length}</div></li>
            {/each}
        </ol>
    </div>
</div>
