import { pb, post } from '/src/lib/pocketbase';




export const update_fav_made = async function (id, col, val){
    let data;
    if (col == "favorite"){
        data = {
            favorite: val
        };
    } else{
        data = {
            made: val
        };
    }
    const record = await pb.collection('recipes').update(id, data, {
        expand: 'notes,ingr_list'
    });
    return record;
}

export const update_fave = async function (id_list){
    for (let i = 0; i < id_list.length; i++){
        const data = {
            "favorite": id_list[i].favorite
        };
        const record = await pb.collection('recipes').update(id_list[i].id, data);
    }
    
}

export const update_notes = async function(notes_in, new_note_in, recipe_id){
    let new_note_result = null;
    if (new_note_in){
        new_note_result = await pb.collection('notes').create({ "content": new_note_in });
        const data = { "notes+": new_note_result.id };
        const recipe_result = await pb.collection('recipes').update(recipe_id, data);
    }
    if (notes_in) {
        for (let i = 0; i < notes_in.length; i++){
            if (!notes_in[i].content){
                await pb.collection('notes').delete(notes_in[i].id);
                notes_in.splice(i, 1);
            } else {
                const result = pb.collection("notes").update(notes_in[i].id, { "content": notes_in[i].content });
                if (!result){
                    new_note_result = null;
                }
            }
        }
    }
    if (new_note_result){
        if (notes_in){
            notes_in.unshift(new_note_result);
        } else {
            notes_in = [new_note_result];
        }
        return notes_in;
    } else {
        return [new_note_result];
    }
}

export const delete_ingr = async function(ingr_id){
    const result = await pb.collection('ingredients').delete(ingr_id);
    return result;
}

export const update_image_upload = async (e) => {
    const fileList = e.currentTarget.files;
    let too_big = [];
    let success_cnt = 0;
    for (let file of fileList) {
        if (file.size > 5242880){
            too_big.push(file.name);
        }else {
            if (document.getElementById("status")) document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">uploading ${file.name}</p>`;
            let result = await uploadImage(file);
            if (result.id){
                success_cnt++;
                return `https://db.ivebeenwastingtime.com/api/files/${result.collectionId}/${result.id}/${result.file}`;
            }
        }
    }
    if (document.getElementById("status")) document.getElementById("status").innerHTML = `<p class="m-auto w-4/5 text-center">uploaded ${success_cnt}/${fileList.length} successfully</p>`;
    let first = true;
    for (let curr of too_big){
        if (first){
            if (document.getElementById("status")) document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">These files were too big:</p>`;
            first = false;
        }
        if (document.getElementById("status")) document.getElementById("status").innerHTML += `<p class="m-auto w-4/5 text-center">${curr}</p>`;
    }
}

async function uploadImage(file) {
    let formData = new FormData();
    formData.append('file', file);
    formData.append("album", "recipes");
    const record = await pb.collection('photos').create(formData);
    return record;
}

export const update_recipe_image = async function(image, recipe_id){
    if (image){
        const data = { "image": image };
        const recipe_result = await pb.collection('recipes').update(recipe_id, data);
        return recipe_result;
    } else {
        return null;
    }
}

export const save_recipe_new = async function(e, recipe, user_id, new_note){
    e.srcElement.disabled = true;
    const data = {
        ...recipe,
        user_id: user_id,
        note: new_note
    };
    const result = await post(data, `api/save_recipe`);
    return result;
}

export const update_ingr = function(id, data){
    
    pb.collection('ingredients').update(id, data);
}

export const create_ingr = async function(data, recipe_id){
    const ingr = await pb.collection('ingredients').create(data);
    const recipe_update = await pb.collection('recipes').update(recipe_id, {"ingr_list+": ingr.id});
    return ingr;
}

export const update_recipe_data = function(id, data){
    pb.collection('recipes').update(id, data);
}