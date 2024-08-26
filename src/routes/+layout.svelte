	<script>
		import { page } from '$app/stores';  
		import { currentUser, pb, signOut } from '/src/lib/pocketbase.js';
		import "../input.css";
		$: is_homepage = ($page.url.pathname == "/") ? true : false; 

    	let page_links = ($currentUser) ? [
			{href:"/gallery", display: "Gallery"},
			{href:"/today", display: "Today"},
			{href:"/recipes", display: "Recipes"},
			{href:"/my_menus", display: "My Menus"},
			{href:"/menu", display: "Create Menu"},
			{href:"/add_recipe", display: "Add Recipe"}
    	] : [
			{href:"/gallery", display: "Gallery"},
			{href:"/recipes", display: "Recipes"},
    	];
	</script>
		<!-- {#if !is_homepage} -->
			<!-- <div> -->
				<div class="navbar bg-base-100 fixed z-10 flex content-center min-h-0 h-6 md:h-9">
					<div class="navbar-start">
						
						<!-- {#if $currentUser && ($currentUser.id == "67gxu7xk6x46gjy" || $currentUser.id == "n7ei4wy3vqv78ea") && $page.url.pathname != "/gallery" && $page.url.pathname != "/test_suite"}
							<a href="test_suite" class="btn btn-error btn-sm">test suite</a>
						{/if} -->
					</div>
					<div class="navbar-center">
					<a class=" normal-case py-1 text-sm md:text-xl" href="/">www.ivebeenwastingtime.com</a>
					</div>
					<div class="navbar-end">
						<div class="dropdown dropdown-end">
							<div tabindex="0" role="button" class="btn btn-ghost btn-circle btn-sm">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
							</div>
							<ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box space-y-1.5">
								{#each page_links as link}
									<li class=""><a href={link.href} class="btn btn-xs {(link.href != $page.url.pathname) ? 'btn-primary' : 'btn-ghost'} flex content-center whitespace-nowrap">{link.display}</a></li>
								{/each}
							{#if !$currentUser && $page.url.pathname != "/login"}
								<li><a href="login" class="btn btn-xs btn-primary flex content-center">login</a></li>
							{:else if $currentUser && $page.url.pathname != "/login" && $page.url.pathname != "/gallery"}
								<li><div on:click={signOut} class="btn btn-xs btn-primary flex content-center" on:keypress={signOut}>logout</div></li>
							{/if}
							</ul>
						</div>
					</div>
				</div>
			<!-- </div> -->
		  <!-- {/if} -->
		<div style="display: contents" class="relative">
			{#if !is_homepage}
				<div class="h-6 md:h-9"></div>
			{/if}
			<slot></slot>
		</div>
