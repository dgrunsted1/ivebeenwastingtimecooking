<script>
    import Alerts from "../../lib/components/alerts.svelte";
    import { currentUser, pb } from '/src/lib/pocketbase.js';
    import NoteCard from "../../lib/components/note_card.svelte";

    let alert = $state({show: false, msg: "", title: "", type: "warning"});
    let username = $state("");
    let password = $state("");
    let name = $state("");
    let email = $state("");
    let is_user = $state(false);

    async function login(username_in) {
      window.location = document.referrer;
    }

    const handle_click = async function(){

        const data = {
            "username": username,
            "password": password,
            "passwordConfirm": password,
            "name":name,
            "email": email,
            "emailVisibility": true,
            "paid": false,
            "active": true
        };
        try {
            const createdUser = await pb.collection('users').create(data);
            const verify_result = await pb.collection('users').requestVerification(createdUser.email);
            const user = await pb.collection('users').authWithPassword(createdUser.username, password);
            is_user = true;
        } catch (err) {
            for (let key in err.data.data) {
                const element = err.data.data[key];
                if (key == "email"){
                    document.getElementById('email').classList.add("bg-error");
                    show_alert(element.message, "error", "invalid email")
                } else if (key == "password"){
                    document.getElementById('password').classList.add("bg-error");
                    show_alert(element.message, "error", "invalid password")
                } else if (key == "username") {
                    document.getElementById('username').classList.add("bg-error");
                    show_alert(element.message, "error", "invalid username")
                }
            }
        }
    }

    const show_alert = function(msg, type, title){
        alert.show = true;
        alert.msg = msg;
        alert.type = type;
        alert.title = title;
    }

    const reset_error = function(e){
        e.currentTarget.classList.remove("bg-error")
    }
</script>
<svelte:head>
    <meta property="og:title" content="Signup" />
    <meta property="og:description" content="Signup" />
    <meta property="og:image" content="static/ChefBookIconV2.png" />
    <meta property="og:url" content="https://www.ivebeenwastingtimecooking.com/signup" />
    <meta property="og:type" content="website" />
</svelte:head>
    <div class="w-full flex flex-col h-full">
        <div style="background-image: url('https://db.ivebeenwastingtime.com/api/files/photos/px7wc33f6m57f53/0071_8XzznOIN4G.jpg?thumb=400x0')" class="flex flex-col relative w-full h-screen m-auto bg-cover bg-no-repeat bg-center">
            <div id="web_title" class="m-auto cursor-default md:text-5xl m-auto flex flex-col">
                {#if !is_user}
                    <form class="m-auto flex flex-col">
                        <input
                        placeholder="Username"
                        type="text"
                        id="username"
                        class="input input-bordered m-1.5"
                        oninput={reset_error}
                        bind:value={username} 
                        />
                    
                        <input 
                        placeholder="Password" 
                        type="password" 
                        id="password"
                        class="input input-bordered m-1.5"
                        oninput={reset_error}
                        bind:value={password} 
                        />
                
                        <input 
                        class="signup m-1.5 input input-bordered"
                        oninput={reset_error}
                        placeholder="email" 
                        type="text" 
                        id="email"
                        bind:value={email} 
                        />
                
                        <input 
                        class="signup m-1.5 input input-bordered"
                        oninput={reset_error}
                        placeholder="name" 
                        type="text" 
                        id="name"
                        bind:value={name} 
                        />
                
                        <button class="btn btn-primary border-black m-2.5 w-fit my-1 mx-auto" onclick={handle_click}>Sign Up</button>
                    </form>
                {:else}
                    <NoteCard msg={`Verification email sent`} action={() => window.location.href = `/recipes`} btn_name={"recipe feed"} />
                {/if}
            </div>
        </div>
        <Alerts msg={alert.msg} type={alert.type} bind:show={alert.show} title={alert.title}/>
    </div>
