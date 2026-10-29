import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'procedure-focused.spec.ts',reporter:[['list'],['json',{outputFile:'docs/evidence/fase-3-procedimiento-enfocada.json'}]]});
