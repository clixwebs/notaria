import {execFileSync} from 'node:child_process';
import {resolve,relative,isAbsolute,basename} from 'node:path';
export function closedPhase6QA(input:string){
 const source=resolve(input),rel=relative(process.cwd(),source);if(!/^\.notaria-phase6-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||rel.startsWith('..')||isAbsolute(rel))throw new Error('Solo bases QA de fase 6 dentro del proyecto.');
 if(process.platform!=='win32')throw new Error('Este verificador exige inspección de Windows.');
 const result=execFileSync('powershell.exe',['-NoProfile','-Command',"$ErrorActionPreference='Stop'; $p=@(Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -match 'next.*--port 3101' }); if($p.Count -gt 0){Write-Output 'QA_RUNNING'}else{Write-Output 'QA_CLOSED'}"],{encoding:'utf8'}).trim();
 if(result!=='QA_CLOSED')throw new Error('No se acredita QA cerrada. Detén el propietario Windows de 3101 antes de abrir PGlite.');return source;
}
