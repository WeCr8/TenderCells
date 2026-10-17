// FeederViewerPanel.tsx - MUI wrapper matching the existing TenderCells UI.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FeederFunctionalViewer, { type FeederTelemetry } from './FeederFunctionalViewer';

export default function FeederViewerPanel({ modelUrl }: { modelUrl: string }) {
  const [t, setT] = useState<FeederTelemetry>({ feedPercent:72, feedWeightGrams:3120, batteryPercent:86, rotorPocket:2, dispenseCount:14, connected:true, jammed:false, homed:true });
  const simulateDispense=()=>setT(v=>({...v,rotorPocket:(v.rotorPocket+1)%6,dispenseCount:(v.dispenseCount??0)+1,feedPercent:Math.max(0,v.feedPercent-4),feedWeightGrams:Math.max(0,(v.feedWeightGrams??0)-120)}));
  return <Paper sx={{p:2,borderRadius:3}}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb:1.5}}>
      <Box><Typography variant="h6">Smart Feeder Digital Twin</Typography><Typography variant="body2" color="text.secondary">Interactive GLB + live/simulated feeder state</Typography></Box>
      <Chip label={t.jammed?'JAMMED':t.connected?'ONLINE':'OFFLINE'} color={t.jammed?'error':t.connected?'success':'warning'} />
    </Stack>
    <FeederFunctionalViewer modelUrl={modelUrl} telemetry={t} visualOnly onCommand={(c)=>{ if(c.type==='visual-dispense') simulateDispense(); if(c.type==='visual-home') setT(v=>({...v,rotorPocket:0,homed:true})); }} />
    <Stack direction="row" spacing={1} sx={{mt:1.5}}><Button variant="contained" onClick={simulateDispense}>Simulate dispense</Button><Button variant="outlined" onClick={()=>setT(v=>({...v,jammed:!v.jammed}))}>Toggle jam</Button></Stack>
  </Paper>;
}
