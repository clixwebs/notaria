export async function api<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path.startsWith('/api/') ? path : '/api/platform/'+path, { cache:'no-store', ...options, headers: options.body instanceof FormData ? options.headers : { 'Content-Type':'application/json',...options.headers } });
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error(data.message||'No se pudo completar la solicitud.'),{status:response.status});
  return data as T;
}
export const authPost = <T = Record<string, unknown>>(path:string,body:unknown={}) => api<T>('/api/auth/'+path,{method:'POST',body:JSON.stringify(body)});
