import {cookies} from 'next/headers';
export async function getAdminSession(){const c=(await cookies()).get('admin_session')?.value; if(!c)return null; try{return JSON.parse(Buffer.from(c,'base64').toString())}catch{return null}}
