/*
 * Tender Cells Field Kit — Flipper Zero diagnostic FAP
 * ----------------------------------------------------
 * A field tool for bringing up and debugging Tender Cells hardware (ESP32 coop
 * controllers, Starter Nodes, WatchTower). Six tools:
 *
 *   1. UART + Health      — launch guidance for the installed UART Terminal;
 *                           the direct parser stays off pending a wired test.
 *   2. Board Diagnostics — summarize observed WiFi, MQTT, mesh and E-STOP state.
 *   3. Frequency Board   — status screen for a receive-only SX127x/SX126x
 *                           diagnostic adapter. Flipper CC1101 is not LoRa.
 *   4. WiFi Board        — status screen for a safe setup-SSID scanner adapter.
 *   5. Offline Node      — offline mesh/edge bring-up guidance.
 *   6. GPIO / Reed       — voltage and continuity guidance.
 *
 * Build:  cd flipper/tendercells_fieldkit && ufbt && ufbt launch
 *
 * v1.1 scope: direct UART receive is compile-time disabled. External frequency
 * and WiFi board screens fail closed until an allowed, versioned diagnostic
 * frame is observed after that path is validated. No transmit or fake data.
 */

#include <furi.h>
#include <furi_hal_serial.h>
#include <furi_hal_serial_control.h>
#include <expansion/expansion.h>
#include <gui/gui.h>
#include <gui/view_dispatcher.h>
#include <gui/modules/submenu.h>
#include <gui/modules/text_box.h>
#include <string.h>

#define TAG "TCFieldKit"

#define UART_BAUD 115200u
#define RX_BUF_SIZE 2048u
#define LOG_MAX_CHARS 4096u

// Direct UART remains opt-in until the exact Momentum/device/XIAO path has a
// wired bench test. The installed UART Terminal is the verified fallback.
#ifndef TC_ENABLE_DIRECT_UART
#define TC_ENABLE_DIRECT_UART 0
#endif

typedef enum {
    TcViewSubmenu,
    TcViewSerial,
} TcView;

typedef enum {
    TcMenuSerial,
    TcMenuDiagnostics,
    TcMenuFrequencyBoard,
    TcMenuWifiBoard,
    TcMenuOfflineNode,
    TcMenuGpioTest,
    TcMenuAbout,
} TcMenuItem;

typedef struct {
    Gui* gui;
    Expansion* expansion;
    ViewDispatcher* view_dispatcher;
    Submenu* submenu;
    TextBox* text_box;

    // Serial Log Reader state
    FuriHalSerialHandle* serial;
    FuriStreamBuffer* rx_stream;
    FuriString* log_text;
    FuriString* line_text;
    FuriString* info_text;
    bool serial_running;
    bool expansion_suspended;
    bool detail_open;

    uint32_t lines_seen;
    uint32_t wifi_frames;
    uint32_t rf_frames;
    bool wifi_seen;
    bool mqtt_connected;
    bool mqtt_error;
    bool mesh_seen;
    bool estop_active;
} TcApp;

/* ── Serial Log Reader ─────────────────────────────────────────────────────── */

// ISR context — keep it tiny: just push received bytes into the stream buffer.
static void
    tc_serial_rx_cb(FuriHalSerialHandle* handle, FuriHalSerialRxEvent ev, void* ctx) {
    TcApp* app = ctx;
    if(ev & FuriHalSerialRxEventData) {
        uint8_t b = furi_hal_serial_async_rx(handle);
        furi_stream_buffer_send(app->rx_stream, &b, 1, 0);
    }
}

static char tc_ascii_lower(char c) {
    return (c >= 'A' && c <= 'Z') ? (char)(c + ('a' - 'A')) : c;
}

static bool tc_contains_ci(const char* haystack, const char* needle) {
    for(; *haystack; haystack++) {
        size_t i = 0;
        while(needle[i] && haystack[i] &&
              tc_ascii_lower(haystack[i]) == tc_ascii_lower(needle[i])) {
            i++;
        }
        if(!needle[i]) return true;
    }
    return false;
}

static bool tc_line_contains_secret(const char* line) {
    return tc_contains_ci(line, "claim") || tc_contains_ci(line, "password") ||
           tc_contains_ci(line, "token");
}

