// DeviceControl screen — main hardware control interface
// React Native Expo app
// Last updated: 2026-06-11

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MQTTService, {
  sendArmCommand,
  sendDoorCommand,
  sendFeedCommand,
  sendCleanCommand,
  sendEstop,
  subscribeTelemetry,
} from '../services/mqtt';

const colors = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

interface TelemetryData {
  temperature: number;
  humidity: number;
  ammonia: number;
  feedLevel: number;
  waterLevel: number;
  chickenCount: number;
  doorState: string;
  systemState: string;
}

export function DeviceControl() {
  const [mqtt, setMqtt] = useState<MQTTService | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const deviceId = 'chicken_tender_001';
  const brokerIP = '192.168.1.100'; // Change to your Pi IP

  useEffect(() => {
    initializeMQTT();
  }, []);

  const initializeMQTT = async () => {
    try {
      const service = new MQTTService({
        broker: brokerIP,
        port: 1883,
      });

      await service.connect();
      setMqtt(service);
      setConnected(true);

      // Subscribe to telemetry
      subscribeTelemetry(service, deviceId, (data) => {
        setTelemetry(data);
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to MQTT broker. Make sure:\n' +
        '1. Broker is running: mosquitto -c mosquitto.conf\n' +
        '2. IP address is correct: ' + brokerIP
      );
      setLoading(false);
    }
  };

  const handleDoorOpen = async () => {
    if (!mqtt) return;
    Alert.alert('Open Door', 'Send command to open coop door?', [
      { text: 'Cancel' },
      {
        text: 'Open',
        onPress: () => {
          sendDoorCommand(mqtt, deviceId, 'open');
          Alert.alert('✓', 'Door open command sent');
        },
      },
    ]);
  };

  const handleDoorClose = async () => {
    if (!mqtt) return;
    Alert.alert('Close Door', 'Send command to close coop door?', [
      { text: 'Cancel' },
      {
        text: 'Close',
        onPress: () => {
          sendDoorCommand(mqtt, deviceId, 'close');
          Alert.alert('✓', 'Door close command sent');
        },
      },
    ]);
  };

  const handleFeed = async () => {
    if (!mqtt) return;
    Alert.alert('Dispense Feed', 'Dispense feed for chickens?', [
      { text: 'Cancel' },
      {
        text: 'Dispense',
        onPress: () => {
          sendFeedCommand(mqtt, deviceId, 100);
          Alert.alert('✓', 'Feed dispense command sent');
        },
      },
    ]);
  };

  const handleCleaning = async () => {
    if (!mqtt) return;
    Alert.alert(
      'Start Cleaning',
      'Start coop cleaning cycle? (5-10 minutes)',
      [
        { text: 'Cancel' },
        {
          text: 'Start',
          onPress: () => {
            sendCleanCommand(mqtt, deviceId, 'start');
            Alert.alert('✓', 'Cleaning cycle started');
          },
        },
      ]
    );
  };

  const handleEstop = async () => {
    if (!mqtt) return;
    Alert.alert(
      '⚠️ E-STOP',
      'EMERGENCY STOP - Cut power to all actuators?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'E-STOP',
          onPress: () => {
            sendEstop(mqtt, deviceId);
            Alert.alert('🛑', 'E-STOP activated - system halted');
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.text}>Connecting to hardware...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusCard}>
        <Text style={styles.title}>Chicken Tender Controller</Text>
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              { color: connected ? colors.accent : colors.danger },
            ]}
          >
            {connected ? '● Online' : '● Offline'}
          </Text>
        </View>
      </View>

      {/* Telemetry */}
      {telemetry && (
        <View style={styles.telemetrySection}>
          <Text style={styles.sectionTitle}>📊 Live Sensors</Text>

          <View style={styles.sensorGrid}>
            <SensorBox
              label="Temperature"
              value={`${telemetry.temperature.toFixed(1)}°F`}
              color={
                telemetry.temperature < 35 || telemetry.temperature > 85
                  ? colors.warning
                  : colors.accent
              }
            />
            <SensorBox
              label="Humidity"
              value={`${telemetry.humidity.toFixed(0)}%`}
              color={colors.accent}
            />
            <SensorBox
              label="Ammonia"
              value={`${telemetry.ammonia.toFixed(1)} ppm`}
              color={telemetry.ammonia > 10 ? colors.warning : colors.accent}
            />
            <SensorBox
              label="Feed Level"
              value={`${telemetry.feedLevel.toFixed(0)}%`}
              color={
                telemetry.feedLevel < 20 ? colors.warning : colors.accent
              }
            />
            <SensorBox
              label="Water Level"
              value={`${telemetry.waterLevel.toFixed(0)}%`}
              color={
                telemetry.waterLevel < 15 ? colors.warning : colors.accent
              }
            />
            <SensorBox
              label="Chickens"
              value={`${telemetry.chickenCount}`}
              color={colors.accent}
            />
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>🎮 Control</Text>

        <ControlButton
          label="🚪 Open Door"
          onPress={handleDoorOpen}
          color={colors.accent}
        />
        <ControlButton
          label="🚪 Close Door"
          onPress={handleDoorClose}
          color={colors.accent}
        />
        <ControlButton
          label="🌾 Dispense Feed"
          onPress={handleFeed}
          color={colors.accent}
        />
        <ControlButton
          label="🧹 Start Cleaning"
          onPress={handleCleaning}
          color={colors.warning}
        />
        <ControlButton
          label="🛑 E-STOP"
          onPress={handleEstop}
          color={colors.danger}
        />
      </View>

      {/* Connection Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Broker: {brokerIP}:1883
        </Text>
        <Text style={styles.infoText}>
          Device: {deviceId}
        </Text>
        <Text style={styles.infoText}>
          All commands require confirmation
        </Text>
      </View>
    </ScrollView>
  );
}

interface SensorBoxProps {
  label: string;
  value: string;
  color: string;
}

function SensorBox({ label, value, color }: SensorBoxProps) {
  return (
    <View style={[styles.sensorBox, { borderColor: color }]}>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={[styles.sensorValue, { color }]}>{value}</Text>
    </View>
  );
}

interface ControlButtonProps {
  label: string;
  onPress: () => void;
  color: string;
}

function ControlButton({ label, onPress, color }: ControlButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  title: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  telemetrySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorBox: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
  },
  sensorLabel: {
    color: colors.goldMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlSection: {
    marginBottom: 30,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  infoText: {
    color: colors.goldMuted,
    fontSize: 12,
    marginBottom: 5,
  },
  text: {
    color: colors.white,
    marginTop: 10,
  },
});
