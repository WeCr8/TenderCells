// ProductSpecsPage.tsx - Chicken Tender product specs reference
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export default function ProductSpecsPage() {
  const variants = [
    { size: 'Small (S)', width: 36, depth: 36, height: 60, capacity: '4-6 chickens' },
    { size: 'Medium (M)', width: 48, depth: 48, height: 72, capacity: '8-12 chickens' },
    { size: 'Large (L)', width: 72, depth: 72, height: 96, capacity: '20-30 chickens' },
  ];

  const tiers = [
    {
      name: 'BASE',
      description: 'Manual operation',
      features: ['Coop structure', 'Nesting', 'Roosting', 'Ventilation'],
    },
    {
      name: 'AUTO',
      description: 'Automated operation',
      features: [
        'Motorized doors',
        'Environmental monitoring',
        'Automated lighting',
        'Control electronics',
      ],
    },
    {
      name: 'PRO',
      description: 'Full ecosystem integration',
      features: [
        'TenderCells Rail System™',
        'WatchTower AI™ compatible',
        'Cloud integration',
        'Robot-ready architecture',
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#C8B882', mb: 1 }}>
          Chicken Tender™ Product Specifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Document ID: TC-CHKN-MASTER-001 | Revision: A | Status: Active Development
        </Typography>
      </Box>

      {/* Overview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <InfoIcon sx={{ color: '#C8B882', mt: 0.5 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#C8B882', mb: 1 }}>
              Product Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chicken Tender™ is an intelligent poultry enclosure platform designed to automate
              routine chicken care activities while improving flock safety, sanitation, environmental
              monitoring, and operational efficiency.
            </Typography>
            <Typography variant="body2" sx={{ color: '#8A7D55' }}>
              The system serves as the foundational product within the TenderCells™ ecosystem and
              supports optional robotic automation, AI monitoring, cloud connectivity, solar power,
              and modular expansion.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Sizes */}
      <Typography variant="h5" sx={{ color: '#C8B882', mb: 2 }}>
        Available Sizes
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4, bgcolor: '#1A3D2B' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D2B1E' }}>
              <TableCell sx={{ color: '#C8B882', fontWeight: 'bold' }}>Size</TableCell>
              <TableCell sx={{ color: '#C8B882', fontWeight: 'bold' }} align="right">
                Width
              </TableCell>
              <TableCell sx={{ color: '#C8B882', fontWeight: 'bold' }} align="right">
                Depth
              </TableCell>
              <TableCell sx={{ color: '#C8B882', fontWeight: 'bold' }} align="right">
                Height
              </TableCell>
              <TableCell sx={{ color: '#C8B882', fontWeight: 'bold' }}>Capacity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.size}>
                <TableCell sx={{ color: '#F0EDE4' }}>{variant.size}</TableCell>
                <TableCell sx={{ color: '#F0EDE4' }} align="right">
                  {variant.width}"
                </TableCell>
                <TableCell sx={{ color: '#F0EDE4' }} align="right">
                  {variant.depth}"
                </TableCell>
                <TableCell sx={{ color: '#F0EDE4' }} align="right">
                  {variant.height}"
                </TableCell>
                <TableCell sx={{ color: '#F0EDE4' }}>{variant.capacity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Feature Tiers */}
      <Typography variant="h5" sx={{ color: '#C8B882', mb: 2 }}>
        Feature Tiers
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {tiers.map((tier) => (
          <Grid item xs={12} md={4} key={tier.name}>
            <Card sx={{ bgcolor: '#1A3D2B', border: '2px solid #4A7C59', height: '100%' }}>
              <CardContent>
                <Chip
                  label={tier.name}
                  sx={{
                    bgcolor: '#4A7C59',
                    color: '#F0EDE4',
                    fontWeight: 'bold',
                    mb: 1,
                  }}
                />
                <Typography variant="subtitle2" sx={{ color: '#8A7D55', mb: 2 }}>
                  {tier.description}
                </Typography>
                <Stack spacing={1}>
                  {tier.features.map((feature) => (
                    <Typography key={feature} variant="body2" sx={{ color: '#F0EDE4' }}>
                      ✓ {feature}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Key Features */}
      <Typography variant="h5" sx={{ color: '#C8B882', mb: 2 }}>
        System Features
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { title: 'Robot Ready', desc: 'Rail system compatible with TenderCells 6DOF arm' },
          {
            title: 'Modular Design',
            desc: 'Stackable zones (living, nesting, waste, service)',
          },
          { title: 'Deep Bedding', desc: '6-12" composting bedding system' },
          { title: 'Motorized Doors', desc: 'Automated entry/exit (AUTO & PRO tiers)' },
          { title: 'Environmental Control', desc: 'Temp, humidity, ammonia monitoring' },
          {
            title: 'Multi-Camera Ready',
            desc: 'Supports 6+ camera locations in coop + pen',
          },
          { title: 'Cloud Connected', desc: 'Optional TenderCells Cloud™ integration' },
          { title: 'Solar Compatible', desc: 'Off-grid operation with LiFePO4 battery' },
        ].map((feature) => (
          <Grid item xs={12} sm={6} key={feature.title}>
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#C8B882', mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Success Criteria */}
      <Paper sx={{ p: 3, bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
        <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
          Success Criteria
        </Typography>
        <Grid container spacing={1}>
          {[
            'Protect chickens from predators (96%+ uptime)',
            'Reduce daily care time by 50%+',
            'Improve flock health metrics',
            'Reduce odor by 70%+ (deep litter)',
            'Enable data-driven decision making',
            'Modular, field-serviceable design',
            'Competitive pricing ($599-$1,499)',
            'COGS 45% of retail, 50%+ gross margin',
          ].map((criterion) => (
            <Grid item xs={12} sm={6} key={criterion}>
              <Typography variant="body2" sx={{ color: '#F0EDE4' }}>
                ✓ {criterion}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Full Spec Link */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #4A7C59' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          For complete technical specifications, see:
        </Typography>
        <Typography variant="body2" sx={{ color: '#C8B882', fontFamily: 'monospace' }}>
          docs/CHICKEN_TENDER_MASTER_SPEC.md
        </Typography>
      </Box>
    </Box>
  );
}
