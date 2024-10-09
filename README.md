[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

# A4T: [A]nother [4]010 [T]oolhead (BETA)
<img src='docs/images/A4T_render.png' width=400 />

> [!TIP] 
> ### You can help support the development of A4T.<br/>
> Donate at https://ko-fi.com/dwtas<br/>
[![ko-fi](docs/images/Ko-fi_TextLogo.png)](https://ko-fi.com/dwtas)

<br/> 
After the last year or two looking after Xol and transforming it into Xol Toolhead, I thought it was about time I tried to see if I could design something from scratch. The result is A4T: [A]nother [4]010 [T]oolhead <br/><br/>

A4T is built around the following constraints:
* Dual 4010 blower fans for part cooling
* HF hotends (designed aroun Dragon HF with an extender, so Rapido HF will also fit).
* 2510 hotend cooling with well-directed hotend cooling airflow. (Can't beet the amazing 5v Delta 2510)
* ***Easy Assembly***
* Custom Wrist Watch BMG mod with Sherpa-Mini spacing. Also works with Sherpa-Mini.
* Neopixel LEDs with good part lighting from in front of the nozzle.
* Built for Xol-Carriage - can work with Voron Tap / Standard Voron CW2 carriage.

## Pre-requisites
A printer that fits either Xol carriage, or a standard voron CW2 or Tap carriage.<br/>
<br/>
To avoid build plate area loss:
- X/Y gantry joints that are within the same size as standard Voron 2.4 or Trident X/Y joints.
- Slimmer than stock idlers (see warning below) 

See Voron Design instructions to install TAP.<br/>
`If using tap, highly recommended to replace M3x50 SHCS with button head screws for better build plate clearance.`<br/>
<br/>
Xol-Carriage documentation is here: https://github.com/Armchair-Heavy-Industries/Xol-Toolhead/blob/main/docs/xol_carriage_assembly.md<br/>

> [!WARNING]
> ## Front Idlers  
> A4T can collide with the stock voron front idlers for Trident and 2.4 when the toolhead is in the front corners of the build area. This can cause issues with the homing sequence when homing X if the toolhead is at the front of the gantry on Y. <br/><br/>
> Fully compatible idlers:<br/>
> * clee's [BFI (Beefy Front Idlers)](https://github.com/clee/VoronBFI)  <br/>
> * Ramalama2's [Front Idlers](https://github.com/Ramalama2/Voron-2-Mods/tree/main/Front_Idlers)  

## Bill of Materials (BOM)
`*Does not include carriage hardware`
| Qty | Item                                          | Notes                                                                                     |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 4   | M3 Square Nut (DIN 562)                       | Yes, squre nuts. They don't spin in a slot like hex nuts                                  |
| 3   | M3 x 8 SHCS                                   | 2x Top cowling mounting. 1x Toolhead board mount to back of Xol Carriage                  |
| 2   | M3 x 6 SHCS or BHCS or Waferhead screw        | Any of these three screw heads. The important part is 6mm thread <br/> `This is only for Xol Carriage. If you use Tap or other Voron carriage, you already have SHCS where the hotend adapter slots under` <img src='docs/images/xol_carriage_screws.png' width=320 alt="tap screws" align='right'> | 
| 2   | M3 x 50 SHCS                                  | Bottom cowling mounting screws. The same as are in the bottom of Stealthburner            |
| 2   | * M3 x 14 SHCS or BHCS (WWBMG)<br/>* M3 x 12 SHCS or BHCS (Sherpa-Mini)                         | Attach extruder to cowling                 |
| 2   | 4010 Blower Fan                               | Recommended blower: GDStime 12,000 RPM 24v. (<a href="https://www.aliexpress.com/item/32798634077.html">Ali Express</a>)                                                        |
| 1   | 2510 Axial Fan                                | Recommended fan: Delta Electronics 15,000 RPM 5v ASB02505SHA-AY6B (<a href="https://www.digikey.com/en/products/detail/delta-electronics/ASB02505SHA-AY6B/7491489">DigiKey</a>) |
| 3   | Neopixel LED PCB                              | The same kind as used in Stealthburner. Get the solder pad version. <br/> `Wiring diagram (click to enlarge) ---->`  <img src='docs/images/LED_wiring_order.jpg' width=60 alt="LEDs" align='right'>                      |
| 9   | Lengths of 28 AWG or 26 AWG wire              | To make the LED harness                                                                   |
| 1   | Connector and required crimps                 | To make the LED harness                                                                   |
| 1   | Hotend                                        | Recommended hotend:<br/>*  **Dragon HF** with **Triangle Lab ZS-MZE-HF** (<a href="https://www.aliexpress.com/item/1005006402646093.html">Ali Express</a>)<img src='docs/images/DragonHF+MZE.png' width=120 alt="Dragon" align='right'> <br/> Alternatives: <br/>* Dragon UHF-Mini <br/>* Dragon Ace (with spacer, no MZE)<br/>* Rapido HF<br/>* NF-Crazy with MZE<br/>* NF-Crazy Volcano <br/><img src='docs/images/other_hotends.png' width=280 alt="hotends" align='right'>        |
| 4   | Hotend screws                                 | Should come with your hotend. Dragon/Rapido usually use M2.5 x 8mm SHCS                   |
| 1   | Extruder                                      | Recommended Extruder:<br/>* Modified WW-BMG with Bondtech RIDGA v2. ([STLs here](STL))<br/> Alternatives: <br/>*Sherpa-Mini  <br/>*VZ-Hextrudort-Low <br/>*LGX-Lite   |
| 2   | 20mm or 21mm 3mm internal threaded stand off  | To attach toolhead board to the back of the extruder motor and third mounting point on the back of Xol Carriage. <br/>`Length will depend on the motor you use. It needs to line up the toolhead board holder with the back of the Xol Carriage.`                   |

## Printing parts
### Print settings
Parts are meant to be printed in 0.2mm layer heights, 0.25mm first layer should be OK. Other layer heights will cause the built-in supports to fail or fuse to the printed part.<br/>
Print settings will depend on your printer setup / filament used / phase of the moon/etc.<br/>
The parts are not pre-scaled for any particular filamen type. You will need to tune the filament you use for correct shrinkage compensation to get good results. Development was done with multiple brands of ASA and ASA-CF filaments (each individually tuned).<br/>

General voron-like settings are a good starting point for 0.4mm wall widths (four walls, 5 top/bottom layers and 40% infil).<br/>
The print setup was tested with 0.5mm nozzle printing 0.55mm line widths with 3 walls and 40% infill with good results.<br/>

You're printing a toolhead, not a trinket or a toy. You should be aiming for high strength with strong layer adhesion. I.e. print it slower/hotter if you have bad layer adhesion. It doesn't matter if it takes over 2 hours to print the main body.<br/>

### What to Print

## Assembly
### LED Harness (optional)
![LEDs](docs/images/LED_wiring_order.jpg)

### Assembly Steps

1. Remove Supports
2. Glue LED filter to LED diffuser
3. Install LED filter/diffuser assembly into cowel
4. Install status LED (closest to MCU) into LED Carrier
5. Pass the LED chain through the LED slot in the cowling from top to bottom. The 2nd and 3rd LEDs go through first, then the status LED + carrier fit into place.
6. Install the part/nozzle LEDs. The wire between these goes back up and over the LED slot that the status LED is in.
7. Install the 2510 HE fan. It will need to be angled in, slightly top first. The wires should be exiting from the top.
8. Slide the HE fan duct up into place. This locks the HE fan into place. `Don't pinch any wires`
9. put the LED wires into the holders up next the the left side (looking from the back) 4010 blower slot.
10. Install the blower fans into the slots. If they're not a snug fit, your shrinkage compensation wasn't quite right. You might be able to make it work with some tape on the top of the blower fans so they are a good tight fit. `Don't pinch any wires`
11. Install the hotend
12. Install the square nuts into the slots
    * Two under the extruder mounting points
    * Two in the back behind the exturder (Xol-Carriage only)
13. Put the two M3x8 screws behind the Extruder adapter (CW2/Tap only)
14. Install the extruder and extruder adapter
    * Include the toolhead board if you're using one
15. Wire it all up
16. Install everything on your carriage
17. Check all your software setup, enstop positions etc.
18. Enjoy!


<br/><br/><br/><br/>
This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg
