<script>
    import { afterUpdate } from "svelte";
    export let title;
    export let msg;
    export let type;
    export let show;
    let delay_timer;
    const alert_types = {   success: "alert-success", 
                            info:"alert-info", 
                            warning:"alert-warning", 
                            error:"alert-error"
    };

    afterUpdate(() => {
        if (show && type != "error") {
            clearTimeout(delay_timer);
            delay_timer = setTimeout(() => {
                show = false;
            }, 3000);
        }
    });
</script>



<div role="alert" id="alert" class="drop-shadow-xl alert {alert_types[type]} fixed top-24 transition-[left] {show ? 'left-0' : '-left-full'} duration-700 p- md:p-10 ml-5 w-4/5 md:w-96 flex flex-row">
    {#if type == "warning"}
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    {:else if type == "error"}
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    {:else if type == "success"}
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    {/if}
    <div>
        <h3 class="font-bold">{title}</h3>
        <div class="text-xs">{msg}</div>
    </div>
    <div>
        <button on:click|stopPropagation={()=>{show = false}} class="btn btn-xs">close</button>
    </div>
</div>