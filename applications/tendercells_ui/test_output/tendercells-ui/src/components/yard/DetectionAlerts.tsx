// DetectionAlerts.tsx - app-wide alert when a robot finds something: a weed from a rover or
// bed weed patrol, an animal on a rover's route (flock out, predator, snake), or a water leak. Mounted once in App.tsx, so the user is
// told wherever they are in the OS (plus a browser notification when they allowed it).
// "View on map" opens Weed Patrol with that robot selected (2D + 3D pins).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { loadPropertyLayout, PROPERTY_LAYOUT_EVENT, type PropertyItem } from '../property/propertyLayoutStore';
import { useYardEvents } from '../../hooks/useYardEvents';
import { WEED_BED_TYPES, WEED_ROVER_TYPES } from '../../lib/yard/yardTypes';
import { newFindings, urgency } from '../../lib/yard/detections';

export default function DetectionAlerts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<PropertyItem[]>(() => loadPropertyLayout().items);
  useEffect(() => {
    const onChange = () => setItems(loadPropertyLayout().items);
    window.addEventListener(PROPERTY_LAYOUT_EVENT, onChange);
    return () => window.removeEventListener(PROPERTY_LAYOUT_EVENT, onChange);
  }, []);
  const robots = useMemo(() => items.filter((i) => i.kind === 'hardware' && (WEED_ROVER_TYPES.has(i.type) || WEED_BED_TYPES.has(i.type))), [items]);
  const { flags } = useYardEvents(robots);
  const seen = useRef<Set<string> | null>(null);
  const [alert, setAlert] = useState<{ msg: string; itemId: string } | null>(null);

  useEffect(() => {
    const { fresh, seen: next } = newFindings(flags, seen.current);
    seen.current = next;
    if (!fresh.length) return;
    // Say the most urgent first: a leak or predator beats a weed.
    const first = [...fresh].sort((a, b) => urgency(a) - urgency(b))[0];
    const robot = robots.find((r) => r.id === first.itemId)?.name ?? 'A robot';
    const weeds = fresh.filter((f) => f.type === 'weed_detected').length;
    const near = first.title.startsWith('Weed near ') ? ` near ${first.title.slice('Weed near '.length)}` : '';
    const msg = weeds === fresh.length
      ? `${robot} found ${weeds === 1 ? `a weed${near}` : `${weeds} weeds`} - review on the map`
      : `${robot}: ${first.title}`;
    // The Weed Patrol page shows its own review queue; still notify the browser there.
    if (!location.pathname.startsWith('/weed-patrol')) setAlert({ msg, itemId: first.itemId });
    window.dispatchEvent(new CustomEvent('tendercells-detection-alert', { detail: first }));
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      new Notification('Tender Cells', { body: msg, tag: `detect-${first.itemId}` });
    }
  }, [flags, robots, location.pathname]);

  return (
    <Snackbar open={!!alert} autoHideDuration={8000} onClose={() => setAlert(null)} message={alert?.msg}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} data-testid="detection-alert"
      ContentProps={{ sx: { bgcolor: '#1A3D2B', color: '#F0EDE4', border: '1px solid #E8A020' } }}
      action={alert && (
        <Button size="small" sx={{ color: '#E8A020' }} onClick={() => { navigate(`/weed-patrol?robot=${encodeURIComponent(alert.itemId)}`); setAlert(null); }}>
          View on map
        </Button>
      )} />
  );
}
