import { pb } from '/src/lib/pocketbase.js';

export async function load({ locals }) {
  
  if (locals.user) {
    const flags_result = await pb.collection('flags').getList(1, 50, {
        filter: `user = "${locals.user.id}"`
    });
    
    return {
      user: locals.user,
      flags: flags_result.items[0]
    };
  }
  
  return {
    user: locals.user
  };
}