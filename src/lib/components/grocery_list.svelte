<script>
    import { onMount } from 'svelte';
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import { page } from '$app/stores';
    import EditIcon from "/src/lib/icons/EditIcon.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import { delete_grocery_item } from '/src/lib/groceries.js'
    import { pb, currentUser } from '/src/lib/pocketbase';
    import Plus from "/src/lib/icons/Plus.svelte";




    let { 
        grocery_list = $bindable([]), 
        status = $bindable(), 
        grocery_list_id,
        list_owner,
        update_grocery_item,
        reset_grocery_list,
        check_grocery_item
    } = $props();
    let edit = $state(false);
    
    let delay_timer;
    let view_size_mobile = $state(`h-[calc(100svh-210px)]`);
    let view_size_desktop = $state(`md:h-[calc(100svh-210px)]`);
    let just_copied = $state(false);
    let new_item = $state({qty: null, unit: "", name: ""});
    let interactable = ($page.url.pathname.includes("/today") || $page.url.pathname.includes("/list/"));
    let is_owner = ($currentUser && $currentUser.id == list_owner);

    onMount(async () => {
        if ($page.url.pathname.includes("/today")){
            view_size_mobile = `h-[calc(100svh-150px)]`;
            view_size_desktop = `md:h-[calc(100svh-105px)]`;
        } else if ( $page.url.pathname.includes("/list/")){
            view_size_mobile = `h-[calc(100svh-75px)]`;
            view_size_desktop = `md:h-[calc(100svh-60px)]`;
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

    const check_item_handle = (e) => {
        let id = e.currentTarget.id;
        let value = e.currentTarget.checked;
        check_grocery_item({id: id, value: value});
    }

    const edit_item = (e) => {
        const id = e.currentTarget.parentNode.id;
        clearTimeout(delay_timer);
        delay_timer = setTimeout(function() {
            update_grocery_item({id: id});
        }, 500);
    }

    const reset_list = (e) => {
        let reset_list = confirm("Are you sure you want to reset your grocery list?");
        if (reset_list){
            reset_grocery_list();
        }
        e.srcElement.parentNode.parentNode.blur();
    }

    const uncheck_list = (e) => {
        for (let i = 0; i < grocery_list.length; i++){
            grocery_list[i].checked = false;
            check_grocery_item({id: grocery_list[i].id, value: false})
        }
        e.srcElement.parentNode.parentNode.blur();
    }

    const add_new_item = async () => {
        if (!new_item.name) return;
        const data = {
            "qty": new_item.qty,
            "unit": new_item.unit,
            "name": new_item.name,
            "checked": false,
            "active": true
        };
        const record = await pb.collection('grocery_items').create(data);
        const list_update = await pb.collection('grocery_lists').update(grocery_list_id, {
            "items+": record.id
        });
        grocery_list.unshift(record);
        new_item = {qty: null, unit: "", name: ""};
        document.getElementById("modal_ingr").focus();
    }

    const edit_groceries = (e) => {
        edit = !edit;
        e.srcElement.parentNode.parentNode.blur();
    }

    const tool_tip_string = (item) => {
        if (!item.expand) return "none";
        else return ingrs_to_string(item.expand.ingrs);
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

    const add_item_modal = () => {
        my_modal_1.showModal();
        document.getElementById("modal_ingr").focus();
    }

    const share_list = () => {
        const share_link = `${window.location.origin}/today/${$currentUser.useename}`;
        navigator.clipboard.writeText(share_link);
    }
</script>

<div id="list" class="flex flex-col w-full">
    <div id="header" class="hidden md:flex {($page.url.pathname.includes("/today")) ? `justify-between` : `justify-evenly`} items-center mt-0">
        {#if grocery_list.length > 0}
            <div>
                {#if status != "none" && $page.url.pathname.includes("/today")}<div id="update_status" class="text-xs">{status}</div>{/if}
                <div id="count" class="text-xs">{grocery_list.reduce((count, item) => count + (item.checked ? 0 : 1), 0)}/{grocery_list.length} Items</div>
            </div>
            <button id="copy" class="btn btn-xs btn-primary cursor-copy" onclick={copy_to_clipboard}>
                {#if just_copied}
                <CheckMark color=""/>
                {:else}
                    copy
                {/if}
            </button>
            {#if is_owner}<button id="uncheck" class="btn btn-xs btn-primary" onclick={uncheck_list}>uncheck</button>{/if}
            {#if is_owner}<button id="reset" class="btn btn-xs btn-primary" onclick={reset_list}>reset</button>{/if}
            {#if interactable}<button id="edit" class="btn btn-xs btn-primary" onclick={edit_groceries}><EditIcon/></button>{/if}
            {#if interactable}<button id="add" class="btn btn-xs btn-primary" onclick={add_item_modal}><Plus/></button>{/if}
        {/if}
    </div>
    <div class="md:mx-3">
        <div class="grocery_list {view_size_mobile} {view_size_desktop} overflow-y-auto px-2 py-4">
            {#if grocery_list.length > 0}
                {#each grocery_list as item, i}
                    {#if edit}
                        <div id={item.id} class="grocery_item flex relative my-1 tooltip {(i > 2) ? "tooltip-top": "tooltip-bottom"} space-x-2 justify-center items-center" data-tip={tool_tip_string(item)}>
                            <input type="text" class="amount input input-bordered input-xs px-1 mr-1 w-8 text-center h-fit" bind:value={item.qty} onkeyup={edit_item}>
                            <input type="text" class="unit input input-bordered input-xs px-1 mr-1 w-20 text-center h-fit" bind:value={item.unit} onkeyup={edit_item}>
                            <textarea class="name input input-bordered input-xs px-1 mr-1 w-3/4 h-fit" bind:value={item.name} onkeyup={edit_item} bind:this={item.input}></textarea>
                            {#if status != "none"}<button class="btn btn-sm p-1 btn-accent" onclick={() => remove_item(item.id)}><DeleteIcon/></button>{/if}
                        </div>
                    {:else}
                        <div class="grocery_item flex space-x-3 {($page.url.pathname.includes("/today") || $page.url.pathname.includes("/list/"))? "justify-end md:justify-start" : "justify-start"} items-center">
                            {#if status != "none"}<input type="checkbox" class="hidden md:flex checkbox checkbox-primary checkbox-lg p-1" id={item.id} bind:checked={item.checked} onchange={check_item_handle}>{/if}
                            <div class="flex md:tooltip {(i > 2) ? "tooltip-top": "tooltip-bottom"}" data-tip={tool_tip_string(item)}>
                                <p class="text-xs">{ingrs_to_string([item])}</p>
                            </div>
                            {#if status != "none"}<input type="checkbox" class="md:hidden checkbox checkbox-primary checkbox-lg p-1" id={item.id} bind:checked={item.checked} onchange={check_item_handle}>{/if}
                        </div>
                    {/if}
                    {#if i != grocery_list.length-1}
                        <div class="divider my-0 h-3"></div>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>
    <div id="header" class="flex md:hidden {($page.url.pathname.includes("/today")) ? `justify-between` : `justify-evenly`} items-center mt-0">
        {#if grocery_list.length > 0 && interactable}
            <div>
                {#if interactable}<div id="update_status" class="text-xs">{status}</div>{/if}
                <div id="count" class="text-xs text-nowrap">{grocery_list.reduce((count, item) => count + (item.checked ? 0 : 1), 0)}/{grocery_list.length} Items</div>
            </div>
            <div class="flex items-center space-x-4 mx-1 my-2 w-full justify-end">
                {#if is_owner}
                    <div class="dropdown dropdown-top">
                        <label tabindex="-1" for="save_menu" class="btn btn-primary btn-sm md:btn-sm">options</label>
                        <ul tabindex="-1" name="save_menu" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-max bg-primary">
                            <li class="btn btn-sm btn-primary p-0"><button class="p-0" onclick={edit_groceries}>
                                edit
                            </button></li>
                            <li class="btn btn-sm btn-primary p-0"><button class="p-0" onclick={uncheck_list}>
                                uncheck
                            </button></li>
                            <li class="btn btn-sm btn-primary p-0"><button class="p-0" onclick={reset_list}>
                                reset
                            </button></li>
                            <li class="btn btn-sm btn-primary p-0"><button class="p-0" onclick={share_list}>
                                share
                            </button></li>
                        </ul>
                    </div>
                {:else}
                    <button class="btn btn-sm btn-primary" onclick={edit_groceries}>
                        edit
                    </button>
                {/if}
                    <button id="copy" class="btn btn-sm btn-primary cursor-copy" onclick={copy_to_clipboard}>
                        {#if just_copied}
                            <CheckMark color=""/>
                        {:else}
                            copy
                        {/if}
                    </button>
                    <button id="add" class="btn btn-sm btn-primary" onclick={add_item_modal}><Plus/></button>
            </div>
        {/if}
    </div>
</div>
<!-- <button class="btn" onclick="my_modal_1.showModal()">open modal</button> -->
<dialog id="my_modal_1" class="modal">
    <div class="modal-box flex flex-col space-y-2">
        <input id="modal_ingr" type="text" class="input input-bordered w-full input-sm" placeholder="ingredient" bind:value={new_item.name}>
        <input  type="text" class="input input-bordered w-full input-sm" placeholder="quantity" bind:value={new_item.qty}>
        <input type="text" class="input input-bordered w-full input-sm" placeholder="unit" bind:value={new_item.unit}>
        <div class="flex items-center m-2 justify-end space-x-1">
            <div class="modal-action mt-0">
                <form method="dialog">
                    <!-- if there is a button in form, it will close the modal -->
                    <button class="btn btn-sm btn-primary" onclick={add_new_item}>Add & Close</button>
                </form>
            </div>
            <button class="btn btn-primary btn-sm" onclick={add_new_item}>add</button>
        </div>
    </div>
</dialog>