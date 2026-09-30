// CameraNodeFirstBuildPage.tsx - in-app rendering of docs/CAMERA_NODE_FIRST_BUILD.md.
//
// FIX: ResourcesPage's "Read in TenderCells" button opened this content in an
// iframe pointed at /guides/camera-node-first-build - a route that never
// existed (no static file, no build step, nothing in the router). It always
// 404'd inside the iframe. This page IS that route, rendering the same
// content the source markdown doc has, with the same real Seeed Studio
// images (copied to public/guides/camera-node/, CC BY-SA 4.0, see
// docs/assets/camera-node/ATTRIBUTION.md - attribution preserved below).
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  List, ListItem, ListItemText, Divider, Link as MuiLink,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const C = { bg: '#0D2B1E', surface: '#153A29', border: '#35634A', text: '#F0EDE4', muted: '#B7C7BF', gold: '#C8B882' };

const materials = [
  ['A1', 'Seeed Studio XIAO ESP32-S3 Sense', 'Genuine board and seated Sense expansion'],
  ['CAM1', 'OV3660 or legacy OV2640 camera', 'Correct FFC orientation and locked connector'],
  ['ANT1', 'Supplied 2.4 GHz antenna', 'U.FL plug seated vertically; cable strain relieved'],
  ['J1', 'USB-C cable', 'Data-capable; 5 V USB source'],
  ['B1', 'Protected single-cell LiPo', 'Nominal 3.7 V; insulated leads; correct polarity'],
];

const wiringSteps = [
  'Seat the Sense expansion board fully on the XIAO board-to-board connector.',
  "Lock the camera ribbon into its connector with contacts in the orientation shown by Seeed's camera guide. Do not insert or remove it while powered.",
  'Attach the supplied 2.4 GHz antenna to the U.FL connector using straight, downward pressure. Do not lever the connector sideways.',
  'Connect a USB-C data cable. Use USB for the first flash and configuration.',
  'After bench testing, connect a qualified protected 3.7 V rechargeable LiPo to the underside battery pads: negative nearest USB-C, positive away from USB-C.',
  'Insulate solder joints, add strain relief, and place the assembly in a ventilated nonconductive enclosure with the lens unobstructed.',
];

const flashSteps = [
  'Sign in to TenderCells and open Products.',
  'Choose Add Your First Device and select DIY ESP32 Camera Node.',
  'Select Seeed XIAO ESP32-S3 Sense and the Camera only starter setup.',
  'Choose 1. Flash Camera. In Chrome or Edge, connect the XIAO serial port and install the camera-node image.',
  'Join the temporary TenderCam-Setup Wi-Fi network.',
  'Enter 2.4 GHz Wi-Fi, broker address when auto-discovery is unavailable, a unique device ID, and product type camera-kit.',
  'Return to TenderCells and choose 2. Register Camera. Give it a human name and location.',
  'Claim the discovered device while signed in. First claim wins; control API calls are then owner-gated.',
  'Open the product dashboard. Add the reported http://<device-ip>/stream URL if it was not discovered automatically.',
  'Confirm live video, online state, and heartbeat before enabling another board capability.',
];

