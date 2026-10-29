import { Workspace } from '@/components/workspace';
import { PlatformContext } from '@/components/platform-context';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { actor, HttpError } from '@/server/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{path?:string[]}>}) {
  const {path=[]}=await params;
  if(path.length && !['acceso','login'].includes(path[0])){
    try{
      const user=await actor(await headers(),undefined,{enrollment:true});
      if(!user.mfa && path[0]!=='seguridad')redirect('/seguridad');
    }catch(error){if(error instanceof HttpError)redirect('/acceso');throw error;}
  }
  return <PlatformContext><Workspace /></PlatformContext>;
}
