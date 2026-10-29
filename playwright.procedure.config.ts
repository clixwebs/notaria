import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',testMatch:'procedure.spec.ts',workers:1,retries:0,timeout:30000,
  reporter:[['list'],['json',{outputFile:'docs/evidence/fase-3-procedimiento-e2e.json'}]],
  use:{baseURL:'http://127.0.0.1:3101',channel:'chrome',viewport:{width:1440,height:1000},trace:'off',screenshot:'off'},
});
