// useFeederTelemetryBridge.ts
// Lets the viewer receive telemetry from MQTT/local gateway, simulator, or a React Native WebView.
import { useEffect, useState } from 'react';
import type { FeederTelemetry } from './FeederFunctionalViewer';
export const FEEDER_TELEMETRY_EVENT='tendercells:feeder-telemetry';
export function useFeederTelemetryBridge(initial:FeederTelemetry){
 const [telemetry,setTelemetry]=useState(initial);
 useEffect(()=>{ const handler=(event:Event)=>{ const detail=(event as CustomEvent<Partial<FeederTelemetry>>).detail; if(detail)setTelemetry(v=>({...v,...detail})); }; window.addEventListener(FEEDER_TELEMETRY_EVENT,handler); return()=>window.removeEventListener(FEEDER_TELEMETRY_EVENT,handler); },[]);
 return {telemetry,setTelemetry};
}
export function pushFeederTelemetry(next:Partial<FeederTelemetry>){window.dispatchEvent(new CustomEvent(FEEDER_TELEMETRY_EVENT,{detail:next}));}
