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

const FARMBOT_APP_URL = 'https://my.farm.bot';
const FARMBOT_SITE_URL = 'https://farm.bot';
const FARMBOT_GREEN = '#61B833';

type FarmBotLink = { email?: string; linkedAt?: string };

const linkKey = (itemId: string) => `tc_farmbot_link_${itemId}`;

const loadLink = (itemId: string): FarmBotLink => {
  try { return JSON.parse(localStorage.getItem(linkKey(itemId)) || '{}'); }
  catch { return {}; }
};

/**
 * Bridge card for a FarmBot Genesis-type garden device.
 *
 * @param item - the Genesis/Genesis-XL garden PropertyItem being bridged
 */
export default function FarmBotBridgePanel({ item }: { item: PropertyItem }) {
  const [link, setLink] = useState<FarmBotLink>(() => loadLink(item.id));
  const [email, setEmail] = useState(link.email || '');

  const saveLink = () => {
    const next: FarmBotLink = { email: email.trim() || undefined, linkedAt: new Date().toISOString() };
    localStorage.setItem(linkKey(item.id), JSON.stringify(next));
    setLink(next);
  };
  const clearLink = () => {
    localStorage.removeItem(linkKey(item.id));
    setLink({});
    setEmail('');
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
        <strong style={{ color: '#E4E7E5' }}>{item.name}</strong> is a Genesis-type garden.
        Tender Cells doesn't reinvent FarmBot — control runs in FarmBot's own web app so
        you get their full toolset and they get the support.
      </Typography>

      <Button
        fullWidth variant="contained" endIcon={<OpenInNewIcon />}
        href={FARMBOT_APP_URL} target="_blank" rel="noopener noreferrer"
        sx={{ bgcolor: FARMBOT_GREEN, color: '#06210a', fontWeight: 700, '&:hover': { bgcolor: '#6FCB3C' } }}
      >
        Open FarmBot Web App
      </Button>

      <Divider sx={{ borderColor: '#1A3D2B', my: 1.5 }} />

      {/* Optional: remember the FarmBot account so we can mirror read-only status into
          the 3D twin later. No control here, no token stored without the user. */}
      <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block', mb: 0.75 }}>
        Link your FarmBot account (optional — for status mirroring)
      </Typography>
      {link.linkedAt ? (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            label={link.email ? `Linked: ${link.email}` : 'Linked'}
            size="small" onDelete={clearLink}
            sx={{ bgcolor: `${FARMBOT_GREEN}22`, color: FARMBOT_GREEN }}
          />
          <Typography variant="caption" color="text.secondary">
            Read-only status mirror to the 3D twin — coming next.
          </Typography>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1}>
          <TextField
            size="small" fullWidth placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="outlined" size="small" onClick={saveLink}
            sx={{ borderColor: '#4A7C59', color: '#9CCC65', whiteSpace: 'nowrap' }}>
            Link
          </Button>
        </Stack>
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
