// FarmBotBridgePanel.tsx — Bridge a Genesis-type garden to FarmBot's own systems.
//
// We do NOT reimplement FarmBot's controls. The Genesis garden type mirrors a real
// FarmBot; actual control is handed off to FarmBot's own web app (my.farm.bot) so
// users get FarmBot's full UI and FarmBot Inc. gets the support/traffic.
//
// Attribution / licensing (see docs/third-party-attribution.md):
//   • FarmBot SOFTWARE is MIT-licensed.
//   • FarmBot BRAND ASSETS / LOGO are CC-BY-NC 4.0 — attribution required and
//     COMMERCIAL USE FORBIDDEN. Tender Cells is a commercial product, so we do NOT
//     embed FarmBot's logo file. We use a plain text wordmark + required attribution
//     + a link to FarmBot. Swap in the official logo only with written permission.
import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, TextField, Chip, Link, Divider,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { PropertyItem } from '../property/propertyLayoutStore';
import { normalizeFarmBotUrl } from './farmbotLinks';
import FarmBotLivePanel from './FarmBotLivePanel';

const FARMBOT_APP_URL = 'https://my.farm.bot';
// Genesis / Genesis XL are FarmBot kits; any other garden can still be driven by a
// FarmBot, so the bridge is offered for every garden item (FIX 2026-09-27: it only
// appeared for the two Genesis types, so most gardens had no way into FarmBot).
const FARMBOT_NATIVE_TYPES = new Set(['farmbot-genesis', 'farmbot-genesis-xl']);
const FARMBOT_SITE_URL = 'https://farm.bot';
// Canonical links from the FarmBot Web App README (checked 2026-09-27 against
// FarmBot/Farmbot-Web-App v15.30.6 / FarmBot OS v15.5.2).
const FARMBOT_GETTING_STARTED_URL = 'https://software.farm.bot/docs/getting-started';
const FARMBOT_SELF_HOST_URL = 'https://github.com/FarmBot/Farmbot-Web-App/blob/main/local_setup_instructions.sh';
const FARMBOT_GREEN = '#61B833';

// serverUrl: self-hosted FarmBot Web App (default my.farm.bot). email/linkedAt were an
// earlier placeholder for status mirroring, now done live by FarmBotLivePanel.
type FarmBotLink = { email?: string; linkedAt?: string; serverUrl?: string };

const linkKey = (itemId: string) => `tc_farmbot_link_${itemId}`;

const loadLink = (itemId: string): FarmBotLink => {
  try { return JSON.parse(localStorage.getItem(linkKey(itemId)) || '{}'); }
  catch { return {}; }
};

/**
 * Bridge card that opens FarmBot's own web app for a garden item.
 *
 * @param item - the garden PropertyItem (Genesis kit, other garden device, or garden plot)
 */
export default function FarmBotBridgePanel({ item }: { item: PropertyItem }) {
  const [link, setLink] = useState<FarmBotLink>(() => loadLink(item.id));
  const [serverInput, setServerInput] = useState(link.serverUrl || '');
  const [serverError, setServerError] = useState<string | null>(null);
  const isNative = FARMBOT_NATIVE_TYPES.has(item.type);
  const appUrl = link.serverUrl || FARMBOT_APP_URL;

  const persist = (next: FarmBotLink) => {
    try { localStorage.setItem(linkKey(item.id), JSON.stringify(next)); } catch { /* storage off */ }
    setLink(next);
  };
  const saveServer = () => {
    if (!serverInput.trim()) { persist({ ...link, serverUrl: undefined }); setServerError(null); return; }
    const url = normalizeFarmBotUrl(serverInput);
    if (!url) { setServerError('Enter an http(s) address, e.g. https://my.farm.bot or 192.168.1.20:3000'); return; }
    setServerError(null);
    setServerInput(url);
    persist({ ...link, serverUrl: url });
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, border: `1px solid ${FARMBOT_GREEN}55`,
        background: 'linear-gradient(135deg, #0D2B1E 0%, #102b16 100%)',
      }}
    >
      {/* Text wordmark (NOT FarmBot's logo asset — see license note above) */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: FARMBOT_GREEN, fontSize: '1.05rem' }}>
          FarmBot
        </Typography>
        <Chip label="Bridge" size="small" sx={{ bgcolor: `${FARMBOT_GREEN}22`, color: FARMBOT_GREEN, fontWeight: 700 }} />
      </Stack>

      <Typography variant="body2" sx={{ color: '#C8D6CC', mb: 1.5 }}>
        {isNative ? (
          <><strong style={{ color: '#E4E7E5' }}>{item.name}</strong> is a Genesis-type garden.</>
        ) : (
          <>Automate <strong style={{ color: '#E4E7E5' }}>{item.name}</strong> with a FarmBot.</>
        )}{' '}
        Tender Cells doesn't reinvent FarmBot — planting, watering and sequences run in
        FarmBot's own web app so you get their full toolset and they get the support.
      </Typography>

      <Button
        fullWidth variant="contained" endIcon={<OpenInNewIcon />}
        href={appUrl} target="_blank" rel="noopener noreferrer"
        sx={{ bgcolor: FARMBOT_GREEN, color: '#06210a', fontWeight: 700, '&:hover': { bgcolor: '#6FCB3C' } }}
      >
        Open FarmBot Web App
      </Button>
      <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block', mt: 0.5, wordBreak: 'break-all' }}>
        Opens {appUrl.replace(/^https?:\/\//, '')} in a new tab
      </Typography>

      {/* Self-hosted FarmBot servers (LAN installs) - per garden. */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <TextField
          size="small" fullWidth placeholder="FarmBot server (default my.farm.bot)"
          value={serverInput} onChange={(e) => setServerInput(e.target.value)}
          error={!!serverError} helperText={serverError || undefined}
          inputProps={{ 'aria-label': 'FarmBot server address' }}
        />
        <Button variant="outlined" size="small" onClick={saveServer}
          sx={{ borderColor: '#4A7C59', color: '#9CCC65', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          Save
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block', mt: 0.5 }}>
        New to FarmBot?{' '}
        <Link href={FARMBOT_GETTING_STARTED_URL} target="_blank" rel="noopener noreferrer" sx={{ color: FARMBOT_GREEN }}>
          Getting started
        </Link>
        {' · '}Running your own server?{' '}
        <Link href={FARMBOT_SELF_HOST_URL} target="_blank" rel="noopener noreferrer" sx={{ color: FARMBOT_GREEN }}>
          Self-hosting guide
        </Link>
      </Typography>

      <Divider sx={{ borderColor: '#1A3D2B', my: 1.5 }} />

      {/* Live link to my.farm.bot (FarmBot's own client + hosted service). Self-hosted
          servers open in a new tab only: the site's security policy cannot allow
          arbitrary servers, and http LAN servers are blocked from an https page. */}
      {link.serverUrl && link.serverUrl !== FARMBOT_APP_URL ? (
        <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block' }}>
          Live status, E-STOP and sequences here work with my.farm.bot accounts. For a
          self-hosted server, use the button above to open its web app.
        </Typography>
      ) : (
        <FarmBotLivePanel item={item} />
      )}

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Powered by{' '}
          <Link href={FARMBOT_SITE_URL} target="_blank" rel="noopener noreferrer" sx={{ color: FARMBOT_GREEN }}>
            FarmBot Inc.
          </Link>{' '}
          — open-source CNC farming. FarmBot software is MIT-licensed; FarmBot is a
          trademark of FarmBot Inc., used here for attribution and compatibility only.
        </Typography>
      </Box>
    </Paper>
  );
}
