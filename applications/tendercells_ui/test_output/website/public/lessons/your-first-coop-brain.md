# 🐣 Your First Coop Brain — Start Here (ages 7+)

> **Grown-ups:** this is the very first lesson. A 7-year-old can do it with a helper
> reading along. It takes about **45 minutes**. No tools, no soldering, no gluing.
> You need a small computer board, a USB cable, and a grown-up's laptop.
>
> **Deep-linking note (for teachers/site):** every lesson links *up* to what comes
> next and *down* to the words it uses. Always end a lesson by clicking the **"What's
> next"** link so kids build a path. Words in **bold-with-a-link** jump to the
> [Picture Dictionary](#-picture-dictionary-hard-words-made-easy).

---

## 🌟 What you will make today

You will give a tiny computer a **brain** so it can wake up, talk to a laptop, and
blink a light to say **"I'm alive!"** This tiny computer is the same kind of brain that
runs a real robot chicken coop. You are starting exactly where real engineers start. 🚀

You will NOT need any chicken stuff today. Today is just: **make the brain wake up.**

```
   YOU  →  press a button on the screen  →  the brain wakes up  →  it blinks 💡
```

---

## 🧰 Parts list — lay them out first (like a LEGO set!)

Open the "bag" and put each part in front of you. Count them. Check the box. ✅

```
 ┌─────────────────────────────────────────────────────────┐
 │  BAG 1 — Your First Coop Brain                           │
 ├─────────────────────────────────────────────────────────┤
 │  [ 1 ]  🟩  Board (Seeed XIAO ESP32-S3)  ......... x1     │
 │  [ 2 ]  🔌  USB data cable  ..................... x1     │
 │  [ 3 ]  💻  Laptop (a grown-up's)  .............. x1     │
 │  [ 4 ]  🌐  Chrome or Edge browser  ............. (on it)│
 └─────────────────────────────────────────────────────────┘
```

- [ ] **Part 1 — Board.** A tiny computer the size of a stick of gum.
- [ ] **Part 2 — USB cable.** The kind that moves *data*, not just charges.
      *(Grown-up: a charge-only cable is the #1 reason it won't work.)*
- [ ] **Part 3 — Laptop.** Windows or Mac. A phone or tablet will **not** work here.
- [ ] **Part 4 — Browser.** Open **Chrome** or **Microsoft Edge**. *(Not Safari/Firefox.)*

> 🧠 New word? **Board**, **USB**, **browser** are all in the
> [Picture Dictionary](#-picture-dictionary-hard-words-made-easy).
> Got all 4 parts? Turn the page. 👉

---

## 🪜 The steps (go slow — one at a time)

### Step 1 — Open the magic page
1. On the laptop, open **Chrome** or **Edge**.
2. In the address bar at the top, type this and press **Enter**:
   ```
   tender-cells.web.app/flash
   ```
3. **What you see:** a green page that says **🐔 Tender Cells Flasher**.

✅ *You found the launch pad!* If you want, read the
[full Flasher page guide](https://github.com/WeCr8/TenderCells/blob/main/applications/tendercells_ui/test_output/website/public/flash/index.html)
later — but you don't need it. Just follow along here.

### Step 2 — Pick "Starter Node"
1. On the page, find the boxes that say what to flash.
2. Tap the one that says **🌱 Starter Node**. It gets a glowing edge to show it's picked.

> 💡 **"Flash"** is a funny word. It means *copy a program onto the brain.* Like loading
> a game onto a game machine. See [Picture Dictionary](#-picture-dictionary-hard-words-made-easy).

### Step 3 — Plug in the board
1. Put one end of the **USB cable** into the **board**.
2. Put the other end into the **laptop**.
3. **What you see:** a tiny light on the board turns on. 🔦
   - ❌ No light? Try the cable the other way, or ask your grown-up for a different cable.

### Step 4 — Press the big button
1. On the page, press **🔌 Connect & Install**.
2. A little window pops up asking **"which thing do I connect to?"**
3. Pick the one that appears when you plugged the board in. It may say `USB Serial`,
   `CH340`, or `CP210x`. Press **Connect**.
   - *Grown-up tip:* if nothing shows up, unplug, wait 3 seconds, plug back in.
4. Press **Install** and say **yes**.
5. **What you see:** a **green bar** fills up like a loading bar in a game. ⏳

🎉 When it says **done**, the brain has its program! Give a high-five.

### Step 5 — Make it wake up
1. **Unplug** the board, then **plug it back in.** (This is like turning it off and on.)
2. **What you see:** the light starts **blinking slowly** — *blink… blink… blink…*
3. That blink means: **"I'm alive and looking for friends!"** 🥳

> If it does **not** blink, that's okay — go to
> [When things go wrong](#-when-things-go-wrong-its-normal) below.

---

## 🤔 What just happened? (the cool part)

The tiny board had **no program** — like a notebook with empty pages. You **flashed**
it, which wrote a program onto it. Now every time it gets power, it runs that program:
it wakes up, blinks, and gets ready to join a **network** (a group of devices that talk
to each other). Later you'll tell it your **Wi-Fi** so it can talk to the
**Tender Cells OS** — the app that shows all your devices.

```
  Today:   empty board  →  flash  →  blinking brain ✅
  Next:    blinking brain  →  add Wi-Fi  →  shows up in the app 📱
```

---

## 🧯 Safety (read with a grown-up)

- The board can get a little **warm** — that's normal, like a phone.
- Only plug into a **computer USB** today. No wall plugs, no batteries yet.
- Never put the board in your **mouth** or in **water**.
- If you ever smell something hot or see smoke, **unplug it** and tell a grown-up. (This
  almost never happens, but good engineers always know the safe move.) 🦺

---

## 🛠️ When things go wrong (it's normal!)

Engineers break things and fix them all day. Here's the fix-it list:

| What you see | Try this |
|---|---|
| Board never shows up | Swap the **USB cable** for a *data* cable (the #1 fix). |
| Page can't flash | You're in the wrong browser — open **Chrome** or **Edge**. |
| Green bar fails | Hold the board's **BOOT** button, press Install, keep holding until the green bar starts. |
| No blinking after | **Unplug and replug** the board. The blink only starts on a fresh power-up. |

Still stuck? Switch the Flasher page to **📚 Learn mode** with your grown-up.

---

## 🏆 You did it! Sticker time

You just:
- ✅ Flashed a real microcontroller (say it: *my-cro-con-TROLL-er*)
- ✅ Made it run a program
- ✅ Saw it come alive

That's **real engineering**. The same steps put the brain in a real robot coop. 🐔🤖

---

## 👉 What's next (pick your path)

- 🔌 **Make it do something** → [Build a Door + a Basic Roaming Roost](../CLASSROOM_DOOR_AND_ROAMING_ROOST.md)
  — add a tiny motor and open a little door from the app.
- 🌡️ **Make it feel the world** → [Sensors → Automated Tasks](../CLASSROOM_SENSORS_AND_AUTOMATION.md)
  — add a light sensor so the coop opens at sunrise by itself.
- 🍽️ **Feed and water** → [Feeder + Waterer](../CLASSROOM_FEEDER_AND_WATERER.md)
- 🧊 **See it in 3D** → open `tender-cells.web.app/viewer` and drop in a model
- 🗺️ **See all the projects** → [Learning Tracks map](../LEARNING_TRACKS.md)

> 🧭 *Do them in order if you're new.* Each one adds one new idea on top of this lesson.

---

## 📖 Picture Dictionary (hard words made easy)

- **Board** — a tiny computer on a small green card. Has a brain chip on it.
- **Brain / chip / microcontroller** — the part that *thinks* and runs the program.
- **USB cable** — the wire that connects the board to the laptop. A *data* cable can
  send the program; a *charge-only* cable cannot.
- **Browser** — the program you use to look at websites (Chrome, Edge).
- **Flash** — to copy a program onto the board's brain so it runs forever after.
- **Program / firmware** — the list of instructions the brain follows.
- **Network / Wi-Fi** — the invisible way devices talk without wires.
- **Tender Cells OS** — the app that shows and controls all your devices.
- **BOOT button** — a tiny button on the board that helps it accept a new program.

---

*Teachers: this lesson is the entry node. Keep the deep links live — every other lesson
should link back here for "what is flashing?" and forward via "What's next." Full printable
pack format: [lesson template](_TEMPLATE.md). Curriculum map: [Learning Tracks](../LEARNING_TRACKS.md).*
