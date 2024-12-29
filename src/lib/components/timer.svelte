<script>
    import { onDestroy } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { linear as easing } from 'svelte/easing';
    
    let { countdown = $bindable() } = $props();
    let audio = $state();
  
    let start = $state(Date.now());
    let now = $state(Date.now());
    let end = $derived(start + countdown * 1000);
  
    let count = $derived(Math.round((end - now) / 1000));
    let h = $derived(Math.floor(count / 3600));
    let m = $derived(Math.floor((count - h * 3600) / 60));
    let s = $derived(count - h * 3600 - m * 60);
    const duration = 1000;
    let offset = tweened(1, { duration, easing });
    let rotation = tweened(360, { duration, easing });
    let isPaused = $state(false);
  
    async function updateTimer() {
      now = Date.now();
      offset.set(Math.max(count - 1, 0) / countdown);
      rotation.set((Math.max(count - 1, 0) / countdown) * 360);
      if (count === 0) audio.play();
      if (count === 0) clearInterval(interval);
    }
  
    let interval = $state(setInterval(updateTimer, 1000));
  
    let isResetting = $state();
  
    
  
    function handleNew() {
      let new_time = prompt("How many minutes would you like to change the timer too?");
      
      countdown = new_time * 60;
      
    }
  
    function handleStart() {
      if (!isPaused) {
        start = Date.now();
      } else {
        // When resuming, adjust the start time to maintain the correct remaining time
        const remainingTime = count;
        start = Date.now() - (countdown - remainingTime) * 1000;
        now = Date.now();
      }
      interval = setInterval(updateTimer, 1000);
      offset.set(Math.max(count - 1, 0) / countdown);
      rotation.set((Math.max(count - 1, 0) / countdown) * 360);
      isPaused = false;
    }
  
    function handlePause() {
      clearInterval(interval);
      isPaused = true;
    }
  
    function handleReset() {
      clearInterval(interval);
      isResetting = true;
      isPaused = false;
      Promise.all([offset.set(1), rotation.set(360)]).then(() => {
        isResetting = false;
        now = Date.now();
        start = Date.now();
        interval = setInterval(updateTimer, 1000);
      });
    }
  
    function padValue(value, length = 2, char = '0') {
      const { length: currentLength } = value.toString();
      if (currentLength >= length) return value.toString();
      return `${char.repeat(length - currentLength)}${value}`;
    }
  
    onDestroy(() => {
      clearInterval(interval);
    });
  </script>
  
  <div class="flex flex-col justify-evenly pr-1 w-full">
    <svg viewBox="-50 -50 100 100" class="w-full">
      <title>Remaining seconds: {count}</title>
      <g fill="none" stroke="currentColor" stroke-width="6">
        <circle stroke="currentColor" r="46" />
        <path stroke="hsl(252, 100%, 75%)" d="M 0 -46 a 46 46 0 0 0 0 92 46 46 0 0 0 0 -92" pathLength="1" stroke-dasharray="1" stroke-dashoffset={$offset} />
      </g>
      <g class="fill-primary" stroke="none">
        <g transform="rotate({$rotation})">
          <g transform="translate(0 -46)">
            <circle r="4" />
          </g>
        </g>
      </g>
  
      <g fill="currentColor" text-anchor="middle" dominant-baseline="baseline" font-size="32">
        <text x="-3" y="6.5">
                {#if h > 0}
                    <tspan dx="3" font-weight="bold">
                        {#if m > 30}
                            {padValue(h+1)}
                        {:else}
                            {padValue(h)}
                        {/if}
                    </tspan>
                    <tspan dx="0.5" font-size="12">h</tspan>
                {:else if m > 0}
                    <tspan dx="3" font-weight="bold">
                        {#if s > 30}
                            {padValue(m+1)}
                        {:else}
                            {padValue(m)}
                        {/if}
                    </tspan>
                    <tspan dx="0.5" font-size="12">m</tspan>
                {:else}
                    <tspan dx="3" font-weight="bold">{padValue(s)}</tspan>
                    <tspan dx="0.5" font-size="12">s</tspan>
                {/if}
        </text>
      </g>
    </svg>
  
    <div class="flex w-full flex-col md:flex-row justify-evenly items-center">
        <div class="flex flex-row md:flex-col items-center">
            <button class="reset_new m-1" onclick={handleNew}>New</button>
            <button class="reset_new m-1" onclick={handleReset}>Reset</button>
        </div>
      {#if isPaused}
        <button class="play_pause bg-primary" disabled={isResetting || count === 0} onclick={handleStart}>
          <!-- <span class="visually-hidden">Start timer</span> -->
  
          <svg class="w-1/3" viewBox="-50 -50 100 100">
            <g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
              <path d="M -25 -40 l 60 40 -60 40z"/>
            </g>
          </svg>
        </button>
      {:else}
        <button class="play_pause bg-primary" disabled={isResetting || count === 0} onclick={handlePause}>
          <!-- <span class="visually-hidden">Pause timer</span> -->
          <svg viewBox="-50 -50 100 100">
            <g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
              <path d="M -25 -30 v 60 m 50 0 v -60"/>
            </g>
          </svg>
        </button>
      {/if}
    </div>
    <audio src="https://freesound.org/data/previews/536/536420_4921277-lq.mp3" bind:this={audio} muted="" playsinline=""></audio>
</div>
  
  <style>
    .reset_new {
      width: max-content;
      font-size: .75rem;
      color: inherit;
      border: none;
      background: none;
      text-transform: capitalize;
    }
  
    .reset_new:hover {
      text-decoration: underline;
    }
  
    .play_pause {
      color: primary;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: none;
      padding: 0.25rem;
      /* background: hsl(208, 100%, 50%); */
      box-shadow: 0px 1px 2px;
      transition: box-shadow 0.2s ease-in-out, transform 0.25s ease-in-out;
    }
  
    .play_pause:hover,
    .play_pause:focus {
      box-shadow: 0px 1px 5px hsl(208, 100%, 50%);
    }
  
    .play_pause svg {
      margin: initial;
      width: 100%;
      height: auto;
      display: block;
    }
  
    button[disabled] {
      transform: scale(0);
    }
  </style>
  