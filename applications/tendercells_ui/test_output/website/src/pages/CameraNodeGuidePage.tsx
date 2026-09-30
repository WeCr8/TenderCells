import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import RelatedContent from "../components/RelatedContent";
import PageHero from "../components/PageHero";
import "./CameraNodeGuidePage.css";

const steps = [
  ["1", "Wire camera only", "Seat the Sense board and camera, attach the antenna, then use USB-C for the first test."],
  ["2", "Flash in browser", "Choose Camera Node in the TenderCells Web Serial flasher using Chrome or Edge."],
  ["3", "Provision locally", "Join TenderCam-Setup and provide 2.4 GHz Wi-Fi, broker address, and a unique device ID."],
  ["4", "Register and claim", "Name the device in Products, select its real capabilities, and claim it to the signed-in owner."],
  ["5", "Verify first function", "Confirm heartbeat, online state, and the local /stream feed before adding hardware."],
];

const pinRows = [
  ["3V3", "Sensor VIN / 3V3", "3.3 V sensor power only"],
  ["GND", "Sensor GND", "Shared logic reference"],
  ["D4 / GPIO5", "I2C SDA", "Temperature or humidity sensor data"],
  ["D5 / GPIO6", "I2C SCL", "Temperature or humidity sensor clock"],
  ["D1 / GPIO2", "Digital input", "3.3 V PIR, reed, or float signal"],
  ["D0 / GPIO1", "Driver signal", "MOSFET or isolated relay input only"],
];

export default function CameraNodeGuidePage() {
  return (
    <PageLayout>
      <PageHero variant="green" title="Build a Single Camera Node" subtitle="Wire, flash, register, and control a battery-powered XIAO ESP32-S3 Sense through TenderCells." image="/assets/images/camera-node/seeed-xiao-esp32s3-sense.jpg" imageAlt="Real Seeed Studio XIAO ESP32-S3 Sense board with camera and antenna" />
      <nav className="camera-guide-actions" aria-label="Camera node actions">
        <a className="button-link primary" href="/flash/?target=camera-node">Flash Camera Node</a>
        <a className="button-link" href="https://github.com/WeCr8/TenderCells/blob/main/docs/CAMERA_NODE_FIRST_BUILD.md">Open engineering document</a>
        <Link className="button-link" to="/developers">Developer platform</Link>
      </nav>
      <section className="camera-guide-section">
        <h2>First working function</h2>
        <p className="camera-guide-lede">Start with live video. Each later function is enabled only when its physical hardware and firmware support are registered.</p>
        <div className="camera-step-grid">{steps.map(([number, title, body]) => <article className="camera-step" key={number}><span className="camera-step-number" aria-hidden="true">{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>
      <section className="camera-guide-section camera-visual-section">
        <div><h2>Wiring overview</h2><p>The camera, microphone, and microSD socket are onboard Sense functions. External sensors use only pins left free by enabled functions. Loads always use a proper driver and separate fused power.</p></div>
        <div className="camera-diagram-scroll" tabIndex={0} aria-label="Scrollable camera-node wiring diagram"><img src="/assets/images/camera-node/camera-node-wiring.svg" alt="Electrical wiring overview for the XIAO ESP32-S3 Sense camera node" /></div>
      </section>
      <section className="camera-guide-section">
        <h2>Auxiliary connections</h2>
        <div className="camera-pin-table-wrap" tabIndex={0}><table className="camera-pin-table"><thead><tr><th>XIAO</th><th>Connect to</th><th>Engineering use</th></tr></thead><tbody>{pinRows.map(([pin, connection, use]) => <tr key={pin}><td><code>{pin}</code></td><td>{connection}</td><td>{use}</td></tr>)}</tbody></table></div>
        <div className="camera-warning-grid">
          <article><h3>Battery</h3><p>Use a protected 3.7 V single-cell LiPo. BAT negative is nearest USB-C. Never connect the cell to 5V/VBUS.</p></article>
          <article><h3>Logic</h3><p>GPIO is 3.3 V logic. Verify sensor pull-ups and output levels before connection.</p></article>
          <article><h3>Loads</h3><p>Motors, pumps, lamps, and coils require a driver, flyback protection where applicable, separate power, and a fuse.</p></article>
          <article><h3>Reserved pins</h3><p>Camera uses GPIO10-18, 38-40, 47, and 48; microphone uses 41-42; microSD uses 3 and 7-9.</p></article>
        </div>
      </section>
      <section className="camera-guide-section camera-visual-section">
        <div><h2>Registry to MQTT</h2><p>The signed-in user claims the discovered node. Dashboard changes pass through the owner-gated API and publish JSON commands over MQTT.</p></div>
        <div className="camera-diagram-scroll" tabIndex={0} aria-label="Scrollable TenderCells device path diagram"><img src="/assets/images/camera-node/tendercells-device-path.svg" alt="TenderCells flash, provision, discover, claim, and MQTT control path" /></div>
      </section>
      <section className="camera-guide-section camera-source-note">
        <h2>Engineering sources</h2><p>Board imagery and pin assignments come from Seeed Studio documentation under CC BY-SA 4.0. Verify the current manufacturer schematic and the exact breakout-board datasheet before assembly.</p>
        <div className="camera-source-links"><a href="https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/">Board, power, battery, and schematics</a><a href="https://wiki.seeedstudio.com/xiao_esp32s3_pin_multiplexing/">Pin multiplexing</a><a href="https://wiki.seeedstudio.com/License/">Seeed documentation license</a></div>
      </section>
      <RelatedContent />
    </PageLayout>
  );
}
