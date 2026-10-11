import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const demoUrl = 'https://tendercells.com/app/demo';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>TenderCells</Text>
        <Text style={styles.subtitle}>Local iOS preview · public demo</Text>
      </View>
      <WebView
        source={{ uri: demoUrl }}
        style={styles.webview}
        onLoadStart={() => { setLoading(true); setFailed(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
      />
      {loading && <ActivityIndicator style={styles.overlay} color="#4A7C59" />}
      {failed && <Text style={styles.error}>The demo could not load. Check this device's connection.</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D2B1E' },
  header: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#0D2B1E' },
  title: { color: '#F0EDE4', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#C8B882', fontSize: 12, marginTop: 3 },
  webview: { flex: 1, backgroundColor: '#F0EDE4' },
  overlay: { position: 'absolute', top: '50%', alignSelf: 'center' },
  error: { color: '#F0EDE4', padding: 16, backgroundColor: '#0D2B1E' }
});
