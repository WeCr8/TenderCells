/*
 * Tender Cells Field Kit — Flipper Zero diagnostic FAP
 * ----------------------------------------------------
 * A field tool for bringing up and debugging Tender Cells hardware (ESP32 coop
 * controllers, Starter Nodes, WatchTower). Four tools:
 *
 *   1. Serial Log Reader  — read ESP32 logs over the Flipper as a USB-UART
 *                           bridge. GPIO 13(TX)/14(RX)/GND <-> ESP32 UART @
 *                           115200. Live scrollback. No extra hardware.
 *   2. 915 MHz RF Survey  — survey sub-GHz RF energy near WatchTower. NOTE the
 *                           Flipper CC1101 does OOK/2-FSK/GFSK only; it CANNOT
 *                           demodulate Semtech LoRa CSS, so it shows presence /
 *                           interference at 915 MHz but never decodes packets.
 *   3. WiFi AP Survey     — scan for "TenderNode-Setup" / "ChickenTender-Setup"
 *                           captive-portal APs for mount placement. Requires the
 *                           Flipper WiFi Dev Board (ESP32).
 *   4. GPIO Hardware Test — pin map + voltage cautions for checking reed-switch
 *                           (door) continuity and 3V3/5V logic during bring-up.
 *
 * Build:  cd flipper/tendercells_fieldkit && ufbt && ufbt launch
 *
 * v1 scope: Serial Log Reader is fully functional. RF/WiFi/GPIO tools ship as
 * guided info screens with accurate pin maps and cautions; their live captures
 * land in v1.1 (they need the subghz worker / WiFi dev board / GPIO drivers and
 * are documented in README.md). This keeps the headline USB path working today.
 */

#include <furi.h>
#include <furi_hal_serial.h>
#include <furi_hal_serial_control.h>
#include <gui/gui.h>
#include <gui/view_dispatcher.h>
#include <gui/modules/submenu.h>
#include <gui/modules/text_box.h>
#include <gui/modules/widget.h>

#define TAG "TCFieldKit"

#define UART_BAUD 115200u
#define RX_BUF_SIZE 2048u
#define LOG_MAX_CHARS 4096u

typedef enum {
    TcViewSubmenu,
    TcViewSerial,
    TcViewInfo,
} TcView;

typedef enum {
    TcMenuSerial,
    TcMenuRfSurvey,
    TcMenuWifiSurvey,
    TcMenuGpioTest,
    TcMenuAbout,
} TcMenuItem;

typedef struct {
    Gui* gui;
    ViewDispatcher* view_dispatcher;
    Submenu* submenu;
    TextBox* text_box;
    Widget* widget;

    // Serial Log Reader state
    FuriHalSerialHandle* serial;
    FuriStreamBuffer* rx_stream;
    FuriThread* worker;
    FuriString* log_text;
    volatile bool serial_running;
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

// Worker thread — drain the stream buffer, append to the scrollback, redraw.
static int32_t tc_serial_worker(void* context) {
    TcApp* app = context;
    uint8_t buf[64];

    while(app->serial_running) {
        size_t n = furi_stream_buffer_receive(app->rx_stream, buf, sizeof(buf), 100);
        if(n == 0) continue;

        for(size_t i = 0; i < n; i++) {
            char c = (char)buf[i];
            if(c == '\r') continue; // normalize CRLF
            furi_string_push_back(app->log_text, c);
        }

        // Cap scrollback: drop oldest chars so we never grow without bound.
        size_t len = furi_string_size(app->log_text);
        if(len > LOG_MAX_CHARS) {
            furi_string_right(app->log_text, len - LOG_MAX_CHARS);
        }

        text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));
    }
    return 0;
}

static void tc_serial_start(TcApp* app) {
    if(app->serial_running) return;

    furi_string_reset(app->log_text);
    furi_string_set(
        app->log_text, "[Field Kit] UART 115200 on GPIO 13(TX)/14(RX)/GND.\nWaiting for ESP32...\n");
    text_box_set_text(app->text_box, furi_string_get_cstr(app->log_text));

    app->serial = furi_hal_serial_control_acquire(FuriHalSerialIdUsart);
    furi_check(app->serial);
    furi_hal_serial_init(app->serial, UART_BAUD);

    app->serial_running = true;
    app->worker = furi_thread_alloc_ex("TcSerialWorker", 1024, tc_serial_worker, app);
    furi_thread_start(app->worker);

    furi_hal_serial_async_rx_start(app->serial, tc_serial_rx_cb, app, false);
}

static void tc_serial_stop(TcApp* app) {
    if(!app->serial_running) return;
    app->serial_running = false;

    furi_hal_serial_async_rx_stop(app->serial);
    furi_hal_serial_deinit(app->serial);
    furi_hal_serial_control_release(app->serial);
    app->serial = NULL;

    furi_thread_join(app->worker);
    furi_thread_free(app->worker);
    app->worker = NULL;
}

/* ── Info screens ──────────────────────────────────────────────────────────── */

static void tc_show_info(TcApp* app, const char* title, const char* body) {
    widget_reset(app->widget);
    widget_add_text_box_element(
        app->widget, 0, 0, 128, 14, AlignCenter, AlignCenter, title, false);
    widget_add_text_scroll_element(app->widget, 0, 16, 128, 48, body);
    view_dispatcher_switch_to_view(app->view_dispatcher, TcViewInfo);
}

