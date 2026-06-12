import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useHardwareControl } from "../../hooks/useHardwareControl";

interface QuickActionsProps {
  deviceId: string;
}

export default function QuickActions({ deviceId }: QuickActionsProps) {
  const hardware = useHardwareControl(deviceId);
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      setConfirmDialog(null);
    } catch (error) {
      console.error("Hardware action failed:", error);
    }
  };

  const ConfirmDialog = ({ title, action }: { title: string; action: () => Promise<any> }) => (
    <Dialog open={confirmDialog === title} onClose={() => setConfirmDialog(null)}>
      <DialogTitle>Confirm Action</DialogTitle>
      <div style={{ padding: "16px", minWidth: "300px" }}>
        <p>Execute: {title}?</p>
        {hardware.error && <Alert severity="error">{hardware.error}</Alert>}
      </div>
      <DialogActions>
        <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
        <Button
          onClick={() => handleAction(action)}
          variant="contained"
          color="warning"
          disabled={hardware.isLoading}
        >
          {hardware.isLoading ? <CircularProgress size={20} /> : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => setConfirmDialog("Open Door")}
        >
          🚪 Door Open
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => setConfirmDialog("Close Door")}
        >
          🚪 Door Close
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => setConfirmDialog("Dispense Feed")}
        >
          🍽️ Feed
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => setConfirmDialog("Start Cleaning")}
        >
          🧹 Clean
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => setConfirmDialog("E-STOP")}
        >
          ⛔ ESTOP
        </Button>
      </Stack>

      <ConfirmDialog title="Open Door" action={hardware.openDoor} />
      <ConfirmDialog title="Close Door" action={hardware.closeDoor} />
      <ConfirmDialog title="Dispense Feed" action={() => hardware.dispenseFeed(100)} />
      <ConfirmDialog title="Start Cleaning" action={hardware.startCleaning} />
      <ConfirmDialog title="E-STOP" action={hardware.emergencyStop} />
    </>
  );
}
