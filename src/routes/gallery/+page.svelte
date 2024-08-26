<script>
    /** @type {import('./$types').PageData} */
    export let data;
   
</script>

<div id="main" class="flex flex-auto flex-wrap justify-around items-center space-y-96 md:space-y-12 pt-36 pb-16 md:pt-0 md:pb-0 h-full">
    {#each data.photos as url}
    <div class="photo w-96 bg-base-200">
        <img src={url} alt="Shoes" class="rounded-lg" />
      </div>
    {/each}
</div>
