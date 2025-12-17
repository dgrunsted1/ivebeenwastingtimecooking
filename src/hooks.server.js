// src/hooks.server.js
import PocketBase from 'pocketbase';
import { pb_url } from '/src/lib/pocketbase';

export async function handle({ event, resolve }) {
  event.locals.pb = new PocketBase(pb_url);
  
  event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');
  
  try {
    if (event.locals.pb.authStore.isValid) {
      await event.locals.pb.collection('users').authRefresh();
    }
  } catch (_) {
    event.locals.pb.authStore.clear();
  }
  
  event.locals.user = event.locals.pb.authStore.model;
  
  const response = await resolve(event);
  
  response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie());
  
  return response;
}