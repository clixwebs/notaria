import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'phase6.spec.ts',reporter:[['list'],['json',{outputFile:'docs/evidence/fase-6-e2e.json'}]]});
