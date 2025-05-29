<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let heroRef;
  let featureCards = [];
  let scrollY = 0;

  const features = [
    {
      icon: '📚',
      title: 'Universal Recipe Import',
      description: 'Add recipes from anywhere - websites, photos, books, handwritten notes, or create your own. Our smart scraper does the heavy lifting.'
    },
    {
      icon: '🔍',
      title: 'Actually Smart Search',
      description: 'Find recipes by ingredients you have, cooking time, dietary needs. No more endless scrolling through irrelevant results.'
    },
    {
      icon: '📋',
      title: 'Custom Menu Builder',
      description: 'Create reusable meal plans for any occasion. Weekly prep, dinner parties, or quick weeknight dinners - save and reuse forever.'
    },
    {
      icon: '🛒',
      title: 'Smart Grocery Lists',
      description: 'Auto-generated shopping lists that merge duplicates and let you modify on the fly. Never forget ingredients again.'
    },
    {
      icon: '🌟',
      title: 'Community Inspiration',
      description: 'See what others are cooking right now. Discover trending recipes and get inspired by real people making real food.'
    },
    {
      icon: '🎲',
      title: 'AI Menu Generator',
      description: 'Can\'t decide what to cook? Try our menu generator and recipe suggester'
    },
    {
      icon: '💡',
      title: 'Smart Suggestions',
      description: 'Get recipe recommendations based on your cooking history, seasonal ingredients, and what\'s trending in your taste profile.'
    },
    {
      icon: '🌐',
      title: 'One-Click Recipe Capture',
      description: 'Found a recipe online? Capture it instantly, cleaning up the formatting and saving it to your collection.'
    },
    {
      icon: '📊',
      title: 'Your Cooking Journey',
      description: 'Track your culinary progress with personalized stats. See your favorite cuisines, most-cooked dishes, and cooking streaks.'
    }
  ];

  onMount(() => {
    if (!browser) return;

    // Parallax effect for hero
    const handleScroll = () => {
      scrollY = window.pageYOffset;
    };

    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for feature cards
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, observerOptions);

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      featureCards.forEach(card => {
        if (card) observer.observe(card);
      });
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  });
</script>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-gradient-to-br from-primary  to-accent text-white overflow-x-hidden">

  <!-- Hero Section -->
  <section 
    bind:this={heroRef}
    class="min-h-screen flex items-center justify-center text-center px-4 relative"
    style="transform: translateY({scrollY * 0.5}px)"
  >
    <!-- Floating background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="max-w-4xl relative z-10">
      <h1 class="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
        Cooking Made Effortless
      </h1>
      <p class="text-xl md:text-2xl mb-12 opacity-90 font-light">
        From scattered recipes to seamless meals. Plan your week, shop with ease, discover, organize, and cook with confidence.
      </p>
      <a href="/recipes">
      <button class="bg-gradient-to-r from-orange-400 to-accent px-12 py-4 text-xl font-semibold rounded-full hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-red-500/30 hover:shadow-red-500/40">
        Start Cooking Smart →
      </button>
      </a>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <div class="text-3xl">🍕</div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-20 bg-white/10 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-4xl md:text-6xl font-bold text-center mb-16">
        Everything You Need to Cook Better
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each features as feature, i}
          <div
            bind:this={featureCards[i]}
            class="feature-card bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group opacity-0 translate-y-8"
          >
            <!-- Shimmer effect -->
            <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <div class="relative z-10">
              <div class="text-5xl mb-6">{feature.icon}</div>
              <h3 class="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p class="opacity-90 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Value Proposition -->
  <section class="py-20 bg-gradient-to-r from-accent to-orange-400 text-center">
    <div class="max-w-4xl mx-auto px-4">
      <h2 class="text-4xl md:text-5xl font-bold mb-8">
        Turn Meal Planning from Chore to Choice
      </h2>
      <p class="text-xl md:text-2xl leading-relaxed mb-12 opacity-95">
        Remember spending hours deciding what to cook, hunting for recipes, making shopping lists, and forgetting what you planned? We want to make cooking decisions as easy as scrolling through your favorite feed.
      </p>
        <a href="/recipes">
            <button class="bg-primary/70 backdrop-blur-md px-12 py-4 text-xl font-semibold rounded-full hover:bg-white/30 hover:scale-105 transition-all duration-300 border border-white/30">
                Try It Free Today
            </button>
        </a>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="py-20 bg-black/20 text-center">
    <div class="max-w-3xl mx-auto px-4">
      <h2 class="text-4xl md:text-5xl font-bold mb-8">
        Ready to Transform Your Kitchen?
      </h2>
      <p class="text-xl mb-12 opacity-90">
        Join thousands of home cooks who've already simplified their meal planning
      </p>
        <a href="/recipes">
            <button class="bg-gradient-to-r from-orange-400 to-accent px-16 py-6 text-2xl font-semibold rounded-full hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-red-500/30 hover:shadow-red-500/40">
                Get Started Now - It's Free
            </button>
        </a>
    </div>
  </section>
</div>

<style>
  .feature-card {
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
</style>