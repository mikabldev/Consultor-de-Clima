# 🌤️ Guía de Pronósticos - Consultor de Clima

## ✅ PROBLEMA RESUELTO: Pronósticos de 5 Días

Se han implementado las siguientes correcciones para garantizar que los pronósticos se muestren correctamente:

### 🔧 Cambios Realizados

#### 1. **Validación de Caché Mejorada**
- Los datos cacheados sin pronóstico se eliminan automáticamente
- Se valida que `forecast` sea un array válido antes de recuperar del caché
- Los datos obsoletos se limpian al inicio

#### 2. **Garantía de Datos de Pronóstico**
- El campo `forecast` siempre retorna un array (nunca `undefined`)
- Se valida después de procesar los datos de Open-Meteo
- Se muestra advertencia en consola si no hay pronóstico

#### 3. **Renderizado Robusto**
- Se valida que `forecast` sea un array antes de renderizar
- Se muestra mensaje informativo si no hay pronóstico
- Se cuenta dinámicamente el número de días en el pronóstico

#### 4. **Limpieza de Caché Automática**
- Se ejecuta al cargar la página (`DOMContentLoaded`)
- Elimina datos expirados (>1 hora)
- Elimina datos sin pronóstico válido (datos obsoletos)

---

## 🧪 CÓMO PROBAR LOS PRONÓSTICOS

### **Opción 1: Panel de Debug Completo**
```
1. Abre: DEBUG_FORECAST.html
2. Verifica "Test 1" - Respuesta bruta de API
   - Debe mostrar 7 días de pronóstico
3. Verifica "Test 2" - Procesamiento
   - Debe mostrar tabla con días procesados
4. Verifica "Test 4" - getWeather()
   - Debe retornar objeto con forecast[]
```

### **Opción 2: Prueba Rápida en Console**
```javascript
// En la consola del navegador (F12):

// 1. Limpiar caché viejo (si lo hay)
clearAllCache();

// 2. Buscar una ciudad
const result = await getWeather('Madrid');

// 3. Verificar pronóstico
console.log("Pronóstico:", result.forecast);
console.log("Días:", result.forecast.length);

// 4. Mostrar detalles
result.forecast.forEach((day, i) => {
  console.log(`[${i}] ${day.day}: ${day.tempMin}°/${day.tempMax}° - ${day.weather}`);
});
```

### **Opción 3: Prueba en la UI**
```
1. Abre: index.html
2. Busca "Madrid"
3. Deberías ver:
   - Datos actuales
   - Sección "📅 Pronóstico de los próximos N Días"
   - Tarjetas con pronóstico para cada día
```

---

## 📊 ESTRUCTURA DEL PRONÓSTICO

### **Datos Procesados de la API**

Cada día incluye:
```javascript
{
  day: "lun",              // Día de semana (abreviado en español)
  dateFormatted: "abr 26", // Fecha formateada
  tempMax: 24.6,           // Temperatura máxima
  tempMin: 13.7,           // Temperatura mínima
  precipitation: 0,        // Precipitación en mm
  weather: "Principalmente despejado", // Descripción
  weatherCode: 1,          // Código WMO
  date: "2026-04-26",      // Fecha ISO
  timezone: "Europe/Madrid" // Zona horaria
}
```

### **Cantidad de Días**
- Open-Meteo devuelve: **7 días**
- Se muestran: **Hasta 7 días** (dinámico)
- Se procesan: **Todos los disponibles**

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "No veo pronóstico en la app"

**Paso 1: Verificar API**
```bash
# En PowerShell, verifica que la API responda:
$url = "https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum"
$resp = Invoke-WebRequest -Uri $url -UseBasicParsing
$data = $resp.Content | ConvertFrom-Json
$data.daily.time.Length  # Debe mostrar número >= 5
```

**Paso 2: Limpiar caché**
```javascript
// En consola del navegador:
localStorage.clear();
location.reload();
// Intenta de nuevo
```

**Paso 3: Verificar Console**
```javascript
// Abre F12 (DevTools) → Console
// Debería ver:
// ✓ Caché hit para "Madrid" - Datos frescos con pronóstico
// 📅 Renderizando 7 días de pronóstico
```

### ❌ "Solo veo datos actuales, no pronóstico"

**Cause: Datos cacheados viejos sin pronóstico**

**Solución:**
```javascript
// En consola del navegador:
clearAllCache();
location.reload();
```

### ❌ "Error al procesar pronóstico"

**Verificar:**
```javascript
// En consola:
const result = await getWeather('Madrid');
console.log(result.forecast);      // Debe ser array
console.log(result.forecast[0]);   // Debe tener propiedades
```

---

## 🔍 VALIDACIONES IMPLEMENTADAS

✅ **Caché valida pronóstico antes de recuperar**
```javascript
if (!data.data.forecast || !Array.isArray(data.data.forecast)) {
  // Elimina este caché
  localStorage.removeItem(key);
}
```

✅ **getWeather siempre retorna array**
```javascript
forecast: forecast && Array.isArray(forecast) ? forecast : []
```

✅ **Renderizado valida antes de mostrar**
```javascript
if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
  // Mostrar pronóstico
}
```

✅ **Limpieza automática de datos obsoletos**
```javascript
// Ejecutada al cargar la página
clearExpiredCache(); // Limpia expirados y obsoletos
```

---

## 📈 INFORMACIÓN TÉCNICA

### API Open-Meteo
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Parámetros daily:** `temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum`
- **Días devueltos:** 7-8 días (varía según ubicación)
- **Frecuencia:** Horaria internamente, pero datos diarios

### Procesamiento
1. Se obtienen coordenadas con Geocoding API
2. Se solicitan datos daily a Weather API
3. Se procesan 5-7 días (según disponibilidad)
4. Se cachean 1 hora
5. Se validan antes de renderizar

---

## ✨ CARACTERÍSTICAS

- ✅ Pronóstico diario (máx/mín, precipitación, clima)
- ✅ Iconos emoji por tipo de clima
- ✅ Responsivo (se adapta a móvil/desktop)
- ✅ Caché inteligente con validación
- ✅ Sincronización entre pestañas
- ✅ Limpieza automática de datos inválidos

---

## 📝 CAMBIOS EN EL CÓDIGO

### script.js
```javascript
// getCachedWeather() - Valida pronóstico antes de recuperar
// clearExpiredCache() - Elimina datos sin pronóstico
// getWeather() - Garantiza forecast[]
```

### index.html
```javascript
// renderWeatherCard() - Valida forecast antes de renderizar
// Muestra mensaje si no hay pronóstico disponible
```

---

## 🎯 PRÓXIMOS PASOS

- [ ] Agregar gráficos de pronóstico (Chart.js)
- [ ] Alertas de clima severo
- [ ] Pronóstico por horas
- [ ] Comparar pronósticos entre ciudades

---

**Estado:** ✅ FUNCIONAL - Pronósticos de 5-7 días  
**Última actualización:** 2026-04-25
