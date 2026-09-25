import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PRODUCT_PROFILES } from "./productProfiles";

export function ProductHero({ product }: { product: string }) {
  const profile = PRODUCT_PROFILES[product];
  if (!profile) return null;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3, border: "1px solid #1F5C3B", overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" }, gap: 3, alignItems: "center" }}>
        <Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
            <Chip label={profile.badge} size="small" sx={{ bgcolor: "#1A3D2B", color: "#C8B882" }} />
            <Chip label="Product profile" size="small" sx={{ bgcolor: "#123D25", color: "#8DD47A" }} />
          </Stack>
          <Typography variant="h4" sx={{ color: "#E4E7E5", fontWeight: 800, mb: 1 }}>
            {profile.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760, mb: 2 }}>
            {profile.summary}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {profile.chips.map((chip) => (
              <Chip key={chip.label} icon={chip.icon} label={chip.label} variant="outlined" />
            ))}
          </Stack>
        </Box>
        <ProductVisual profile={profile} />
      </Box>
    </Paper>
  );
}

export function ProductDetailsPanel({ product }: { product: string }) {
  const profile = PRODUCT_PROFILES[product];
  if (!profile) return null;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, border: "1px solid #1F5C3B" }}>
      <Typography variant="h6" gutterBottom>
        Product Details
      </Typography>
      <Stack spacing={1.25}>
        {profile.specs.map(([label, value]) => (
          <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: "#E4E7E5", textAlign: "right" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1, color: "#C8B882" }}>
        Setup Needs
      </Typography>
      <Stack spacing={0.75}>
        {profile.setupNeeds.map((need) => (
          <Typography key={need} variant="body2" color="text.secondary">
            - {need}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

function ProductVisual({ profile }: { profile: ProductProfile }) {
  return (
    <Box
      role="img"
      aria-label={`${profile.name} product visual`}
      sx={{
        minHeight: { xs: 220, sm: 260, lg: 300 },
        borderRadius: 1,
        bgcolor: "#001B14",
        border: "1px solid #1F5C3B",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 68% 22%, ${profile.accent}66, transparent 28%), linear-gradient(145deg, #001B14 0%, #123D25 100%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "34%",
          bgcolor: "#2D6235",
          opacity: 0.82,
          clipPath: "polygon(0 28%, 18% 16%, 38% 29%, 57% 12%, 78% 28%, 100% 16%, 100% 100%, 0 100%)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          width: { xs: 172, sm: 220 },
          height: { xs: 126, sm: 158 },
          border: `4px solid ${profile.accent}`,
          borderRadius: "50% 50% 18px 18px",
          bgcolor: "rgba(228,231,229,0.08)",
          boxShadow: "0 18px 34px rgba(0,0,0,0.38)",
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: profile.accent,
            fontSize: { xs: "2.6rem", sm: "3.4rem" },
            fontWeight: 900,
          }}
        >
          {profile.imageLabel}
        </Typography>
        <Box sx={{ position: "absolute", bottom: -20, left: 22, width: 34, height: 34, borderRadius: "50%", bgcolor: "#101A16", border: `6px solid ${profile.accent}` }} />
        <Box sx={{ position: "absolute", bottom: -20, right: 22, width: 34, height: 34, borderRadius: "50%", bgcolor: "#101A16", border: `6px solid ${profile.accent}` }} />
      </Box>
    </Box>
  );
}
