<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import { page } from '$app/stores';
    import EditIcon from "/src/lib/icons/EditIcon.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import { delete_grocery_item } from '/src/lib/groceries.js'



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
            view_size_mobile = `max-h-[calc(100svh-130px)]`;
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

    const remove_item = (id) => {
        let temp_arr = [];
        let found = false;
        let deleted_item = null;
        for (let i = 0; i < grocery_list.length; i++){
            if (grocery_list[i].id != id || found){
                temp_arr.push(grocery_list[i]);
            }else {
                deleted_item = grocery_list[i];
                found = true;
            }
        }
        if (deleted_item){
            let delete_item = confirm("Are you sure you want to delete:\n"+deleted_item.qty+" "+deleted_item.unit+" "+deleted_item.name+"?");
            if (delete_item){
                grocery_list = temp_arr;
                delete_grocery_item(id);
            }
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
        const new_item = {qty: 0, unit: "unit", name: "", checked: false};
        grocery_list.push(new_item);
        grocery_list = grocery_list;
        edit = true;
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

    const edit_groceries = () => {
        edit = !edit;
    }

    const ingrs_to_string = (ingrs) => {
        if (!ingrs) return "none";
        let ingrs_string = "";
        for (let i = 0; i < ingrs.length; i++){
            if (!ingrs[i]) continue;
            if (i > 0) ingrs_string += " + ";
            if (ingrs[i].quantity) {
                ingrs_string += ingrs[i].quantity;
            }else if (ingrs[i].qty){
                ingrs_string += ingrs[i].qty;
            }
            ingrs_string += (ingrs[i].unit) ? " "+ingrs[i].unit+" " : " ";
            ingrs_string += (ingrs[i].name) ? ingrs[i].name : ingrs[i].ingredient;
        }
        return ingrs_string;
    }
</script>

<div id="list" class="flex flex-col w-full">
    <div id="header" class="flex {($page.url.pathname == "/today") ? `justify-between` : `justify-evenly`} items-center mt-0">
        {#if grocery_list.length > 0}
            <div>
                {#if status != "none" && $page.url.pathname == "/today"}<div id="update_status" class="text-xs">{status}</div>{/if}
                <div id="count" class="text-xs">{grocery_list.length} Items</div>
            </div>
            <button id="copy" class="btn btn-xs btn-primary cursor-copy" on:click={copy_to_clipboard}>
                {#if just_copied}
                <CheckMark color=""/>
                {:else}
                    copy
                {/if}
            </button>
            {#if status != "none"}<button id="uncheck" class="btn btn-xs btn-primary" on:click={uncheck_list}>uncheck</button>{/if}
            {#if status != "none"}<button id="reset" class="btn btn-xs btn-primary" on:click={reset_list}>reset</button>{/if}
            {#if status != "none"}<button id="edit" class="btn btn-xs btn-primary" on:click={edit_groceries}><EditIcon/></button>{/if}
        {/if}
    </div>
    <div class="md:mx-3">
        <div class="grocery_list {view_size_mobile} {view_size_desktop} overflow-y-auto border border-primary rounded-md md:border-none px-2">
            {#if grocery_list.length > 0}
                {#each grocery_list as item, i}
                    {#if edit}
                        <div class="grocery_item flex relative my-1 tooltip {(i > 2) ? "tooltip-top": "tooltip-bottom"} space-x-2 justify-center items-center z-10" data-tip={ingrs_to_string(item.expand.ingrs)}>
                            <input type="text" class="amount input input-bordered input-xs px-1 mr-1 w-8 text-center h-fit" bind:value={item.qty} on:keyup={edit_item}>
                            <input type="text" class="unit input input-bordered input-xs px-1 mr-1 w-20 text-center h-fit" bind:value={item.unit} on:keyup={edit_item}>
                            <textarea class="name input input-bordered input-xs px-1 mr-1 w-3/4 h-fit" bind:value={item.name} on:keyup={edit_item} on:keypress={enter_new_item} bind:this={item.input}></textarea>
                            {#if status != "none"}<button class="btn btn-sm p-1 btn-accent" on:click={() => remove_item(item.id)}><DeleteIcon/></button>{/if}
                        </div>
                    {:else}
                        <div class="grocery_item flex relative my-2 tooltip {(i > 2) ? "tooltip-top": "tooltip-bottom"} space-x-3 justify-end md:justify-start items-center z-100" data-tip={ingrs_to_string(item.expand.ingrs)}>
                            {#if status != "none"}<input type="checkbox" class="hidden md:flex checkbox checkbox-primary checkbox-lg p-1" id="{item.name}" bind:checked={item.checked} on:change={edit_item}>{/if}
                            <p class="text-xs md:text-left -indent-5 pl-5">{ingrs_to_string([item])}</p>
                            {#if status != "none"}<input type="checkbox" class="md:hidden checkbox checkbox-primary checkbox-lg p-1" id="{item.name}" bind:checked={item.checked} on:change={edit_item}>{/if}
                        </div>
                    {/if}
                {/each} 
                {#if status != "none"}
                    <div class="flex relative my-1 space-x-2 justify-center items-center">
                        <button class="btn btn-xs btn-primary" on:click={new_item}>new item</button>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>