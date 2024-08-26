import { scrape } from '/src/lib/scraper.js';


const tests = {"serious eats":[{
        url: "https://www.seriouseats.com/summer-rolls-with-jicama-watermelon-and-herbs", 
        result: {
            title: 'Summer Rolls With Jicama, Watermelon, and Herbs Recipe',
            author: 'Sohla El-Waylly',
            description: 'Keep cool with these refreshing no-cook summer rolls, filled with watermelon, jicama, and herbs',
            image: 'https://www.seriouseats.com/thmb/Nfvv2cV_blFRUhj4xGMFNyGCdSE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__2018__07__20180711-watermelon-jicama-spring-rolls-vicky-wasik-17--acc8507bc2f84db8ba512527db05ccd6.jpg',
            time: '15 mins',
            servings: '10 rolls',
            ingredients: [
            'One 5.4-ounce (150g) can unsweetened coconut cream',
            '2 tablespoons (1 ounce; 30g) freshly squeezed lime juice (from about 1 lime)',
            '3 Thai chiles, finely minced (about 1 tablespoon; 15g)',
            '1 tablespoon (15g) coconut aminos (see note)',
            '2 teaspoons fish sauce',
            '10 (8-inch) rice summer roll wrappers',
            '1/2 bunch (1 ounce; 30g) fresh cilantro',
            '1/2 bunch (1 ounce; 30g) fresh mint',
            '1/2 bunch (1 ounce; 30g) fresh basil',
            '1 pound (454g) jicama, peeled and cut into 1/4-inch matchsticks',
            '1 pound (454g) watermelon, peeled and cut into 1/4-inch matchsticks',
            '3/4 cup (3 1/2 ounces; 100g) toasted and salted peanuts, roughly chopped',
            '3-inch piece ginger, cut into 1/8-inch matchsticks (about 1 ounce; 30g)',
            '2 limes, cut into wedges',
            'Kosher salt'
            ],
            directions: [
            'For the Dipping Sauce: In a small bowl, whisk together the coconut cream, lime juice, Thai chilies, coconut aminos, and fish sauce. Set aside.',
            'For the Summer Rolls: Before you begin, dampen a clean kitchen towel with water and lay over cutting board to create a surface to wrap the rolls. Fill a shallow dish, like a pie plate, with water.',
            'Working with one rice paper wrap at a time, quickly dip each into the dish of water and place onto the kitchen towel–lined board. (The rice paper will not soften immediately, but it will while you place ingredients onto it.) Top the wrapper with a few leaves of mint, cilantro, and basil across the center of the wrapper. Top with a layer of jicama and watermelon matchsticks. Sprinkle a spoonful of peanuts and ginger over the matchsticks. Season the filling with a squeeze of lime juice and a pinch of salt.',
            'To wrap the summer roll, first fold the right and left sides of the rice paper over the ingredients. (If the rice paper is too sticky, moisten your hands with water before handling.) Start with the end closest to you, lift the edge of the paper and fold over the ingredients, rolling tightly up to the top. Repeat with remaining ingredients and serve immediately with coconut sauce.'
            ]}
    }, {
        url: "https://www.seriouseats.com/spring-vegetables-salad-with-poached-egg", 
        result: {
            title: 'Spring Vegetable Salad With Poached Egg and Crispy Bread Crumbs Recipe',
            author: 'J. Kenji López-Alt',
            description: "This fresh verdant salad of blanched favas, peas, asparagus, fiddleheads, and broccolini is enriched with runny egg yolk and a crunchy shallot-herb topping",
            image: 'https://www.seriouseats.com/thmb/9VxReoLxHJCBWFTuTiw0lEhGFro=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2017__04__20170419-spring-salad-crispy-egg-20-ecc817e1a96e47039eb75bb11cfba9b3.jpg',
            time: '45 mins',
            servings: 4,
            ingredients: [
            '12 ounces fava beans in their pods or 4 ounces shucked fava beans (120g shucked beans)',
            '12 ounces English peas in their pods or 4 ounces shucked peas (120g shucked peas)',
            'Kosher salt',
            '8 ounces asparagus, woody ends removed, stalks cut on a sharp bias at 1-inch intervals pieces (225g)',
            '6 ounces snap peas, strings removed, sliced on a sharp bias into 1/2-inch slices (170g)',
            '8 ounces broccolini, woody ends removed, cut on a sharp bias at 1-inch intervals pieces (170g)',
            '6 ounces stale hearty bread, crusts removed (170g)',
            '3 tablespoons unsalted butter (25g)',
            '2 tablespoons minced shallot, divided (about 1 small; 30g)',
            '2 tablespoons minced fresh parsley leaves',
            '2 tablespoons minced fresh chives',
            'Freshly ground black pepper',
            '1 tablespoon (15ml) juice and 2 teaspoons (5g) zest from 1 lemon',
            '3 tablespoons extra-virgin olive oil (45ml)',
            '4 poached eggs'
            ],
            directions: [
            'If using fava beans and peas in their pods, shuck the beans and peas from their pods, keeping them separate. Discard the pods. Bring a large pot of salted water to a boil and prepare an ice bath. Working with one vegetable at a time, blanch the favas, peas, asparagus, snap peas, and broccolini in the boiling water for 1 minute, transfer to the ice bath to cool, then transfer to a paper towel-lined tray and pat dry. Remove and discard the skins from each individual fava bean. Set vegetables aside.',
            'Tear bread into small pieces and transfer to the bowl of a food processor, mini-chopper, or blender. Pulse until reduced to fine bread crumbs.',
            'Heat butter in a small skillet over medium heat until melted, then add bread crumbs and cook, stirring and tossing frequently, until golden brown and crisp, about 5 minutes. Add half of shallots and cook, stirring, until fragrant, about 30 seconds. Remove from heat, add half of parsley and half of chives, and toss to combine. Season mixture to taste with salt and pepper.',
            'In a large bowl, whisk together lemon juice, lemon zest, and remaining shallot, parsley, and chives. Slowly drizzle in olive oil, whisking constantly. Add blanched vegetables, toss to combine, and season to taste with salt and pepper. Divide vegetables between four serving plates or bowls, making a small indentation to place the egg.',
            'Transfer poached eggs to skillet with bread crumbs and turn them carefully to coat in crumbs. Place eggs on top of salad and spoon any remaining crumbs on top. Serve immediately.'
            ]}}
], "new york times":[{
    url: "https://cooking.nytimes.com/recipes/1893-everyday-pancakes?action=click&module=Recipe%20of%20The%20Day&pgType=homepage", 
    result: {
        title: 'Everyday Pancakes',
        author: 'Mark Bittman',
        description: 'The basic pancake is made from a simple batter of eggs, flour, milk and baking powder for leavening',
        image: 'https://static01.nyt.com/images/2017/03/24/dining/24COOKING-CLASSICPANCAKES/24COOKING-CLASSICPANCAKES-articleLarge.jpg?w=1280&q=75',
        time: '20 minutes',
        servings: 4,
        ingredients: [
        '2cups all-purpose flour',
        '2teaspoons baking powder',
        '¼teaspoon salt',
        '1tablespoon sugar, optional',
        '2eggs',
        '1½ to 2cups milk',
        '2tablespoons melted and cooled butter (optional), plus unmelted butter for cooking, or use neutral oil'
        ],
        directions: [
        "Heat a griddle or large skillet over medium-low heat. In a bowl, mix together dry ingredients. Beat eggs into 1½ cups milk, then stir in 2 tablespoons melted cooled butter, if using it. Gently stir this mixture into dry ingredients, mixing only enough to moisten flour; don't worry about a few lumps. If batter seems thick, add a little more milk.",
        'Place a teaspoon or 2 of butter or oil on griddle or skillet. When butter foam subsides or oil shimmers, ladle batter onto griddle or skillet, making pancakes of any size you like. Adjust heat as necessary; usually, first batch will require higher heat than subsequent batches. Flip pancakes after bubbles rise to surface and bottoms brown, after 2 to 4 minutes.',
        'Cook until second side is lightly browned. Serve, or hold on an ovenproof plate in a 200-degree oven for up to 15 minutes.'
        ]}
    }, {
        url: "https://cooking.nytimes.com/recipes/7930-slow-roasted-duck-with-orange-sherry-sauce?algo=identity&fellback=true&imp_id=2029147694379135&req_id=3843803395711755&surface=cooking-search-web&variant=3_cooking_search_relevance_metric_ios_and_web", 
        result: {
            title: 'Slow Roasted Duck With Orange-Sherry Sauce',
            author: 'Greg Sonnier',
            description: 'The New Orleans raconteur Pableaux Johnson scored this recipe from Greg Sonnier of Gabrielle restaurant in the Mid-City neighborhood back in 2004, calling it a reflection "of the dual nature of New Orleans cookery',
            image: 'https://static01.nyt.com/images/2014/05/13/dining/orangeduck-still/orangeduck-still-articleLarge.jpg?w=1280&q=75',
            time: '5 hours 45 minutes',
            servings: 2,
            ingredients: [
            '1pound yellow onions, peeled and coarsely chopped',
            '½stick unsalted butter, melted',
            '15-pound duck, rinsed and patted dry',
            'Salt',
            'Freshly ground pepper',
            '2large rosemary sprigs',
            '2cups fresh orange juice',
            '1cup dry sherry',
            '½cup soy sauce',
            '2medium carrots, peeled and julienned',
            '4ounces cremini or white button mushrooms, trimmed and sliced thin',
            '2tablespoons unsalted butter',
            '17-ounce jar roasted red peppers, rinsed, drained and cut into strips',
            '2fresh chives, cut into 1-inch lengths',
            'Hash browns (see recipe)'
            ],
            directions: [
            "Heat oven to 500 degrees. In a large bowl, toss onions with melted butter. Season duck inside and out with salt and pepper. Place rosemary sprigs inside duck's cavity and then tightly pack with buttered onion mixture.",
            'Place duck in medium-size roasting pan, and roast for 10 minutes. Reduce oven temperature to 300 degrees and cover pan loosely with foil. Roast for about 4½ hours, draining fat every hour.',
            'Remove pan from oven and carefully discard as much fat as possible with a ladle. Add orange juice, sherry and soy sauce. Return pan to oven and roast uncovered for 30 minutes. Transfer duck to a platter and let cool slightly. Pour pan juices (about 4 cups) into a saucepan, discarding any pieces of skin. Skim off fat and bring to a boil over medium-high heat. Add carrots and reduce to 1½ cups, strain and keep on the side. In same pan, sauté mushrooms with 2 tablespoons butter until brown. Add red peppers and briefly sauté, then add reduced sauce. Season to taste with salt and pepper. Keep warm over low heat.',
            "Remove onions and rosemary from duck's cavity. Remove meat from bones. Place skin from duck breasts onto cookie sheet and bake at 400 degrees until skin starts to foam, about 5 to 10 minutes. Lower oven temperature to 200 degrees and place meat in oven to keep warm until serving.",
            'Cover bottoms of individual plates with sauce and top with either pasta, shoestring fries, hash browns or unsalted potato chips. Place a generous amount of duck meat on top, then garnish with crispy skin, vegetables and chives.'
            ]}}]
};

