"""Habitat sound monitor - a microphone on the local hub, classified by a Hugging Face audio
model on the hub itself. Only labels leave the device (JSON on MQTT); audio never does.

    DEVICE_ID=coop_mic MQTT_BROKER=mqtt://192.168.1.50:1883 python3 habitat_listener.py

Model: MIT/ast-finetuned-audioset-10-10-0.4593 (AudioSet labels) by default - HF_AUDIO_MODEL
to change it. Needs `pip install transformers torch sounddevice numpy paho-mqtt`.

Publishes: tc/{id}/sensors  {"soundLabel", "score", "ts"} every 10 s (top label of the window)
           tc/{id}/alert    {"type": "predator"|"health", "label", "confidence", "ts"} when a
                            watched sound is heard (with a cooldown so a barking dog is one alert)
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

DEFAULT_MODEL = "MIT/ast-finetuned-audioset-10-10-0.4593"

# AudioSet labels worth an alert, and what kind. Matching is case-insensitive substring.
WATCH: Dict[str, str] = {
    "dog": "predator", "bark": "predator", "howl": "predator", "coyote": "predator",
    "rodents, rats, mice": "predator", "hiss": "predator", "rattle": "predator",
    "screaming": "health", "squeal": "health", "whimper": "health",
}


@dataclass
class SoundEventFilter:
    """Turns a stream of (label, score) into rate-limited alerts. Pure - unit tested."""

    min_score: float = 0.35
    cooldown_s: float = 120.0
    watch: Dict[str, str] = field(default_factory=lambda: dict(WATCH))
    _last: Dict[str, float] = field(default_factory=dict)

    def kind_for(self, label: str) -> Optional[str]:
        low = label.lower()
        for key, kind in self.watch.items():
            if key in low:
                return kind
        return None

    def feed(self, results: List[Tuple[str, float]], now: float) -> List[dict]:
        alerts = []
        for label, score in results:
            kind = self.kind_for(label)
            if kind is None or score < self.min_score:
                continue
            if now - self._last.get(label, -1e9) < self.cooldown_s:
                continue
            self._last[label] = now
            alerts.append({"type": kind, "label": label, "confidence": round(score, 3), "source": "audio", "ts": int(now * 1000)})
        return alerts


def main() -> None:  # pragma: no cover - needs a microphone, a model and a broker
    from urllib.parse import urlparse

    import numpy as np
    import paho.mqtt.client as mqtt
    import sounddevice as sd
    from transformers import pipeline

    device_id = os.environ.get("DEVICE_ID", "habitat_mic")
    broker = urlparse(os.environ.get("MQTT_BROKER", "mqtt://localhost:1883"))
    clf = pipeline("audio-classification", model=os.environ.get("HF_AUDIO_MODEL", DEFAULT_MODEL))
    rate = clf.feature_extractor.sampling_rate
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"tc-audio-{device_id}")
    client.will_set(f"tc/{device_id}/status", json.dumps({"online": False}), qos=1, retain=True)
    client.connect_async(broker.hostname or "localhost", broker.port or 1883)
    client.loop_start()
    client.publish(f"tc/{device_id}/status", json.dumps({"online": True}), qos=1, retain=True)
    flt = SoundEventFilter()
    print(f"🎙️  {device_id}: listening, publishing labels only")
    while True:
        audio = sd.rec(int(5 * rate), samplerate=rate, channels=1, dtype="float32")  # 5 s window
        sd.wait()
        out = clf(np.squeeze(audio), top_k=5)
        results = [(r["label"], float(r["score"])) for r in out]
        now = time.time()
        client.publish(f"tc/{device_id}/sensors", json.dumps({"soundLabel": results[0][0], "score": round(results[0][1], 3),
                                                              "ts": int(now * 1000)}), qos=0)
        for alert in flt.feed(results, now):
            client.publish(f"tc/{device_id}/alert", json.dumps(alert), qos=2)


if __name__ == "__main__":  # pragma: no cover
    main()
