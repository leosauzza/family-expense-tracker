# Resumen de Cambios - Nuevos Tipos de Listas de Gastos

## Cambios Realizados

### 1. Frontend - Nuevos Componentes

#### `ListTypeSelectorModal.tsx` + `.module.css`
- Modal con 3 radio buttons para seleccionar el tipo de lista:
  - **Gastos 100% de gente fuera del sistema** (ThirdPartyExpenseList existente)
  - **Gastos 100% de gente dentro del sistema** (SharedExpense con ForSpecificSystemUser)
  - **Gastos compartidos con gente fuera del sistema** (SharedExpense con SplitWithExternalParties)
- Permite configurar el usuario objetivo o los nombres de las partes externas

#### `SharedExpenseList.tsx` + `.module.css`
- Nuevo componente para mostrar grupos de SharedExpense
- Soporta 3 tipos de visualización:
  - `systemUser`: Gastos pagados para otro usuario del sistema
  - `externalShared`: Gastos compartidos con personas externas
  - `systemShared`: Gastos compartidos entre todos los usuarios del sistema
- Incluye iconos diferenciados por tipo
- Muestra subtítulos con información contextual (para quién es, con quién se comparte)

### 2. Frontend - Actualizaciones de Componentes Existentes

#### `types/index.ts`
- Agregado tipo `SharedExpenseType` explícito
- Agregado campo `expenseType` a `SharedExpense`
- Nuevos campos en `CalculationResult`:
  - `systemUserExpensesTotalARS/USD`
  - `externalSharedExpensesTotalARS/USD`

#### `DashboardPage.tsx`
- Integración del `ListTypeSelectorModal`
- Lógica para agrupar SharedExpenses por tipo usando `useMemo`
- Renderizado condicional de listas según su tipo
- Handlers actualizados para manejar los diferentes tipos de gastos

#### `TheyOweMe.tsx`
- Actualizado para mostrar desglose de:
  - Gastos de terceros (ThirdParty)
  - Gastos pagados para otros usuarios del sistema (SystemUser)
  - Gastos compartidos con externos (ExternalShared)
  - Parte correspondiente de gastos compartidos del sistema (SharedSplit)
- Cálculos actualizados para considerar todos los tipos

#### `CalculationDisplay.tsx`
- Actualizado para mostrar nuevos ítems en el desglose:
  - Gastos para otros usuarios
  - Gastos compartidos con externos (50%)

#### `utils/calculations.ts`
- Nueva función `filterSharedExpensesByType()`
- Nueva función `calculateTheyOweMeDetailed()`
- Actualizada `calculateFinalBalance()` para considerar:
  - SystemUser expenses: 100% suma al balance
  - ExternalShared: 50% suma al balance (asumiendo dividido 50/50)
  - SystemShared: dividido entre todos los usuarios

### 3. Frontend - Traducciones

#### `es.json` / `en.json`
- Nuevas claves para `dashboard.listSelector.*`
- Nuevas claves para `dashboard.sharedExpenseList.*`
- Nuevas claves para `dashboard.calculation.systemUser` y `externalShared`
- Nuevas claves para `dashboard.theyOweMe.systemUser` y `externalShared`
- Nueva clave `common.pending`

### 4. Backend - Actualizaciones

#### `MonthlyDataController.cs`
- Actualizado `MapToDto()` para incluir:
  - `ExpenseType` como string
  - `ExternalParties` deserializado desde JSON
  - `TargetUserId` y `TargetUserName`
- Actualizados queries para incluir `TargetUser` en SharedExpenses
- Actualizado `CopyFromPrevious()` para copiar nuevos campos

## Cálculos Implementados

### Fórmula de Balance Final
```
Balance = Wallet 
        + ThirdParty (100%)
        + SystemUserExpenses (100%) 
        + ExternalShared/2 (50%)
        - FixedExpenses (100%)
        + SystemShared/TotalUsers (dividido)
```

### Fórmula de "Me Deben"
```
TotalOwed = ThirdParty (100%)
          + SystemUserExpenses (100%)
          + ExternalShared/2 (50%)
          + ((SystemSharedByMe + SystemSharedByOthers)/TotalUsers - SystemSharedByMe)
```

## Funcionalidades Faltantes / Mejoras Pendientes

### 1. Alta Prioridad
- [ ] **Marcar como pagado en SharedExpenseList**: El componente no tiene checkbox de "pagado" como ThirdPartyList
- [ ] **Edición de listas virtuales**: No se puede editar el usuario objetivo o las partes externas de una lista existente
- [ ] **Eliminación de grupos vacíos**: Cuando se borran todos los gastos de un grupo, el grupo desaparece pero podría quererse mantener la configuración

### 2. Media Prioridad
- [ ] **Dividir ExternalShared configurable**: Actualmente asume 50/50, pero podría ser configurable (ej: 3 personas = dividir en 3)
- [ ] **Filtros de visualización**: Opción para mostrar/ocultar listas pagadas o vacías
- [ ] **Resumen mensual por tipo**: Mostrar totales por tipo de gasto en el header
- [ ] **Notificaciones de deudas**: Indicar cuando alguien te debe o vos debés

### 3. Baja Prioridad
- [ ] **Colapsar/Expandir listas**: Similar al comportamiento de TheyOweMe
- [ ] **Arrastrar y ordenar listas**: Permitir reordenar las listas manualmente
- [ ] **Colores por tipo de lista**: Diferenciar visualmente los tipos de lista
- [ ] **Exportar a PDF/Excel**: Funcionalidad de exportación

### 4. Bugs Conocidos
- [ ] **Primera carga**: Al crear la primera lista de un tipo nuevo, puede no aparecer hasta refrescar
- [ ] **Validación de nombres externos**: No hay validación de duplicados en nombres de partes externas

### 5. Mejoras Técnicas
- [ ] **Optimización de re-renders**: El useMemo en DashboardPage podría optimizarse más
- [ ] **Caché de datos**: Implementar React Query o similar para mejor manejo de estado
- [ ] **Tests unitarios**: Agregar tests para los cálculos complejos
