<script>
  import { run } from 'svelte/legacy';

    import { onMount, onDestroy, createEventDispatcher } from "svelte";
  
  /**
   * @typedef {Object} Props
   * @property {number} [threshold]
   * @property {boolean} [horizontal]
   * @property {any} elementScroll
   * @property {boolean} [hasMore]
   */

  /** @type {Props} */
  let {
    threshold = 0,
    horizontal = false,
    elementScroll,
    hasMore = true
  } = $props();
  
    const dispatch = createEventDispatcher();
    let isLoadMore = false;
    let component = $state();
  
  
    const onScroll = e => {
      const element = e.target;
  
      const offset = horizontal
        ? e.target.scrollWidth - e.target.clientWidth - e.target.scrollLeft
        : e.target.scrollHeight - e.target.clientHeight - e.target.scrollTop;
  
      if (offset <= threshold) {
        if (!isLoadMore && hasMore) {
          dispatch("loadMore");
        }
        isLoadMore = true;
      } else {
        isLoadMore = false;
      }
    };
  
    onDestroy(() => {
      if (component || elementScroll) {
        const element = elementScroll ? elementScroll : component.parentNode;
  
        element.removeEventListener("scroll", null);
        element.removeEventListener("resize", null);
      }
    });
      $effect(() => {
      if (component || elementScroll) {
        const element = elementScroll ? elementScroll : component.parentNode;
  
        element.addEventListener("scroll", onScroll);
        element.addEventListener("resize", onScroll);
      }
    });
</script>
  
  <div bind:this={component} style="width:0px"></div>