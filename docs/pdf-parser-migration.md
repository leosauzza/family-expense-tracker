# Migración al Servicio de PDF Parser (Node.js)

## Resumen

Se ha creado un nuevo microservicio Node.js que reemplaza el parsing de PDFs en C# (PdfPig) por una solución basada en **pdf.js** con extracción por posiciones.

## Motivación

- **Mejor precisión**: pdf.js permite extraer texto con coordenadas X/Y, permitiendo detectar columnas de tablas
- **Separación de responsabilidades**: El parsing de PDFs es ahora un servicio dedicado
- **Extensibilidad**: Más fácil agregar nuevos bancos
- **Mantenimiento**: JavaScript tiene mejor soporte para manipulación de PDFs que .NET

## Arquitectura Nueva

```
┌─────────────────┐      HTTP POST      ┌──────────────────┐      HTTP POST      ┌─────────────┐
│   Frontend      │ ───────────────────► │   Backend .NET   │ ───────────────────► │  Node.js    │
│   (React)       │                      │   (API Gateway)  │   (PDF + Metadata)  │  (Parser)   │
│                 │ ◄─────────────────── │                  │ ◄────────────────── │  (pdf.js)   │
│                 │   JSON Transactions  │                  │   JSON Transactions │             │
└─────────────────┘                      └──────────────────┘                     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  PostgreSQL │
                                        └─────────────┘
```

## Estructura del Proyecto

```
pdf-parser-service/
├── Dockerfile
├── package.json
├── README.md
├── test-parse.js              # Script de test
└── src/
    ├── index.js               # Entry point (Express)
    ├── parsers/
    │   ├── pdfParser.js       # Router y detector de banco
    │   ├── bbvaParser.js      # Parser específico BBVA
    │   └── galiciaParser.js   # Parser específico Galicia
    └── utils/
        ├── canvasFactory.js   # Factory para pdf.js en Node
        └── pdfUtils.js        # Utilidades comunes
```

## Cambios Realizados

### 1. Nuevo Servicio: `pdf-parser-service/`
- Servicio Express en Node.js
- Usa `pdfjs-dist` para parsing de PDFs
- Expone endpoint `POST /parse` que recibe PDF y devuelve JSON

### 2. Backend .NET Modificado
- **Nuevo archivo**: `RemotePdfParsingService.cs`
  - Reemplaza `PdfParsingService`
  - Hace HTTP POST al servicio Node.js
  - Mapea la respuesta JSON al modelo de dominio
- **Program.cs**: Cambiado `AddScoped<IPdfParsingService, PdfParsingService>()` por `AddScoped<IPdfParsingService, RemotePdfParsingService>()`

### 3. Docker Compose Actualizado
- Agregado servicio `pdf-parser` con:
  - Puerto 3001 expuesto
  - Health check
  - Volumen para desarrollo (hot-reload)

## Cómo Ejecutar

### Desarrollo Local (con Docker)

```bash
# Construir y levantar todos los servicios
./restart.sh

# O manualmente:
docker compose up -d --build

# Verificar que el servicio de PDF esté corriendo
curl http://localhost:3001/health
```

### Test del Parser

```bash
# Entrar al directorio del servicio
cd pdf-parser-service

# Instalar dependencias (para test local sin Docker)
npm install

# Correr test con el PDF de ejemplo
node test-parse.js ../bbva-example.pdf
```

## API del Servicio de PDF

