<script>
  import { currentUser, pb, auth_refresh } from '/src/lib/pocketbase.js';
  import Alerts from "../../lib/components/alerts.svelte";
  import NoteCard from "../../lib/components/note_card.svelte";

    import { onMount } from 'svelte';

    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let username = $state();
    let password = $state();

    onMount(async () => {
      if ($currentUser){
        const result = await auth_refresh;
        if (result.error){
          show_error(e.message);
        }
      }
    })
    
    async function login() {
      try {
        const user = await pb.collection('users').authWithPassword(username, password);
        window.location = document.referrer;
      } catch (e) {
        show_error(e.message);
      }
    }
  
    function signOut() {
      pb.authStore.clear();
    }

    function show_error(title){
      alert.title = title;
      alert.type = "error";
      alert.show = true;
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
            <NoteCard msg={`Signed in as ${$currentUser.username}`} action={signOut} btn_name={"Sign Out"} />
            
          {:else}
            <form class="m-auto flex flex-col">
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