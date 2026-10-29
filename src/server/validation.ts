import { z } from 'zod';
export const credentials = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(200), password: z.string().min(12).max(128) }).strict();
export const personInput = z.object({ name: z.string().trim().min(2).max(150), documentType: z.enum(['DNI','CE','PASAPORTE','DEMO']), documentNumber: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9-]+$/), revision: z.number().int().positive().optional() }).strict().superRefine((v,ctx) => { if (v.documentType==='DNI' && !/^\d{8}$/.test(v.documentNumber)) ctx.addIssue({ code:'custom', message:'El DNI debe tener ocho dígitos.',path:['documentNumber'] }); });
export const rolesInput = z.enum(['administracion','recepcion','abogado','notario','caja']);
export function validateFile(bytes: Uint8Array, filename: string) {
  if (!bytes.length || bytes.length>5*1024*1024) throw new Error('Selecciona un archivo de hasta 5 MB.');
  if (/\.pdf$/i.test(filename) && Buffer.from(bytes.subarray(0,5)).toString()==='%PDF-') return 'application/pdf';
  if (/\.txt$/i.test(filename)) {
    const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error('El archivo no es texto permitido.');
    return 'text/plain';
  }
  throw new Error('Solo se admiten PDF con cabecera válida y archivos TXT UTF-8.');
}
