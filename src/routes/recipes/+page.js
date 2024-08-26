// import { currentUser, pb } from '/src/lib/pocketbase.js';


// /** @type {import('./$types').PageLoad} */
// export async function load({ params }) {
//     const result_list = await pb.collection('recipes').(`url_id="${params.recipe}"`, {
//         expand: 'notes,ingr_list'
//     });
//     return {
//         post: {
//             recipe: result_list,
//             servings: params.servings
//         }
//     };
// }