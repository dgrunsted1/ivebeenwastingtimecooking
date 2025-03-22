<script>
    import DeleteIcon from "/src/lib/icons/DeleteIcon.svelte";
    import EditIcon from "/src/lib/icons/EditIcon.svelte";
    import CheckMark from "/src/lib/icons/CheckMark.svelte";
    import { delete_grocery_item, ingrs_to_string, update_grocery_item } from '/src/lib/groceries.js'
    import { combine } from '/src/lib/merge_ingredients.js'
    import { pb, currentUser } from '/src/lib/pocketbase';
    import Plus from "/src/lib/icons/Plus.svelte";




    let { 
        grocery_list = $bindable([]), 
        status = $bindable(), 
        grocery_list_id,
        list_owner,
        reset_grocery_list,
        check_grocery_item
    } = $props();
    let edit = $state(false);
    
    let delay_timer;
    let just_copied = $state(false);
    let new_item = $state({qty: null, unit: "", name: ""});
    let interactable = true;
    let is_owner = ($currentUser && $currentUser.id == list_owner);
    let dragged_item = $state(null);
    let dragged_over = $state(null);

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
            const updated_item = grocery_list.filter(item => item.id == id)[0];
            update_grocery_item(updated_item);
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

    const add_item_modal = () => {
        my_modal_1.showModal();
        document.getElementById("modal_ingr").focus();
    }

    const share_list = (e) => {
        const share_link = `${window.location.origin}/today/${$currentUser.username}`;
        navigator.clipboard.writeText(share_link);
        e.currentTarget.parentNode.parentNode.blur();
    }

    const drag_over = (e) => {
        dragged_over = e.currentTarget.getElementsByTagName("input")[0].id;
    }

    const drag_start = (e) => {
        dragged_item = e.currentTarget.getElementsByTagName("input")[0].id;
    }

    const drag_end = (e) => {
        if (dragged_item == dragged_over){
            dragged_item = null;
            dragged_over = null;
            return;
        }
        add_item_modal();
        let drag = {};
        let drag_over = {};
        for (let i = 0; i < grocery_list.length; i++){
            if (grocery_list[i].id == dragged_item){
                drag = grocery_list[i];
            }
            if (grocery_list[i].id == dragged_over){
                drag_over = grocery_list[i];
            }
        }
        const merge_name = (drag_over.name === drag.name) ? drag_over.name : `${drag_over.name}  |  ${drag.name}`;
        try{
            const combine_result = combine(drag, drag_over);
            new_item = {
                qty: combine_result.amount,
                unit: combine_result.unit,
                name: merge_name
            };
        } catch (error){
            new_item = {
                qty: `${drag_over.qty}  |  ${drag.qty}`,
                unit: `${drag_over.unit}  |  ${drag.unit}`,
                name: merge_name
            };
        }
    }

    const merge_items = async () => {
        let new_index = 0;
        const curr_dragged_item = grocery_list.filter(item => item.id == dragged_item)[0];
        let drag_over_item = {...grocery_list.filter(item => item.id == dragged_over)[0]};
        drag_over_item.ingrs = curr_dragged_item.ingrs.concat(drag_over_item.ingrs);
        drag_over_item.qty = new_item.qty;
        drag_over_item.unit = new_item.unit;
        drag_over_item.name = new_item.name;
        drag_over_item.checked = (curr_dragged_item.checked && drag_over_item.checked);
        await update_grocery_item(drag_over_item);
        setTimeout(async () => {
            dragged_over = null;
            await delete_grocery_item(dragged_item);
            dragged_item = null;
        }, 1000);
    }

    const merge_disabled = () => {
        if (new_item.name.includes('|')) return true;
        if (new_item.unit.includes('|')) return true;
        if (!(!isNaN(parseFloat(new_item.qty)) && isFinite(new_item.qty))) return true;
        return false;
    }

    const handle_modal_enter = (e) => {
        if (e.key == "Enter" && !merge_disabled()){
            if (dragged_item){
                merge_items(e);
            } else {
                add_new_item(e);
            }  
            my_modal_1.close();
        } else if (e.key == "Escape"){
            dragged_over = null;
            dragged_item = null;
        }
    } 

    const touch_start = (e) => {
        console.log("start", e);
        disableScroll();
        e.preventDefault();
        const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            view: window,
            dataTransfer: dataTransfer || new DataTransfer()
        });
        e.currentTarget.parentNode.classList.add("touch-none");
        dragged_item = e.currentTarget.getElementsByTagName("input")[0].id;
    }

    const touch_move = (e) => {
        console.log("move", e);
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element?.closest('.grocery_item')) {
            dragged_over = element.closest('.grocery_item').getElementsByTagName("input")[0].id;
        }
    }

    const touch_end = (e) => {
        console.log("end", e);
        e.preventDefault();
        drag_end(e);
        e.currentTarget.parentNode.classList.remove("touch-none");
    }

    function disableScroll() {
            // Get the current page scroll position
        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop;
        const scrollLeft =
            window.scrollX ||
            document.documentElement.scrollLeft;

            // if any scroll is attempted,
            // set this to the previous value
            window.onscroll = function () {
                window.scrollTo(scrollLeft, scrollTop);
            };
    }

    function enableScroll() {
        window.onscroll = function () { };
    }
