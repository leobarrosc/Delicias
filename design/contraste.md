# Verificação de contraste — WCAG 2.1 AA

Gerado a partir dos valores reais de `src/app/globals.css`, replicando o
`color-mix(in oklab, ...)` do CSS e a composição alfa do navegador.

Critérios: texto normal **4.5:1** · texto grande **3:1** · componentes de
interface e seus limites **3:1** (WCAG 1.4.11).

> Divisórias puramente decorativas de card (`border-stone-200`) ficam abaixo de
> 3:1 por opção de projeto. A 1.4.11 cobre limites *necessários para identificar*
> um componente; um card já é delimitado por fundo e sombra. Bordas de campo
> de formulário (`border-stone-300`), essas sim, passam.


## delicias — diurno (capuccino)

| par verificado | cor final | razão | resultado |
|---|---|---|---|
| títulos `stone-950/900` sobre base-100 | `#3B2A21` | 13.34:1 | **AAA** |
| corpo `stone-700` sobre base-100 | `#4F3F36` | 9.80:1 | **AAA** |
| secundário `stone-600` sobre base-100 | `#5E5048` | 7.57:1 | **AAA** |
| legenda `stone-500/400` sobre base-100 | `#72655D` | 5.51:1 | **AA** |
| `primary` como texto sobre base-100 | `#8B5E3C` | 5.45:1 | **AA** |
| `secondary` como texto sobre base-100 | `#A64B57` | 5.45:1 | **AA** |
| `info` como texto sobre base-100 | `#3A6485` | 6.14:1 | **AA** |
| `success` como texto sobre base-100 | `#4F7034` | 5.55:1 | **AA** |
| `warning` como texto sobre base-100 | `#8C5B0C` | 5.68:1 | **AA** |
| `error` como texto sobre base-100 | `#A93B32` | 6.11:1 | **AA** |
| títulos `stone-950/900` sobre base-200 | `#3B2A21` | 11.98:1 | **AAA** |
| corpo `stone-700` sobre base-200 | `#4E3E35` | 8.97:1 | **AAA** |
| secundário `stone-600` sobre base-200 | `#5D4D44` | 7.03:1 | **AAA** |
| legenda `stone-500/400` sobre base-200 | `#706158` | 5.21:1 | **AA** |
| `primary` como texto sobre base-200 | `#8B5E3C` | 4.90:1 | **AA** |
| `secondary` como texto sobre base-200 | `#A64B57` | 4.90:1 | **AA** |
| `info` como texto sobre base-200 | `#3A6485` | 5.52:1 | **AA** |
| `success` como texto sobre base-200 | `#4F7034` | 4.99:1 | **AA** |
| `warning` como texto sobre base-200 | `#8C5B0C` | 5.10:1 | **AA** |
| `error` como texto sobre base-200 | `#A93B32` | 5.49:1 | **AA** |
| `primary-content` sobre `primary` (botão) | `#FFF9F3` | 5.34:1 | **AA** |
| `secondary-content` sobre `secondary` (botão) | `#FFF9F3` | 5.34:1 | **AA** |
| `accent-content` sobre `accent` (botão) | `#FFF9F3` | 8.99:1 | **AAA** |
| `neutral-content` sobre `neutral` (botão) | `#F7EDE3` | 9.81:1 | **AAA** |
| `amber-700` sobre `amber-50` (chip) | `#F1E8DD` | 4.79:1 | **AA** |
| `sky-700` sobre `sky-50` (chip) | `#E6E9EA` | 5.14:1 | **AA** |
| `emerald-700` sobre `emerald-50` (chip) | `#E8EADF` | 4.69:1 | **AA** |
| `red-700` sobre `red-50` (chip) | `#F7E5DF` | 5.12:1 | **AA** |
| `brand-700` sobre `brand-100` (chip) | `#F1E8E0` | 5.45:1 | **AA** |
| `brand-700` sobre base-100 (link) | `#7C5437` | 6.45:1 | **AA** |
| borda de campo `stone-300` sobre base-100 | `#998F88` | 3.10:1 | **PASSA (>=3)** |
| borda de campo `stone-300` sobre base-200 | `#958980` | 3.00:1 | **PASSA (>=3)** |
| foco `brand-600` sobre base-100 | `#8B5E3C` | 5.45:1 | **PASSA (>=3)** |