### POST /parse

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `pdf`: Archivo PDF (requerido)
  - `bank`: Hint del banco (opcional: `bbva`, `galicia`)

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
    "fileName": "statement.pdf",
    "processedAt": "2026-02-11T20:00:00.000Z",
    "transactionCount": 12
  }
}
```

### GET /health

Health check simple.

## Algoritmo de Parsing

### 1. Extracción con Posiciones
```javascript
// pdf.js devuelve cada fragmento con coordenadas
{
  str: "NETFLIX.COM",
  dir: "ltr",
  width: 45.5,
  height: 8,
  transform: [8, 0, 0, 8, 120.5, 450.2], // [a, b, c, d, e, f] donde e=X, f=Y
  fontName: "g_d0_f1"
}
```

### 2. Agrupación por Líneas
```javascript
// Agrupar por coordenada Y (con tolerancia de 3 puntos)
const lines = groupByLines(items, 3);
```

### 3. Detección de Columnas
```javascript
// Detectar gaps horizontales > 12 puntos entre elementos
const columns = extractColumns(lineItems, 12);
// Resultado: ['04-Ene-26', 'NETFLIX.COM M2wgWnC6RUSD 10,38', '968625', '10,38']
```

### 4. Parsing Específico por Banco
Cada banco implementa su lógica para interpretar las columnas:
- **BBVA**: Fecha | Descripción + USD? | Cupón (6 dígitos) | ARS | USD?
- **Galicia**: Fecha | Descripción | Comprobante | ARS | USD?

## Extender para Nuevos Bancos

1. Crear archivo `src/parsers/{bank}Parser.js`:

```javascript
export function parse{bank}(pages) {
  const transactions = [];
  
  for (const page of pages) {
    const lines = groupByLines(page.items, 3);
    
    for (const lineItems of lines) {
      // Detectar inicio/fin de sección de transacciones
      // ...
      
      const columns = extractColumns(lineItems, 15);
      const transaction = parseLine(columns);
      
      if (transaction) transactions.push(transaction);
    }
  }
  
  return transactions;
}
```

2. Agregar detector en `pdfParser.js`:

```javascript
function detectBank(textContent) {
  const fullText = textContent.toUpperCase();
  
  if (fullText.includes('BBVA')) return 'bbva';
  if (fullText.includes('GALICIA')) return 'galicia';
  if (fullText.includes('NUEVO_BANCO')) return 'nuevo_banco'; // <-- Agregar
  
  return 'unknown';
}
```

3. Agregar case en `parsePdf()`:

```javascript
case 'nuevo_banco':
  transactions = parseNuevoBanco(pages);
  break;
```

## Troubleshooting

### Error: "PDF parser service is unavailable"
- Verificar que el contenedor `pdf-parser` esté corriendo: `docker compose ps`
- Revisar logs: `docker compose logs pdf-parser`
- Verificar red: El backend usa `http://pdf-parser:3001` (nombre del servicio en Docker)

### Transacciones no detectadas
- Revisar logs del servicio: `docker compose logs -f pdf-parser`
- Ajustar `COL_GAP_THRESHOLD` en el parser específico (por defecto 12-15 puntos)
- Verificar que el PDF no sea una imagen escaneada (pdf.js solo extrae texto)

### Formato de fecha incorrecto
- Verificar el mapeo de meses en `parseSpanishMonth()`
- Algunos bancos usan formato numérico (DD-MM-YY) vs textual (DD-Mmm-YY)

### Montos incorrectos
- Revisar el regex de detección de montos: `/\d{1,3}(?:\.\d{3})*,\d{2}/`
- Verificar lógica de USD vs ARS en el parser específico

## Ventajas vs Solución Anterior

| Aspecto | PdfPig (C#) | pdf.js (Node.js) |
|---------|-------------|------------------|
| Extracción de posiciones | Limitada | Nativa y precisa |
| Detección de columnas | Compleja | Simple con gaps X/Y |
| Comunidad/Documentación | Menor | Extensa (Mozilla) |
| Parsing de tablas | Difícil | Natural |
| Performance | Similar | Similar |
| Facilidad de debug | Media | Alta (logs detallados) |

## Próximos Pasos Sugeridos

1. **Testing**: Correr `node test-parse.js bbva-example.pdf` para validar
2. **Calibración**: Ajustar `COL_GAP_THRESHOLD` si es necesario según el PDF
3. **Logging**: Agregar más logs en los parsers para debugging
4. **Cache**: Considerar cache de resultados por hash de PDF
5. **Colas**: Para PDFs grandes, usar cola de procesamiento (Bull/Redis)

## Notas de Implementación

- El servicio usa `canvas` como dependencia de pdf.js para renderizado en Node.js
- El Alpine Linux requiere paquetes adicionales para compilar `canvas` (ver Dockerfile)
- El servicio está configurado con hot-reload en desarrollo (`npm run dev` = `node --watch`)
- La comunicación entre backend y parser usa HTTP simple (no gRPC/GraphQL para mantener simplicidad)
