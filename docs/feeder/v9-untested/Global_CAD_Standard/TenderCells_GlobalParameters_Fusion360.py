# Tender Cells Fusion 360 global user-parameter installer
# Run from Utilities > Scripts and Add-Ins in Fusion 360.
import adsk.core, adsk.fusion, traceback
PARAMS = [
    ("TC_PRINT_CLEARANCE", "0.30 mm", "Typical FDM sliding-fit clearance per side"),
    ("TC_MOVING_CLEARANCE", "0.60 mm", "Moving/feed metering clearance"),
    ("TC_M3_CLEARANCE", "3.40 mm", "M3 clearance hole target"),
    ("TC_M4_CLEARANCE", "4.50 mm", "M4 clearance hole target"),
    ("TC_M5_CLEARANCE", "5.50 mm", "M5 clearance hole target"),
    ("TC_INSERT_M3_OD", "4.60 mm", "M3 heat-set insert pilot nominal"),
    ("TC_WALL_GENERAL", "2.40 mm", "General printed wall"),
    ("TC_FLOOR_GENERAL", "3.00 mm", "General structural floor"),
    ("TC_EDGE_FILLET", "2.00 mm", "Default non-interface fillet"),
    ("TC_GRID", "25.00 mm", "Tender Cells modular mounting grid"),
    ("TC_SERVICE_CLEARANCE", "20.00 mm", "Electronics service clearance"),
    ("TC_CABLE_BEND_MIN", "25.00 mm", "Cable bend planning radius"),
]
def run(context):
    ui=None
    try:
        app=adsk.core.Application.get(); ui=app.userInterface
        design=adsk.fusion.Design.cast(app.activeProduct)
        if not design: raise RuntimeError("Open a Fusion design first")
        units=design.unitsManager; ups=design.userParameters
        for name, expr, comment in PARAMS:
            existing=ups.itemByName(name)
            if existing:
                existing.expression=expr; existing.comment=comment
            else:
                ups.add(name, adsk.core.ValueInput.createByString(expr), '', comment)
        ui.messageBox("Tender Cells global parameters installed/updated.")
    except:
        if ui: ui.messageBox("Failed:\n"+traceback.format_exc())
