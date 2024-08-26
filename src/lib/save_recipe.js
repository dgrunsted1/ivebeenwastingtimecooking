import { pb } from '/src/lib/pocketbase';
import { process_recipe_old } from '/src/lib/process_recipe.js'
 
export async function save_recipe(e, recipe, user, new_note) {
    e.srcElement.disabled = true;
    e.srcElement.innerHTML = "validating";

    let validate_err = validate(recipe);
    if (validate_err){
        let ans = alert(`${validate_err}`);
        e.srcElement.disabled = false;
        e.srcElement.innerHTML = "save recipe";
        return;
    }
    e.srcElement.innerHTML = "uploading ingredients";

    let ingr_ids = await get_ingr_ids(recipe);
    e.srcElement.innerHTML = "uploading notes";
    let note_ids = [];
    note_ids = await get_note_ids(recipe);
    note_ids = await add_new_note(note_ids, new_note);
    e.srcElement.innerHTML = "uploading recipe";
    let data = {
        "title": recipe.title,
        "description": recipe.description,
        "author": recipe.author,
        "time": recipe.time,
        "time_new": get_mins(recipe.time),
        "directions": JSON.stringify(recipe.directions),
        "servings": recipe.servings,
        "image": recipe.image,
        "category": recipe.category,
        "cuisine": recipe.cuisine,
        "country": recipe.country,
        "ingr_list": ingr_ids,
        "ingr_num": ingr_ids.length,
        "url_id": await get_url_id(recipe),
        "made": recipe.made,
        "favorite": recipe.favorite
    };
    if (note_ids.length) data.notes = note_ids;
    if (recipe.id){
        recipe = await pb.collection('recipes').update(recipe.id, data, {expand: "notes,ingr_list"});
    }else {
        data.user = user.id;
        data.url = recipe.url;
        recipe = await pb.collection('recipes').create(data, {expand: "notes,ingr_list"});
        e.srcElement.innerHTML = "updating ingredients";
        for (let curr_ingr_id of ingr_ids){
            let update_ingr = await pb.collection('ingredients').update(curr_ingr_id, {"recipe+": recipe.id});
        }
    }
    
    
    e.srcElement.innerHTML = "saved";
    return recipe;
}

function get_mins(time_in){
    let mins = 0;
    let min_result = time_in.match(/(\d+) [mins|minutes]/);
    if (min_result){
        mins += parseInt(min_result[1]);
    }

    let hr_result = time_in.match(/(\d+) [hrs|hours|hour|hr]/);
    if (hr_result){
        mins += parseInt(hr_result[1]) * 60;
    }
    return mins;
}

