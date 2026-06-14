# Chicken TenderCell CAD Concepts

These files are the June 2026 physical concept source for the Chicken TenderCell automated coop.

## Files

| File | Purpose |
| --- | --- |
| `72x72_Chicken_Tender_Cell.SLDASM` | Main SolidWorks assembly for the 72-inch square cell concept. |
| `Chicken_Tender_Cell_72SQ.SLDPRT` | Cell body / enclosure part concept. |
| `Chicken_tender_X_Rails.SLDPRT` | X-axis rail part concept. |
| `Chicken_tender_Y_Rail.SLDPRT` | Y-axis rail part concept. |
| `Chicken_tender_Z_Rails.SLDPRT` | Z-axis rail part concept. |
| `Chicken_tender_6DOF_Mounting_Plate.SLDPRT` | 6DOF robot arm mounting plate concept. |
| `UR3e.step` | Universal Robots UR3e reference model. |
| `universal-robots-graphical-documentation-terms.txt` | Terms supplied with the UR3e reference model. |

## Website Usage

Raw CAD files are not browser-friendly product images. Render product previews to PNG/WebP and place them under:

```text
applications/tendercells_ui/test_output/website/public/assets/images/products/
```

Current public preview:

```text
applications/tendercells_ui/test_output/website/public/assets/images/products/chicken-tender-concept.png
```

## Documentation Rule

When the CAD geometry changes, update the rendered preview and the product docs so builders can understand both the appearance and the editable source.
