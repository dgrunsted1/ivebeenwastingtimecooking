import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
// export const pb_url = "https://db.ivebeenwastingtime.com";
export const pb_url = "http://127.0.0.1:8090";


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
        pb.authStore.clear();
        window.location.href = "/login";
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

export const sendImageToBackend = async function(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const base64String = e.target.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            let imageType = file.type.includes("jpeg") ? "jpeg" : file.type.includes("png") ? "png" : "unknown";
            try {
                const response = await fetch(`${pb_url}/api/data_from_pdf`, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    image: base64String,
                    imageType: imageType,
                    }),
                });
                
                const result = await response.json();
                console.log('Recipe analysis:', result.data);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        
        reader.readAsDataURL(file);
    }