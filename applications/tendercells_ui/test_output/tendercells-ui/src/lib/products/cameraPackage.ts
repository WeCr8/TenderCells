// cameraPackage.ts - builds the second, linked registration a "package"
// template (e.g. "Chicken Tender + Camera") sends after its primary product
// registers. Pure/no React, no Firebase call - ProductRegistrationModal's
// handleSubmit just calls onRegister(buildBundleCameraRegistration(...))
// with the primary's real id, so this data-construction step is testable
// without mounting the modal or a Firebase backend.
import type { BuildSource, RegisterProductData } from '../../types/products';

export interface BundleCameraSpec {
  productName: string;
  model: string;
  controllerBoard: string;
  cameraModule: string;
  firmwareTarget: string;
  enabledCapabilities: string[];
}

export function buildBundleCameraRegistration(
  bundle: BundleCameraSpec,
  parentProductId: string,
  buildSource: BuildSource,
  senseCapabilities: string[]
): RegisterProductData {
  return {
    product_type: 'automation_device',
    product_name: bundle.productName,
    model: bundle.model,
    metadata: {
      product_family: 'camera-kit',
      build_source: buildSource,
      connection_type: 'tendercells-template',
      controller_board: bundle.controllerBoard,
      camera_module: bundle.cameraModule,
      firmware_target: bundle.firmwareTarget,
      hardware_capabilities: [...new Set([...senseCapabilities, ...bundle.enabledCapabilities])],
      enabled_capabilities: bundle.enabledCapabilities,
      capability_profile: 'camera_only',
      mounted_on_product_id: parentProductId,
    },
  };
}
