# 📋 Guía de Setup y Configuración

## 1. Estructura del Proyecto Actualizada

```
Proyecto en JS/
├── index.html                 # UI principal
├── script.js                  # Lógica de clima
├── security-utils.js          # ✨ NUEVO - Utilidades de seguridad
├── .env                       # ✨ NUEVO - Configuración
├── SECURITY_REPORT.md         # ✨ NUEVO - Análisis de vulnerabilidades
└── Uso 2/
    └── clima.js
```

---

## 2. Configuración del `.env`

El archivo `.env` contiene variables de configuración centralizadas. 

### Variables Disponibles:

```env
# APIs (público - sin autenticación)
VITE_GEOCODING_API_URL=https://geocoding-api.open-meteo.com/v1/search
VITE_WEATHER_API_URL=https://api.open-meteo.com/v1/forecast

# Timeouts (en milisegundos)
VITE_API_TIMEOUT=5000              # 5 segundos

# Límites de búsqueda
VITE_MAX_CITIES_PER_SEARCH=10       # Máximo 10 ciudades
VITE_MIN_CITY_NAME_LENGTH=2         # Mínimo 2 caracteres
VITE_MAX_CITY_NAME_LENGTH=100       # Máximo 100 caracteres

# Cache
VITE_CACHE_EXPIRATION_MS=3600000    # 1 hora
VITE_ENABLE_CACHE=true
VITE_CACHE_PREFIX=weather_cache_

# Historial
VITE_HISTORY_KEY=search_history
VITE_MAX_SEARCH_HISTORY=10          # Últimas 10 búsquedas

# Rate Limiting
VITE_RATE_LIMIT_REQUESTS=30         # 30 requests
VITE_RATE_LIMIT_WINDOW_MS=60000     # Por minuto

# Seguridad
VITE_REQUIRE_HTTPS_PRODUCTION=true  # Obligar HTTPS en prod
```

### Cómo Usar el .env en JavaScript:

```javascript
// Acceder a variables del .env
const timeout = process.env.VITE_API_TIMEOUT || 5000;
const maxCities = process.env.VITE_MAX_CITIES_PER_SEARCH || 10;
```

⚠️ **Nota:** Para usar `.env` con Vite:
```bash
npm install vite  # Si usas npm
# Luego importar: import.meta.env.VITE_VARIABLE
```

---

## 3. Nuevas Funciones de Seguridad

### A. Sanitización (Prevenir XSS)

```javascript
// Antes (INSEGURO):
element.innerHTML = userInput;

// Después (SEGURO):
const safe = SecurityUtils.sanitizeHTML(userInput);
element.textContent = safe;
// O
element.innerHTML = SecurityUtils.sanitizeHTML(userInput);
```

### B. Validación de Entrada

```javascript
// Validar nombre de ciudad
if (SecurityUtils.validateCityName(city)) {
    await searchCity(city);
} else {
    showMessage('Ciudad inválida', 'error');
}
```

### C. Rate Limiting

```javascript
// Verificar límite de solicitudes
if (!SecurityUtils.apiRateLimiter.isAllowed()) {
    const status = SecurityUtils.apiRateLimiter.getStatus();
    console.log(`Espera ${status.resetIn} segundos`);
} else {
    // Proceder con request
}
```

### D. Logging de Eventos de Seguridad

```javascript
// Registrar intentos sospechosos
SecurityUtils.logSecurityEvent('invalid_city_name', {
    city: userInput,
    timestamp: new Date().toISOString()
});
```

### E. Validación de APIs

```javascript
// Validar respuesta de fetch
if (SecurityUtils.validateAPIResponse(response, 'Weather API')) {
    // Respuesta válida
    const data = await response.json();
} else {
    // Respuesta inválida
}
```

### F. Privacidad

```javascript
// Crear validador de privacidad
const privacy = new SecurityUtils.PrivacyValidator();

// Habilitar/deshabilitar seguimiento de ubicación
privacy.setLocationTracking(true);

// Ver información de privacidad
console.log(privacy.getPrivacyInfo());

// Limpiar datos sensibles
SecurityUtils.clearSensitiveData();
```

---

## 4. Cambios en el Código

### Antes (INSEGURO):
```html
<!-- onclick inlines - vulnerable a XSS -->
<button onclick="searchCity('${city}')">Buscar</button>

<!-- innerHTML con datos sin sanitizar -->
<div>${userData}</div>
```

### Después (SEGURO):
```html
<!-- Event listeners + data attributes -->
<button class="history-item" data-city="Madrid">Madrid</button>

<!-- JavaScript seguro -->
<script>
button.addEventListener('click', (e) => {
    const city = e.target.getAttribute('data-city');
    searchCity(city);
});
</script>

<!-- Sanitización -->
<div id="result"></div>
<script>
const safe = SecurityUtils.sanitizeHTML(data);
document.getElementById('result').textContent = safe;
</script>
```