const checklist = [
  'USB data connection flashes successfully.',
  'TenderCam-Setup provisions 2.4 GHz Wi-Fi.',
  'Device publishes a heartbeat every 10 seconds.',
  'Device appears unclaimed, then binds to the signed-in owner.',
  'Registry capabilities match installed hardware.',
  'Live stream opens on the local network.',
  'Reboot preserves the selected configuration.',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

export default function CameraNodeFirstBuildPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100%', color: C.text, p: { xs: 2, md: 4 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resources?category=guides')} sx={{ color: C.muted, mb: 2 }}>
        Resources
      </Button>
      <Typography variant="h4" sx={{ color: C.gold, mb: 1 }}>Single Camera Node: First Build</Typography>
      <Typography sx={{ color: C.muted, mb: 3, maxWidth: 720 }}>
        The first physical TenderCells build for students, makers, and open-source contributors:
        one battery-powered Seeed Studio XIAO ESP32-S3 Sense, one camera, and one named device in
        the TenderCells UI. Start camera-only - prove flash, Wi-Fi, MQTT, ownership, and live video
        before adding an auxiliary sensor or load.
      </Typography>

      <Box
        component="img"
        src="/guides/camera-node/seeed-xiao-esp32s3-sense.jpg"
        alt="Seeed Studio XIAO ESP32-S3 Sense with camera and antenna"
        sx={{ width: '100%', maxWidth: 480, borderRadius: 1, border: `1px solid ${C.border}`, display: 'block', mb: 1 }}
      />
      <Typography variant="caption" sx={{ color: C.muted, display: 'block', mb: 3 }}>
        Official Seeed Studio product image. © Seeed Studio, CC BY-SA 4.0 - see{' '}
        <MuiLink href="https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/" target="_blank" rel="noopener noreferrer" sx={{ color: C.gold }}>
          the Seeed getting-started guide
        </MuiLink>.
      </Typography>

      <Section title="Reference materials (camera-only build)">
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Ref', 'Part', 'Electrical requirement'].map((h) => (
                <TableCell key={h} sx={{ color: C.gold, borderColor: C.border }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map(([ref, part, req]) => (
              <TableRow key={ref}>
                <TableCell sx={{ color: C.text, borderColor: C.border }}>{ref}</TableCell>
                <TableCell sx={{ color: C.text, borderColor: C.border }}>{part}</TableCell>
                <TableCell sx={{ color: C.muted, borderColor: C.border }}>{req}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="First-function wiring">
        <Box
          component="img"
          src="/guides/camera-node/camera-node-wiring.svg"
          alt="TenderCells camera-node wiring diagram"
          sx={{ width: '100%', maxWidth: 640, display: 'block', mb: 2, bgcolor: '#fff', borderRadius: 1 }}
        />
        <List dense>
          {wiringSteps.map((step, i) => (
            <ListItem key={i} sx={{ display: 'list-item', listStyleType: 'decimal', ml: 3, pl: 0 }}>
              <ListItemText primaryTypographyProps={{ sx: { color: C.text } }} primary={step} />
            </ListItem>
          ))}
        </List>
        <Typography sx={{ color: '#EF5350', mt: 1 }}>
          Never connect a LiPo directly to 5V/VBUS. The 5V pin has no output when running from
          battery. Do not power motors, pumps, heaters, or solenoids from the XIAO regulator.
        </Typography>
      </Section>

      <Section title="Flash and register in the UI">
        <List dense>
          {flashSteps.map((step, i) => (
            <ListItem key={i} sx={{ display: 'list-item', listStyleType: 'decimal', ml: 3, pl: 0 }}>
              <ListItemText primaryTypographyProps={{ sx: { color: C.text } }} primary={step} />
            </ListItem>
          ))}
        </List>
      </Section>

      <Section title="Verification checklist">
        <List dense>
          {checklist.map((item) => (
            <ListItem key={item} sx={{ display: 'list-item', listStyleType: 'disc', ml: 3, pl: 0 }}>
              <ListItemText primaryTypographyProps={{ sx: { color: C.text } }} primary={item} />
            </ListItem>
          ))}
        </List>
      </Section>

      <Divider sx={{ borderColor: C.border, my: 3 }} />
      <Typography variant="caption" sx={{ color: C.muted }}>
        Full reference (BOM, auxiliary wiring, reserved pins, electrical acceptance checks, and the
        official pinout diagram):{' '}
        <MuiLink href="https://github.com/WeCr8/TenderCells/blob/main/docs/CAMERA_NODE_FIRST_BUILD.md" target="_blank" rel="noopener noreferrer" sx={{ color: C.gold }}>
          docs/CAMERA_NODE_FIRST_BUILD.md
        </MuiLink>{' '}
        on GitHub.
      </Typography>
    </Box>
  );
}
