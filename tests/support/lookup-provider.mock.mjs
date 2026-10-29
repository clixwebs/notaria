// Injected only by the isolated QA server command; never imported by the app.
if(process.env.NOTARIA_LOOKUP_QA!=='1'||process.env.NOTARIA_URL!=='http://127.0.0.1:3101'||!process.env.NOTARIA_DATA_DIR?.includes('lookup-qa'))throw new Error('Provider fixture requires isolated local lookup QA.');
const original=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 if(url!=='https://api.apiperu.dev/dni')return original(input,init);
 const {dni}=JSON.parse(init.body);
 if(dni==='00000004')return Response.json({success:false,code:'document_not_found'},{status:404});
 if(dni==='00000002')await new Promise(resolve=>setTimeout(resolve,1500));
 return Response.json({success:true,data:{numero:dni,nombres:dni==='00000003'?'NUEVA':'PERSONA',apellido_paterno:'FICTICIA',apellido_materno:'QA'}});
};
