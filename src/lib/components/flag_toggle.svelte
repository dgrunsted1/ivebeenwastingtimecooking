<script>
let { 
        type,
        value = $bindable(),
        handle_func
    } = $props();

    const svgs = {is_compact: {
        true: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="5" width="18" height="2" rx="1"/>
            <rect x="3" y="10" width="18" height="2" rx="1"/>
            <rect x="3" y="15" width="18" height="2" rx="1"/>
            <rect x="3" y="20" width="18" height="2" rx="1"/>
          </svg>`,
        false: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="7" rx="1"/>
            <rect x="3" y="14" width="18" height="7" rx="1"/>
          </svg>`
    }};
</script>

<div>
    <button
      onclick={handle_func}
      class="relative inline-flex h-8 w-12 items-center rounded-full bg-primary transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      aria-pressed={value}
    >
      <span class="sr-only">{value ? 'Enabled' : 'Disabled'}</span>
      
      <span class="flex h-5 w-5 transform items-center bg-neutral justify-center rounded-full bg-white transition-transform duration-200 ease-in-out {value ? 'translate-x-5' : 'translate-x-1'}">
        {#if value}
            {@html svgs[type].true}
        {:else}
            {@html svgs[type].false}
        {/if}
      </span>
    </button>
</div>