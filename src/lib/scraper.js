import puppeteer from 'puppeteer';
import { currentUser, pb } from '/src/lib/pocketbase.js';

const selectors = {
        serious_eats: {
            title: 'h1',
            author: '#mntl-bylines__item_1-0 > div > a',
            description: '#heading_1-0 > p',
            image: 'img',
            time: '#recipe-decision-block__container_1-0 > div.project-meta__times-container > div.total-time.project-meta__total-time > span > span.meta-text__data',
            servings: '#recipe-decision-block__container_1-0 > div.project-meta__results-container > div > span > span.meta-text__data',
            ingredients: [{
                            group: '#structured-ingredients_1-0 > *',
                            list: '#structured-ingredients_1-0 > ul:nth-child(LIST_INDEX) > *',
                            item: '#structured-ingredients_1-0 > ul:nth-child(LIST_INDEX) > li:nth-child(ITEM_INDEX)'
                        },
                        {
                            group: '#ingredient-list_1-0 > *',
                            item: '#ingredient-list_1-0 > li:nth-child(ITEM_INDEX)'
                        },
                        {
                            group: '#structured-ingredients_1-0 > ul > *',
                            item: '#structured-ingredients_1-0 > ul > li:nth-child(ITEM_INDEX)'
                        }],
            directions: [{
                            group: '#mntl-sc-block_45-0 > *',
                            item: '#mntl-sc-block_45-0 > li:nth-child(ITEM_INDEX) > p'
                        }]
                        // #mntl-sc-block_3-0
                        // #ingredient-list_1-0 > li:nth-child(2)
        },
        nyt: {
            title: 'header > h1',
            author: 'header > div > h2 > a',
            description: '#__next > main > div > div:nth-child(1) > div:nth-child(4) > div > div > div > p',
            image: 'img',
            time: '#__next > main > div > div:nth-child(1) > div:nth-child(3) > dl > dd:nth-child(2)',
            servings: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > div:nth-child(2) > span:nth-child(2)',
            ingredients: [{
                            group: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > ul > *',
                            list: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > ul > ul:nth-child(LIST_INDEX) > li',
                            item: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > ul > ul:nth-child(LIST_INDEX) > li:nth-child(ITEM_INDEX)'
                        },
                        {
                            group: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > ul > *',
                            item: '#__next > main > div > div:nth-child(1) > div:nth-child(8) > div > ul > li:nth-child(ITEM_INDEX)'
                        }],
            directions: [{
                            group: '#__next > main > div > div:nth-child(1) > div:nth-child(9) > div > ol > *',
                            item: '#__next > main > div > div:nth-child(1) > div:nth-child(9) > div > ol > li:nth-child(ITEM_INDEX) > p'
                        }]
        },
        ba: {
            title: 'h1',
            author: '#main-content > article > div:nth-child(1) > header > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > p > span > span > a',
            description: '#main-content > article > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > div > p:nth-child(1)',
            image: '#main-content > article > div:nth-child(1) > header > div > div:nth-child(2) div > div > span > picture > img',
            servings: '#main-content > article > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > p',
            ingredients: [{
                            group: '#main-content > article > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > div:nth-child(3) > *',
                            pitem: '#main-content > article > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > div:nth-child(3) > p:nth-child(ITEM_INDEX)',
                            item: '#main-content > article > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > div:nth-child(3) > div:nth-child(ITEM_INDEX)'
                        }],
            directions: [{
                            group: '#main-content > article > div:nth-child(2) > div > div > div > div:nth-child(6) > ol > li > *',
                            item: '#main-content > article > div:nth-child(2) > div > div > div > div:nth-child(6) > ol > li > p:nth-child(ITEM_INDEX)'
                        }]
        }
    };

async function get_ingredients(page, selectors){
    for (let k = 0; k < selectors.length; k++) {
        let sel_len = selectors[k].group
        let length = await page.evaluate((selector) => {
                        return Array.from(document.querySelectorAll(selector)).length;
                    }, sel_len);
        let output = [];
        for (let i = 0; i <= length; i++){
            if (selectors[k].list){
                let sel = selectors[k].list.replace("LIST_INDEX", i);
                
                let list_length = await page.evaluate((selector) => {
                                    return Array.from(document.querySelectorAll(selector)).length;
                                }, sel);
                for (let j = 0; j <= list_length; j++){
                    let sel_item = selectors[k].item.replace("ITEM_INDEX", j);
                    sel_item = sel_item.replace("LIST_INDEX", i);
    
                    let temp = await page.evaluate((sel) => {
                        return document.querySelector(sel)?.textContent;
                    }, sel_item);
                    if (temp) output.push(temp.trim());
                }
            }else{
                let sel_item = selectors[k].item.replace("ITEM_INDEX", i);
                let temp;
                if (selectors[k].pitem){
                    let p_item = selectors[k].pitem.replace("ITEM_INDEX", i);
                    temp = await page.evaluate((sel, p_item) => {
                        if (document.querySelector(p_item)) return document.querySelector(p_item)?.textContent;
                        else return document.querySelector(sel)?.textContent;
                    }, sel_item, p_item);
                }else {
                    temp = await page.evaluate((sel) => {
                        return document.querySelector(sel)?.textContent;
                    }, sel_item);
                }
                if (temp) {
                    if (output[output.length - 1] && !output[output.length - 1].includes(" ") && !/[a-z]/i.test(output[output.length - 1])){
                        output[output.length - 1] = output[output.length - 1] + " " + temp;
                    }else {
                        output.push(temp.trim());
                    }
                }
            }
        }
        if (output.length) return output;
    }
    return false;
}

