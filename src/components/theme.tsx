'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
const Context=createContext<{dark:boolean;setDark:(value:boolean)=>void}>({dark:false,setDark:()=>{}});
export function ThemeProvider({children}:{children:ReactNode}){const [dark,setDark]=useState(false);return <Context value={{dark,setDark}}><div data-theme={dark?'dark':'light'}>{children}</div></Context>;}
export function useTheme(){return useContext(Context);}
