<script>
    import { deserialize } from '$app/forms';
    import { onMount } from 'svelte';
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { process_recipe_old } from '/src/lib/process_recipe.js';
    import { save_recipe } from '/src/lib/save_recipe.js';
    import { page } from '$app/stores';


$: scraper_test_result = [];
$: process_recipe_results = [];
// $: test_recipe_link = null;
$: test_recipe_link = {"id":"gc48952q9l8ixuw","title":"Moroccan Chicken Brochettes","url":"https://www.bonappetit.com/recipe/moroccan-chicken-brochettes","img":"https://assets.bonappetit.com/photos/57ad3f29f1c801a1038bcadb/master/w_1280%2Cc_limit/moroccan-chicken-brochettes.jpg"};
$: recipe_links = [];
$: num_tests = 10;
$: test_site = null;
$: test_sites = ['www.seriouseats.com', 'cooking.nytimes.com', 'www.bonappetit.com'];

onMount(async () => {
    if (!$currentUser) window.location.href = "/login";
    recipe_links = await pb.collection('recipes').getFullList({expand:`ingr_list`});
    if (recipe_links) document.getElementById("compare_parsers_btn").disabled = false;
});

async function fetch_recipe(e){
    document.getElementById("scrape_loading").classList.remove("hidden");
    const data = new FormData(this);

    const response = await fetch(this.action, {
        method: 'POST',
        body: data
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());
    document.getElementById("scrape_loading").classList.add("hidden");
    if (result.data.err) {
        alert(result.data.err);
    } else if (result.type === 'success') {
        scraper_test_result = result.data;
    }
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function get_recipes(){
    if (test_recipe_link){
        for (let i = 0; i < recipe_links.length; i++){
            if (recipe_links[i].id == test_recipe_link.id) return [recipe_links[i]];
        }
    } else if (test_site){
        let result = [];
        for (let i = 0; i < recipe_links.length; i++){
            if (get_website_name(recipe_links[i].url) == test_site) result.push(recipe_links[i]);
        }
        return shuffle(result).slice(0, num_tests);
    } else {
        return shuffle(recipe_links).slice(0, num_tests);
    }
    return null;
}

function get_test_data(error, recipe){
    return {
                error: error,
                id: recipe.id,
                passed: false,
                title: recipe.title,
                url: recipe.url,
                scrape_time: null, 
                data: null
            };
}

async function process_recipe_test(e){
    e.srcElement.innerHTML = `<progress id="progress" class="progress progress-secondary w-56" value="5" max="100"></progress>`;
    const recipes = get_recipes();
    e.srcElement.firstChild.value = `10`;
    process_recipe_results = [];
    for (let i = 0; i < recipes.length; i++){
        const data = new FormData(this);
        data.append("recipe", JSON.stringify(recipes[i]));
        let scraped_ingr = [];
        const response = await fetch(this.action, {
            method: 'POST',
            body: data,
            recipe: recipes[i]
        });

        /** @type {import('@sveltejs/kit').ActionResult} */
        const result = deserialize(await response.text());
        if (result.error && result.error.message) {
            process_recipe_results  = [get_test_data(result.error.message, recipes[i])].concat(process_recipe_results);
        } else if (result.type === 'success') {
            let scraped_recipe = result.data;
            scraped_recipe.expand.ingr_list = process_recipe_old(scraped_recipe.expand.ingr_list);

            process_recipe_results  = [test_recipe(scraped_recipe, recipes[i])].concat(process_recipe_results);    
        }
        let progress = ((i+1)/recipes.length)*100;
        e.srcElement.firstChild.value = `${progress}`;
    }
    e.srcElement.innerHTML = `Test Scraper`;
}

function test_attr(truth, attr_in){
    if (!truth || !attr_in) return false;
    if (typeof truth == "number" || typeof attr_in == "number"){
        return (parseInt(truth) == parseInt(attr_in));
    } else if (typeof truth == "object" || typeof attr_in == "object"){
        for (let [key, value] of Object.entries(attr_in)){
            if (truth[key] != attr_in[key]) return false;
        }
        return true;
    } else {
        return (truth.toLowerCase().trim() == attr_in.toLowerCase().trim())
    }
}

function test_ingr(truth, ingr_in){
    let output = "";
    if (!truth ^ !ingr_in) return false;
    if (truth.ingredient != ingr_in.ingredient) output += `Ingredient mismatch: ${truth?.ingredient} vs ${ingr_in.ingredient}\n`;
    if (truth.quantity != ingr_in.quantity) output += `Quantity mismatch: ${truth?.quantity} vs ${ingr_in.quantity}\n`;
    if (truth.unit != ingr_in.unit) output += `Unit mismatch: ${truth?.unit} vs ${ingr_in.unit}\n`;

    // if (output) console.log("errors", output);
    return (output == "") ? true : false;
}

function test_recipe(my_result, truth){
    let output = [];
    for (let [key, value] of Object.entries(my_result)) {
        if (!value && !truth[key]) continue;
        if (key == "expand"){
            for (let j = 0; j < value.ingr_list.length; j++){
                if (!value.ingr_list[j]) continue;
                let list_length = (truth.expand.ingr_list.length >= value.ingr_list.length) ? truth.expand.ingr_list.length : value.ingr_list.length;
                let found = false;
                for (let i = 0; i < list_length && !found; i++){
                    if (truth.expand.ingr_list[i] && (truth.expand.ingr_list[i].ingredient == value.ingr_list[j].ingredient ||
                        truth.expand.ingr_list[i].ingredient.includes(value.ingr_list[j].ingredient) || 
                        value.ingr_list[j].ingredient.includes(truth.expand.ingr_list[i].ingredient) || 
                        getFirstWords(value.ingr_list[j].ingredient, 3) == getFirstWords(truth.expand.ingr_list[i].ingredient, 3) || 
                        getFirstWords(truth.expand.ingr_list[i].ingredient, 4).includes(getFirstWords(value.ingr_list[j].ingredient, 3)))){
                        output.push({key: key, val: value.ingr_list[j], test_val: truth.expand.ingr_list[i], test: test_ingr(truth.expand.ingr_list[j], my_result.expand.ingr_list[j])});
                        found = true;
                    }
                }
                if (!found){
                    output.push({key: key, val: value.ingr_list[j], test_val: false, test: false});
                }
            }
        }else if (key != "tags" && key != "timing"){
            output.push({key: key, val: value, test_val: truth[key], test: test_attr(truth[key], value)});
        }
    } 
    return {
        error: false,
        id: truth.id,
        passed: passed(output),
        title:truth.title,
        url:truth.url,
        scrape_time: my_result.timing.execution_time, 
        data: output,
        scrape_result: my_result
    };
}

function passed(data){
    for (let [key, value] of Object.entries(data)) {
        if (!value && !truth[key]) continue;
        if (key == "expand"){
            for (let j = 0; j < value.ingr_list.length; j++){
               if (!data.expand.ingr_list[j].test) return false;
            }
        }else if (key != "tags" && key != "timing"){
            if (!value.test) return false;
        }
    }  
    return true;
}

function compare(my_result, npm_result){
    let compare = {};
    compare.lengths = {val: `npm: ${npm_result.length} - mine: ${my_result.length}`, pass: npm_result.length == my_result.length};
    compare.ingr = [];
    for (let i = 0; i < my_result.length; i++){
        let npm_match = null
        for (let j = 0; j < npm_result.length; j++){
            if (my_result[i].ingredient && (npm_result[j].ingredient.toLowerCase().includes(my_result[i].ingredient.toLowerCase().replace(/ *\([^)]*\) */g, "").trim()) || 
                my_result[i].ingredient.toLowerCase().includes(npm_result[j].ingredient.toLowerCase().replace(/ *\([^)]*\) */g, "").trim()))){
                npm_match = npm_result[j];
            }
        }
        if (!npm_match){
            npm_match = npm_result[i];
        }
        let quantity = {
            npm: npm_match.quantity,
            mine: my_result[i].quantity,
            pass: (npm_match.quantity == my_result[i].quantity || (my_result[i].quantity && (!npm_match.quantity)) || (!my_result[i].quantity && !npm_match.quantity))
        }
        let unit = {
            npm: npm_match.unit,
            mine: my_result[i].unit,
            pass: (npm_match.unit == my_result[i].unit || (my_result[i].unit && (!npm_match.unit || npm_match.unit == "q.b.")) || (!my_result[i].unit && !npm_match.unit) || ((my_result[i].unit == "g" || my_result[i].unit == "gram") && (npm_match.unit == "g" || npm_match.unit == "gram")))
        }
        let ingredient = {
            npm: npm_match.ingredient,
            mine: my_result[i].ingredient,
            pass: (npm_match.ingredient == my_result[i].ingredient || (npm_match.ingredient.toLowerCase().replace(/ *\([^)]*\) */g, "").trim() == my_result[i].ingredient.toLowerCase().replace(/ *\([^)]*\) */g, "").trim()) || (my_result[i].ingredient && !npm_match.ingredient))
        }
        compare.ingr.push({quantity, unit, ingredient, original: my_result[i].original});
        
    }
    return compare;
}

