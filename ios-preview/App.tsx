import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

const origin = 'https://tendercells.com';
const sections = [
  { label: 'Farm', path: '/app/dashboard' },
  { label: 'Animals', path: '/app/animals' },
  { label: 'Schedule', path: '/app/schedules' },
  { label: 'Account', path: '/app/account' },
  { label: 'Demo', path: '/app/demo' },
] as const;

export default function App() {
  const browser = useRef<WebView>(null);
  const [section, setSection] = useState<string>(sections[0].path);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      browser.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const navigate = (path: string) => {
    setSection(path);
    setFailed(false);
    browser.current?.injectJavaScript(`window.location.assign(${JSON.stringify(origin + path)}); true;`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>TenderCells</Text>
        <Text style={styles.subtitle}>Farm dashboard · devices · animal care</Text>
      </View>
      <View style={styles.content}>
        <WebView
          ref={browser}
          source={{ uri: origin + sections[0].path }}
          style={styles.webview}
          sharedCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          onLoadStart={() => { setLoading(true); setFailed(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
          onNavigationStateChange={(state: WebViewNavigation) => {
            setCanGoBack(state.canGoBack);
            try {
              const path = new URL(state.url).pathname;
              const active = sections.find(item => path === item.path);
              if (active) setSection(active.path);
            } catch { /* WebView can emit about:blank during startup. */ }
          }}
          onShouldStartLoadWithRequest={request => {
            if (request.url === 'about:blank') return true;
            // Firebase Auth loads a cross-origin iframe during startup. It is
            // part of the page, not a user navigation to open in Safari.
            if ('isTopFrame' in request && request.isTopFrame === false) return true;
            try {
              const target = new URL(request.url);
              if (target.origin === origin || target.hostname === 'tendercells.firebaseapp.com') return true;
            } catch { /* Let the system handle non-web URLs. */ }
            void Linking.openURL(request.url);
            return false;
          }}
        />
        {loading && <ActivityIndicator style={styles.overlay} color="#4A7C59" />}
        {failed && <View style={styles.errorBox}>
          <Text style={styles.error}>TenderCells could not load. Check this device's connection.</Text>
          <Pressable onPress={() => { setFailed(false); browser.current?.reload(); }}><Text style={styles.retry}>Try again</Text></Pressable>
        </View>}
      </View>
      <View style={styles.tabs}>
        {sections.map(item => <Pressable key={item.path} onPress={() => navigate(item.path)} style={[styles.tab, section === item.path && styles.activeTab]}>
          <Text style={[styles.tabText, section === item.path && styles.activeTabText]}>{item.label}</Text>
        </Pressable>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D2B1E' },
  header: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#0D2B1E' },
  title: { color: '#F0EDE4', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#C8B882', fontSize: 12, marginTop: 3 },
  content: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#F0EDE4' },
  overlay: { position: 'absolute', top: '50%', alignSelf: 'center' },
  errorBox: { position: 'absolute', top: 20, left: 12, right: 12, padding: 16, backgroundColor: '#0D2B1E' },
  error: { color: '#F0EDE4', marginBottom: 10 },
  retry: { color: '#C8B882', fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#0D2B1E', paddingVertical: 8, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  activeTab: { backgroundColor: '#235B40' },
  tabText: { color: '#C8B882', fontSize: 11, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
});