async function get_directions(page, selector){
    let length = 0;
    let cnt = 0;
    for (let i = 0; i < selector.length; i++){
        length = await page.evaluate((selector) => {
            return Array.from(document.querySelectorAll(selector)).length;
        }, selector[i].group);
        cnt = i;
        if (length > 0) break;
    }
    
    let output = [];
    for (let i = 0; i <= length && length > 0; i++){
        let sel = selector[cnt].item.replace("ITEM_INDEX", i);
        let temp = await page.evaluate((sel) => {
            return document.querySelector(sel)?.textContent;
        }, sel);
        if (temp) output.push(temp.trim());
    }
    
    return output;
}

async function get_img(page, selector){
    let temp = await page.evaluate((sel) => {
        let imgs = document.querySelectorAll('main img');
        for (let i = 0; i < imgs.length; i++){
            if (imgs[i].width > 100 && imgs[i].height > 100){
                return (imgs[i].src) ? imgs[i].src : imgs[i].getAttribute('data-src');
            }
        }
    }, selector);
    return temp;
}

async function get_element(page, selector){

    let temp = await page.evaluate((sel) => {
        return document.querySelector(sel)?.textContent;
    }, selector);
    return temp;
}

function format_servings(input){
    if (input && input.includes('servings')) return parseInt(input.replace("servings", "").trim());
    else return input;
}

async function get_nyt_data(page){
    let result = await page.evaluate(() => {
        let article = document.querySelector("main > div > div");

        let title = article.querySelector("h1").textContent;
        let author = article.querySelector("h2 > a").textContent;
        let description = article.querySelector("p").textContent;
        let img = article.querySelector("img").src;
        let time = article.querySelector("dd").textContent;

        let ingr_list = article.querySelector("div:nth-child(8) > div");
        let servings = ingr_list.querySelector("div > div > span:nth-child(2)").textContent;

        let ingredient_list = ingr_list.querySelectorAll("div > ul > *");
        let ingredients_top = [];
        let ingredients_sub = [];
        for (let i = 0; i < ingredient_list.length; i++){
            if (ingredient_list[i].tagName == "UL"){
                let sub_ingrs = ingredient_list[i].querySelectorAll("li");
                for (let j = 0; j < sub_ingrs.length; j++){
                    ingredients_sub.push(sub_ingrs[j].textContent);
                }
            }else {
                ingredients_top.push(ingredient_list[i].textContent);
            }
        }
        let ingredients = (ingredients_sub.length) ? ingredients_sub : ingredients_top;
        // ingredients = ingredients_top;
        let dir_list = article.querySelectorAll("div:nth-child(9) > div > ol > *");
        let directions = [];
        let tags = [];
        for (let i = 0; i < dir_list.length; i++) directions.push(dir_list[i].querySelector("p").textContent);
        
        return {
            title: title,
            author: author,
            description: description,
            image: img,
            time: time,
            servings: servings,
            expand: {ingr_list: ingredients},
            directions: directions,
            tags: tags
        };
    });
    return result;
}
async function get_ba_data(page){
    let result = await page.evaluate(() => {
        let article = document.querySelector("#main-content > article");
        let header = article.querySelector("header");
        let img = header.querySelector("img").src ? header.querySelector("img").src : document.querySelector("img").data('src');
        let title = header.querySelector("h1").textContent;
        let author = header.querySelector("span > a").textContent;
        let body = article.querySelector(".recipe__main-content");
        let description = body.querySelector(".body").textContent;
        let ingr_list = body.querySelector("[data-testid='IngredientList']");
        let servings = ingr_list.querySelector("p").textContent;
        let ingredient_list = ingr_list.querySelectorAll("div:nth-child(3) > *");
        if (ingredient_list.length <= 2) ingredient_list = ingr_list.querySelectorAll("div:nth-child(3) > *");
        let ingredients = [];
        for (let i = 0; i < ingredient_list.length; i++){
            if (ingredient_list[i].tagName == "DIV" || ingredient_list[i].tagName == "P") {
                if (ingredients[ingredients.length - 1] && !ingredients[ingredients.length - 1].includes(" ") && !/[a-z]/i.test(ingredients[ingredients.length - 1])){
                    ingredients[ingredients.length - 1] = ingredients[ingredients.length - 1] + " " + ingredient_list[i].textContent;
                }else ingredients.push(ingredient_list[i].textContent);
            }
        }
        let dir_list = body.querySelectorAll("[data-testid='InstructionsWrapper'] > ol > *");
        let directions = [];
        let tags = [];
        for (let i = 0; i < dir_list.length; i++){
            let curr_list = dir_list[i].querySelectorAll("li > *");
            for (let j = 0; j < curr_list.length; j++){
                tags.push(ingredient_list[i].tagName+"* "+ingredient_list[i].textContent);
                if (curr_list[j].tagName == "P") directions.push(curr_list[j].textContent);
            }
        }
        
        return {
            title: title,
            author: author,
            description: description,
            image: img,
            time: null,
            servings: servings,
            expand: {ingr_list: ingredients},
            directions: directions,
            tags: tags
        };
    });
    return result;
}

