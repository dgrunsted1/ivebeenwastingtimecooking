<script>
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { page } from '$app/stores';

    let username;
    let password;
    let name;
    let email;

    async function login() {
      const user = await pb.collection('users').authWithPassword(username, password);
      window.location = document.referrer;
    }
  
    async function signUp() {
        if (!name && !email){
            let elements = document.getElementsByClassName('signup');
            for (let curr in elements){
                elements[curr].style.display = 'block';
            }
            return;
        }
        const data = {
            "username": username,
            "password": password,
            "passwordConfirm": password,
            "name":name,
            "email": email,
            "verified": false
        };  
      try {
        const createdUser = await pb.collection('users').create(data);
        await login();
      } catch (err) {
        for (let key in err.data.data) {
            const element = err.data.data[key];
            let ans = window.prompt(`Re-enter ${key}: ${element.message}`, data[key]);
            data[key] = ans;
        }
        data.passwordConfirm = data.password;
        try {
            const createdUser = await pb.collection('users').create(data);
            await login();
        } catch (err) {
            console.error("sign up", err);
        }
      }
    }
  
    function signOut() {
      pb.authStore.clear();
    }
  </script>
  
  {#if $currentUser}
    <div class="m-auto mt-32 flex flex-col">
      <p class="m-auto">Signed in as {$currentUser.username}</p> 
      <button on:click={signOut}>Sign Out</button>
    </div>
  {:else}
    <form on:submit|preventDefault class="m-auto mt-32 flex flex-col w-72">
      <input
        placeholder="Username"
        type="text"
        class="input input-bordered m-1.5"
        bind:value={username} 
        />
  
      <input 
        placeholder="Password" 
        type="password" 
        class="input input-bordered m-1.5"
        bind:value={password} 
      />

      <input 
        class="signup hidden m-1.5 input input-bordered"
        placeholder="email" 
        type="text" 
        bind:value={email} 
      />

      <input 
        class="signup hidden m-1.5 input input-bordered"
        placeholder="name" 
        type="text" 
        bind:value={name} 
      />

      <button class="btn btn-primary m-2.5 w-fit my-1 mx-auto" on:click={login}>Login</button>
      <button class="btn btn-accent m-2.5 w-fit my-1 mx-auto" on:click={signUp}>Sign Up</button>
    </form>
  {/if}