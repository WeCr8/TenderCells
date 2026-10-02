// TenderCellsFeederViewerNative.tsx
// React Native drop-in wrapper. It reuses the hosted TenderCells viewer so mobile and web share one 3D implementation.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type NativeFeederTelemetry={feedPercent:number;feedWeightGrams?:number;batteryPercent:number;rotorPocket:number;dispenseCount?:number;connected:boolean;jammed:boolean;homed?:boolean;lastDispenseAt?:string};
export type Props={ viewerUrl:string; modelUrl:string; telemetry:NativeFeederTelemetry; style?:object; onMessage?:(data:any)=>void };

export default function TenderCellsFeederViewerNative({viewerUrl,modelUrl,telemetry,style,onMessage}:Props){
 const ref=useRef<WebView>(null);
 const url=`${viewerUrl}${viewerUrl.includes('?')?'&':'?'}model=${encodeURIComponent(modelUrl)}&embed=1`;
 useEffect(()=>{const js=`window.dispatchEvent(new CustomEvent('tendercells:feeder-telemetry',{detail:${JSON.stringify(telemetry)}}));true;`;ref.current?.injectJavaScript(js);},[telemetry]);
 return <View style={[styles.root,style]}><WebView ref={ref} source={{uri:url}} javaScriptEnabled originWhitelist={['https://*','http://*']} onMessage={e=>{try{onMessage?.(JSON.parse(e.nativeEvent.data));}catch{onMessage?.(e.nativeEvent.data);}}}/></View>;
}
const styles=StyleSheet.create({root:{minHeight:320,overflow:'hidden',borderRadius:14}});
