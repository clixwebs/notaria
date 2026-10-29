import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'deployment.spec.ts',timeout:60000,reporter:[['list'],['json',{outputFile:'docs/evidence/deploy-neon-e2e.json'}]]});