static void tc_analyze_line(TcApp* app, const char* line) {
    app->lines_seen++;

    if(strstr(line, "WiFi connected") || strstr(line, "[USB] CONNECTED")) {
        app->wifi_seen = true;
    }
    if(strstr(line, "MQTT connected") || strstr(line, "[MQTT] connected")) {
        app->mqtt_connected = true;
        app->mqtt_error = false;
    } else if(strstr(line, "MQTT connect failed")) {
        app->mqtt_connected = false;
        app->mqtt_error = true;
    }
    if(strstr(line, "[Mesh] ready")) {
        app->mesh_seen = true;
    }

    const bool diag_v1 =
        strstr(line, "\"tc_diag\":1") || strstr(line, "\"tc_diag\": 1");
    const bool wifi_frame =
        strstr(line, "\"type\":\"wifi\"") || strstr(line, "\"type\": \"wifi\"");
    const bool allowed_ssid =
        strstr(line, "\"ssid\":\"TenderNode-Setup\"") ||
        strstr(line, "\"ssid\": \"TenderNode-Setup\"") ||
        strstr(line, "\"ssid\":\"ChickenTender-Setup\"") ||
        strstr(line, "\"ssid\": \"ChickenTender-Setup\"");
    const bool rf_frame =
        strstr(line, "\"type\":\"rf\"") || strstr(line, "\"type\": \"rf\"");
    const bool receive_only = strstr(line, "\"receive_only\":true") ||
                              strstr(line, "\"receive_only\": true");

    if(diag_v1 && wifi_frame && allowed_ssid) {
        app->wifi_frames++;
        app->wifi_seen = true;
    }
    if(diag_v1 && rf_frame && receive_only) {
        app->rf_frames++;
        app->mesh_seen = true;
    }
    if(strstr(line, "ESTOP] active") || strstr(line, "E-STOP ENGAGED") ||
       strstr(line, "entering ESTOP")) {
        app->estop_active = true;
    } else if(strstr(line, "ESTOP] cleared") || strstr(line, "E-STOP cleared")) {
        app->estop_active = false;
    }
}

static void tc_commit_line(TcApp* app) {
    const char* line = furi_string_get_cstr(app->line_text);
    tc_analyze_line(app, line);

    if(tc_line_contains_secret(line)) {
        furi_string_cat(app->log_text, "[REDACTED setup credential]\n");
    } else {
        furi_string_cat(app->log_text, line);
        furi_string_cat(app->log_text, "\n");
    }
    furi_string_reset(app->line_text);
}

// The dispatcher tick runs on the application/UI thread. The ISR only queues
// bytes, so TextBox state is never mutated from an RX callback or worker thread.
static void tc_serial_tick(void* context) {
    TcApp* app = context;
    if(!app->serial_running) return;

    uint8_t buf[64];
    bool changed = false;
    size_t n = 0;
    while((n = furi_stream_buffer_receive(app->rx_stream, buf, sizeof(buf), 0)) > 0) {
        changed = true;
        for(size_t i = 0; i < n; i++) {
            char c = (char)buf[i];
            if(c == '\r') continue;
            if(c == '\n') {
                tc_commit_line(app);
            } else if(c >= 0x20 && c <= 0x7E) {
                if(furi_string_size(app->line_text) < 255) {
                    furi_string_push_back(app->line_text, c);
                } else {
                    furi_string_reset(app->line_text);
                    furi_string_cat(app->log_text, "[discarded overlong line]\n");
                }
            }
        }
    }

    if(changed) {
        size_t len = furi_string_size(app->log_text);
        if(len > LOG_MAX_CHARS) {
            furi_string_right(app->log_text, len - LOG_MAX_CHARS);
        }
        text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));
    }
}

static void tc_serial_start(TcApp* app) {
    if(app->serial_running) return;

    furi_string_reset(app->log_text);
    furi_string_reset(app->line_text);
    furi_stream_buffer_reset(app->rx_stream);
    furi_string_set(
        app->log_text,
        "[Field Kit] RX-only UART 115200 on GPIO 14(RX) + GND.\nWaiting for ESP32/XIAO...\n");
    text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));

    if(!TC_ENABLE_DIRECT_UART) {
        furi_string_cat(
            app->log_text,
            "\nDirect UART is disabled pending wired validation. Use Apps > GPIO > UART Terminal at 115200, or the XIAO native USB console.\n");
        text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));
        return;
    }

    expansion_disable(app->expansion);
    app->expansion_suspended = true;
    app->serial = furi_hal_serial_control_acquire(FuriHalSerialIdUsart);
    if(!app->serial) {
        expansion_enable(app->expansion);
        app->expansion_suspended = false;
        furi_string_cat(
            app->log_text,
            "\nUART unavailable. Close another GPIO app and disable Expansion Listen UART, then retry.\n");
        text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));
        return;
    }
    furi_hal_serial_init(app->serial, UART_BAUD);

    app->serial_running = true;
    furi_hal_serial_async_rx_start(app->serial, tc_serial_rx_cb, app, false);
}