function array_test(scrape, test, in_type){
    let output = {status: false, message:[]};
    if (typeof scrape == typeof test && scrape.length == test.length){
        for (let j = 0; j < test.length; j++) {
            if (test[j].replace(/\s+/g, "") != scrape[j].replace(/\s+/g, "")){
                output.message.push(`"${test[j]}" != "${scrape[j]}"`);
            }
        }
        if (!output.message.length){
            output.status = true;
        }
    }else if (typeof scrape == typeof test) {
        output.message.push(`scraped length:${test.length} != test length:${scrape.length}`);
    }else {
        output.message.push(`scraped type:${typeof test} != test type:${typeof scrape}`);
    }
    return output;
}

/** @type {import('./$types').Actions} */
export const actions = {
    scrape: async ({ request }) => {
        let result = [];
        let i = 0;
        for (const [key, value] of Object.entries(tests)) {
            for (const curr of value) {
                let test_result = await scrape(curr.url);
                let error = {};
                error.servings = (test_result.servings != curr.result.servings) ? false : true;
                error.time = (test_result.time != curr.result.time) ? false : true;
                error.image = (!curr.result.image) ? false : true;
                error.description = (test_result.description != curr.result.description) ? false : true;
                error.author = (test_result.author != curr.result.author) ? false : true;
                error.title = (test_result.title != curr.result.title) ? false : true;
                error.directions = array_test(test_result.directions, curr.result.directions, "directions");
                error.expand.ingr_list = array_test(test_result.expand.ingr_list, curr.result.expand.ingr_list, "ingredients");
                
                if (error.title && error.author && error.description && error.image && error.time && error.servings && error.expand.ingr_list.status && error.directions.status){
                    error.message = `${key} ${i} passed`;
                }else {
                    error.message = `${key} ${i} failed`;
                }
                error.url = curr.url;
                result.push(error);
                i++;
            };          
        }
    return result;
    },
    scrape_ingr:  async ({ request }) => {
        let data = await request.formData();
        let recipe = JSON.parse(await data.get('recipe'));
        let test_result = await scrape(recipe.url);
        return test_result;
    }
};