/* ── Navigation ────────────────────────────────────────────────────────────── */

static void tc_submenu_cb(void* context, uint32_t index) {
    TcApp* app = context;
    switch(index) {
    case TcMenuSerial:
        tc_serial_start(app);
        view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSerial);
        break;
    case TcMenuRfSurvey:
        tc_show_info(
            app,
            "915 MHz RF Survey",
            "Surveys RF energy near WatchTower at 915 MHz.\n\n"
            "LIMIT: Flipper CC1101 does OOK/2-FSK/GFSK only. It CANNOT decode "
            "Semtech LoRa (CSS) packets. Use it to confirm RF presence / find "
            "interference, NOT to read alerts.\n\n"
            "Live RSSI sweep lands in v1.1 (see README).");
        break;
    case TcMenuWifiSurvey:
        tc_show_info(
            app,
            "WiFi AP Survey",
            "Scans for setup APs: TenderNode-Setup / ChickenTender-Setup. Use "
            "RSSI to pick a mount spot.\n\n"
            "REQUIRES the Flipper WiFi Dev Board (ESP32) on the GPIO header. "
            "Without it, the Flipper has no 2.4 GHz radio.\n\n"
            "Live scan lands in v1.1 (see README).");
        break;
    case TcMenuGpioTest:
        tc_show_info(
            app,
            "GPIO Hardware Test",
            "Bring-up checks. Pin map (Flipper <-> ESP32):\n"
            " 13 TX -> ESP32 RX\n"
            " 14 RX -> ESP32 TX\n"
            " 8/11 GND -> ESP32 GND\n"
            " 9 = 3V3 out, 1 = 5V out (USB only)\n\n"
            "CAUTION: ESP32 GPIO is 3V3. Do NOT feed 5V into a data pin. Reed "
            "(door) switch reads as continuity to GND.");
        break;
    case TcMenuAbout:
        tc_show_info(
            app,
            "Tender Cells Field Kit",
            "WeCr8 Solutions. Open hardware diagnostics for the Tender Cells "
            "platform.\n\n"
            "USB-first: with the host plugged in, the Flipper bridges ESP32 "
            "UART to your PC, so a laptop reads coop logs through the Flipper "
            "(no FTDI).\n\nApache-2.0.");
        break;
    default:
        break;
    }
}

// Back button: from a tool view -> stop serial if running, return to menu.
// From the menu -> exit the app.
static bool tc_nav_back(void* context) {
    TcApp* app = context;
    if(app->serial_running) {
        tc_serial_stop(app);
    }
    view_dispatcher_switch_to_view(app->view_dispatcher, TcViewSubmenu);
    return true;
}

static bool tc_nav_exit(void* context) {
    UNUSED(context);
    return false; // let the dispatcher stop
}

/* ── App lifecycle ─────────────────────────────────────────────────────────── */

static TcApp* tc_app_alloc(void) {
    TcApp* app = malloc(sizeof(TcApp));
    memset(app, 0, sizeof(TcApp));

    app->gui = furi_record_open(RECORD_GUI);
    app->view_dispatcher = view_dispatcher_alloc();
    app->log_text = furi_string_alloc();
    app->rx_stream = furi_stream_buffer_alloc(RX_BUF_SIZE, 1);

    app->submenu = submenu_alloc();
    submenu_set_header(app->submenu, "Tender Cells Field Kit");
    submenu_add_item(app->submenu, "Serial Log Reader", TcMenuSerial, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "915 MHz RF Survey", TcMenuRfSurvey, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "WiFi AP Survey", TcMenuWifiSurvey, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "GPIO Hardware Test", TcMenuGpioTest, tc_submenu_cb, app);
    submenu_add_item(app->submenu, "About", TcMenuAbout, tc_submenu_cb, app);

    app->text_box = text_box_alloc();
    text_box_set_font(app->text_box, TextBoxFontText);
    app->widget = widget_alloc();

    view_set_previous_callback(submenu_get_view(app->submenu), tc_nav_exit);
    view_set_previous_callback(text_box_get_view(app->text_box), tc_nav_back);
    view_set_previous_callback(widget_get_view(app->widget), tc_nav_back);

    view_dispatcher_add_view(app->view_dispatcher, TcViewSubmenu, submenu_get_view(app->submenu));
    view_dispatcher_add_view(app->view_dispatcher, TcViewSerial, text_box_get_view(app->text_box));
    view_dispatcher_add_view(app->view_dispatcher, TcViewInfo, widget_get_view(app->widget));

    view_dispatcher_attach_to_gui(app->view_dispatcher, app->gui, ViewDispatcherTypeFullscreen);
    return app;
}

static void tc_app_free(TcApp* app) {
    if(app->serial_running) tc_serial_stop(app);

    view_dispatcher_remove_view(app->view_dispatcher, TcViewSubmenu);
    view_dispatcher_remove_view(app->view_dispatcher, TcViewSerial);
    view_dispatcher_remove_view(app->view_dispatcher, TcViewInfo);

    submenu_free(app->submenu);
    text_box_free(app->text_box);
    widget_free(app->widget);
    view_dispatcher_free(app->view_dispatcher);

    furi_stream_buffer_free(app->rx_stream);
    furi_string_free(app->log_text);
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