static void tc_serial_stop(TcApp* app) {
    if(!app->serial_running) return;
    app->serial_running = false;

    furi_hal_serial_async_rx_stop(app->serial);
    furi_hal_serial_deinit(app->serial);
    furi_hal_serial_control_release(app->serial);
    app->serial = NULL;
    expansion_enable(app->expansion);
    app->expansion_suspended = false;
}

/* ── Info screens ──────────────────────────────────────────────────────────── */

static void tc_show_info(TcApp* app, const char* title, const char* body) {
    furi_string_set(app->info_text, title);
    furi_string_cat(app->info_text, "\n\n");
    furi_string_cat(app->info_text, body);
    text_box_set_text(app->text_box, furi_string_get_cstr(app->info_text));
    app->detail_open = true;
    view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSerial);
}

/* ── Navigation ────────────────────────────────────────────────────────────── */

static void tc_submenu_cb(void* context, uint32_t index) {
    TcApp* app = context;
    char status[384];
    switch(index) {
    case TcMenuSerial:
        if(TC_ENABLE_DIRECT_UART) {
            tc_serial_start(app);
            app->detail_open = true;
            view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSerial);
        } else {
            tc_show_info(
                app,
                "UART + Health",
                "Direct UART is disabled pending a wired Momentum/XIAO validation.\n\nUse Apps > GPIO > UART Terminal at 115200, or use the XIAO native USB console.\n\nNever paste claim codes, passwords, or tokens into retained logs.");
        }
        break;
    case TcMenuDiagnostics:
        snprintf(
            status,
            sizeof(status),
            "UART: %s\nLines: %lu\nWiFi: %s\nMQTT: %s\nMesh/RF: %s\nE-STOP: %s\n\nDirect ingestion is disabled. Use the installed UART Terminal for live evidence.",
            app->serial_running ? "listening" : "stopped",
            (unsigned long)app->lines_seen,
            app->wifi_seen ? "seen" : "not seen",
            app->mqtt_connected ? "connected" : (app->mqtt_error ? "error" : "unknown"),
            app->mesh_seen ? "seen" : "not seen",
            app->estop_active ? "ACTIVE" : "not observed");
        tc_show_info(app, "Board Diagnostics", status);
        break;
    case TcMenuFrequencyBoard:
        snprintf(
            status,
            sizeof(status),
            "Adapter frames: %lu\nStatus: %s\n\nExternal SX127x/SX126x required for TenderCells LoRa. Planned tc_diag v1 frames report frequency, RSSI, SNR and packet count. Receive-only by default.\n\nFlipper CC1101 cannot decode LoRa CSS.",
            (unsigned long)app->rf_frames,
            app->rf_frames ? "observed on UART" : "board not detected");
        tc_show_info(
            app,
            "Frequency Board",
            status);
        break;
    case TcMenuWifiBoard:
        snprintf(
            status,
            sizeof(status),
            "Adapter frames: %lu\nStatus: %s\nMQTT: %s\n\nExternal ESP32 required. Scanner is limited to setup discovery (TenderNode-Setup / ChickenTender-Setup), channel and RSSI. No passwords, captures or deauth.",
            (unsigned long)app->wifi_frames,
            app->wifi_frames ? "observed on UART" : "board not detected",
            app->mqtt_connected ? "connected" : (app->mqtt_error ? "error" : "unknown"));
        tc_show_info(
            app,
            "WiFi Board",
            status);
        break;
    case TcMenuOfflineNode:
        tc_show_info(
            app,
            "Offline Node",
            "No internet required: use local UART diagnostics and store observations on the edge device. For transport use ESP-NOW, RS-485/CAN, or an authenticated SX127x mesh through external hardware.\n\nFlipper is the handheld UI, not the safety-critical relay. Keep control outputs fail-closed.");
        break;
    case TcMenuGpioTest:
        tc_show_info(
            app,
            "GPIO / Reed Test",
            "Input-only bring-up checks. Pin map (Flipper <-> ESP32):\n"
            " 14 RX -> ESP32 TX\n"
            " 8/11 GND -> ESP32 GND\n"
            "\nCAUTION: 3V3 logic only. Power targets separately. Reed switch closes to GND; use an installed GPIO input tool or the Hark XIAO console for a live pull-up test.");
        break;
    case TcMenuAbout:
        tc_show_info(
            app,
            "Tender Cells Field Kit",
            "WeCr8 Solutions. Open hardware diagnostics for the Tender Cells "
            "platform.\n\n"
            "Momentum API 87.1 field guidance. Direct UART ingestion is "
            "disabled pending a wired test. Use UART Terminal or the XIAO "
            "native USB console. No host USB bridge.\n\nApache-2.0.");
        break;
    default:
        break;
    }
}

