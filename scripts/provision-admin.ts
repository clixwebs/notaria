import {platform,query,audit} from '../src/server/platform.ts';
import {credentials} from '../src/server/validation.ts';
if(!process.env.DATABASE_URL||process.env.VERCEL)throw new Error('Run initial provisioning from an authorized release terminal.');
const input=credentials.parse({name:process.env.NOTARIA_INITIAL_ADMIN_NAME,email:process.env.NOTARIA_INITIAL_ADMIN_EMAIL,password:process.env.NOTARIA_INITIAL_ADMIN_PASSWORD});
const {db,auth}=await platform();
try{
 if((await query(db,'SELECT user_id FROM staff LIMIT 1')).length)throw new Error('Installation already provisioned; refusing to replace accounts.');
 const claim=await query(db,'INSERT INTO setup_claim(id) VALUES(1) ON CONFLICT DO NOTHING RETURNING id');if(!claim.length)throw new Error('Installation already claimed.');
 try{const created=await auth.api.signUpEmail({body:input});await db.transaction().execute(async tx=>{await query(tx,'INSERT INTO staff(user_id,role) VALUES($1,$2)',[created.user.id,'administracion']);await audit(tx,created.user.id,'installation.complete','notary');});console.log('Initial administrator provisioned; TOTP enrollment required.');}
 catch(e){await query(db,'DELETE FROM setup_claim WHERE id=1');throw e;}
}finally{await db.destroy();}
