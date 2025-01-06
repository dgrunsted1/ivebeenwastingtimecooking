<script>
  let {
        msg,
        action = $bindable(),
        btn_name = $bindable()
    } = $props();
</script>


<div class="m-auto flex flex-col items-center space-y-10 md:space-y-20 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8 border border-gray-500 justify-center mx-2 md:mx-auto md:text-4xl max-w-5xl">
    <p class="m-auto">{msg}</p>
    {#if btn_name&& action}
        <button class="btn" onclick={action}>{btn_name}</button>
    {/if}
  </div>