async function validate_recipe_data(recipe_data, url){
    let errors = [];
    if (typeof recipe_data.title != "string" || recipe_data.title == ""){
        errors.push("title");
    }

    if (typeof recipe_data.author != "string" || recipe_data.author == ""){
        errors.push("author");
    }

    if (typeof recipe_data.description != "string" || recipe_data.description == ""){
        errors.push("description");
    }

    if (typeof recipe_data.image != "string" || recipe_data.image == ""){
        errors.push("image");
    }

    if (typeof recipe_data.time != "string" || recipe_data.time == ""){
        errors.push("time");
    }

    if (typeof recipe_data.servings != "string" || recipe_data.servings == ""){
        errors.push("servings");
    }

    if (typeof recipe_data.expand.ingr_list != "object" || recipe_data.expand.ingr_list.length == 0){
        errors.push("ingrs");
    }

    if (typeof recipe_data.directions != "object" || recipe_data.directions.length == 0){
        errors.push("directions");
    }
    if (errors){
        console.log(errors)
        const error_data = {
            "function": "missing recipe data",
            "data": errors,
            "message": "",
            "url": url
        };
        
        const error_record = await pb.collection('errors').create(error_data);
    }
}

export const scrape = async function(url) {
        
        const start = Date.now();
        const browser = await puppeteer.launch({headless: 'new', args: [ '--incognito' ]});
        const page = await browser.newPage();
        const init_time = Date.now();
        const await_data = Date.now();
        let site_selectors;
        if (url.includes("www.seriouseats.com")){
            site_selectors = selectors.serious_eats;
        }else if(url.includes("cooking.nytimes.com")){
            site_selectors = selectors.nyt;
        }else if(url.includes("www.bonappetit.com")){
            site_selectors = selectors.ba;
        }else{
            const url_match = url.match(/http(|s):\/\/(www.)?(.*?)\.(com|co\.uk|org|net)/);
            if (url_match){
                const error_data = {
                    message: url_match[3] ?? url_match[0],
                    url: url,
                    function: "url not supported"
                }
                await pb.collection('errors').create(error_data);
            }
            
            return {err: {title: "website not supported", msg: "supported websites include bon appetit, serious eats, and nytimes"}};
        }
        const selector_time = Date.now();
        try{
            await page.goto(url);
            const go_to_time = Date.now();
            
            await page.setViewport({width: 1080, height: 1024});
            const set_view_time = Date.now();

            let results = {};
            if (url.includes("www.bonappetit.com")){
                results = await get_ba_data(page);
                console.log({results});
            }else if (url.includes("cooking.nytimes.com")) {
                results = await get_nyt_data(page);

            } else {
                for (const k in site_selectors){
                        if(k == "ingredients"){
                            results.expand = {ingr_list: []};
                            results.expand.ingr_list = await get_ingredients(page, site_selectors[k]);
                        }else if(k == "directions"){
                            results[k] = await get_directions(page, site_selectors[k]);
                        }else {
                            results[k] = await get_element(page, site_selectors[k]);
                        }
                    
                };
            }

            results.image = await get_img(page, "none");

            results.description = (results.description) ? results.description.split(".")[0] : results.description;
            results.servings = format_servings(results.servings);
            let close = await browser.close();
            const end = Date.now();
            results.timing = {
                execution_time: `${(end-start)/1000}s`,
                logic_time: `${(end-set_view_time)/1000}s`,
                init_time: `${(init_time-start)/1000}s`,
                await_data_time: `${(await_data-init_time)/1000}s`,
                selector_time: `${(selector_time-await_data)/1000}s`,
                got_to_time: `${(go_to_time-selector_time)/1000}s`,
                set_view_time: `${(set_view_time-go_to_time)/1000}s`,
                compare_time: `${((set_view_time-go_to_time)+(end-set_view_time)+(go_to_time-selector_time)+(selector_time-await_data)+(await_data-init_time)+(init_time-start))/1000}s`
            };
            await validate_recipe_data(results, url);
            return results;
        }catch (e){
            await browser.close();
            let data = {
                message: e.message,
                url: url,
                function: "prep scrape"
            };
            const result = await pb.collection('errors').create(data);
            return {err: {title: "an error has occurred", msg: "This has been reported,  sorry for the inconvenince, try again or copy/paste each field manually"}};
        }
};