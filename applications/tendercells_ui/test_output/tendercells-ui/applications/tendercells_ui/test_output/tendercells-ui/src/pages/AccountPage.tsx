// AccountPage.tsx
import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function AccountPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Account</Typography>
      <TextField label="Email" fullWidth margin="normal" />
      <TextField label="Password" fullWidth margin="normal" />
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Update Account</Button>
    </Box>
  );
}
