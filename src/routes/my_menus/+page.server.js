import { pb } from '/src/lib/pocketbase.js';


/** @type {import('./$types').PageLoad} */
export async function load({ locals }) {
    const result_list = await pb.collection('menus').getList(1, 250, {
            filter: `user="${locals.user.id}" && recipes:length > 0`,
            expand: `recipes,recipes.ingr_list`,
            sort: `-created`
        });
    return {
        post: {
            menus: result_list.items,
        }
    };
}