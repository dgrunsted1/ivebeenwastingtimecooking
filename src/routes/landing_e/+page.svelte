<script>
    // Content objects for easy maintenance
    const content = {
        meta: {
            title: "Cooking Made Effortless",
            description: "Transform scattered recipes into organized meal plans. From import to plate, we make cooking effortless."
        },
        hero: {
            tagline: "✨ Smart Recipe Management",
            heading: {
                part1: "Cook",
                part2: "with",
                part3: "Confidence"
            },
            description: "Transform scattered recipes into organized meal plans. From import to plate, we make cooking effortless.",
            buttons: {
                primary: "Start Free Today",
                secondary: "Watch Demo"
            }
        },
        features: {
            heading: "Everything You Need in One Place",
            items: [
                {
                    icon: "📚",
                    title: "Universal Recipe Import",
                    description: "Add recipes from anywhere - websites, photos, books, or create your own.",
                    borderColor: "border-primary"
                },
                {
                    icon: "🔍",
                    title: "Actually Smart Search",
                    description: "Find recipes by ingredients, cooking time, or dietary needs instantly.",
                    borderColor: "border-accent"
                },
                {
                    icon: "📋",
                    title: "Custom Menu Builder",
                    description: "Create reusable meal plans for any occasion and save forever.",
                    borderColor: "border-secondary"
                },
                {
                    icon: "🛒",
                    title: "Smart Grocery Lists",
                    description: "Auto-generated shopping lists that merge duplicates seamlessly.",
                    borderColor: "border-info"
                },
                {
                    icon: "🌟",
                    title: "Community Inspiration",
                    description: "Discover trending recipes from real people making real food.",
                    borderColor: "border-success"
                },
                {
                    icon: "🎲",
                    title: "Menu Generator",
                    description: "Can't decide what to cook? Our AI suggests perfect meals for you.",
                    borderColor: "border-warning"
                },
                {
                    icon: '💡',
                    title: 'Smart Suggestions',
                    description: 'Get recipe recommendations based on your cooking history, seasonal ingredients, and what\'s trending in your taste profile.',
                    borderColor: "border-primary"
                },
                {
                    icon: '🌐',
                    title: 'One-Click Recipe Capture',
                    description: 'Found a recipe online? Capture it instantly, cleaning up the formatting and saving it to your collection.',
                    borderColor: "border-accent"
                },
                {
                    icon: '📊',
                    title: 'Your Cooking Journey',
                    description: 'Track your culinary progress with personalized stats. See your favorite cuisines, most-cooked dishes, and cooking streaks.',
                    borderColor: "border-secondary"
                }
            ]
        },
        stats: {
            items: [
                { value: "50K+", label: "Recipes Saved" },
                { value: "10K+", label: "Happy Cooks" },
                { value: "95%", label: "Love It" },
                { value: "24/7", label: "Always Ready" }
            ]
        },
        cta: {
            heading: "Ready to Cook Smarter?",
            description: "Join thousands of home cooks who've transformed their kitchen experience. Start your journey today.",
            button: "Get Started Free",
            footnote: "No credit card required • 30-day free trial"
        }
    };

    // Feature cards for hero section
    const featureCards = [
        { icon: "📚", title: "Recipe Import" },
        { icon: "🔍", title: "Smart Search" },
        { icon: "📋", title: "Menu Builder" },
        { icon: "🛒", title: "Shopping Lists" }
    ];

    // Animation functions
    function setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.group').forEach(el => observer.observe(el));

        // Parallax effect for geometric shapes
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const shapes = document.querySelectorAll('.geo div');
            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.5;
                shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
            });
        });
    }

    // Run animations after component mounts
    import { onMount } from 'svelte';
    onMount(setupAnimations);
</script>

<svelte:head>
    <title>{content.meta.title}</title>
    <meta name="description" content={content.meta.description} />
</svelte:head>

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

<div class="bg-base-100 text-neutral overflow-x-hidden">
    <!-- Geometric Background Elements -->
    <div class="geo fixed inset-0 pointer-events-none">
        <div class="absolute top-20 left-10 w-32 h-32 bg-primary/20 rotate-45 rounded-lg animate-pulse"></div>
        <div class="absolute top-40 right-20 w-20 h-20 bg-accent/30 rounded-full animate-pulse"></div>
        <div class="absolute bottom-40 left-1/4 w-16 h-40 bg-secondary/25 transform -rotate-12"></div>
        <div class="absolute bottom-20 right-10 w-24 h-24 bg-primary/15 rotate-12 rounded-lg"></div>
    </div>

    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center relative px-4">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Left Content -->
            <div class="space-y-8 z-10 relative">
                <div class="inline-block bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-semibold">
                    {content.hero.tagline}
                </div>
                <h1 class="text-5xl md:text-7xl font-black leading-tight">
                    <span class="text-primary">{content.hero.heading.part1}</span> {content.hero.heading.part2} 
                    <span class="text-accent">{content.hero.heading.part3}</span>
                </h1>
                <p class="text-xl text-neutral/80 leading-relaxed max-w-lg">
                    {content.hero.description}
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <button class="bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-xl shadow-primary/25">
                        {content.hero.buttons.primary}
                    </button>
                    <button class="border-2 border-accent text-accent px-8 py-4 rounded-2xl font-semibold hover:bg-accent hover:text-white transition-all duration-300">
                        {content.hero.buttons.secondary}
                    </button>
                </div>
            </div>

            <!-- Right Visual -->
            <div class="relative">
                <div class="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 backdrop-blur-sm border border-primary/20">
                    <div class="grid grid-cols-2 gap-4">
                        {#each featureCards as card}
                            <div class="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform duration-300">
                                <div class="text-3xl mb-3">{card.icon}</div>
                                <div class="text-sm font-semibold text-neutral">{card.title}</div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Grid -->
    <section class="py-20 bg-gradient-to-br from-secondary/10 to-primary/5">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-neutral mb-6">
                    {content.features.heading}
                </h2>
                <div class="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each content.features.items as item}
                    <div class="group bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-l-4 {item.borderColor}">
                        <div class="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h3 class="text-xl font-bold text-invbase mb-4">{item.title}</h3>
                        <p class="text-neutral">{item.description}</p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div class="max-w-6xl mx-auto px-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {#each content.stats.items as stat}
                    <div class="space-y-2">
                        <div class="text-4xl md:text-5xl font-black">{stat.value}</div>
                        <div class="text-white/80">{stat.label}</div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section class="py-20 bg-base-100 text-center">
        <div class="max-w-4xl mx-auto px-4">
            <h2 class="text-4xl md:text-5xl font-bold text-neutral mb-8">
                {content.cta.heading}
            </h2>
            <p class="text-xl text-neutral/70 mb-12 max-w-2xl mx-auto">
                {content.cta.description}
            </p>
            <div class="space-y-4">
                <button class="bg-gradient-to-r from-primary to-accent text-white px-12 py-6 rounded-2xl text-xl font-semibold hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    {content.cta.button}
                </button>
                <p class="text-sm text-neutral/60">{content.cta.footnote}</p>
            </div>
        </div>
    </section>
</div>