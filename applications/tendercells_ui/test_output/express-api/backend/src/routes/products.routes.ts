import { Router } from "express";
import type { Request, Response } from "express";
import { AUTH_ENABLED, requireAuth, type AuthedRequest } from "../middleware/auth.js";

type ProductType = "hardware_unit" | "automation_device" | "custom_product" | "software_only";
type ProductStatus = "setup_required" | "connected" | "disconnected" | "maintenance" | "retired";
type ConnectionStatus = "online" | "offline" | "unknown";

interface Product {
  id: string;
  user_id: string;
  product_type: ProductType;
  product_name: string;
  model: string;
  serial_number: string;
  activation_code?: string;
  qr_code?: string;
  status: ProductStatus;
  connection_status: ConnectionStatus;
  device_id?: string;
  network_config?: Record<string, unknown>;
  location?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const router = Router();

// FIX(2026-10-12): this in-memory product registry (a dev/LAN mock - nothing persists) was
// open even on a hub with accounts on: anyone could list every product with its activation
// code, edit, delete or re-link it. With accounts on it now needs a signed-in caller and
// shows each person only their own products. LAN/demo mode is unchanged.
router.use(requireAuth);

/** May this caller see / change this product? Always true in LAN/demo mode. */
export function canAccessProduct(product: { user_id: string }, uid: string | undefined, authEnabled = AUTH_ENABLED): boolean {
  return !authEnabled || (Boolean(uid) && product.user_id === uid);
}
const uidOf = (req: Request) => (req as AuthedRequest).uid;
const mine = (req: Request) => products.filter((p) => canAccessProduct(p, uidOf(req)));
const findMine = (req: Request) => mine(req).find((item) => item.id === req.params.id);

const nowIso = () => new Date().toISOString();

const products: Product[] = [
  {
    id: "demo-chicken-tender-001",
    user_id: "demo-local-owner",
    product_type: "hardware_unit",
    product_name: "Demo Chicken Tender 001",
    model: "Chicken Tender Coop - Demo Build",
    serial_number: "TC-CT-DEMO-0001",
    activation_code: "TC-DEMO-001",
    qr_code: "tendercells://register?serial=TC-CT-DEMO-0001&device=ct_001",
    status: "setup_required",
    connection_status: "offline",
    device_id: "ct_001",
    network_config: { connected: false },
    location: "Demo Workspace",
    metadata: {
      owner_email: "demo-local-owner",
      source: "express-api-dev-seed",
      product_family: "chicken-tender",
      mqtt_base_topic: "tc/ct_001",
      simulation_backend: "hardware_in_loop",
      safety_validation_status: "bench_tested",
      telemetry_consent: "local_only",
    },
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

function stats(list: Product[]) {
  return {
    totalProducts: list.length,
    hardwareUnits: list.filter((product) => product.product_type === "hardware_unit").length,
    automationDevices: list.filter((product) => product.product_type === "automation_device").length,
    connectedProducts: list.filter((product) => product.status === "connected").length,
    disconnectedProducts: list.filter((product) => product.status === "disconnected").length,
    setupRequired: list.filter((product) => product.status === "setup_required").length,
    onlineProducts: list.filter((product) => product.connection_status === "online").length,
    offlineProducts: list.filter((product) => product.connection_status === "offline").length,
  };
}

router.get("/", (req: Request, res: Response) => {
  res.json(mine(req));
});

router.get("/stats", (req: Request, res: Response) => {
  res.json(stats(mine(req)));
});

router.post("/", (req: Request, res: Response) => {
  const body = req.body as Partial<Product>;
  const now = nowIso();
  const serial = body.serial_number || `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const product: Product = {
    id: body.id || `api-dev-${Date.now()}`,
    user_id: AUTH_ENABLED ? uidOf(req)! : String(body.metadata?.owner_email || body.user_id || "local-dev"),
    product_type: body.product_type || "custom_product",
    product_name: body.product_name || "Custom TenderCells Product",
    model: body.model || "Community Custom Build",
    serial_number: serial,
    activation_code: body.activation_code,
    qr_code: body.qr_code,
    status: body.status || "setup_required",
    connection_status: body.connection_status || "offline",
    device_id: body.device_id || serial.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    network_config: body.network_config || {},
    location: body.location || "Local Dev",
    metadata: { source: "express-api-dev", ...body.metadata },
    created_at: now,
    updated_at: now,
  };
  products.unshift(product);
  res.status(201).json(product);
});

router.get("/:id", (req: Request, res: Response) => {
  const product = findMine(req);
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.json(product);
});

router.put("/:id", (req: Request, res: Response) => {
  const current = findMine(req);
  const index = current ? products.indexOf(current) : -1;
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  const { id: _id, user_id: _owner, created_at: _created, ...patch } = (req.body ?? {}) as Partial<Product>;
  products[index] = {
    ...products[index],
    ...patch,
    metadata: { ...products[index].metadata, ...req.body?.metadata },
    updated_at: nowIso(),
  };
  return res.json(products[index]);
});

router.delete("/:id", (req: Request, res: Response) => {
  const current = findMine(req);
  const index = current ? products.indexOf(current) : -1;
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  products.splice(index, 1);
  return res.status(204).send();
});

router.post("/:id/connect", (req: Request, res: Response) => {
  const product = findMine(req);
  if (!product) return res.status(404).json({ error: "Product not found" });
  product.status = "connected";
  product.connection_status = "online";
  product.network_config = { ...product.network_config, ...req.body?.network_config, connected: true };
  product.updated_at = nowIso();
  return res.json(product);
});

router.post("/:id/disconnect", (req: Request, res: Response) => {
  const product = findMine(req);
  if (!product) return res.status(404).json({ error: "Product not found" });
  product.status = "disconnected";
  product.connection_status = "offline";
  product.network_config = { ...product.network_config, connected: false };
  product.updated_at = nowIso();
  return res.json(product);
});

router.post("/:id/link-device", (req: Request, res: Response) => {
  const product = findMine(req);
  if (!product) return res.status(404).json({ error: "Product not found" });
  // Accept device_id too: every other field on this API is snake_case.
  product.device_id = req.body?.deviceId || req.body?.device_id || product.device_id;
  product.updated_at = nowIso();
  return res.json(product);
});

router.post("/validate", (req: Request, res: Response) => {
  const code = String(req.body?.code || "");
  const product = products.find((item) =>
    item.serial_number === code || item.activation_code === code || item.qr_code === code
  );
  // Never hand another account's product (and its activation code) to the caller.
  const visible = product && canAccessProduct(product, uidOf(req));
  return res.json({ valid: Boolean(product), productInfo: visible ? product : undefined });
});

export default router;
