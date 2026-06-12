import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Chip,
  Checkbox,
  Divider,
  Grid,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import CloudQueueOutlinedIcon from '@mui/icons-material/CloudQueueOutlined';
import EggAltOutlinedIcon from '@mui/icons-material/EggAltOutlined';
import FenceOutlinedIcon from '@mui/icons-material/FenceOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import DeveloperBoardOutlinedIcon from '@mui/icons-material/DeveloperBoardOutlined';
import DoorSlidingOutlinedIcon from '@mui/icons-material/DoorSlidingOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import { useTheme, useMediaQuery } from '@mui/material';
import QRCodeScanner from './QRCodeScanner';
import ConnectionSetupWizard from './ConnectionSetupWizard';
import type { BuildSource, HardwareSetupMode, Product, ProductFamily, ProductType, RegisterProductData, SimulationBackend } from '../../types/products';

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: RegisterProductData) => Promise<Product | void>;
  onRegisterFirstChickenTender?: () => Promise<Product | void>;
  showConnectionWizardAfterRegister?: boolean;
}

export default function ProductRegistrationModal({
  isOpen,
  onClose,
  onRegister,
  onRegisterFirstChickenTender,
  showConnectionWizardAfterRegister = true,
}: ProductRegistrationModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState<number>(0);
  const [productType, setProductType] = useState<ProductType>('hardware_unit');
  const [productName, setProductName] = useState('');
  const [productFamily, setProductFamily] = useState<ProductFamily>('chicken-tender');
  const [buildSource, setBuildSource] = useState<BuildSource>('tendercells-kit');
  const [selectedTemplateId, setSelectedTemplateId] = useState('chicken-tender-kit');
  const [customProductName, setCustomProductName] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [animalCount, setAnimalCount] = useState('4');
  const [hardwareSetupMode, setHardwareSetupMode] = useState<HardwareSetupMode>('sim_only');
  const [simulationBackend, setSimulationBackend] = useState<SimulationBackend>('browser_threejs');
  const [simulationProfile, setSimulationProfile] = useState('layout-and-axis-preview');
  const [roboticsMiddleware, setRoboticsMiddleware] = useState('mqtt_bridge');
  const [nvidiaIsaacScene, setNvidiaIsaacScene] = useState('');
  const [nvidiaIsaacRobotAsset, setNvidiaIsaacRobotAsset] = useState('');
  const [syntheticDataEnabled, setSyntheticDataEnabled] = useState(false);
  const [propertySimulationEnabled, setPropertySimulationEnabled] = useState(false);
  const [propertySceneUrl, setPropertySceneUrl] = useState('');
  const [terrainSource, setTerrainSource] = useState('manual_layout');
  const [terrainCaptureDeviceId, setTerrainCaptureDeviceId] = useState('');
  const [customDeviceAssetUrl, setCustomDeviceAssetUrl] = useState('');
  const [telemetryLearningEnabled, setTelemetryLearningEnabled] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [hardwareRevision, setHardwareRevision] = useState('');
  const [firmwareTarget, setFirmwareTarget] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [mqttBaseTopic, setMqttBaseTopic] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [schematicUrl, setSchematicUrl] = useState('');
  const [enclosureWidth, setEnclosureWidth] = useState('');
  const [enclosureDepth, setEnclosureDepth] = useState('');
  const [enclosureHeight, setEnclosureHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredProduct, setRegisteredProduct] = useState<Product | null>(null);
  const [isConnectionWizardOpen, setIsConnectionWizardOpen] = useState(false);

  const productTemplates = [
    {
      id: 'first-chicken-tender',
      title: 'First Chicken TenderCell',
      subtitle: 'Garage dev coop for zgoodbody@gmail.com with device ct_001.',
      description: 'Register our first real Chicken TenderCell for garage electronics, axes, motors, and safety testing.',
      icon: <CottageOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'chicken-tender' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Garage Chicken Tender 001',
      model: 'Chicken Tender Coop - Garage Dev Build',
      location: 'Garage Electronics Bench',
      ownerEmail: 'zgoodbody@gmail.com',
      deviceId: 'ct_001',
      hardwareRevision: 'garage-dev-r0',
      firmwareTarget: 'firmware/chicken-tender',
      mqttBaseTopic: 'tc/ct_001',
      serialNumber: 'TC-CT-GARAGE-0001',
      activationCode: 'TC-GARAGE-001',
      animalCount: '4',
      hardwareSetupMode: 'connect_now' as HardwareSetupMode,
      simulationBackend: 'hardware_in_loop' as SimulationBackend,
      roboticsMiddleware: 'mqtt_bridge',
      notes: 'First local coop device for garage electronics bring-up, axes, motors, and community kit validation.',
      primaryAction: 'Register First Device',
    },
    {
      id: 'chicken-tender-kit',
      title: 'Chicken Tender Kit',
      subtitle: 'Standard TenderCells coop product or kit build.',
      description: 'Automated coop with robotics, cleaning, feeding, monitoring, and smart access doors.',
      icon: <CottageOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'chicken-tender' as ProductFamily,
      buildSource: 'tendercells-kit' as BuildSource,
      productName: 'Chicken Tender',
      model: 'Chicken Tender Coop',
      firmwareTarget: 'firmware/chicken-tender',
    },
    {
      id: 'roaming-roost',
      title: 'Roaming Roost',
      subtitle: 'Mobile yard robot/product for roaming and simulation work.',
      description: 'Mobile motorized rearing enclosure that moves around a yard autonomously.',
      icon: <DirectionsCarOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'roaming-roost' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Roaming Roost',
      model: 'Roaming Roost Rover',
      firmwareTarget: 'firmware/roaming-roost',
      simulationBackend: 'nvidia_isaac' as SimulationBackend,
      simulationProfile: 'mobile-navigation-and-obstacle-avoidance',
      roboticsMiddleware: 'ros2',
      propertySimulationEnabled: true,
      telemetryLearningEnabled: true,
    },
    {
      id: 'duck-dock',
      title: 'Duck Dock',
      subtitle: 'Water and duck habitat automation.',
      description: 'Duck platform with cleaning, feeding, and water/pond management integration.',
      icon: <WaterDropOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'duck-dock' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Duck Dock',
      model: 'Duck Dock Platform',
      firmwareTarget: 'firmware/duck-dock',
    },
    {
      id: 'predator-monitor',
      title: 'WatchTower AI',
      subtitle: 'Predator Monitor',
      description: 'AI-powered perimeter monitor for detection, alerts, and camera workflows.',
      icon: <SecurityOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'predator-monitor' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'WatchTower AI',
      model: 'Predator Monitor',
      firmwareTarget: 'firmware/predator-monitor',
      simulationBackend: 'nvidia_isaac' as SimulationBackend,
      simulationProfile: 'synthetic-camera-detection',
      syntheticDataEnabled: true,
    },
    {
      id: 'goat-guardian',
      title: 'Goat Guardian',
      subtitle: 'Pasture and livestock automation.',
      description: 'Guardian product for gates, water, shelter, perimeter events, and herd monitoring.',
      icon: <GrassOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'goat-guardian' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Goat Guardian',
      model: 'Goat Guardian Field Unit',
      firmwareTarget: 'firmware/goat-guardian',
    },
    {
      id: 'bunny-burrow',
      title: 'Bunny Burrow',
      subtitle: 'Rabbit habitat automation.',
      description: 'Rabbit system for feeding, temperature control, safe housing, and habitat monitoring.',
      icon: <PetsOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'bunny-burrow' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Bunny Burrow',
      model: 'Bunny Burrow Habitat',
      firmwareTarget: 'firmware/bunny-burrow',
    },
    {
      id: 'turkey-tower',
      title: 'Turkey Tower',
      subtitle: 'Large-bird enclosure automation.',
      description: 'Automation platform for larger poultry housing, roosting, feeding, access, and monitoring.',
      icon: <FenceOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'turkey-tower' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Turkey Tower',
      model: 'Turkey Tower Enclosure',
      firmwareTarget: 'firmware/turkey-tower',
    },
    {
      id: 'rail-system',
      title: 'TenderCells Rail System',
      subtitle: 'Modular maintenance automation.',
      description: 'Rail-based platform for tools, cleaning modules, and enclosure attachments.',
      icon: <HubOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'rail-system-modules' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'TenderCells Rail System',
      model: 'Modular Rail Platform',
      firmwareTarget: 'firmware/rail-system',
      simulationBackend: 'nvidia_isaac' as SimulationBackend,
      simulationProfile: 'rail-axis-motion-and-collision',
      roboticsMiddleware: 'ros2',
    },
    {
      id: 'tendercells-cloud',
      title: 'TenderCells Cloud',
      subtitle: 'Software-only cloud workspace.',
      description: 'Cloud registration for dashboards, shared models, telemetry, remote management, and community software deployments.',
      icon: <CloudQueueOutlinedIcon />,
      productType: 'software_only' as ProductType,
      productFamily: 'tendercells-cloud' as ProductFamily,
      buildSource: 'open-source-diy' as BuildSource,
      productName: 'TenderCells Cloud',
      model: 'Cloud Workspace',
      activeTab: 3,
    },
    {
      id: 'door-system',
      title: 'Smart Door System',
      subtitle: 'Pop doors, access doors, and printed door assemblies.',
      description: 'Standalone door controller product for actuators, reed switches, limit switches, and safety lockouts.',
      icon: <DoorSlidingOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'door-system' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Smart Door System',
      model: 'TenderCells Door Module',
      firmwareTarget: 'firmware/door-system',
      activeTab: 3,
    },
    {
      id: 'latch-system',
      title: 'Latch System',
      subtitle: 'Servo latches and access locks.',
      description: 'Register latch hardware, magnetic sensors, printed brackets, and fail-safe locking modules.',
      icon: <DoorSlidingOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'latch-system' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Latch System',
      model: 'TenderCells Latch Module',
      firmwareTarget: 'firmware/latch-system',
      activeTab: 3,
    },
    {
      id: 'waterer',
      title: 'Smart Waterer',
      subtitle: 'Water level, valves, flow, and freeze protection.',
      description: 'Water product for float sensors, valves, heaters, reservoirs, and printed mounts.',
      icon: <LocalDrinkOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'waterer' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Smart Waterer',
      model: 'TenderCells Waterer Module',
      firmwareTarget: 'firmware/waterer',
      activeTab: 3,
    },
    {
      id: 'feeder',
      title: 'Smart Feeder',
      subtitle: 'Feed hoppers, augers, scales, and portion control.',
      description: 'Standalone feeder product for feed dispensing, reservoir sensing, anti-clog cycles, and calibration.',
      icon: <RestaurantOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'feeder' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Smart Feeder',
      model: 'TenderCells Feeder Module',
      firmwareTarget: 'firmware/feeder',
      activeTab: 3,
    },
    {
      id: 'sensor-pod',
      title: 'Sensor Pod',
      subtitle: 'Environmental and safety sensing.',
      description: 'Sensor module for temperature, humidity, air quality, presence, battery, and bus testing.',
      icon: <SensorsOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'sensor-pod' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Sensor Pod',
      model: 'TenderCells Sensor Pod',
      firmwareTarget: 'firmware/sensor-pod',
      activeTab: 3,
    },
    {
      id: 'camera-kit',
      title: 'Camera Kit',
      subtitle: 'Camera, enclosure, and AI vision accessory.',
      description: 'Register camera kits, IR modules, printed mounts, detection zones, and stream hardware.',
      icon: <CameraAltOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'camera-kit' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Camera Kit',
      model: 'TenderCells Camera Kit',
      firmwareTarget: 'firmware/camera-kit',
      activeTab: 3,
    },
    {
      id: 'motor-axis-kit',
      title: 'Motor / Axis Kit',
      subtitle: 'Motors, rails, carriages, homing, and motion testing.',
      description: 'Axis product for steppers, servos, motor drivers, endstops, rails, and jog/homing validation.',
      icon: <PrecisionManufacturingOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'motor-axis-kit' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Motor / Axis Kit',
      model: 'TenderCells Axis Module',
      firmwareTarget: 'firmware/motor-axis-kit',
      hardwareSetupMode: 'connect_now' as HardwareSetupMode,
      simulationBackend: 'nvidia_isaac' as SimulationBackend,
      simulationProfile: 'axis-jog-homing-limits',
      roboticsMiddleware: 'ros2',
      activeTab: 3,
    },
    {
      id: 'controller-board',
      title: 'Controller Board',
      subtitle: 'Main PCB, expansion board, or community controller.',
      description: 'Register the electronics board itself for firmware, pin maps, bus devices, and bench testing.',
      icon: <DeveloperBoardOutlinedIcon />,
      productType: 'automation_device' as ProductType,
      productFamily: 'controller-board' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Controller Board',
      model: 'TenderCells Controller',
      firmwareTarget: 'firmware/controller-board',
      hardwareSetupMode: 'connect_now' as HardwareSetupMode,
      activeTab: 3,
    },
    {
      id: 'printed-part',
      title: '3D Printed Part',
      subtitle: 'Printable brackets, housings, adapters, and fixtures.',
      description: 'Track printable products by revision, material, mounting location, and compatible parent products.',
      icon: <ExtensionOutlinedIcon />,
      productType: 'custom_product' as ProductType,
      productFamily: 'printed-part' as ProductFamily,
      buildSource: 'open-source-diy' as BuildSource,
      productName: '3D Printed Part',
      model: 'Printable Component',
      activeTab: 3,
    },
    {
      id: 'pigeon-palace',
      title: 'Pigeon Palace',
      subtitle: 'Smart loft automation.',
      description: 'Automated loft product for feeding, access doors, environmental checks, and bird monitoring.',
      icon: <EggAltOutlinedIcon />,
      productType: 'hardware_unit' as ProductType,
      productFamily: 'pigeon-palace' as ProductFamily,
      buildSource: 'prototype' as BuildSource,
      productName: 'Pigeon Palace',
      model: 'Pigeon Palace Loft',
      firmwareTarget: 'firmware/pigeon-palace',
    },
    {
      id: 'custom-build',
      title: 'Custom Build',
      subtitle: 'Open-source DIY, third-party hardware, or community product.',
      description: 'Register your own hardware, fork, prototype, or software-only product.',
      icon: <ExtensionOutlinedIcon />,
      productType: 'custom_product' as ProductType,
      productFamily: 'community-custom' as ProductFamily,
      buildSource: 'open-source-diy' as BuildSource,
      productName: '',
      model: '',
      activeTab: 3,
    },
  ];

  const applyTemplate = (template: typeof productTemplates[number]) => {
    setSelectedTemplateId(template.id);
    setProductType(template.productType);
    setProductFamily(template.productFamily);
    setBuildSource(template.buildSource);
    setProductName(template.productName || '');
    setModel(template.model || '');
    setLocation(template.location || '');
    setAnimalCount(template.animalCount || '4');
    setHardwareSetupMode(template.hardwareSetupMode || 'sim_only');
    setSimulationBackend(template.simulationBackend || 'browser_threejs');
    setSimulationProfile(template.simulationProfile || 'layout-and-axis-preview');
    setRoboticsMiddleware(template.roboticsMiddleware || 'mqtt_bridge');
    setNvidiaIsaacScene('');
    setNvidiaIsaacRobotAsset('');
    setSyntheticDataEnabled(Boolean(template.syntheticDataEnabled));
    setPropertySimulationEnabled(Boolean(template.propertySimulationEnabled));
    setPropertySceneUrl('');
    setTerrainSource('manual_layout');
    setTerrainCaptureDeviceId('');
    setCustomDeviceAssetUrl('');
    setTelemetryLearningEnabled(Boolean(template.telemetryLearningEnabled));
    setOwnerEmail(template.ownerEmail || '');
    setDeviceId(template.deviceId || '');
    setHardwareRevision(template.hardwareRevision || '');
    setFirmwareTarget(template.firmwareTarget || '');
    setFirmwareVersion('');
    setMqttBaseTopic(template.mqttBaseTopic || '');
    setRepoUrl('');
    setSchematicUrl('');
    setEnclosureWidth('');
    setEnclosureDepth('');
    setEnclosureHeight('');
    setNotes(template.notes || '');
    setSerialNumber(template.serialNumber || '');
    setActivationCode(template.activationCode || '');
    setQrCode('');
    setActiveTab(template.activeTab ?? 0);
    setErrors({});
    setSubmitError(null);
  };

  const handleRegisterFirstChickenTender = async () => {
    if (!onRegisterFirstChickenTender) {
      applyTemplate(productTemplates[0]);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onRegisterFirstChickenTender();
      if (result && 'id' in result && showConnectionWizardAfterRegister) {
        setRegisteredProduct(result as Product);
        setIsConnectionWizardOpen(true);
      } else {
        onClose();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to register first Chicken TenderCell');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(0);
      setProductType('hardware_unit');
      setProductFamily('chicken-tender');
      setBuildSource('tendercells-kit');
      setSelectedTemplateId('chicken-tender-kit');
      setCustomProductName('');
      setProductName('');
      setModel('');
      setLocation('');
      setAnimalCount('4');
      setHardwareSetupMode('sim_only');
      setSimulationBackend('browser_threejs');
      setSimulationProfile('layout-and-axis-preview');
      setRoboticsMiddleware('mqtt_bridge');
      setNvidiaIsaacScene('');
      setNvidiaIsaacRobotAsset('');
      setSyntheticDataEnabled(false);
      setPropertySimulationEnabled(false);
      setPropertySceneUrl('');
      setTerrainSource('manual_layout');
      setTerrainCaptureDeviceId('');
      setCustomDeviceAssetUrl('');
      setTelemetryLearningEnabled(false);
      setOwnerEmail('');
      setDeviceId('');
      setHardwareRevision('');
      setFirmwareTarget('');
      setFirmwareVersion('');
      setMqttBaseTopic('');
      setRepoUrl('');
      setSchematicUrl('');
      setEnclosureWidth('');
      setEnclosureDepth('');
      setEnclosureHeight('');
      setNotes('');
      setSerialNumber('');
      setActivationCode('');
      setQrCode('');
      setErrors({});
      setSubmitError(null);
      setRegisteredProduct(null);
      setIsConnectionWizardOpen(false);
    }
  }, [isOpen]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setErrors({});
    setSubmitError(null);
  };

  const handleQRScan = (result: string) => {
    setQrCode(result);
    setQrScannerOpen(false);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.qr_code;
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    // Validate based on active tab (registration method)
    if (activeTab === 0 && !serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    } else if (activeTab === 1 && !qrCode.trim()) {
      newErrors.qrCode = 'QR code is required. Please scan or enter manually.';
    } else if (activeTab === 2 && !activationCode.trim()) {
      newErrors.activationCode = 'Activation code is required';
    }

    if (productFamily === 'community-custom' && !customProductName.trim()) {
      newErrors.customProductName = 'Custom product name is required for community/custom builds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const registrationData: RegisterProductData = {
        product_type: productType,
        product_name: productName.trim(),
        model: model.trim() || undefined,
        location: location.trim() || undefined,
        serial_number: activeTab === 0 ? serialNumber.trim() : undefined,
        qr_code: activeTab === 1 ? qrCode.trim() : undefined,
        activation_code: activeTab === 2 ? activationCode.trim() : undefined,
        device_id: deviceId.trim() || undefined,
        metadata: {
          owner_email: ownerEmail.trim() || undefined,
          product_family: productFamily,
          build_source: buildSource,
          custom_product_name: customProductName.trim() || undefined,
          hardware_revision: hardwareRevision.trim() || undefined,
          firmware_target: firmwareTarget.trim() || undefined,
          firmware_version: firmwareVersion.trim() || undefined,
          mqtt_base_topic: mqttBaseTopic.trim() || undefined,
          repo_url: repoUrl.trim() || undefined,
          schematic_url: schematicUrl.trim() || undefined,
          enclosure_width_ft: enclosureWidth ? Number(enclosureWidth) : undefined,
          enclosure_depth_ft: enclosureDepth ? Number(enclosureDepth) : undefined,
          enclosure_height_ft: enclosureHeight ? Number(enclosureHeight) : undefined,
          animal_count: animalCount ? Number(animalCount) : undefined,
          hardware_setup_mode: hardwareSetupMode,
          setup_intent: hardwareSetupMode === 'connect_now' ? 'Connect hardware during registration' : 'Simulation-only setup for layout and validation',
          simulation_backend: simulationBackend,
          simulation_profile: simulationProfile.trim() || undefined,
          robotics_middleware: roboticsMiddleware,
          synthetic_data_enabled: syntheticDataEnabled,
          nvidia_isaac_enabled: simulationBackend === 'nvidia_isaac',
          nvidia_isaac_scene: nvidiaIsaacScene.trim() || undefined,
          nvidia_isaac_robot_asset: nvidiaIsaacRobotAsset.trim() || undefined,
          property_simulation_enabled: propertySimulationEnabled,
          property_scene_url: propertySceneUrl.trim() || undefined,
          terrain_source: terrainSource,
          terrain_capture_device_id: terrainCaptureDeviceId.trim() || undefined,
          terrain_detail_status: propertySimulationEnabled ? 'manual' : 'not_started',
          custom_device_asset_url: customDeviceAssetUrl.trim() || undefined,
          telemetry_learning_enabled: telemetryLearningEnabled,
          notes: notes.trim() || undefined,
        },
      };

      const result = await onRegister(registrationData);
      
      // If registration returns a product and we should show connection wizard, open it
      if (result && 'id' in result && showConnectionWizardAfterRegister) {
        setRegisteredProduct(result as Product);
        setIsConnectionWizardOpen(true);
        // Keep modal open but show connection wizard instead
      } else {
        onClose();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to register product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#001F17',
            border: '1px solid rgba(200, 184, 130, 0.18)',
            backgroundImage: 'radial-gradient(circle at top right, rgba(107, 191, 89, 0.12), transparent 34%)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="overline" sx={{ color: '#9FB08D', letterSpacing: 4 }}>
            Tender Cells | Product Registration
          </Typography>
          <Typography variant="h4" sx={{ color: '#E6E8D8', fontSize: { xs: 28, md: 40 }, mt: 0.5 }}>
            Choose a Tender Cells product
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pick which unit you want to register, simulate, or connect to hardware.
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Box>
              <Grid container spacing={1.5}>
                {productTemplates.map((template) => (
                  <Grid item xs={12} sm={6} key={template.id}>
                    <Paper
                      component="button"
                      type="button"
                      onClick={() => applyTemplate(template)}
                      sx={{
                        p: 2,
                        height: '100%',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        bgcolor: selectedTemplateId === template.id ? 'rgba(107, 191, 89, 0.13)' : 'rgba(0, 43, 31, 0.64)',
                        border: `1px solid ${selectedTemplateId === template.id ? '#C8E6A0' : 'rgba(159, 176, 141, 0.28)'}`,
                        borderRadius: 1,
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: '#C8E6A0',
                          bgcolor: 'rgba(107, 191, 89, 0.10)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ color: '#DDF2B1', '& svg': { fontSize: 48 } }}>
                          {template.icon}
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="h6" sx={{ color: '#F0F2DA' }}>
                              {template.title}
                            </Typography>
                            {template.id === 'first-chicken-tender' && <Chip size="small" label="Garage" color="success" />}
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#C8E6A0', mb: 0.75 }}>
                            {template.subtitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            <Paper
              sx={{
                p: { xs: 1.5, md: 2 },
                bgcolor: 'rgba(0, 27, 20, 0.72)',
                border: '1px solid rgba(200, 184, 130, 0.18)',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 120, minHeight: 96, color: '#DDF2B1' }}>
                  {productTemplates.find((template) => template.id === selectedTemplateId)?.icon || <PetsOutlinedIcon />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ color: '#E6E8D8' }}>
                    {productName || customProductName || 'Custom product'} Registration Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirm the product name, location, animal count, and hardware setup before registering.
                  </Typography>
                </Box>
                {selectedTemplateId === 'first-chicken-tender' && (
                  <Button variant="contained" onClick={handleRegisterFirstChickenTender} disabled={isSubmitting}>
                    Register First Device
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Product Type Selection */}
            <FormControl fullWidth required>
              <InputLabel>Product Type</InputLabel>
              <Select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                label="Product Type"
              >
                <MenuItem value="hardware_unit">Hardware Unit</MenuItem>
                <MenuItem value="automation_device">Automation Device</MenuItem>
                <MenuItem value="custom_product">Custom Product</MenuItem>
                <MenuItem value="software_only">Software Only</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Product Family</InputLabel>
                  <Select
                    value={productFamily}
                    onChange={(e) => {
                      const value = e.target.value as ProductFamily;
                      setProductFamily(value);
                      if (value === 'community-custom') {
                        setProductType('custom_product');
                      }
                    }}
                    label="Product Family"
                  >
                    <MenuItem value="chicken-tender">Chicken Tender</MenuItem>
                    <MenuItem value="roaming-roost">Roaming Roost</MenuItem>
                    <MenuItem value="duck-dock">Duck Dock</MenuItem>
                    <MenuItem value="goat-guardian">Goat Guardian</MenuItem>
                    <MenuItem value="bunny-burrow">Bunny Burrow</MenuItem>
                    <MenuItem value="turkey-tower">Turkey Tower</MenuItem>
                    <MenuItem value="predator-monitor">Predator Monitor</MenuItem>
                    <MenuItem value="rail-system">Rail System</MenuItem>
                    <MenuItem value="rail-system-modules">Rail System Modules</MenuItem>
                    <MenuItem value="tendercells-cloud">TenderCells Cloud</MenuItem>
                    <MenuItem value="pigeon-palace">Pigeon Palace</MenuItem>
                    <MenuItem value="door-system">Door System</MenuItem>
                    <MenuItem value="latch-system">Latch System</MenuItem>
                    <MenuItem value="waterer">Waterer</MenuItem>
                    <MenuItem value="feeder">Feeder</MenuItem>
                    <MenuItem value="sensor-pod">Sensor Pod</MenuItem>
                    <MenuItem value="camera-kit">Camera Kit</MenuItem>
                    <MenuItem value="motor-axis-kit">Motor / Axis Kit</MenuItem>
                    <MenuItem value="controller-board">Controller Board</MenuItem>
                    <MenuItem value="printed-part">3D Printed Part</MenuItem>
                    <MenuItem value="community-custom">Community Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Build Source</InputLabel>
                  <Select
                    value={buildSource}
                    onChange={(e) => setBuildSource(e.target.value as BuildSource)}
                    label="Build Source"
                  >
                    <MenuItem value="tendercells-kit">TenderCells Kit</MenuItem>
                    <MenuItem value="prebuilt-unit">Prebuilt Unit</MenuItem>
                    <MenuItem value="open-source-diy">Open Source DIY</MenuItem>
                    <MenuItem value="third-party">Third Party</MenuItem>
                    <MenuItem value="prototype">Prototype</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {productFamily === 'community-custom' && (
              <TextField
                fullWidth
                label="Custom Product Name"
                value={customProductName}
                onChange={(e) => {
                  setCustomProductName(e.target.value);
                  if (errors.customProductName) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.customProductName;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!errors.customProductName}
                helperText={errors.customProductName || 'Use this for community hardware, forks, and experimental products.'}
                placeholder="e.g., Solar Pasture Gate Controller"
              />
            )}

            {/* Product Name */}
            <TextField
              fullWidth
              label="Product Name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (errors.productName) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.productName;
                    return newErrors;
                  });
                }
              }}
              required
              error={!!errors.productName}
              helperText={errors.productName}
              placeholder="e.g., Chicken Tender, Roaming Roost"
            />

            {/* Model */}
            <TextField
              fullWidth
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Product model (optional)"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Main Coop, Run A, Garage Bench"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Animals"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Optional for shared/community builds"
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Hardware Setup
              </Typography>
              <RadioGroup
                row={!isMobile}
                value={hardwareSetupMode}
                onChange={(e) => setHardwareSetupMode(e.target.value as HardwareSetupMode)}
              >
                <FormControlLabel value="sim_only" control={<Radio />} label="Sim-only testing" />
                <FormControlLabel value="connect_now" control={<Radio />} label="Connect hardware now" />
              </RadioGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Simulation Backend
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Simulator</InputLabel>
                    <Select
                      value={simulationBackend}
                      onChange={(e) => setSimulationBackend(e.target.value as SimulationBackend)}
                      label="Simulator"
                    >
                      <MenuItem value="browser_threejs">Browser Three.js</MenuItem>
                      <MenuItem value="nvidia_isaac">NVIDIA Isaac / Omniverse</MenuItem>
                      <MenuItem value="ros_gazebo">ROS / Gazebo</MenuItem>
                      <MenuItem value="hardware_in_loop">Hardware-in-loop</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Middleware</InputLabel>
                    <Select
                      value={roboticsMiddleware}
                      onChange={(e) => setRoboticsMiddleware(e.target.value)}
                      label="Middleware"
                    >
                      <MenuItem value="mqtt_bridge">MQTT Bridge</MenuItem>
                      <MenuItem value="ros2">ROS 2</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Simulation Profile"
                    value={simulationProfile}
                    onChange={(e) => setSimulationProfile(e.target.value)}
                    placeholder="e.g., axis-jog-homing-limits"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Checkbox checked={syntheticDataEnabled} onChange={(e) => setSyntheticDataEnabled(e.target.checked)} />}
                    label="Use synthetic data"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Checkbox checked={propertySimulationEnabled} onChange={(e) => setPropertySimulationEnabled(e.target.checked)} />}
                    label="Run on property scene"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Checkbox checked={telemetryLearningEnabled} onChange={(e) => setTelemetryLearningEnabled(e.target.checked)} />}
                    label="Improve terrain from device data"
                  />
                </Grid>
                {simulationBackend === 'nvidia_isaac' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Isaac Scene"
                        value={nvidiaIsaacScene}
                        onChange={(e) => setNvidiaIsaacScene(e.target.value)}
                        placeholder="e.g., scenes/chicken-tender-garage.usd"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Isaac Robot Asset"
                        value={nvidiaIsaacRobotAsset}
                        onChange={(e) => setNvidiaIsaacRobotAsset(e.target.value)}
                        placeholder="e.g., robots/tendercells-axis-kit.usd"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Property Scene URL"
                        value={propertySceneUrl}
                        onChange={(e) => setPropertySceneUrl(e.target.value)}
                        placeholder="e.g., scenes/my-yard.usd"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Custom Device Asset URL"
                        value={customDeviceAssetUrl}
                        onChange={(e) => setCustomDeviceAssetUrl(e.target.value)}
                        placeholder="e.g., assets/devices/my-waterer.usd"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Terrain Source</InputLabel>
                        <Select
                          value={terrainSource}
                          onChange={(e) => setTerrainSource(e.target.value)}
                          label="Terrain Source"
                        >
                          <MenuItem value="manual_layout">Manual layout</MenuItem>
                          <MenuItem value="device_telemetry">Device telemetry</MenuItem>
                          <MenuItem value="depth_camera">Depth camera</MenuItem>
                          <MenuItem value="lidar">LiDAR</MenuItem>
                          <MenuItem value="photogrammetry">Photogrammetry</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Terrain Capture Device"
                        value={terrainCaptureDeviceId}
                        onChange={(e) => setTerrainCaptureDeviceId(e.target.value)}
                        placeholder="e.g., rr-yard-01, camera-kit-01"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">
                        NVIDIA simulation is optional and intended for robotics development, synthetic camera data, motion envelopes, collision checks, property scenes, custom device assets, and future terrain learning from device telemetry.
                      </Alert>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            <Divider />
            <Typography variant="subtitle2">Device & Build Details</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device ID"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="e.g., ct_001, rr-yard-01"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MQTT Base Topic"
                  value={mqttBaseTopic}
                  onChange={(e) => setMqttBaseTopic(e.target.value)}
                  placeholder="e.g., tc/ct_001"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hardware Revision"
                  value={hardwareRevision}
                  onChange={(e) => setHardwareRevision(e.target.value)}
                  placeholder="e.g., garage-dev-r0, community-v1"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Firmware Target"
                  value={firmwareTarget}
                  onChange={(e) => setFirmwareTarget(e.target.value)}
                  placeholder="e.g., firmware/chicken-tender"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Firmware Version"
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  placeholder="Optional"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Repo URL"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Optional open-source repo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Schematic/BOM URL"
                  value={schematicUrl}
                  onChange={(e) => setSchematicUrl(e.target.value)}
                  placeholder="Optional docs, CAD, schematic, or BOM link"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Width ft"
                  value={enclosureWidth}
                  onChange={(e) => setEnclosureWidth(e.target.value)}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Depth ft"
                  value={enclosureDepth}
                  onChange={(e) => setEnclosureDepth(e.target.value)}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Height ft"
                  value={enclosureHeight}
                  onChange={(e) => setEnclosureHeight(e.target.value)}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Build Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Controller board, motors, sensors, enclosure notes, known issues..."
            />

            {/* Registration Method Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label="Serial Number" />
                <Tab label="QR Code" />
                <Tab label="Activation Code" />
                <Tab label="Manual Build" />
              </Tabs>
            </Box>

            {/* Serial Number Tab */}
            {activeTab === 0 && (
              <TextField
                fullWidth
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => {
                  setSerialNumber(e.target.value);
                  if (errors.serialNumber) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.serialNumber;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!errors.serialNumber}
                helperText={errors.serialNumber}
                placeholder="Enter product serial number"
              />
            )}

            {/* QR Code Tab */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setQrScannerOpen(true)}
                  fullWidth
                >
                  Scan QR Code
                </Button>
                <TextField
                  fullWidth
                  label="QR Code"
                  value={qrCode}
                  onChange={(e) => {
                    setQrCode(e.target.value);
                    if (errors.qrCode) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.qrCode;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  error={!!errors.qrCode}
                  helperText={errors.qrCode || 'Scan QR code or enter manually'}
                  placeholder="QR code will appear here after scanning"
                />
              </Box>
            )}

            {/* Activation Code Tab */}
            {activeTab === 2 && (
              <TextField
                fullWidth
                label="Activation Code"
                value={activationCode}
                onChange={(e) => {
                  setActivationCode(e.target.value);
                  if (errors.activationCode) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.activationCode;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!errors.activationCode}
                helperText={errors.activationCode}
                placeholder="Enter activation code"
              />
            )}

            {activeTab === 3 && (
              <Alert severity="info">
                Manual registration is for open-source DIY, prototype, and custom community products without a factory serial or activation code.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
      />

      {/* Connection Setup Wizard - Opens after product registration */}
      {registeredProduct && (
        <ConnectionSetupWizard
          isOpen={isConnectionWizardOpen}
          onClose={() => {
            setIsConnectionWizardOpen(false);
            setRegisteredProduct(null);
            onClose(); // Close registration modal after connection wizard closes
          }}
          product={registeredProduct}
          onComplete={() => {
            setIsConnectionWizardOpen(false);
            setRegisteredProduct(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