</script>

<div id="list" class="flex flex-col w-full">
    <div id="header" class="hidden md:flex justify-between items-center mt-0">
        {#if grocery_list.length > 0}
            <div>
                {#if status != "none"}<div id="update_status" class="text-xs">{status}</div>{/if}
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
            {#if is_owner}<button class="btn btn-xs btn-primary" onclick={share_list}>share</button>{/if}
            {#if interactable}<button id="edit" class="btn btn-xs btn-primary" onclick={edit_groceries}><EditIcon/></button>{/if}
            {#if interactable}<button id="add" class="btn btn-xs btn-primary" onclick={add_item_modal}><Plus/></button>{/if}
        {/if}
    </div>
    <div class="md:mx-3">
        <div class="grocery_list h-[calc(100svh-150px)] md:h-[calc(100svh-105px)] overflow-y-auto px-2 py-4">
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
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="grocery_item select-none hidden md:flex space-x-3 justify-end md:justify-start items-center {item.id == dragged_item && item.id != dragged_over ? `border border-error rounded-lg p-1` : ``} {item.id == dragged_over ? `border border-primary rounded-lg p-1` : ``}"
                            draggable="true"
                            ondragover={drag_over}
                            ondragstart={drag_start}
                            ondragend={drag_end}
                        >
                            {#if status != "none"}<input type="checkbox" class="hidden md:flex checkbox checkbox-primary checkbox-lg p-1" id={item.id} bind:checked={item.checked} onchange={check_item_handle}>{/if}
                            <div class="flex">
                                <p class="text {item.id == dragged_item || item.id == dragged_over ? `text-xl` : ``}">{ingrs_to_string([item])}</p>
                            </div>
                            {#if status != "none"}<input type="checkbox" class="md:hidden checkbox checkbox-primary checkbox-lg p-1" id={item.id} bind:checked={item.checked} onchange={check_item_handle}>{/if}
                        </div>
                        <div class="grocery_item select-none flex md:hidden space-x-3 justify-end md:justify-start items-center"
                            ontouchstart={touch_start}
                            ontouchmove={touch_move}
                            ontouchend={touch_end}>
                            {#if status != "none"}<input type="checkbox" class="hidden md:flex checkbox checkbox-primary checkbox-lg p-1" id={item.id} bind:checked={item.checked} onchange={check_item_handle}>{/if}
                            <div class="flex">
                                <p class="text {item.id == dragged_item || item.id == dragged_over ? `text-xl` : ``}">{ingrs_to_string([item])}</p>
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
    <div id="header" class="flex md:hidden justify-between items-center mt-0">
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
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog id="my_modal_1" class="modal" onkeydown={handle_modal_enter}>
    <div class="modal-box flex flex-col space-y-2">
        <input id="modal_ingr" type="text" class="input input-bordered w-full input-sm{new_item.name.includes('|') ? ' bg-error/50' : ''}" placeholder="ingredient" bind:value={new_item.name}>
        <input  type="text" class="input input-bordered w-full input-sm{(!(!isNaN(parseFloat(new_item.qty)) && isFinite(new_item.qty))) ? ' bg-error/50' : ''}" placeholder="quantity" bind:value={new_item.qty}>
        <input type="text" class="input input-bordered w-full input-sm{new_item.unit.includes('|') ? ' bg-error/50' : ''}" placeholder="unit" bind:value={new_item.unit}>
        <div class="flex items-center m-2 justify-end space-x-1">
            <div class="modal-action mt-0">
                <form method="dialog">
                    <!-- if there is a button in form, it will close the modal -->
                    {#if !dragged_item}
                        <button id="enter_click" class="btn btn-sm btn-primary" onclick={add_new_item}>Add & Close</button>
                    {:else}
                        <button id="enter_click" class="btn btn-sm btn-primary" onclick={merge_items} disabled={merge_disabled()}>Merge</button>
                    {/if}
                </form>
            </div>
            {#if !dragged_item}
                <button class="btn btn-primary btn-sm" onclick={add_new_item}>add</button>
            {/if}
        </div>
    </div>
</dialog>