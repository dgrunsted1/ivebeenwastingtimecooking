<script>
    let {
        cnt
    } = $props();
</script>

{#each Array(cnt) as _, i}
    <div id="country" class="btn btn-xs"><div class="skeleton h-2 w-12"></div></div> 
{/each}