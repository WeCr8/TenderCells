import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Viewport3D from "./Viewport3D";

type ProductViewportPanelProps = {
  product: string;
  title: string;
};

export default function ProductViewportPanel({ product, title }: ProductViewportPanelProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1, sm: 1.5, md: 2 },
        mb: 2,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontSize: { xs: "1.1rem", sm: "1.35rem", md: "1.5rem" },
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      <Viewport3D
        product={product}
        title={title}
        initialWorkspaceMode="products"
        height={{ xs: "min(62dvh, 430px)", sm: "min(68dvh, 520px)", lg: 560 }}
      />
    </Paper>
  );
}
