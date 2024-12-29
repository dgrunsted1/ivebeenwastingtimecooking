import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
export const pb = new PocketBase('https://db.ivebeenwastingtime.com'); 

export const currentUser = writable(pb.authStore.model);

pb.authStore.onChange((auth) => {
    currentUser.set(pb.authStore.model);
});

export const signOut = function() {
    pb.authStore.clear();
    window.location.href = "/";
}

export const auth_refresh = async function() {
    try {
        const result = await pb.collection('users').authRefresh();
        return {error: false, msg: "logged in"};
    }catch(err){
        await pb.collection('errors').create({
            message: err.message,
            function: "auth_refresh",
            url: window.location.href
        });
        return {error: true, msg: err.message};
    }
}