async function get_ingr_ids(recipe){
    let ingr_ids = [];
    for (let i = 0; i < recipe.expand.ingr_list.length; i++){
        if (!recipe.expand.ingr_list[i].removed){
            if (recipe.expand.ingr_list[i].id){
                const db_ingr = await pb.collection('ingredients').getOne(recipe.expand.ingr_list[i].id);
                if (db_ingr.quantity != recipe.expand.ingr_list[i].quantity || 
                db_ingr.ingredient != recipe.expand.ingr_list[i].ingredient || 
                db_ingr.unit != recipe.expand.ingr_list[i].unit){

                    if (recipe.expand.ingr_list[i].recipe && recipe.expand.ingr_list[i].recipe.length > 1){
                        const remove_from_ingr = await pb.collection('ingredients').update(recipe.expand.ingr_list[i].id, {"recipe-": [recipe.expand.ingr_list[i].id]});
                        const new_ingr_data = {
                            "quantity": recipe.expand.ingr_list[i].quantity,
                            "ingredient": recipe.expand.ingr_list[i].ingredient,
                            "unit": recipe.expand.ingr_list[i].unit,
                            "unitPlural": recipe.expand.ingr_list[i].unitPlural,
                            "symbol": recipe.expand.ingr_list[i].symbol,
                            "recipe": [
                                recipe.id
                            ]
                        };
                        const new_ingr = await pb.collection('ingredients').create(new_ingr_data);
                        ingr_ids.push(new_ingr.id);
                    } else {
                        const update_ingr_data = {
                            "quantity": recipe.expand.ingr_list[i].quantity,
                            "ingredient": recipe.expand.ingr_list[i].ingredient,
                            "unit": recipe.expand.ingr_list[i].unit,
                            "unitPlural": recipe.expand.ingr_list[i].unitPlural,
                            "symbol": recipe.expand.ingr_list[i].symbol,
                            "recipe": [
                                recipe.id
                            ]
                        };
                        const update_ingr = await pb.collection('ingredients').update(recipe.expand.ingr_list[i].id, update_ingr_data);
                        ingr_ids.push(recipe.expand.ingr_list[i].id);
                    }
                } else {
                    ingr_ids.push(recipe.expand.ingr_list[i].id);
                }
            } else {
                const similar_ingr = await pb.collection('ingredients').getList(1, 1, { filter: `quantity='${recipe.expand.ingr_list[i].quantity}' && unit='${recipe.expand.ingr_list[i].unit}' && ingredient='${recipe.expand.ingr_list[i].ingredient}'` });
                if (similar_ingr.items.length){
                    const add_to_ingr = await pb.collection('ingredients').update(similar_ingr.items[0].id, {"recipe+": [recipe.id]});
                    ingr_ids.push(similar_ingr.items[0].id);
                }else {
                    const new_ingr_data = {
                        "quantity": recipe.expand.ingr_list[i].quantity,
                        "ingredient": recipe.expand.ingr_list[i].ingredient,
                        "unit": recipe.expand.ingr_list[i].unit,
                        "unitPlural": recipe.expand.ingr_list[i].unitPlural,
                        "symbol": recipe.expand.ingr_list[i].symbol,
                        "recipe": [
                            recipe.id
                        ]
                    };
                    const new_ingr = await pb.collection('ingredients').create(new_ingr_data);
                    ingr_ids.push(new_ingr.id);
                }
            }
        } else if (recipe.expand.ingr_list[i].id) {
            if (recipe.expand.ingr_list[i].recipe && recipe.expand.ingr_list[i].recipe.length > 1){
                const remove_from_ingr = await pb.collection('ingredients').update(recipe.expand.ingr_list[i].id, {"recipe-": [recipe.id]});
            } else {
                await pb.collection('ingredients').delete(recipe.expand.ingr_list[i].id);
            }
        }
    }
    return ingr_ids;    
}

async function get_note_ids(recipe){
    let note_ids = [];
    if (recipe.expand && recipe.expand.notes){
        for (let note of recipe.expand.notes){
            if (note.id){
                const note_record = await pb.collection('notes').update(note.id, { "content": note.content });
                note_ids.push(note_record.id);
            }
        }
    }

    return note_ids;
}

function validate(recipe){
    let err = "";
    if (recipe.category == "Category") err += "Please pick a category.";
    return err;
}

async function add_new_note(note_ids, note_text){
    if (note_text){
        const new_note_record = await pb.collection('notes').create({ content: note_text });
        note_ids.push(new_note_record.id);
    }
    return note_ids;
}

const get_url_id = async function (recipe){
    let url_id = recipe.title.trim();
    url_id = url_id.replaceAll(" ", "_");
    let new_url_id = "";
    try {
        new_url_id = url_id;
        let same_url_id = await pb.collection('recipes').getFirstListItem(`url_id="${new_url_id}"`);
        let cnt = 1;
        while (true){
            new_url_id = url_id+`_${cnt}`;
            same_url_id = await pb.collection('recipes').getFirstListItem(`url_id="${new_url_id}"`);
            cnt++;
        }
    } catch (e){
        return new_url_id;
    }
}

export const update_fave_made = async function (id_list){
    for (let i = 0; i < id_list.length; i++){
        const data = {
            "made": id_list[i].made,
            "favorite": id_list[i].favorite
        };
        const record = await pb.collection('recipes').update(id_list[i].id, data);
    }
    
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