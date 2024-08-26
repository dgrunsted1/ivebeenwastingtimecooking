<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import { page } from '$app/stores';
    import EditIcon from "/src/lib/icons/EditIcon.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";



    export let grocery_list = [];
    export let status;
    $: edit = false;
    let dispatch = createEventDispatcher();
    let delay_timer;
    let view_size_mobile = `max-h-[calc(55svh)]`;
    let view_size_desktop = `md:max-h-[calc(100svh-200px)]`;
    $: just_copied = false;

    onMount(async () => {
        if ($page.url.pathname == "/today"){
            view_size_mobile = `max-h-[calc(71vh)]`;
            view_size_desktop = `md:max-h-[calc(100svh-120px)]`;
        }
    });
    const copy_to_clipboard = () => {
        let copy_text = "";
        let first = true;
        let copy_list = document.getElementsByClassName("grocery_item");
        Array.from(copy_list).forEach(function (element) {
            if (!element.getElementsByTagName('input')[0].checked){
                if (first) first = false;
                else copy_text += "\n";
                let first_of_sent = true;
                Array.from(element.getElementsByTagName('p')).forEach(curr => {
                    if (curr.type == "checkbox") return;
                    if (!first_of_sent) copy_text += " ";
                    else first_of_sent = false;
                    copy_text += curr.innerHTML;
                });
            }
        });
        navigator.clipboard.writeText(copy_text);
        just_copied = true;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(function() {
            just_copied = false;
        }, 2000);
    }

    const remove_item = (qty, unit, ingr) => {
        let delete_item = confirm("Are you sure you want to delete:\n"+qty+" "+unit+" "+ingr+"?");
        if (delete_item){
            let temp_arr = [];
            let found = false;
            for (let i = 0; i < grocery_list.length; i++){
                if (grocery_list[i].quantity != qty || grocery_list[i].unit != unit || grocery_list[i].ingredient != ingr || found){
                    temp_arr.push(grocery_list[i]);
                }else {
                    found = true;
                }
            }
            grocery_list = temp_arr;
            edit_item();
        }
    }

    const edit_item = () => {
        if (status == "edited") return;
        status = "edited";
        clearTimeout(delay_timer);
        delay_timer = setTimeout(function() {
            dispatch("update_grocery_list", {grocery_list: grocery_list});
        }, 2000);
    }

    const reset_list = () => {
        let reset_list = confirm("Are you sure you want to reset your grocery list?");
        if (reset_list){
            dispatch("reset_grocery_list");
        }
    }

    const uncheck_list = () => {
        for (let i = 0; i < grocery_list.length; i++){
            grocery_list[i].checked = false;
        }
        edit_item();
    }

    const new_item = async () => {
        const new_item = {quantity: 0, unit: "unit", ingredient: "", checked: false, id: generate_id()};
        grocery_list.push(new_item);
        grocery_list = grocery_list;
        await tick();
        new_item.input.focus();
    }

    const enter_new_item = async (e) => {
        const items = document.getElementsByClassName("grocery_item");
        const items_array = Array.prototype.slice.call(items);
        if (e.key == "Enter" && items_array[items_array.length-1] == e.srcElement.parentNode){
            await new_item();
        }
    }

    const generate_id = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 15; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    const edit_groceries = () => {
        edit = !edit;
    }
</script>

<div id="list" class="flex flex-col w-full">
    <div id="header" class="flex {($page.url.pathname == "/today") ? `justify-between` : `justify-evenly`} items-center my-2.5 mt-0">
        {#if grocery_list.length > 0}
            <div>
                {#if status != "none" && $page.url.pathname == "/today"}<div id="update_status" class="text-xs">{status}</div>{/if}
                <div id="count" class="text-xs">{grocery_list.length} Items</div>
            </div>
            <button id="copy" class="btn btn-xs md:btn-sm btn-secondary cursor-copy" on:click={copy_to_clipboard}>
                {#if just_copied}
                <CheckMark/>
                {:else}
                    copy
                {/if}
            </button>
            {#if status != "none"}<button id="uncheck" class="btn btn-xs md:btn-sm btn-secondary" on:click={uncheck_list}>uncheck</button>{/if}
            {#if status != "none"}<button id="reset" class="btn btn-xs md:btn-sm btn-secondary" on:click={reset_list}>reset</button>{/if}
            {#if status != "none"}<button id="edit" class="btn btn-xs md:btn-sm btn-secondary" on:click={edit_groceries}><EditIcon/></button>{/if}
        {/if}
    </div>
    <div class="md:mx-3">
        <div class="grocery_list {view_size_mobile} {view_size_desktop} overflow-y-auto border border-primary rounded-md md:border-none px-2">
            {#if grocery_list.length > 0}
                {#each grocery_list as item, i}
                    {#if edit}
                        <div class="grocery_item flex relative my-1 tooltip space-x-2 justify-center items-center">
                            <input type="text" class="amount input input-bordered input-xs px-1 mr-1 w-8 text-center h-fit" bind:value={item.quantity} on:keyup={edit_item}>
                            <input type="text" class="unit input input-bordered input-xs px-1 mr-1 w-20 text-center h-fit" bind:value={item.unit} on:keyup={edit_item}>
                            <textarea class="name input input-bordered input-xs px-1 mr-1 w-3/4 h-fit" bind:value={item.ingredient} on:keyup={edit_item} on:keypress={enter_new_item} bind:this={item.input}></textarea>
                            {#if status != "none"}<button class="btn btn-sm p-1 btn-accent" on:click={() => remove_item(item.quantity, item.unit, item.ingredient)}><DeleteIcon/></button>{/if}
                        </div>
                    {:else}
                        <div class="grocery_item flex relative my-2 tooltip space-x-3 justify-left items-center">
                            {#if status != "none"}<input type="checkbox" class="checkbox checkbox-primary checkbox-lg p-1w" id="{item.ingredient}" bind:checked={item.checked} on:change={edit_item}>{/if}
                            <p class="text-xs text-left -indent-5 pl-5">{item.quantity} {item.unit} {item.ingredient}</p>
                        </div>
                    {/if}
                {/each} 
                {#if status != "none"}
                    <div class="flex relative my-1 tooltip space-x-2 justify-center items-center">
                        <button class="btn btn-xs btn-primary" on:click={new_item}>new item</button>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>