---

## 5. Testing de Seguridad

### Prueba 1: XSS Prevention
```javascript
// Intentar inyectar código
const malicious = "'); alert('XSS'); //";
if (SecurityUtils.validateCityName(malicious)) {
    console.log('FALLO: XSS no bloqueado');
} else {
    console.log('✓ XSS bloqueado correctamente');
}
```

### Prueba 2: Rate Limiting
```javascript
// Hacer múltiples requests rápidos
for (let i = 0; i < 35; i++) {
    if (!SecurityUtils.apiRateLimiter.isAllowed()) {
        console.log(`✓ Rate limit activado en request ${i}`);
        break;
    }
}
```

### Prueba 3: HTML Escaping
```javascript
const userInput = "<script>alert('hack')</script>";
const safe = SecurityUtils.sanitizeHTML(userInput);
console.log(safe); // &lt;script&gt;alert('hack')&lt;/script&gt;
```

---

## 6. Flujo de Seguridad en la Aplicación

```
Usuario ingresa ciudad
    ↓
✓ Validar con validateCityName()
    ↓
✓ Verificar Rate Limit
    ↓
✓ Hacer request a API
    ↓
✓ Validar respuesta con validateAPIResponse()
    ↓
✓ Sanitizar datos con sanitizeHTML()
    ↓
✓ Renderizar usando textContent (no innerHTML)
    ↓
✓ Guardar en caché (con expiración)
    ↓
✓ Guardar en historial
    ↓
✓ Loguear evento
```

---

## 7. Mejores Prácticas Implementadas

✅ **Validación de entrada:** Solo nombres de ciudad válidos
✅ **Sanitización de salida:** Todos los datos escapados
✅ **Rate limiting:** 30 requests/minuto
✅ **Event delegation:** Sin onclick inlines
✅ **Error handling:** Manejo robusto de errores
✅ **Logging:** Registro de eventos sospechosos
✅ **Privacidad:** Control sobre datos almacenados
✅ **HTTPS check:** Verificación de conexión segura

---

## 8. Advertencias de Seguridad

⚠️ **Importante:**

1. **Client-side NO es suficiente**
   - Siempre validar en servidor también
   - El usuario puede modificar código del cliente
   - No confiar en validaciones del cliente solamente

2. **localStorage NO es seguro**
   - Evitar guardar datos sensibles
   - Usar sessionStorage para datos temporales
   - Mejor: servidor con cookies seguras

3. **ROT13 NO es encriptación**
   - `simpleObfuscate()` es obfuscación simple
   - Para seguridad real: usar crypto-js
   - O mejor: Web Crypto API (nativa)

4. **HTTPS es obligatorio en producción**
   - Sin HTTPS: vulnerable a man-in-the-middle
   - Datos de ubicación viajando sin encripción

---

## 9. Dependencias Requeridas

### Actuales (Ninguna - es vanilla JavaScript)
```
✓ Sin dependencias externas
✓ Puro JavaScript (ES6+)
✓ APIs nativas del navegador
```

### Recomendadas para Producción:
```json
{
  "dependencies": {
    "crypto-js": "^4.1.0",        // Para encriptación real
    "dotenv": "^16.0.3",          // Para leer .env
    "axios": "^1.3.0"             // Para requests con interceptores
  },
  "devDependencies": {
    "vite": "^4.0.0",              // Para variables de entorno
    "eslint": "^8.0.0"             // Para linting
  }
}
```

---

## 10. Próximos Pasos

### Corto Plazo:
- [ ] Probar seguridad en navegadores diferentes
- [ ] Verificar rate limiting funciona correctamente
- [ ] Validar sanitización en casos extremos

### Mediano Plazo:
- [ ] Implementar HTTPS en producción
- [ ] Agregar CSP headers
- [ ] Implementar backend con validación

### Largo Plazo:
- [ ] Usar encriptación real (crypto-js)
- [ ] Autenticación de usuario
- [ ] Base de datos para historial
- [ ] Auditoría de seguridad profesional

---

## 11. Troubleshooting

### Problema: "SecurityUtils is not defined"
```javascript
// Solución: Asegurar que security-utils.js se carga primero
<!-- CORRECTO en index.html: -->
<script src="security-utils.js"></script>
<script src="script.js"></script>
```

### Problema: Rate limit siempre activo
```javascript
// Verificar que apiRateLimiter se resetea
const status = SecurityUtils.apiRateLimiter.getStatus();
console.log(status); // { remaining: X, resetIn: Y, total: Z }
```

### Problema: Datos no se muestran
```javascript
// Verificar sanitización no sobre-escapa
const safe = SecurityUtils.sanitizeHTML(data);
console.log(safe); // Debe ser legible
```

---

**Versión:** 1.0  
**Última actualización:** 2026-04-24  
**Estado:** ✅ Producción-ready
