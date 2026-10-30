# BikeWo Brand Colors

Official palette from **BikeWo Brand Guidelines v1.0**.

## Primary

| Name | HEX | Role |
|------|-----|------|
| BikeWo Indigo | `#241F5D` | Structure, type, dark surfaces, labels on green CTAs |
| BikeWo Green | `#2AB77C` | CTAs, highlights, active states |

## Support

| Name | HEX | Role |
|------|-----|------|
| Midnight | `#14113A` | Deepest surfaces |
| Charge Green | `#35D68F` | Screen-only highlights |
| Cloud | `#F1F1F5` | Default light surface |
| Pure White | `#FFFFFF` | Dominant light surface |
| Slate | `#4A4869` | Body copy on light |
| Mist | `#C8C7D6` | Body copy on dark |

## Rules

- Ratio ~60% neutral / 25% indigo / 10% green / 5% support
- Green text on white → `#17754F` only
- Primary button: **Indigo text on Green fill** — never white on green
- **Selection chrome** (toggles, tabs, active sidebar, form section icons): **Indigo fill** — keep green for CTAs only
- Fonts: do not substitute brand wordmark; app UI keeps Host Grotesk

## Code

```js
import { brandColors } from '@webfudge/config';

brandColors.primary; // #2AB77C
brandColors.indigo;  // #241F5D
brandColors.cloud;   // #F1F1F5
```

Tailwind: `bg-brand-primary`, `text-brand-indigo`, `bg-brand-light`.  
Existing `orange-*` utility classes map to the green ramp via the shared preset.
