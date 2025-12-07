// ActionButton.tsx
import React from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export type ActionKind = "primary" | "secondary" | "danger" | "ghost";
export type ActionIcon = "save" | "close" | "delete" | "edit" | "none";

export interface ActionButtonProps extends ButtonProps {
  kind?: ActionKind;
  icon?: ActionIcon;
  label: string;
}

function resolveIcon(icon: ActionIcon) {
  switch (icon) {
    case "save":
      return <SaveIcon fontSize="small" />;
    case "close":
      return <CloseIcon fontSize="small" />;
    case "delete":
      return <DeleteIcon fontSize="small" />;
    case "edit":
      return <EditIcon fontSize="small" />;
    default:
      return null;
  }
}

export default function ActionButton({
  kind = "primary",
  icon = "none",
  label,
  ...rest
}: ActionButtonProps) {
  const color =
    kind === "danger" ? "error" : kind === "secondary" ? "secondary" : "primary";
  const variant =
    kind === "ghost" ? "text" : kind === "secondary" ? "outlined" : "contained";

  const startIcon = icon !== "none" ? resolveIcon(icon) : undefined;

  return (
    <Button
      color={color}
      variant={variant}
      size="small"
      startIcon={startIcon}
      {...rest}
    >
      {label}
    </Button>
  );
}
