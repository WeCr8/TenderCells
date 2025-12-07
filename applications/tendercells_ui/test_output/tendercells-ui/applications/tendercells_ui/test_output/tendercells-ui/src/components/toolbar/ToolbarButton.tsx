// ToolbarButton.tsx
import React from "react";
import ActionButton, { ActionButtonProps } from "../common/ActionButton";

type ToolbarButtonProps = Omit<ActionButtonProps, "kind">;

export default function ToolbarButton(props: ToolbarButtonProps) {
  return <ActionButton kind="secondary" {...props} />;
}
