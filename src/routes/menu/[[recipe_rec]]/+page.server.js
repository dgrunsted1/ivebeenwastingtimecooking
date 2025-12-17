import { pb } from '/src/lib/pocketbase.js';


/** @type {import('./$types').PageLoad} */
export async function load({ locals }) {
    const result_list = await pb.collection('recipes').getList(1, 250, {
            filter: `user="${locals.user.id}"`,
            expand: `notes, ingr_list`,
            sort: `-created`
        });
    return {
        post: {
            recipes: result_list.items,
        }
    };
}