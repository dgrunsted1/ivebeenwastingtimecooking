import { currentUser, pb } from '/src/lib/pocketbase';


/** @type {import('./$types').PageLoad} */
export async function load() {

    let photos = await pb.collection('photos').getList(1, 200, {
        filter: `album != 'recipes'`,
        fields: 'album,id,file'
    }); 
    let output = [];
    for (let photo of photos.items){
        output.push(`https://db.ivebeenwastingtime.com/api/files/photos/${photo.id}/${photo.file}?thumb=400x0`);
    }
    if (output){
        return {photos: shuffle(output)};
    }else {
        return {error: "no photos found"};
    }
  }


  function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }