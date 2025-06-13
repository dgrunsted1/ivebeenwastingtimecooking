<script>
	import { page } from '$app/stores';  
	import { currentUser, pb, signOut } from '/src/lib/pocketbase.js';
	import "../input.css";
    import { onMount } from 'svelte';
	import { flagsStore } from '/src/lib/stores.js';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
	let page_links = ($currentUser) ? [
		{href:"/today", display: "Today"},
		{href:"/recipes", display: "Recipes"},
		{href:"/my_menus", display: "My Menus"},
		{href:"/menu", display: "Create Menu"},
		{href:"/add_recipe", display: "Add Recipe"},
		{href:"/profile", display: "Profile"}
	] : [
		{href:"/recipes", display: "Recipes"}
	];

	onMount(async () => {
		const flags_result = await pb.collection('flags').getList(1, 50, {
			filter: `user = "${$currentUser.id}"`
		});
		flagsStore.set(flags_result.items[0]);
	});
</script>
		<div class="navbar bg-base-100 fixed z-100 flex content-center min-h-0 h-6 md:h-9 relative">
			<div class="navbar-start">
				
				<!-- {#if $currentUser && ($currentUser.id == "67gxu7xk6x46gjy" || $currentUser.id == "n7ei4wy3vqv78ea") && $page.url.pathname != "/gallery" && $page.url.pathname != "/test_suite"}
					<a href="test_suite" class="btn btn-error btn-sm">test suite</a>
				{/if} -->
			</div>
			<div class="navbar-center">
			<a class=" normal-case py-1 text-sm md:text-xl" href="/">i'vebeenwastingtimecooking</a>
			</div>
			<div class="navbar-end">
				<!-- <label class="label cursor-pointer space-x-2">
					<input type="checkbox" class="toggle toggle-primary" checked={$flagsStore.is_compact} onclick={toggle_compact}/>
					<span class="label-text">compact cards</span>
				</label> -->
				<!-- <FlagToggle
					type="is_compact"
					value={$flagsStore.is_compact}
					handle_func={toggle_compact}
				/> -->
				<div class="dropdown dropdown-end  z-9999">
					<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
					</div>
					<ul tabindex="-1" class="menu menu-sm dropdown-content mt-3 z-9999 bg-transparent rounded-box space-y-1.5">
						{#each page_links as link}
							<li class=""><a href={link.href} class="btn btn-xs {(link.href != $page.url.pathname) ? 'btn-neutral text-neutral-content' : 'btn-primary text-primary-content'} flex content-center whitespace-nowrap">{link.display}</a></li>
						{/each}
						{#if !$currentUser && $page.url.pathname != "/login"}
							<li><a href="/login" class="btn btn-xs btn-neutral flex content-center">login</a></li>
						{:else if $currentUser && $page.url.pathname != "/login" && $page.url.pathname != "/gallery"}
							<li><button onclick={signOut} class="btn btn-xs btn-neutral flex content-center" onkeypress={signOut}>logout</button></li>
						{/if}
					</ul>
				</div>
			</div>
		</div>
		<div style="display: contents" class="relative">
			{@render children?.()}
		</div>
