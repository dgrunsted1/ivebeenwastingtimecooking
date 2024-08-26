import { scrape } from '/src/lib/scraper.js';

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request }) => {
        let data = await request.formData();
        let url = await data.get('url');
        let results = await scrape(url);
        return results;
    }
};