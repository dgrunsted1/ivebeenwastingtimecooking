

<script>
  import { onMount } from 'svelte';
import { currentUser, pb } from '/src/lib/pocketbase';
export let data;



let albums = data.albums;
let curr_album = "";
let new_album = "";

onMount(() => {
    if (!$currentUser) window.location.href = "/login";
});

const update_album = (selected_album) => {
    if (selected_album == "new"){
        curr_album = "";
        let text_box =  document.getElementById("album");
        text_box.style.display = 'flex'; 
        text_box.focus();       //open text box to enter new album
    }else {
        if (new_album) {
            curr_album = new_album;
            new_album = "";
        }
        else curr_album = selected_album;

        document.getElementById("album").style.display = 'none';
    }
    document.getElementById("dropdown").checked = false;
}

const update_image_upload = async () => {
    const fileList = event.target.files;
    let too_big = [];
    let success_cnt = 0;
    for (let file of fileList) {
        if (file.size > 5242880){
            too_big.push(file.name);
        }else {
            document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">uploading ${file.name}</p>`;
            let result = await uploadImage(file);
            if (result.id) success_cnt++;
        }
    }
    document.getElementById("status").innerHTML = `<p class="m-auto w-4/5 text-center">uploaded ${success_cnt}/${fileList.length} successfully</p>`;
    let first = true;
    for (let curr of too_big){
        if (first){
            document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">These files were too big:</p>`;
            first = false;
        }
        document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">${curr}</p>`;
    }
}

async function uploadImage(file) {
    let formData = new FormData();
    formData.append('file', file);
    formData.append("album", curr_album);
    const record = await pb.collection('photos').create(formData);
    return record;
}

</script>


<div id="main" class="max-w-[600px] mx-auto mt-5">
    <form class="flex flex-col m-auto">
        <div class="sec-center relative max-w-full text-center my-5">
            <select class="select w-full max-w-xs select-primary">
                <option disabled selected>Select Album</option>
                {#each albums as album}
                    <option>{album}</option>
                {/each}
                <option>New Album</option>
              </select>
        </div>
        <div class="w-full flex" id="new_album_input"><input type="text" name="album" id="album" class="input input-bordered w-full max-w-xs hidden m-auto my-5" on:change={update_album} bind:value={new_album}></div>
        <div class="w-full flex flex-col"><input type="file" name="photo" id="photo" class="absolute max-w-[605px] w-23/25 h-[225px] opacity-0" on:change={update_image_upload} multiple><p class="h-52 text-center text-xl border-dashed border-2 border-primary">Drag your files here or click to browse</p></div>
        <div class="w-full flex my-3" id="submit"><button id="submit" type="submit" class="btn btn-primary m-auto" multiple>upload</button></div>    
    </form>
    <div id="status">
    </div>
</div>