const getFirstWords = (str, len_in) => {
  let match = str.split(/[ ,]+/);
  if (match){
    let len = (match.length > len_in) ? len_in : match.length;
    let output = "";
    for (let i = (len_in == 4) ? 1 : 0; i < len; i++){
        if (i > 0 && i < len){
            output += " ";
        }
        output += match[i];
    }
    return output;
  }else {
    return "ingredient";
  }
}

function display_key(data_in){
    return data_in.key != "expand" ? data_in.key : getFirstWords(data_in.val.ingredient, 3);
}

function set_test_recipe(e){
    for (let i = 0; i < recipe_links.length; i++){
        if (recipe_links[i].id == e.srcElement.id){
            test_recipe_link = {
                                    id: e.srcElement.id,
                                    title: recipe_links[i].title,
                                    url: recipe_links[i].url,
                                    img: recipe_links[i].image
                                };
            console.log(JSON.stringify(test_recipe_link));
        }
    }
}    

function remove_test_recipe(){
    test_recipe_link = null;    
}

function set_num_tests(e){
    document.getElementById("num_tests_label").innerHTML = e.srcElement.innerHTML;
    document.activeElement.blur();
}
function set_test_site(e){
    document.getElementById("test_sites_label").innerHTML = e.srcElement.innerHTML;
    document.activeElement.blur();
}

