<script>
  import { createBubbler, preventDefault } from 'svelte/legacy';
  import Alerts from "../../lib/components/alerts.svelte";

  const bubble = createBubbler();
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import { onMount } from 'svelte';

    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let username = $state();
    let password = $state();

    onMount(async () => {
      if ($currentUser) await pb.collection('users').authRefresh();
    })
    
    async function login() {
      const user = await pb.collection('users').authWithPassword(username, password);
      window.location = document.referrer;
    }
  
    function signOut() {
      pb.authStore.clear();
    }
  </script>
  <svelte:head>
    <meta property="og:title" content="Login" />
    <meta property="og:description" content="Login" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/login" />
    <meta property="og:type" content="website" />
  </svelte:head>
  <div class="w-full flex flex-col h-full">
    <div style="background-image: url('https://db.ivebeenwastingtime.com/api/files/photos/s7f3suof21cxupr/0059_99ZbLSLOOM.jpg?thumb=400x0')" class="flex flex-col relative w-full h-screen m-auto bg-cover bg-no-repeat bg-center">
        <div id="web_title" class="m-auto cursor-default md:text-5xl">
          {#if $currentUser}
            <div class="m-auto flex flex-col items-center space-y-10 md:space-y-20 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8 border border-gray-500">
              <p class="m-auto">Signed in as {$currentUser.username}</p> 
              <button class="btn" onclick={signOut}>Sign Out</button>
            </div>
          {:else}
            <form onsubmit={preventDefault(bubble('submit'))} class="m-auto flex flex-col">
              <input
                placeholder="Username or Email"
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
              <div class="flex">
                <button class="btn btn-primary border-gray-500 m-2.5 w-fit my-1 mx-auto" onclick={login}>Login</button>
                <a class="btn btn-success border-gray-500 m-2.5 w-fit my-1 mx-auto" href="/signup">Sign Up</a>
              </div>
            </form>
          {/if}
        </div>
      </div>
      <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
    </div>