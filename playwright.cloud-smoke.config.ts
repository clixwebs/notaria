import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'cloud-smoke.spec.ts',timeout:120000,expect:{timeout:30000},reporter:[['list'],['json',{outputFile:'docs/evidence/deploy-neon-focused.json'}]]});
