import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'phase5.spec.ts',reporter:[['list'],['json',{outputFile:'docs/evidence/fase-5-e2e.json'}]]});
