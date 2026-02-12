# PDF Parser Service

Microservicio Node.js para extraer transacciones de resúmenes de tarjetas de crédito usando pdf.js.

## Características

- **Parsing basado en posiciones**: Usa coordenadas X/Y para detectar columnas de tablas
- **Soporte multi-banco**: BBVA, Galicia (extensible a otros)
- **Extracción precisa**: Detecta automáticamente montos en ARS y USD
- **API REST simple**: Endpoint único `/parse` que recibe PDF y devuelve JSON

## API

### POST /parse

Sube un PDF de resumen de tarjeta de crédito y extrae las transacciones.

**Request:**
```bash
curl -X POST http://localhost:3001/parse \
  -F "pdf=@bbva-statement.pdf" \
  -F "bank=bbva"  # opcional: hint del banco
```

**Response:**
```json
{
  "success": true,
  "bank": "bbva",
  "transactions": [
    {
      "id": "txn_abc123",
      "date": "2026-01-04",
      "description": "NETFLIX.COM",
      "amountARS": 10.38,
      "amountUSD": 10.38,
      "installmentInfo": null
    }
  ],
  "metadata": {
    "fileName": "bbva-statement.pdf",
    "processedAt": "2026-02-11T20:00:00.000Z",
    "transactionCount": 12
  }
}
```

### GET /health

Health check del servicio.

## Arquitectura

```
┌─────────────────┐      HTTP POST      ┌──────────────────┐
│   Backend .NET  │ ───────────────────► │  PDF Parser      │
│   (API Gateway) │   multipart/form     │  (Node.js)       │
│                 │ ◄─────────────────── │                  │
│                 │   JSON Response      │  pdf.js engine   │
└─────────────────┘                      └──────────────────┘
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Producción
npm start
```

## Docker

El servicio se incluye automáticamente en el docker-compose principal:

```bash
docker compose up pdf-parser
```

## Cómo funciona el parsing

### BBVA - Detección de Columnas

El resumen BBVA tiene una tabla con 5 columnas principales:

| Fecha | Descripción | Nro. Cupón | Pesos | Dólares |
|-------|-------------|------------|-------|---------|

El parser usa las **posiciones X absolutas** para identificar cada columna:

```
04-Ene-26   NETFLIX.COM M2wgWnC6RUSD 10,38   968625   [vacío]   10,38
|---------| |-----------------------------| |------| |-------| |-----|
  Fecha           Descripción               Cupón    Pesos   Dólares
                                              ↑
                                    Solo si es transacción USD
```

**Lógica de montos:**
- **Transacciones ARS**: Solo tienen monto en columna "Pesos" (`amountARS`)
- **Transacciones USD**: Tienen monto en columna "Dólares" (`amountUSD`), la columna "Pesos" suele estar vacía o tener el equivalente ARS

**Ejemplos:**

```
RACING CLUB (ARS solo):
  Description: "RACING CLUB"
  amountARS: 29400.00
  amountUSD: 0

NETFLIX.COM (USD):
  Description: "NETFLIX.COM"
  amountARS: 0
  amountUSD: 10.38

ENIGMA TICKETS con cuota:
  Description: "ENIGMA TICKETS FTM (03/06)"
  amountARS: 47500.04
  amountUSD: 0
  installmentInfo: "03/06"
```

### Algoritmo general

1. **Extracción de texto con posiciones**: pdf.js devuelve cada fragmento de texto con sus coordenadas X/Y
2. **Agrupación por líneas**: Se agrupan elementos con coordenada Y similar (misma línea)
3. **Detección de columnas por X**: Se usa el header "FECHA DESCRIPCIÓN CUPÓN PESOS DÓLARES" para calibrar los límites de cada columna
4. **Parsing específico**: Para cada línea, se clasifican los elementos según su posición X en las columnas correspondientes

## Extender para nuevos bancos

1. Crear `src/parsers/{bank}Parser.js`
2. Implementar función `parse{Bank}(pages)`
3. Agregar detección en `pdfParser.js` → `detectBank()`
4. Agregar case en `parsePdf()`

## Troubleshooting

### "Could not detect bank type"
- El PDF no contiene los marcadores esperados del banco
- Verificar que el PDF sea un resumen de tarjeta válido

### "No transactions found"
- El formato del PDF puede haber cambiado
- Revisar logs para ver líneas detectadas
- Ajustar `COL_GAP_THRESHOLD` en el parser específico

### Servicio no responde
- Verificar que el contenedor esté corriendo: `docker compose ps`
- Revisar logs: `docker compose logs pdf-parser`
- Health check: `curl http://localhost:3001/health`
