<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let navElement = $state(null);
	let cardElements = $state([]);
	let lastScrollY = $state(0);

	onMount(() => {
		if (!browser) return;

		// Staggered animation for cards
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry, index) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						entry.target.classList.add('animate-fadeInUp');
					}, index * 100);
				}
			});
		}, { threshold: 0.1 });

		cardElements.forEach(card => {
			if (card) observer.observe(card);
		});

		// Floating nav scroll effect
		const handleScroll = () => {
			if (window.scrollY > lastScrollY && window.scrollY > 100) {
				if (navElement) {
					navElement.style.transform = 'translateX(-50%) translateY(-100%)';
				}
			} else {
				if (navElement) {
					navElement.style.transform = 'translateX(-50%) translateY(0)';
				}
			}
			lastScrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>Cooking Made Effortless - CookSmart</title>
	<meta name="description" content="Transform your kitchen from recipe chaos to cooking zen with AI-powered meal planning and smart recipe organization." />
</svelte:head>

<div class="bg-base-100 text-neutral min-h-screen">
	<!-- Floating Navigation -->
	<nav bind:this={navElement} class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-base-100/80 backdrop-blur-md rounded-full px-8 py-4 shadow-xl border border-neutral/10 transition-transform duration-300">
		<div class="flex items-center space-x-8">
			<div class="font-bold text-primary">🍳 CookSmart</div>
			<div class="hidden md:flex space-x-6 text-sm">
				<a href="#features" class="hover:text-primary transition-colors">Features</a>
				<a href="#pricing" class="hover:text-primary transition-colors">Pricing</a>
				<a href="#contact" class="hover:text-primary transition-colors">Contact</a>
			</div>
			<button class="btn btn-primary btn-sm rounded-full font-semibold">
				Sign Up
			</button>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="min-h-screen flex items-center justify-center px-4 pt-20">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<div class="inline-flex items-center bg-secondary/20 text-secondary px-6 py-3 rounded-full text-sm font-medium mb-8">
					<span class="animate-pulse mr-2">🎉</span>
					Now with AI-powered meal planning
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
				<div bind:this={cardElements[0]} class="break-inside-avoid card bg-base-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-primary">
					<div class="card-body">
						<div class="text-5xl mb-6">📚</div>
						<h3 class="card-title text-2xl text-neutral">Universal Import</h3>
						<p class="text-neutral/70 leading-relaxed">Capture recipes from anywhere - websites, photos, handwritten notes. Our smart scraper cleans up the mess.</p>
						<div class="card-actions justify-start mt-6">
							<div class="flex items-center text-primary font-semibold cursor-pointer hover:text-primary/80">
								<span>Learn more</span>
								<span class="ml-2">→</span>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[1]} class="break-inside-avoid card bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-accent">
					<div class="card-body">
						<div class="text-5xl mb-6">🔍</div>
						<h3 class="card-title text-2xl text-neutral">Smart Search</h3>
						<p class="text-neutral/70 leading-relaxed">Find recipes by ingredients you have, cooking time, dietary restrictions. No more endless scrolling.</p>
						<div class="mt-8 bg-base-100/50 rounded-2xl p-4">
							<div class="text-sm text-neutral/80 mb-2">Try searching:</div>
							<div class="flex flex-wrap gap-2">
								<span class="badge badge-accent badge-sm">chicken + 30min</span>
								<span class="badge badge-accent badge-sm">vegan pasta</span>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[2]} class="break-inside-avoid card bg-base-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-secondary">
					<div class="card-body">
						<div class="text-5xl mb-6">📋</div>
						<h3 class="card-title text-2xl text-neutral">Menu Builder</h3>
						<p class="text-neutral/70 leading-relaxed">Create custom meal plans for any occasion. Weekly prep, dinner parties, quick weeknights.</p>
					</div>
				</div>

				<div bind:this={cardElements[3]} class="break-inside-avoid card bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-primary">
					<div class="card-body">
						<div class="text-5xl mb-6">🛒</div>
						<h3 class="card-title text-2xl text-neutral">Smart Shopping</h3>
						<p class="text-neutral/70 leading-relaxed mb-6">Auto-generated lists that merge duplicates and organize by store layout.</p>
						<div class="bg-base-100/60 rounded-xl p-4">
							<div class="flex items-center justify-between text-sm mb-2">
								<span class="text-neutral/80">Weekly groceries</span>
								<span class="text-primary font-semibold">$47.20</span>
							</div>
							<div class="space-y-1 text-xs text-neutral/60">
								<div>✓ Chicken breast (2 lbs)</div>
								<div>✓ Fresh basil</div>
								<div>✓ Olive oil</div>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[4]} class="break-inside-avoid card bg-base-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-info">
					<div class="card-body">
						<div class="text-5xl mb-6">🌟</div>
						<h3 class="card-title text-2xl text-neutral">Community Vibes</h3>
						<p class="text-neutral/70 leading-relaxed">See what others are cooking. Get inspired by real people making real food.</p>
						<div class="mt-6 space-y-3">
							<div class="flex items-center space-x-3">
								<div class="avatar">
									<div class="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full"></div>
								</div>
								<div class="text-sm text-neutral/80">Sarah made Pasta Primavera</div>
							</div>
							<div class="flex items-center space-x-3">
								<div class="avatar">
									<div class="w-8 h-8 bg-gradient-to-r from-accent to-secondary rounded-full"></div>
								</div>
								<div class="text-sm text-neutral/80">Mike tried Thai Curry</div>
							</div>
						</div>
					</div>
				</div>

				<div bind:this={cardElements[5]} class="break-inside-avoid card bg-gradient-to-br from-success/10 to-success/5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-success">
					<div class="card-body">
						<div class="text-5xl mb-6">🎲</div>
						<h3 class="card-title text-2xl text-neutral">AI Menu Magic</h3>
						<p class="text-neutral/70 leading-relaxed">Can't decide what to cook? Our AI suggests perfect meals based on your taste and what's in your fridge.</p>
					</div>
				</div>

				<div bind:this={cardElements[6]} class="break-inside-avoid card bg-base-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-warning">
					<div class="card-body">
						<div class="text-5xl mb-6">💡</div>
						<h3 class="card-title text-2xl text-neutral">Smart Suggestions</h3>
						<p class="text-neutral/70 leading-relaxed">Get personalized recommendations based on your cooking history and seasonal ingredients.</p>
					</div>
				</div>

				<div bind:this={cardElements[7]} class="break-inside-avoid card bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-t-4 border-secondary">
					<div class="card-body">
						<div class="text-5xl mb-6">📊</div>
						<h3 class="card-title text-2xl text-neutral">Your Journey</h3>
						<p class="text-neutral/70 leading-relaxed mb-6">Track your culinary progress with personalized stats and cooking streaks.</p>
						<div class="stats bg-base-100/60 rounded-xl">
							<div class="stat place-items-center">
								<div class="stat-value text-primary text-2xl">47</div>
								<div class="stat-desc">Recipes Tried</div>
							</div>
							<div class="stat place-items-center">
								<div class="stat-value text-accent text-2xl">12</div>
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
	@keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fadeInUp {
        animation: fadeInUp 0.6s ease-out;
    }
</style>