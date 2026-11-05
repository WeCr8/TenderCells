// FeederModelUploadCard.tsx
// Reuses TenderCells' existing modelUploadService so the packaged GLB can be uploaded like other coop models.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { auth } from '../../lib/firebase/firebaseApp';
import { modelUploadService } from '../../services/modelUploadService';

export function FeederModelUploadCard({ deviceId, onUploaded }:{deviceId:string;onUploaded:(url:string)=>void}){
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
 const pick=async(e:React.ChangeEvent<HTMLInputElement>)=>{ const file=e.target.files?.[0]; if(!file)return; const uid=auth.currentUser?.uid; if(!uid){setMessage('Sign in before uploading.');return;} setBusy(true); try{const out=await modelUploadService.uploadModel(file,uid,deviceId); onUploaded(out.url); setMessage(`Uploaded ${out.name} (${(out.size/1024/1024).toFixed(1)} MB)`);}catch(err){setMessage(err instanceof Error?err.message:String(err));}finally{setBusy(false);} };
 return <Stack spacing={1}><Button component="label" variant="outlined" disabled={busy}>{busy?'Uploading…':'Upload feeder GLB'}<input hidden type="file" accept=".glb,model/gltf-binary" onChange={pick}/></Button>{message&&<Typography variant="caption">{message}</Typography>}</Stack>;
}
