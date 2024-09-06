<script>
    import { onMount } from "svelte";

    const pages = [{
        gif: `https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/1v2pt8h8glmy7o1/my_project_1_copyCVePJ4.gif?thumb=400x0`,
        text: "add a recipe easily from your favorite website, a book, or a video"
    },{
        gif: `https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/i0xx644lq8874uc/my_project_34_copy_0_tIWm7ouO9W.gif?thumb=400x0`,
        text: "Easily see all ingredients and directions at the same time.  Add notes, blur ingredients or directions when completed, and it even has built in timers"
    },{
        gif: `https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/0oq9ib2ekr0wkjf/my_project_31_9G37Ylanui.gif?thumb=400x0`,
        text: "quickly create menus with grocery lists based on the recipes you have added, search, filter and sort to find the perfect recipe."
    },{
        gif: `https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/hvdik0mxsukp0yk/my_project_32_4kg8mYpQdl.gif?thumb=400x0`,
        text: "browse and search your previous menus and set one as today's menu"
    },{
        gif: `https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/88kx73q80vvo6l1/my_project_33_gmMgQzzNkG.gif?thumb=400x0`,
        text: "your current menu will show on the today page"
    }]

    onMount(async () => {
        await pb.collection('users').authRefresh();
    })
</script>


<div class="flex flex-col space-y-96 py-32 p-5">
    {#each pages as page}
        <div class="flex flex-col md:flex-row w-full items-center border border-primary bg-primary rounded-lg">
            <div class="md:w-2/3 p-2">
                <img src={page.gif} alt="gif of {page.text}" class="w-full rounded-lg"/>
            </div>
            <p class="p-10 md:w-1/3 text-black">{page.text}</p>
        </div>
    {/each}
</div>