// Back button: from a tool view -> stop serial if running, return to menu.
// From the menu -> exit the app. This dispatcher-level callback preserves the
// module-owned View contexts used internally by Submenu and TextBox.
// FIX(2026-10-25): Never replace module-owned View contexts with TcApp state.
static bool tc_nav_back(void* context) {
    TcApp* app = context;
    if(app->detail_open) {
        if(app->serial_running) {
            tc_serial_stop(app);
        }
        app->detail_open = false;
        view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSubmenu);
    } else {
        view_dispatcher_stop(app->view_dispatcher);
    }
    return true;
}

/* ── App lifecycle ─────────────────────────────────────────────────────────── */

static TcApp* tc_app_alloc(void) {
    TcApp* app = malloc(sizeof(TcApp));
    memset(app, 0, sizeof(TcApp));

    app->gui = furi_record_open(RECORD_GUI);
    app->expansion = furi_record_open(RECORD_EXPANSION);
    app->view_dispatcher = view_dispatcher_alloc();
    app->log_text = furi_string_alloc();
    app->line_text = furi_string_alloc();
    app->info_text = furi_string_alloc();
    app->rx_stream = furi_stream_buffer_alloc(RX_BUF_SIZE, 1);

    app->submenu = submenu_alloc();
    submenu_set_header(app->submenu, "Tender Cells Field Kit");
    submenu_add_item(app->submenu, "UART + Health", TcMenuSerial, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "Board Diagnostics", TcMenuDiagnostics, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "Frequency Board", TcMenuFrequencyBoard, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "WiFi Board", TcMenuWifiBoard, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "Offline Node", TcMenuOfflineNode, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "GPIO / Reed Test", TcMenuGpioTest, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "About", TcMenuAbout, tc_submenu_cb, app);

    app->text_box = text_box_alloc();
    text_box_set_font(app->text_box, TextBoxFontText);

    view_dispatcher_set_event_callback_context(app->view_dispatcher, app);
    view_dispatcher_set_navigation_event_callback(app->view_dispatcher, tc_nav_back);
    view_dispatcher_set_tick_event_callback(app->view_dispatcher, tc_serial_tick, 100);

    view_dispatcher_add_view(app->view_dispatcher, TcViewSubmenu, submenu_get_view(app->submenu));
    view_dispatcher_add_view(app->view_dispatcher, TcViewSerial, text_box_get_view(app->text_box));

    view_dispatcher_attach_to_gui(app->view_dispatcher, app->gui, ViewDispatcherTypeFullscreen);
    return app;
}

static void tc_app_free(TcApp* app) {
    if(app->serial_running) tc_serial_stop(app);
    if(app->expansion_suspended) {
        expansion_enable(app->expansion);
        app->expansion_suspended = false;
    }

    view_dispatcher_remove_view(app->view_dispatcher, TcViewSubmenu);
    view_dispatcher_remove_view(app->view_dispatcher, TcViewSerial);

    submenu_free(app->submenu);
    text_box_free(app->text_box);
    view_dispatcher_free(app->view_dispatcher);

    furi_stream_buffer_free(app->rx_stream);
    furi_string_free(app->log_text);
    furi_string_free(app->line_text);
    furi_string_free(app->info_text);
    furi_record_close(RECORD_EXPANSION);
    furi_record_close(RECORD_GUI);
    free(app);
}

int32_t tendercells_fieldkit_app(void* p) {
    UNUSED(p);
    TcApp* app = tc_app_alloc();
    view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSubmenu);
    view_dispatcher_run(app->view_dispatcher);
    tc_app_free(app);
    return 0;
}
