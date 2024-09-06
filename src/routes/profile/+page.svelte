<script>
    import { onMount } from 'svelte';
    import { pb, currentUser } from '/src/lib/pocketbase.js';

    let recipes = [];
    let menus = [];

    onMount(async () => {
        await pb.collection('users').authRefresh();
        if (!$currentUser){
            window.location.href = "/login";
            return;
        }
        console.log($currentUser);
    });

    function get_local_time(utc_code){
        const event = new Date(utc_code);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };

        return event.toLocaleDateString(undefined, options);
    }
</script>
<div class="flex flex-col items-center space-y-6">
    <h1>Profile</h1>
    <div class="flex space-x-4">
        {#if !$currentUser}
            <div class="flex"><span class="loading loading-bars loading-lg"></span></div>
        {:else}
            {#if $currentUser.avatar != ""}
                <img src={$currentUser.avatar} alt="avatar" class="profile-avatar" />
            {:else}
                <img src="https://db.ivebeenwastingtime.com/api/files/716b9n2y44y92zp/w27w7eusm0jjeb4/unknown_3_sc7jpHPrHp.png?token=" alt="avatar" class="profile-avatar border rounded-xl" />
            {/if}
            <div class="flex flex-col space-y-2 my-5">
                <div class="text">name: {$currentUser.name}</div>
                <div class="text">email: {$currentUser.email}</div>
                <div class="text">username: {$currentUser.username}</div>
                <div class="text">user since: {get_local_time($currentUser.created)}</div>
                <div></div>
            </div>
        {/if}
    </div>
    
</div>
