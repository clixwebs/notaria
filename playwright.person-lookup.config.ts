import {defineConfig} from '@playwright/test';
import base from './playwright.procedure.config';
export default defineConfig({...base,testMatch:'person-lookup.spec.ts',timeout:60000,expect:{timeout:20000},reporter:[['list'],['json',{outputFile:'docs/evidence/person-lookup-e2e.json'}]]});
