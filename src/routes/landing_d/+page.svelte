<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let cardElements = $state([]);

	onMount(() => {
		if (!browser) return;

		// Staggered animation for cards
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('animate-slideIn');
				}
			});
		}, { threshold: 0.3 });

		// Add animation classes to all cards with a delay
		setTimeout(() => {
			cardElements.forEach((card, index) => {
				if (card) {
					setTimeout(() => {
						observer.observe(card);
					}, index * 150);
				}
			});
		}, 200);

		return () => {
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Cooking Made Effortless - CookSmart</title>
	<meta name="description" content="Transform your kitchen from recipe chaos to cooking zen with smart meal planning and recipe organization." />
</svelte:head>

<div class="bg-base-100 text-neutral min-h-screen">
	<!-- Hero Section -->
	<section class="min-h-screen flex items-center justify-center px-4 py-20">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<div class="inline-flex items-center bg-secondary/20 text-secondary px-6 py-3 rounded-full text-sm font-medium mb-8">
					<span class="animate-pulse mr-2">🎉</span>
					Now with smart meal planning
				</div>
				<h1 class="text-6xl md:text-8xl font-black mb-8 leading-tight">
					<span class="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
						Recipe Chaos
					</span>
					<br />
					<span class="text-neutral">to Kitchen Zen</span>
				</h1>
				<p class="text-xl md:text-2xl text-neutral/70 max-w-3xl mx-auto mb-12 leading-relaxed">
					Stop juggling cookbooks, screenshots, and sticky notes. Organize everything, plan effortlessly, shop smartly.
				</p>
				<button class="btn btn-lg bg-gradient-to-r from-primary to-accent text-white border-none hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl shadow-primary/25 rounded-2xl">
					Transform Your Kitchen Today
				</button>
			</div>

			<!-- Masonry Card Layout -->
			<div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
				<!-- Feature Cards -->
				<div bind:this={cardElements[0]} class="break-inside-avoid card bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-primary opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6 animate-bounce">📚</div>
						<h3 class="card-title text-2xl text-neutral">Universal Import</h3>
						<p class="text-neutral/70 leading-relaxed">Capture recipes from anywhere - websites, photos, handwritten notes. Our smart scraper cleans up the mess.</p>
						<div class="card-actions justify-start mt-6">
							<div class="flex items-center text-primary font-semibold cursor-pointer hover:text-primary/80 transition-colors">
								<span>Learn more</span>
								<span class="ml-2 transition-transform group-hover:translate-x-1">→</span>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[1]} class="break-inside-avoid card bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-accent opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6 animate-pulse">🔍</div>
						<h3 class="card-title text-2xl text-neutral">Smart Search</h3>
						<p class="text-neutral/70 leading-relaxed">Find recipes by ingredients you have, cooking time, dietary restrictions. No more endless scrolling.</p>
						<div class="mt-8 bg-base-100/50 rounded-2xl p-4">
							<div class="text-sm text-neutral/80 mb-2">Try searching:</div>
							<div class="flex flex-wrap gap-2">
								<span class="badge badge-accent badge-sm animate-pulse">chicken + 30min</span>
								<span class="badge badge-accent badge-sm animate-pulse">vegan pasta</span>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[2]} class="break-inside-avoid card bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-secondary opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6">📋</div>
						<h3 class="card-title text-2xl text-neutral">Menu Builder</h3>
						<p class="text-neutral/70 leading-relaxed">Create custom meal plans for any occasion. Weekly prep, dinner parties, quick weeknights.</p>
					</div>
				</div>

				<div bind:this={cardElements[3]} class="break-inside-avoid card bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-primary opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6 animate-bounce">🛒</div>
						<h3 class="card-title text-2xl text-neutral">Smart Shopping</h3>
						<p class="text-neutral/70 leading-relaxed mb-6">Auto-generated lists that merge duplicates and organize by store layout.</p>
						<div class="bg-base-100/60 rounded-xl p-4 hover:bg-base-100/80 transition-colors">
							<div class="flex items-center justify-between text-sm mb-2">
								<span class="text-neutral/80">Weekly groceries</span>
								<span class="text-primary font-semibold">$47.20</span>
							</div>
							<div class="space-y-1 text-xs text-neutral/60">
								<div class="hover:text-success transition-colors">✓ Chicken breast (2 lbs)</div>
								<div class="hover:text-success transition-colors">✓ Fresh basil</div>
								<div class="hover:text-success transition-colors">✓ Olive oil</div>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[4]} class="break-inside-avoid card bg-gradient-to-br from-info/10 to-info/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-info opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6">🌟</div>
						<h3 class="card-title text-2xl text-neutral">Community Vibes</h3>
						<p class="text-neutral/70 leading-relaxed">See what others are cooking. Get inspired by real people making real food.</p>
						<div class="mt-6 space-y-3">
							<div class="flex items-center space-x-3 hover:translate-x-2 transition-transform">
								<div class="avatar">
									<div class="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full"></div>
								</div>
								<div class="text-sm text-neutral/80">Sarah made Pasta Primavera</div>
							</div>
							<div class="flex items-center space-x-3 hover:translate-x-2 transition-transform">
								<div class="avatar">
									<div class="w-8 h-8 bg-gradient-to-r from-accent to-secondary rounded-full"></div>
								</div>
								<div class="text-sm text-neutral/80">Mike tried Thai Curry</div>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[5]} class="break-inside-avoid card bg-gradient-to-br from-success/10 to-success/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-success opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6">🎲</div>
						<h3 class="card-title text-2xl text-neutral">Menu Magic</h3>
						<p class="text-neutral/70 leading-relaxed">Can't decide what to cook? Get perfect meal suggestions based on your taste and what's in your fridge.</p>
					</div>
				</div>

				<div bind:this={cardElements[6]} class="break-inside-avoid card bg-gradient-to-br from-warning/10 to-warning/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-warning opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6 animate-pulse">💡</div>
						<h3 class="card-title text-2xl text-neutral">Smart Suggestions</h3>
						<p class="text-neutral/70 leading-relaxed">Get personalized recommendations based on your cooking history and seasonal ingredients.</p>
					</div>
				</div>

				<div bind:this={cardElements[7]} class="break-inside-avoid card bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 border-t-4 border-secondary opacity-0">
					<div class="card-body">
						<div class="text-5xl mb-6 animate-bounce">📊</div>
						<h3 class="card-title text-2xl text-neutral">Your Journey</h3>
						<p class="text-neutral/70 leading-relaxed mb-6">Track your culinary progress with personalized stats and cooking streaks.</p>
						<div class="stats bg-base-100/60 rounded-xl hover:bg-base-100/80 transition-colors">
							<div class="stat place-items-center">
								<div class="stat-value text-primary text-2xl hover:scale-110 transition-transform">47</div>
								<div class="stat-desc">Recipes Tried</div>
							</div>
							<div class="stat place-items-center">
								<div class="stat-value text-accent text-2xl hover:scale-110 transition-transform">12</div>
								<div class="stat-desc">Day Streak</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Social Proof -->
	<section class="py-20 bg-gradient-to-r from-neutral/5 to-primary/5">
		<div class="max-w-6xl mx-auto px-4 text-center">
			<h2 class="text-3xl md:text-4xl font-bold text-neutral mb-12">
				Loved by Home Cooks Everywhere
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="rating rating-sm mb-4">
							<input type="radio" name="rating-1" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-1" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-1" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-1" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-1" class="mask mask-star-2 bg-warning" checked />
						</div>
						<p class="text-neutral/70 mb-6">"Finally, all my recipes in one place! The AI suggestions are spot-on."</p>
						<div class="font-semibold text-neutral">- Jennifer K.</div>
					</div>
				</div>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="rating rating-sm mb-4">
							<input type="radio" name="rating-2" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-2" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-2" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-2" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-2" class="mask mask-star-2 bg-warning" checked />
						</div>
						<p class="text-neutral/70 mb-6">"Meal planning went from 2 hours to 10 minutes. Game changer!"</p>
						<div class="font-semibold text-neutral">- David M.</div>
					</div>
				</div>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="rating rating-sm mb-4">
							<input type="radio" name="rating-3" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-3" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-3" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-3" class="mask mask-star-2 bg-warning" checked />
							<input type="radio" name="rating-3" class="mask mask-star-2 bg-warning" checked />
						</div>
						<p class="text-neutral/70 mb-6">"The grocery list feature saves me so much time and money."</p>
						<div class="font-semibold text-neutral">- Maria S.</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="py-20 bg-gradient-to-br from-primary via-accent to-secondary text-white text-center">
		<div class="max-w-4xl mx-auto px-4">
			<h2 class="text-4xl md:text-6xl font-bold mb-8">
				Your Kitchen Revolution Starts Now
			</h2>
			<p class="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
				Join over 10,000 home cooks who've transformed their kitchen experience. No more recipe chaos, just organized cooking bliss.
			</p>
			<div class="space-y-6">
				<button class="btn btn-lg bg-white text-primary border-none hover:scale-105 hover:shadow-2xl transition-all duration-300 rounded-2xl">
					Start Your Free Trial
				</button>
				<div class="flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
					<div class="flex items-center">
						<span class="mr-2">✓</span>
						30-day free trial
					</div>
					<div class="flex items-center">
						<span class="mr-2">✓</span>
						No credit card required
					</div>
					<div class="flex items-center">
						<span class="mr-2">✓</span>
						Cancel anytime
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(50px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	
	:global(.animate-slideIn) {
		animation: slideIn 0.8s ease-out forwards;
	}
</style>