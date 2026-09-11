# Beacon Verify — brand assets

Drop these files here (git-ignored). Everything works with built-in fallbacks
if a file is missing, so you can add them one at a time — and once a file
lands here it's picked up on the very next request, no restart needed.

| File | Purpose | Notes |
|---|---|---|
| `letterhead.pdf` | Background for the **Digital Copy** (planner Q&A) | A4 **portrait**, 1 page. Content is drawn in Times Roman with a **5.5 cm top** and **1.5 cm bottom** margin. |
| `certificate.png` | Background for the **Certificate** | A4 **landscape** proportions (≈1.414:1). `.jpg` or `.pdf` also accepted — set the name in `verify-layout.json`. |
| `fonts/NewIconScript.ttf` | Planner name on the certificate | size 55, centred, baseline **9.64 cm** from the top |
| `fonts/Lora.ttf` | "Certificate No: BCN-137-NN" line | size 18, centred, baseline **16.53 cm** from the top |

## Tuning positions without code — `assets/verify-layout.json`

Optional. Only include the keys you want to override. All measurements are in
**cm from the top of the page**.

```json
{
  "letterhead": {
    "background": "letterhead.pdf",
    "marginTopCm": 5.5,
    "marginBottomCm": 1.5,
    "marginLeftCm": 2.2,
    "marginRightCm": 2.2,
    "bodyFontSize": 10.5
  },
  "certificate": {
    "background": "certificate.png",
    "plannerName":   { "fromTopCm": 9.64,  "size": 55, "minSize": 22, "maxWidthCm": 24, "font": "NewIconScript", "align": "center" },
    "certificateNo": { "fromTopCm": 16.53, "size": 18, "minSize": 10, "maxWidthCm": 24, "font": "Lora", "align": "center", "prefix": "Certificate No: ", "bold": true }
  }
}
```

`font` is the base filename under `assets/fonts/` (without extension).
`align` is `left` | `center` | `right`.
The certificate name is rendered as **"Firm Name - Full Name"**. Long names
auto-shrink from `size` down to `minSize` to stay within `maxWidthCm`; if it's
still too wide at `minSize` it's ellipsized rather than overflowing.
`certificateNo.bold: true` looks for `fonts/Lora-Bold.ttf` first; if that file
isn't there it fakes bold by redrawing the regular weight with a hairline
offset.
