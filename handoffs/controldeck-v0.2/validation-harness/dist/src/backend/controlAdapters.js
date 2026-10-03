export function neutralMotionPayload(reason) {
    return {
        mode: 'analog',
        deadman: false,
        axes: {},
        reason,
        timestamp: Date.now(),
    };
}
export function frameToMqttPayload(frame) {
    return {
        mode: 'analog',
        v: frame.v,
        sessionId: frame.sessionId,
        profileId: frame.profileId,
        seq: frame.seq,
        deadman: frame.deadman,
        axes: frame.deadman ? frame.axes : {},
        timestamp: Date.now(),
    };
}
/**
 * Adapter for MQTTController.host() without importing the entire controller here.
 * Inject the actual publish function at server composition time.
 */
export function createMotionPublisher(mqttPublish) {
    return {
        publish(deviceId, payload) {
            return mqttPublish(`tc/${deviceId}/cmd/drive/analog`, payload, false);
        },
    };
}
