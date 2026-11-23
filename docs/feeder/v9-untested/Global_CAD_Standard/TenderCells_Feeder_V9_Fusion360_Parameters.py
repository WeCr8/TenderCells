# Tender Cells Feeder V9 parameters — paste/run in Fusion 360 Scripts and Add-Ins
import adsk.core, adsk.fusion, traceback
PARAMS = [('TC_FDR_BORE_D', 72.0, 'mm', 'Metering housing bore'), ('TC_FDR_ROTOR_OD', 70.8, 'mm', 'Corrected rotor OD'), ('TC_FDR_ROTOR_W', 50.8, 'mm', 'Corrected rotor axial width'), ('TC_FDR_ROTOR_RADIAL_CLR', 0.6, 'mm', 'Per-side radial clearance'), ('TC_FDR_ROTOR_AXIAL_CLR', 0.6, 'mm', 'Per-side axial clearance'), ('TC_FDR_ROTOR_POCKETS', 6.0, '', 'Pocket count'), ('TC_FDR_INDEX_ANGLE', 60.0, 'deg', '360 / pocket count'), ('TC_FDR_SIDE_INNER_SPACING', 52.0, 'mm', 'Closure plate inner-face spacing'), ('TC_FDR_SHAFT_D', 6.0, 'mm', 'Rotor shaft nominal'), ('TC_FDR_SHAFT_D_FLAT', 5.0, 'mm', 'D-shaft across-flat'), ('TC_FDR_BEARING_ID', 6.0, 'mm', '696 bearing'), ('TC_FDR_BEARING_OD', 15.0, 'mm', '696 bearing'), ('TC_FDR_BEARING_W', 5.0, 'mm', '696 bearing'), ('TC_FDR_BEARING_POCKET', 15.08, 'mm', 'Printed pocket candidate'), ('TC_FDR_GASKET_T', 1.8, 'mm', 'Actual gasket STEP thickness'), ('TC_FDR_GASKET_GROOVE_D', 1.6, 'mm', 'Nominal groove depth'), ('TC_FDR_HOPPER_TOP', 160.0, 'mm', 'Outer top size'), ('TC_FDR_HOPPER_BOTTOM', 82.0, 'mm', 'Outer lower size'), ('TC_FDR_HOPPER_H', 190.0, 'mm', 'Outer height'), ('TC_FDR_HOPPER_WALL', 2.6, 'mm', 'Nominal wall')]
def run(context):
    app=adsk.core.Application.get(); des=adsk.fusion.Design.cast(app.activeProduct)
    if not des: raise RuntimeError('Open a Fusion design first')
    up=des.userParameters
    unit_map={'mm':'mm','deg':'deg','':''}
    for name,value,unit,desc in PARAMS:
        existing=up.itemByName(name)
        expr=str(value) + ((' '+unit_map[unit]) if unit_map[unit] else '')
        if existing:
            existing.expression=expr; existing.comment=desc
        else:
            up.add(name, adsk.core.ValueInput.createByString(expr), unit_map[unit], desc)
