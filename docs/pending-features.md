# Funcionalidades Pendientes - Family Expense Tracker

## ✅ Implementado Recientemente

### Últimos cambios (Recientes)

1. ✅ **Estilo visual unificado** - Todas las listas no-fijas ahora usan el mismo diseño de tarjeta:
   - Header con icono colorido
   - Subtítulo descriptivo
   - Badges de estado (Pagado/Pendiente)
   - Footer con totales y acciones

2. ✅ **Creación de listas virtuales funcionando**:
   - Gastos 100% de otra persona del sistema
   - Gastos compartidos con personas fuera del sistema

---

## 📋 Lista de Pendientes Actualizada

### 🔴 Alta Prioridad

#### 1. Checkbox/toggle para marcar como pagado en SharedExpenseList
**Descripción:** Actualmente se muestra el estado pero no se puede cambiar directamente desde la lista.

**Estado:** Los badges muestran el estado, pero falta la interacción para cambiarlo.

**Implementación sugerida:**
- Hacer clickeables los badges "Pagado"/"Pendiente"
- O agregar un toggle switch en cada fila
- Llamar a `onTogglePaid(id, !isPaid)`

#### 2. Edición de configuración de listas virtuales
**Descripción:** No se puede cambiar el usuario objetivo o las partes externas después de crear la lista.

**Implementación sugerida:**
- Agregar menú de opciones (tres puntos verticales) en el header
- Opción "Editar configuración" que abra un modal
- Actualizar todos los gastos del grupo con la nueva configuración

#### 3. Eliminar listas virtuales vacías
**Descripción:** No hay forma de eliminar una lista virtual que no tiene gastos.

**Implementación sugerida:**
- Mostrar botón de eliminar cuando la lista está vacía
- Limpiar `virtualListConfigs` al eliminar

---

### 🟡 Media Prioridad

#### 4. División configurable de gastos externos
**Descripción:** Actualmente asume división 50/50 con personas externas.

**Implementación sugerida:**
- Permitir especificar número de personas al crear la lista
- Guardar configuración en `externalParties` como objeto: `{ names: string[], split: number }`
- Actualizar cálculos para usar el split configurable

#### 5. Filtros de visualización
**Descripción:** No hay forma de ocultar listas pagadas o agrupar por tipo.

**Implementación sugerida:**
- Toolbar con filtros: "Mostrar todo" / "Solo pendientes" / "Agrupar por tipo"
- Persistir preferencia en localStorage

#### 6. Resumen mensual por tipo
**Descripción:** No hay un resumen visual de totales por categoría.

**Implementación sugerida:**
- Sección colapsable "Resumen por tipo" debajo de las tarjetas superiores
- Mostrar: Fijos | Compartidos | Para Terceros | Para Otros Usuarios

#### 7. Soporte para múltiples divisas
**Descripción:** No hay conversión entre ARS y USD.

**Implementación sugerida:**
- Campo para tasa de conversión en settings
- Toggle para mostrar totales en ARS, USD, o ambos
- Posibilidad de fijar tasa mensual

---

### 🟢 Baja Prioridad

#### 8. Colapsar/Expandir listas individuales
**Descripción:** Solo las tarjetas superiores son colapsables.

**Implementación sugerida:**
- Botón de colapsar en el header de cada lista
- Persistir estado en localStorage

#### 9. ✅ Reordenar listas manualmente
**Descripción:** Las listas aparecen en orden de creación.

**Estado:** ✅ IMPLEMENTADO

**Implementación:**
- Usar @dnd-kit para drag & drop
- Handle visual (icono GripVertical) aparece al hover
- Las listas se pueden arrastrar para reordenar
- El orden se guarda en la base de datos para ThirdParty lists
- Para listas virtuales (SharedExpense) el orden es temporal (frontend only)

#### 10. Exportar datos
**Descripción:** No hay forma de exportar los gastos.

**Implementación sugerida:**
- Exportar a CSV/Excel
- Exportar resumen a PDF

---

### 🔧 Mejoras Técnicas

#### 11. Optimización de rendimiento
**Descripción:** DashboardPage recalcula todo en cada render.

**Implementación sugerida:**
- React Query para caching de datos
- Memoización de cálculos pesados
- Virtualización para listas muy largas

#### 12. Tests unitarios
**Descripción:** No hay tests para los cálculos financieros.

**Implementación sugerida:**
- Tests para `calculateFinalBalance`
- Tests para `calculateTheyOweMe`
- Tests de integración

#### 13. Manejo de errores mejorado
**Descripción:** Manejo de errores básico (console.error).

**Implementación sugerida:**
- Sistema de notificaciones toast
- Retry automático para peticiones fallidas
- Estados de loading más claros

#### 14. Persistencia de listas virtuales
**Descripción:** Las listas virtuales se pierden al refrescar si no tienen gastos.

**Implementación sugerida:**
- Guardar `virtualListConfigs` en localStorage
- O crear endpoint en backend para persistir configuraciones

---

### 🐛 Bugs Conocidos

#### 15. Validación de duplicados
**Descripción:** Se pueden crear múltiples listas para el mismo usuario externo.

**Impacto:** Bajo - solo afecta organización visual

**Implementación sugerida:**
- Validar al crear que no exista ya una lista para ese usuario/externo
- Mostrar advertencia o sugerir agregar a la lista existente

---

## 📊 Resumen por Prioridad

| Prioridad | Cantidad | Items principales |
|-----------|----------|-------------------|
| 🔴 Alta | 3 | Toggle pagado, Editar config, Eliminar vacías |
| 🟡 Media | 4 | División configurable, Filtros, Resumen, Divisas |
| 🟢 Baja | 3 | Colapsar, Reordenar, Exportar |
| 🔧 Técnica | 4 | Performance, Tests, Errores, Persistencia |
| 🐛 Bugs | 1 | Validación de duplicados |

---

## 🎯 Recomendaciones para Próximos Pasos

### Si querés mejorar la usabilidad:
1. Implementar **toggle de pagado** en SharedExpenseList
2. Agregar **filtros de visualización**
3. Permitir **editar configuración** de listas

### Si querés agregar valor funcional:
1. Implementar **división configurable** (no solo 50/50)
2. Agregar **resumen mensual por tipo**
3. Soporte para **tasa de cambio** ARS/USD

### Si querés robustecer el sistema:
1. Agregar **tests unitarios** para cálculos
2. Implementar **persistencia** de listas virtuales
3. Mejorar **manejo de errores**

---

## 📝 Notas Técnicas

### Estructura de Datos Actual

```
MonthlyData
├── FixedExpenses[]
├── SharedExpensesPaidByUser[]
│   └── ExpenseType: SplitWithAllSystemUsers | ForSpecificSystemUser | SplitWithExternalParties
└── ThirdPartyExpenseLists[]
    └── Expenses[]

Frontend State:
├── virtualListConfigs[]  // Para listas virtuales (systemUser/externalShared)
```

### Cálculos Actuales

- **ThirdParty**: 100% → "Me deben"
- **ForSpecificSystemUser**: 100% → "Me deben"
- **SplitWithExternalParties**: 50% → "Me deben"
- **SplitWithAllSystemUsers**: /TotalUsers → Balance
