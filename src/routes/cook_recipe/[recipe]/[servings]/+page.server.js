import { currentUser, pb } from '/src/lib/pocketbase.js';


/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
    let user_logged_in = false;
    let todays_menu = null;
    const result_list = await pb.collection('recipes').getFirstListItem(`url_id="${params.recipe}"`, {
        expand: 'notes,ingr_list'
    });
    if (locals.user && locals.user.id == result_list.user) {
        user_logged_in = true;
        const result_menu = await pb.collection('menus').getList(1, 1, {
            filter: `user="${locals.user.id}" && today=True`,
        });
        todays_menu = result_menu.items[0];
    }
    return {
        post: {
            recipe: result_list,
            servings: params.servings,
            user_logged_in: user_logged_in,
            todays_menu: todays_menu
        }
    };
}