## delicias-dark — noturno (chocolate amargo)

| par verificado | cor final | razão | resultado |
|---|---|---|---|
| títulos `stone-950/900` sobre base-100 | `#F0E3D6` | 13.51:1 | **AAA** |
| corpo `stone-700` sobre base-100 | `#DCCFC3` | 11.13:1 | **AAA** |
| secundário `stone-600` sobre base-100 | `#CBBFB3` | 9.43:1 | **AAA** |
| legenda `stone-500/400` sobre base-100 | `#B7ABA0` | 7.56:1 | **AAA** |
| `primary` como texto sobre base-100 | `#D9A066` | 7.43:1 | **AAA** |
| `secondary` como texto sobre base-100 | `#E09AA3` | 7.56:1 | **AAA** |
| `info` como texto sobre base-100 | `#7FAFD4` | 7.28:1 | **AAA** |
| `success` como texto sobre base-100 | `#9BBF72` | 8.18:1 | **AAA** |
| `warning` como texto sobre base-100 | `#E0AC4A` | 8.24:1 | **AAA** |
| `error` como texto sobre base-100 | `#E8837A` | 6.45:1 | **AA** |
| títulos `stone-950/900` sobre base-200 | `#F0E3D6` | 14.53:1 | **AAA** |
| corpo `stone-700` sobre base-200 | `#DBCEC2` | 11.88:1 | **AAA** |
| secundário `stone-600` sobre base-200 | `#CABEB2` | 10.00:1 | **AAA** |
| legenda `stone-500/400` sobre base-200 | `#B4A99F` | 7.94:1 | **AAA** |
| `primary` como texto sobre base-200 | `#D9A066` | 7.99:1 | **AAA** |
| `secondary` como texto sobre base-200 | `#E09AA3` | 8.12:1 | **AAA** |
| `info` como texto sobre base-200 | `#7FAFD4` | 7.83:1 | **AAA** |
| `success` como texto sobre base-200 | `#9BBF72` | 8.79:1 | **AAA** |
| `warning` como texto sobre base-200 | `#E0AC4A` | 8.86:1 | **AAA** |
| `error` como texto sobre base-200 | `#E8837A` | 6.94:1 | **AA** |
| `primary-content` sobre `primary` (botão) | `#2A1B10` | 7.26:1 | **AAA** |
| `secondary-content` sobre `secondary` (botão) | `#2A1B10` | 7.38:1 | **AAA** |
| `accent-content` sobre `accent` (botão) | `#2A1B10` | 6.77:1 | **AA** |
| `neutral-content` sobre `neutral` (botão) | `#EFE2D5` | 14.93:1 | **AAA** |
| `amber-700` sobre `amber-50` (chip) | `#37291C` | 6.78:1 | **AA** |
| `sky-700` sobre `sky-50` (chip) | `#2F2A29` | 6.08:1 | **AA** |
| `emerald-700` sobre `emerald-50` (chip) | `#312B1F` | 6.74:1 | **AA** |
| `red-700` sobre `red-50` (chip) | `#382520` | 5.46:1 | **AA** |
| `brand-700` sobre `brand-100` (chip) | `#37281E` | 6.95:1 | **AA** |
| `brand-700` sobre base-100 (link) | `#DEAC7B` | 8.34:1 | **AAA** |
| borda de campo `stone-300` sobre base-100 | `#8E8379` | 4.58:1 | **PASSA (>=3)** |
| borda de campo `stone-300` sobre base-200 | `#8A7F77` | 4.70:1 | **PASSA (>=3)** |
| foco `brand-600` sobre base-100 | `#D9A066` | 7.43:1 | **PASSA (>=3)** |

---

**Reprovações: 0**

