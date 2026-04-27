# 🌤️ Consultor de Clima con API Open-Meteo

Una aplicación educativa que demuestra cómo usar **JavaScript**, la **API Fetch** y **APIs externas** para obtener datos meteorológicos en tiempo real.

## 📋 ¿Qué aprenderás?

Este proyecto enseña conceptos clave para desarrolladores principiantes:

- ✅ **Promesas y Async/Await**: Manejo de operaciones asincrónicas
- ✅ **API Fetch**: Cómo hacer solicitudes HTTP desde JavaScript
- ✅ **Manejo de Errores**: Try/Catch y validación de datos
- ✅ **Integración de APIs**: Usar APIs externas (Geocoding + Weather)
- ✅ **DOM Manipulation**: Actualizar la página con resultados dinámicos
- ✅ **Eventos**: Capturar y procesar eventos de formularios

---

## 🚀 Cómo usar

### Opción 1: Abrir en el navegador
1. Abre `index.html` en tu navegador
2. Ingresa el nombre de una ciudad
3. Haz clic en "Buscar Clima"
4. ¡Verás el clima actual!

### Opción 2: Usar en la consola del navegador
```javascript
// Obtener clima de una ciudad
const datos = await getWeather("Madrid");
console.log(datos);
```

### Opción 3: En Node.js
```javascript
// Si quieres usar esto en Node.js, necesitarás instalar un polyfill para fetch:
// npm install node-fetch
```

---

## 📚 Estructura del código

### 1. **getWeather(city)** - Función principal
Esta es la función que hace todo el trabajo:

```javascript
async function getWeather(city) {
    try {
        // Paso 1: Validar entrada
        // Paso 2: Obtener coordenadas (Geocoding)
        // Paso 3: Obtener datos meteorológicos
        // Paso 4: Retornar resultado
    } catch (error) {
        // Manejo de errores
    }
}
```

**¿Qué significa `async`?**
- Significa que la función es **asincrónica**
- Puede hacer pausas mientras espera respuestas del servidor
- Usa `await` para esperar resultados

### 2. **getWeatherDescription(code)** - Función auxiliar
Convierte códigos numéricos a descripciones legibles:

```javascript
getWeatherDescription(0);   // "Despejado"
getWeatherDescription(61);  // "Lluvia ligera"
getWeatherDescription(95);  // "Tormenta"
```

---

## 🔄 Flujo de ejecución

```
Usuario ingresa ciudad
         ↓
Función getWeather() comienza
         ↓
Validar que la ciudad no esté vacía
         ↓
API Geocoding: convertir nombre a coordenadas
         ↓
¿Ciudad encontrada?
    NO → Error: Ciudad no encontrada
    SÍ ↓
API Weather: obtener datos meteorológicos
         ↓
¿Solicitud exitosa?
    NO → Error de red
    SÍ ↓
Retornar objeto JSON con datos
         ↓
Mostrar resultado en pantalla
```

---

## 🎯 Manejo de Errores

La función maneja automáticamente estos casos:

| Error | Causa | Solución |
|-------|-------|----------|
| "Ciudad no puede estar vacía" | Input vacío | Escribir nombre válido |
| "No se encontró la ciudad: X" | Nombre incorrecto | Verificar ortografía |
| "Error de red: 404" | Problema con la API | Reintentar (problema servidor) |
| "Error de red: Network Error" | Sin conexión a internet | Verificar conexión |

---

## 📊 Objeto JSON retornado

La función devuelve un objeto con esta estructura:

```javascript
{
    city: "Madrid, Spain",
    temperature: 22.5,
    unit: "°C",
    weather: "Parcialmente nublado",
    timestamp: "23/4/2026 14:30:45"
}
```

O en caso de error:

```javascript
{
    error: true,
    message: "No se encontró la ciudad: Xyz",
    city: "Xyz"
}
```

---

## 🔑 APIs utilizadas

### 1. Open-Meteo Geocoding API
- **URL**: `https://geocoding-api.open-meteo.com/v1/search`
- **Función**: Convertir nombre de ciudad a coordenadas (latitud, longitud)
- **Parámetros**: 
  - `name`: Nombre de la ciudad
  - `count`: Cantidad de resultados (1 = primer resultado)
  - `language`: Idioma de los resultados

**Ejemplo de respuesta:**
```json
{
    "results": [
        {
            "name": "Madrid",
            "country": "Spain",
            "latitude": 40.4168,
            "longitude": -3.7038
        }
    ]
}
```

### 2. Open-Meteo Weather API
- **URL**: `https://api.open-meteo.com/v1/forecast`
- **Función**: Obtener datos meteorológicos actuales
- **Parámetros**:
  - `latitude`: Latitud
  - `longitude`: Longitud
  - `current`: Campos a obtener (temperatura, código de clima)
  - `timezone`: Zona horaria

**Ejemplo de respuesta:**
```json
{
    "current": {
        "temperature_2m": 22.5,
        "weather_code": 2
    }
}
```

---

## 💡 Conceptos clave explicados

### `async` y `await`

```javascript
// SIN async/await (más difícil de leer)
fetch(url)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));

// CON async/await (más legible)
async function ejemplo() {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
}
```

### `encodeURIComponent()`

Convierte caracteres especiales en la URL:
```javascript
"Buenos Aires" → "Buenos%20Aires"
"São Paulo" → "S%C3%A3o%20Paulo"
```

### Códigos WMO (Climate codes)

Cada número representa un tipo de clima:
- 0-2: Despejado a parcialmente nublado
- 45-48: Niebla
- 51-75: Lluvia/Nieve
- 80-82: Chubascos
- 95-99: Tormentas

---

## 🛠️ Para desarrolladores - Mejoras posibles

1. **Agregar predicción**: Obtener clima de los próximos días
2. **Guardar favoritos**: Recordar ciudades buscadas
3. **Gráficos**: Mostrar temperaturas en gráficos
4. **Múltiples ciudades**: Comparar clima de varias ciudades
5. **Ubicación actual**: Usar geolocalización del navegador

---

## 📝 Ejemplos de uso en consola

```javascript
// Ejemplo 1: Esperar resultado completo
const resultado = await getWeather("París");
console.log(`Temperatura: ${resultado.temperature}°C`);

// Ejemplo 2: Verificar si hay error
const datos = await getWeather("XyzInvalid");
if (datos.error) {
    console.log("Error:", datos.message);
}

// Ejemplo 3: Con ciudades en español
await getWeather("Madrid");      // ✅
await getWeather("Barcelona");   // ✅
await getWeather("Guadalajara"); // ✅
```

---

## 🐛 Solucionar problemas

### "CORS error"
Si ves un error CORS, significa que el navegador bloqueó la solicitud. Open-Meteo debe permitirlo. Prueba en navegadores modernos.

### "Undefined is not a function"
Asegúrate de que el archivo `script.js` esté cargado antes de llamar `getWeather()`.

### Resultados en idioma inglés
La API devuelve descripciones en inglés si no especificas `language=es`. El código ya lo hace automáticamente.

---

## 📖 Recursos para aprender más

- [MDN - Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)
- [MDN - Async/Await](https://developer.mozilla.org/es/docs/Learn/JavaScript/Asynchronous/Promises)
- [Open-Meteo Documentation](https://open-meteo.com/en/docs)
- [Códigos WMO Weather](https://open-meteo.com/en/docs)

---

**¡Diviértete aprendiendo! 🚀**
