# Análisis de PDFs de Tarjetas de Crédito

## Galicia - VISA

### Estructura Detectada
```
FECHA      REFERENCIA                    CUOTA    COMPROBANTE  PESOS       DÓLARES
08-09-25   * MERPAGO*PEQUENOSHINCH       05/06    060539       5.826,00
07-11-25   * OPTICA LOMBARDI             03/03    952311       62.700,33
31-12-25   K MERPAGO*DELICIAS                              25.996,00
16-01-26   F AIRBNB * HMSZC9P3RT       USD 250,06 048150                250,06
21-01-26   GOOGLE *YouTubeP           USD 4,79   826140                  4,79
```

### Características:
- **Fecha**: DD-MM-YY (ej: `09-01-26`)
- **Cuotas**: Formato `NN/MM` (ej: `05/06` = cuota 5 de 6)
- **Indicador USD**: Letra `F` al principio o texto `USD` en descripción
- **Montos**: Formato argentino con punto de miles y coma decimal
- **K***: Indica consumo en cuotas (o tarjeta adicional)
- **\***: Indica cuota de compra en curso

### Patrones de extracción:
```regex
^(\d{2}-\d{2}-\d{2})\s+([*K]\s+)?([\w\s\*]+?)\s+(?:(\d{2}/\d{2})\s+)?(\d{6})?\s+([\d.,]+)$   // ARS
^(\d{2}-\d{2}-\d{2})\s+F\s+([\w\s\*]+?)\s+USD\s+([\d.,]+)\s+(\d{6})\s+([\d.,]+)$              // USD
```

---

## BBVA - VISA Platinum

### Estructura Detectada
```
FECHA       DESCRIPCIÓN                    NRO. CUPÓN  PESOS       DÓLARES
05-Ene-26   SU PAGO EN USD                                         -26,75
04-Ene-26   AUTOPISTAS URBAN              000000002764515 000001   5.026,42
04-Ene-26   NETFLIX.COM                   579145140USD 6,23 944008 6,23
04-Ene-26   NETFLIX.COM M2wgWnC6RUSD 10,38 968625                   10,38
```

### Características:
- **Fecha**: DD-Mmm-YY en español (ej: `04-Ene-26`)
- **Meses**: Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic
- **Cuotas**: No claramente identificadas en el extracto (puede estar en descripción)
- **Indicador USD**: Texto `USD` seguido del monto en la descripción
- **Formato**: Más irregular que Galicia
- **NRO. CUPÓN**: Número de comprobante (variable longitud)

### Líneas a ignorar:
- `SU PAGO EN USD` / `SU PAGO EN PESOS` (pagos, no consumos)
- `CR.RG 5617 30%` (créditos/devoluciones)
- `INTERESES FINANCIACION` (cargos, no consumos)
- Líneas que empiezan con `TOTAL` o `SALDO`

---

## Estrategia de Parsing

### 1. Detección de Banco
- **Galicia**: Buscar `"Banco:"` + `"Galicia"` o `"Tarjeta Crédito VISA"` con formato específico
- **BBVA**: Buscar `"BBVA"` o `"OCASA - R.N.P.S.P"`

### 2. Zona de extracción
- **Galicia**: Buscar `"DETALLE DEL CONSUMO"` hasta `"TARJETA XXXX"` o `"Resumen de tarjeta"`
- **BBVA**: Buscar `"DETALLE"` o `"FECHA DESCRIPCIÓN"` hasta `"TOTAL CONSUMOS"`

### 3. Parsing de líneas

#### Galicia:
```csharp
// Ejemplo: "09-01-26 K MERPAGO*HIPERCHANGOMA 154849 41.977,20"
var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
// parts[0] = fecha
// parts[1] = indicador (K o *)
// parts[2..n-2] = descripción
// parts[n-2] = cuota (opcional NN/MM)
// parts[n-1] = monto
```

#### BBVA:
```csharp
// Ejemplo: "04-Ene-26 NETFLIX.COM M2wgWnC6RUSD 10,38 968625 10,38"
// Más complejo - requiere regex
// Fecha + Descripción (puede contener "USD XX,XX") + Cupón + Monto ARS + Monto USD
```

### 4. Normalización de descripción
- **Cuotas**: Agregar " (NN/MM)" al final de la descripción
- **Limpiar**: Remover códigos como `MERPAGO*`, `DLO*`, `CP*`, etc.
- **Mayúsculas**: Mantener o convertir según preferencia

### 5. Detección de moneda
- **Galicia**: Si tiene `F` al inicio O si la columna USD tiene valor > 0
- **BBVA**: Si la descripción contiene `USD XX,XX` y el monto USD > 0