function get_website_name(url){
    return url.match(/\w+\.\w+\.\w+/);
}

function update_recipe(e){
    for (let i = 0; i < process_recipe_results.length; i++){
        if (process_recipe_results[i].id = e.srcElement.id){
            process_recipe_results[i].scrape_result.id = process_recipe_results[i].id;
            save_recipe(e, process_recipe_results[i].scrape_result, null, null);
        }
    }
}


</script>


<div class="flex flex-col">
     <div class="flex">
         <div class="flex w-full m-5 w-full">
            <div class="w-full justify-center w-full">
                <div class="flex justify-center space-x-10 content-center w-full">
                    <form method="POST" action="?/scrape_ingr" class="w-52"  on:click|preventDefault={process_recipe_test}>
                        <button id="compare_parsers_btn" class="btn btn-primary w-56" disabled>
                            Test Scraper
                        </button>
                    </form>
                    <div class="dropdown w-52">
                        <label tabindex="0" class="btn m-1 w-full" id="num_tests_label">Number of Recipes</label>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box">
                            {#each [1,3,5,7,10] as curr}
                                <li class="cursor-pointer" on:click={()=>{num_tests = curr}} on:click={set_num_tests}>{curr}</li>
                            {/each}
                        </ul>
                    </div>
                    <div class="dropdown w-52">
                        <label tabindex="0" class="btn m-1 w-full" id="test_sites_label">site</label>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box">
                            {#each test_sites as curr}
                                <li class="cursor-pointer" on:click={()=>{test_site = curr}} on:click={set_test_site}>{curr}</li>
                            {/each}
                        </ul>
                    </div>
                </div>

                {#if test_recipe_link}
                    <div class="flex justify-center space-x-3">
                        <div class="flex flex-col justify-center w-full space-y-3">
                            <div class="text-center">Testing {test_recipe_link.title}</div>
                            <div  class="flex justify-evenly">
                                <div class="btn" on:click={remove_test_recipe}>stop testing recipe</div>
                                <div class="btn" href={test_recipe_link.url} target="_blank">{get_website_name(test_recipe_link.url)}</div>
                            </div>
                        </div>
                        <div  class="w-1/3"><img src={test_recipe_link.img}/></div>
                    </div>
                    <div class="flex flex-col w-full space-y-2 mt-5 justify-center">
                        {#if process_recipe_results}
                        <!-- <h3 class="text-center">NPM : MINE</h3> -->
                            {#each process_recipe_results as recipe}
                                {#if recipe.passed == true}
                                    <div class="bg-success-content text-success rounded text-center col-span-3">
                                        <div>
                                            <div>{recipe.title}</div>
                                            <div>{recipe.scrape_time}</div>
                                        </div>
                                        <div class="flex justify-center space-x-3">
                                            <div class="btn"><a href={recipe.url} target="_blank">{get_website_name(recipe.url)}</a></div>
                                            <div class="btn" on:click={set_test_recipe} id={recipe.id}>test</div>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="bg-error-content text-error rounded text-center col-span-3">
                                        <div>
                                            <div>{recipe.title}</div>
                                            <div>{recipe.scrape_time}</div>
                                        </div>
                                        <div class="flex justify-center space-x-3">
                                            <div class="btn"><a href={recipe.url} target="_blank">{get_website_name(recipe.url)}</a></div>
                                            <div class="btn" on:click={set_test_recipe} id={recipe.id}>test</div>
                                        </div>
                                        <div class="dropdown w-52">
                                            <button class="btn btn-primary w-56" id={recipe.id} on:click={update_recipe}>
                                                update recipe solution
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                                <div class="flex flex-col space-x-1 w-full justify-center">
                                    <div class="bg-content rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div>Scraped</div><div>The Truth</div></div>
                                    {#each recipe.data as curr}
                                        {#if curr.key == "image"}
                                            {#if curr.test == true}
                                                <div class="bg-success-content text-success rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><img src={curr.val} alt={curr.val} class="w-1/3"/><img src={curr.test_val} alt={curr.test_val} class="w-1/3"/></div>
                                            {:else}
                                                <div class="bg-error-content text-error rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><img src={curr.val} alt={curr.val} class="w-1/3"/><img src={curr.test_val} alt={curr.test_val} class="w-1/3"/></div>
                                            {/if}
                                        {:else if curr.key == "expand"}
                                            {#if curr.test == true}
                                                <div class="bg-success-content text-success rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div class="w-1/2">{curr.val.quantity} | {curr.val.unit} | {curr.val.ingredient}</div><div class="w-1/2">{curr.test_val.quantity} | {curr.test_val.unit} | {curr.test_val.ingredient}</div></div>
                                            {:else}
                                                {#if !curr.test_val}
                                                    <div class="bg-error-content text-error rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div class="w-1/2">{curr.val.quantity} | {curr.val.unit} | {curr.val.ingredient}</div><div class="w-1/2">none</div></div>
                                                {:else}
                                                    <div class="bg-error-content text-error rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div class="w-1/2">{curr.val.quantity} | {curr.val.unit} | {curr.val.ingredient}</div><div class="w-1/2">{curr.test_val.quantity} | {curr.test_val.unit} | {curr.test_val.ingredient}</div></div>
                                                {/if}
                                            {/if}
                                        {:else}
                                            {#if curr.test == true}
                                                <div class="bg-success-content text-success rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div>{curr.val}</div><div>{curr.test_val}</div></div>
                                            {:else}
                                                <div class="bg-error-content text-error rounded text-center border-solid border border-black p-1 flex justify-evenly space-x-4"><div>{curr.val}</div><div>{curr.test_val}</div></div>
                                            {/if}
                                        {/if}
                                    {/each}
                                </div>
                            {/each}
                        {/if}
                    </div>
                {:else}
                    <div class="flex flex-col w-full space-y-2 mt-5 justify-center">
                        {#if process_recipe_results}
                        <!-- <h3 class="text-center">NPM : MINE</h3> -->
                            {#each process_recipe_results as recipe}
                                {#if recipe.passed == true}
                                    <div class="bg-success-content text-success rounded text-center col-span-3">
                                        <div>
                                            <div>{recipe.title}</div>
                                            <div>{recipe.scrape_time}</div>
                                        </div>
                                        <div class="flex justify-center space-x-3">
                                            <div class="btn"><a href={recipe.url} target="_blank">{get_website_name(recipe.url)}</a></div>
                                            <div class="btn" on:click={set_test_recipe} id={recipe.id}>test</div>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="bg-error-content text-error rounded text-center col-span-3">
                                        <div>
                                            <div>{recipe.title}</div>
                                            <div>{recipe.scrape_time}</div>
                                        </div>
                                        <div class="flex justify-center space-x-3">
                                            <div class="btn"><a href={recipe.url} target="_blank">{get_website_name(recipe.url)}</a></div>
                                            <div class="btn" on:click={set_test_recipe} id={recipe.id}>test</div>
                                        </div>
                                    </div>
                                {/if}
                                <div class="flex flex-row space-x-1 w-full flex-wrap justify-center">
                                    {#each recipe.data as curr}
                                        {#if curr.test == true}
                                            <div class="bg-success-content text-success rounded text-center border-solid border border-black p-1">{display_key(curr)}</div>
                                        {:else}
                                            <div class="bg-error-content text-error rounded text-center border-solid border border-black p-1">{display_key(curr)}</div>
                                        {/if}
                                    {/each}
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if} 
            </div>
         </div>
     </div>
     
</div>
