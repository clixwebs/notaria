import {identityAdapter} from './identity-adapter.ts';
import {identityResults} from '../lib/procedure-domain.ts';
import {signatureOutcomes} from '../lib/integration-domain.ts';
// No remote transport, endpoint, key, certificate or switch to production exists.
export const realIntegrationGate=Object.freeze({reniec:false,sunarp:false,fiscal:false});
export function requireRealIntegration(channel:keyof typeof realIntegrationGate):never{throw new Error('Integración real bloqueada: '+channel+'. Requiere contrato, autorización y pruebas independientes.');}
export function identityContractSpike(){return {mode:'simulation',hardwareTested:false,results:identityResults.map(s=>identityAdapter.check(s)),unknownRequiresConsult:true,biometricDataCaptured:false};}
export interface SignatureAdapter {readonly mode:'simulation';validate(hash:string,outcome:typeof signatureOutcomes[number]):{mode:'simulation';artifactHash:string;outcome:typeof signatureOutcomes[number];cryptographicallyVerified:false}}
export const signatureAdapter:SignatureAdapter=Object.freeze<SignatureAdapter>({mode:'simulation',validate(hash,outcome){if(!/^[a-f0-9]{64}$/.test(hash)||!signatureOutcomes.includes(outcome))throw new Error('Contrato de firma no válido.');return {mode:'simulation',artifactHash:hash,outcome,cryptographicallyVerified:false};}});
