import { currentUser, pb } from '/src/lib/pocketbase.js';


/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
    const filter = params.user_name 
            ? `user.username='${params.user_name}' && today=true`
            : `user="${locals.user.id}" && today=True`;
    const result_list = await pb.collection('menus').getList(1, 1, {
            filter,
            expand: `recipes,recipes.notes,recipes.ingr_list, grocery_list, grocery_list.items, grocery_list.items.ingrs, grocery_list.items.ingrs.recipe${params.user_name ? ', user' : ''}`
        });
    return {
        post: {
            menu: result_list.items[0],
        }
    };
}