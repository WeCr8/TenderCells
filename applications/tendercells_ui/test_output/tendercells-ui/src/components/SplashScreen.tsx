// SplashScreen.tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CircularProgress } from "@mui/material";

export default function SplashScreen() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#6750A4",
        color: "white",
      }}
    >
      <img src="/assets/images/tender_cells_logo.png" alt="Tender Cells Logo" style={{ width: "200px", marginBottom: "20px" }} />
      <Typography variant="h4">TenderCells</Typography>
      <CircularProgress sx={{ mt: 2, color: "white" }} />
    </Box>
  );
}
