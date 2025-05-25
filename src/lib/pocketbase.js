import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
export const pb_url = "https://db.ivebeenwastingtime.com";
// export const pb_url = "http://127.0.0.1:8090";


export const pb = new PocketBase(pb_url);

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

export const post = async function(data_in, url_str) {
    try {
        const data = JSON.stringify(data_in);
        const response = await fetch(`${pb_url}/${url_str}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        });
        return true;
    } catch (error) {
        console.log(error);
    }
}