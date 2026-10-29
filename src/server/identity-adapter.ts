import {identityResults} from '../lib/procedure-domain.ts';
// Local exercise only. There is deliberately no endpoint, credentials or production implementation.
export interface IdentityAdapter {readonly mode:'simulation';check(scenario:typeof identityResults[number]):{mode:'simulation';result:typeof identityResults[number]};}
export const identityAdapter:IdentityAdapter=Object.freeze<IdentityAdapter>({mode:'simulation',check:(scenario)=>({mode:'simulation',result:scenario})});
