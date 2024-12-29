<script>
    let {
        cnt
    } = $props();
</script>

{#each Array(cnt) as _, i}
    <div class="card card-side bg-base-200 h-24 md:h-28 card-bordered border-primary cursor-pointer mx-1">
        <div class="flex items-center gap-4 w-full m-5">
            <div class="skeleton h-20 md:h-24 w-1/4 shrink-0 rounded-full"></div>
            <div class="flex flex-col gap-4 w-3/4">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-full"></div>
            </div>
        </div>
    </div>
{/each}