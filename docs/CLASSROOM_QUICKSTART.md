# Classroom Quickstart — Run a Smart Coop in 5 Minutes

For **teachers, students, clubs, and science-fair / robotics-competition teams**.
No hardware. No accounts. No internet account signups. Just a laptop.

You will start a pretend (but real-software) automated chicken coop, watch its sensors,
and send it commands — the same way the real robot coop works.

---

## What you need

- A laptop (Windows, Mac, or Chromebook with Linux turned on).
- **Node.js** installed — get it free at [nodejs.org](https://nodejs.org) (pick the
  big green "LTS" button). Ask a teacher if you're not allowed to install software.
- 5 minutes.

> **Grown-up note:** Node.js is a safe, standard tool used by millions of developers.
> Everything here runs on the student's own laptop. Nothing is sent to the internet.

---

## Step 1 — Open a terminal

- **Windows:** press the Start key, type `powershell`, press Enter.
- **Mac:** press `Cmd+Space`, type `terminal`, press Enter.
- **Chromebook/Linux:** open the **Terminal** app.

A window with text opens. This is where you type commands. Type each line below, then
press Enter.

---

## Step 2 — Get the project and start it

```bash
cd applications/tendercells_ui/test_output/express-api
npm install
npm run demo
```

`npm install` takes a minute the first time (it downloads the building blocks).
`npm run demo` starts your coop. When you see a box that says **"Tender Cells is
running"**, you did it! 🐔

Leave this window open. The coop keeps running here.

---

## Step 3 — Watch your coop

Open a **second** terminal window (Step 1 again). Type:

```bash
cd applications/tendercells_ui/test_output/express-api
npm run tc -- telemetry demo_coop
```

You'll see numbers like temperature, humidity, feed level, and how many chickens are
inside. These change over time — run it again and watch them move.

---

## Step 4 — Boss the coop around

Try these one at a time:

```bash
npm run tc -- door demo_coop open      # open the coop door
npm run tc -- door demo_coop close     # close it
npm run tc -- feed demo_coop 100       # drop 100 grams of food
npm run tc -- status                   # see everything at once
```

Flip back to the first terminal after each command — you'll see the coop react.

**The red button:** every real robot needs an emergency stop. Try it:

```bash
npm run tc -- estop demo_coop          # STOP everything right now
```

In real life this cuts power to all the motors instantly. Safety first — always.

---

## Step 5 — Stop everything

Click the first terminal and press **Ctrl + C**. The coop shuts down. Done.

---

## Show it on a phone or a second laptop (for the science fair table)

`npm run demo` already shares your coop with everything on the same Wi-Fi. When it
starts, look for the line that says:

```
LAN:   http://192.168.1.42:4000
```

Type that address (yours will have different numbers) into a phone's web browser **on
the same Wi-Fi** to see the live data. Great for letting judges poke at it.

> Want it private to your laptop only? Use `LOCAL=1 npm run demo` instead.

---

## Competition / Science-Fair Challenges

Pick one. Each one is a real engineering problem with a clear "done."

### 🥚 Level 1 — Sensor Detective
Run `npm run tc -- telemetry demo_coop` ten times. Write down the temperature each
time. **Question:** does it go up, down, or wander? Make a graph. Explain what a real
chicken would feel.

### 🚪 Level 2 — The Caretaker
Real coops open the door at sunrise and close at sunset. Write a tiny script (any
language) that calls `tc door ... open` and `tc door ... close` on a timer. **Goal:**
the door runs itself for a "day" you make up (e.g. 30 seconds = 1 day).

### 🤖 Level 3 — The Watchdog
The coop reports `ammonia` (a stinky gas — too much is unhealthy). Write a program
that reads telemetry every few seconds and **automatically** starts a cleaning cycle
(`tc clean demo_coop start`) if ammonia goes above 10. This is real automation: a
machine making a safety decision on its own.

### 🧠 Level 4 — Bring Your Own Brain
Use the `--json` flag (`tc telemetry demo_coop --json`) to get computer-readable data,
then build a dashboard, a phone app, or even hook up an AI that explains the readings.
The sky's the limit.

> **Judges love:** a clear problem, a working demo, and a student who can explain *why*
> the emergency stop and the safety checks matter. That's real engineering.

---

## Stuck?

| Problem | Try this |
|---|---|
| `npm: command not found` | Node.js isn't installed. Go back to "What you need." |
| `EADDRINUSE` or "port in use" | Another program has the port. Use `PORT=4100 npm run demo`. |
| Commands say "unreachable" | Is the first terminal still running `npm run demo`? It must stay open. |
| Nothing changes when I send commands | Check you typed `demo_coop` exactly. |

Want the deep version (real ESP32 hardware, the MQTT topics, the firmware contract)?
See [CONNECT_A_DEVICE.md](CONNECT_A_DEVICE.md).

---

*Tender Cells is open-source software by WeCr8 Solutions. Build something. Break it.
Learn how it works. That's the whole point.*
