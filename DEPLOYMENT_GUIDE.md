# 📋 Guía de Despliegue - Consultor de Clima

## ✅ Problemas Corregidos

### 1. **Rutas de Scripts Incorrectas** ❌ ARREGLADO
**Problema:** Los scripts tenían rutas incorrectas:
```html
<script src="../Consultor de Clima/src/js/security-utils.js"></script>
<script src="../Consultor de Clima/src/js/script.js"></script>
```

**Solución:** Rutas relativas correctas:
```html
<script src="src/js/security-utils.js"></script>
<script src="src/js/script.js"></script>
```

### 2. **Orden de Carga** ✅ CORRECTO
- `security-utils.js` carga primero → exporta `window.SecurityUtils`
- `script.js` carga después → puede usar `window.SecurityUtils`
- El código HTML embebido carga último → puede usar todo

---

## 🚀 Requisitos para Despliegue

### Estructura de Carpetas
```
Consultor de Clima/
├── index.html              (archivo principal)
├── DEPLOYMENT_GUIDE.md     (esta guía)
├── src/
│   ├── css/               (estilos)
│   ├── html/              (módulos HTML)
│   └── js/
│       ├── script.js      (lógica principal)
│       └── security-utils.js (seguridad)
└── docs/
    ├── SECURITY_REPORT.md
    └── SETUP_GUIDE.md
```

### APIs Externas Requeridas
- ✅ **Open-Meteo Geocoding API** (gratuita)
  - URL: `https://geocoding-api.open-meteo.com/v1/search`
  - Sin autenticación requerida
  - Límite: 30 requests/minuto (implementado en el código)

- ✅ **Open-Meteo Weather API** (gratuita)
  - URL: `https://api.open-meteo.com/v1/forecast`
  - Sin autenticación requerida
  - Límite: 30 requests/minuto (implementado en el código)

---

## 🌐 Despliegue en Diferentes Plataformas

### Local (Desarrollo)
```bash
# Opción 1: Abrir directamente
# Haz doble clic en index.html

# Opción 2: Servidor local (recomendado)
# En la carpeta del proyecto:
python -m http.server 8000
# Accede a: http://localhost:8000
```

### GitHub Pages
1. Crea un repositorio `username.github.io` O
2. Usa `docs/` como source en un repositorio existente
3. Verifica que la estructura sea correcta
4. Push y listo

### Netlify
```bash
# Instala Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir .
```

### Vercel
```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🔒 Consideraciones de Seguridad

### HTTPS en Producción ⚠️ IMPORTANTE
- Todas las APIs usadas son HTTPS
- En desarrollo local (localhost) funciona sin HTTPS
- **En producción, DEBES usar HTTPS**

### Validaciones Implementadas ✅
- Sanitización de HTML (previene XSS)
- Validación de nombres de ciudad
- Rate limiting (30 requests/minuto)
- Validación de respuestas JSON
- localStorage seguro (datos locales, no en servidor)

### Privacidad de Datos
- ✅ **NO hay servidor backend** - todo es client-side
- ✅ **Datos almacenados localmente** en localStorage del navegador
- ✅ **No se envía información personal** a Open-Meteo
- ✅ Caché local expira automáticamente en 1 hora

---

## 🧪 Checklist de Prueba

- [ ] Abre `index.html` en navegador
- [ ] Busca una ciudad (ej: "Madrid")
- [ ] Verifica que aparezcan datos climáticos
- [ ] Prueba comparador con múltiples ciudades
- [ ] Comprueba que el historial se guarde
- [ ] Vacía el caché y verifica que funcione
- [ ] Abre en otra pestaña y verifica sincronización de caché
- [ ] Prueba en móvil (responsive)

---

## 🐛 Solución de Problemas

### "No se encuentran datos de clima"
**Causa:** Problemas de conectividad a Open-Meteo
**Solución:** 
- Verifica tu conexión a internet
- Comprueba que no haya firewall bloqueando
- Espera unos segundos e intenta de nuevo

### "Demasiadas solicitudes"
**Causa:** Rate limiting alcanzado (30 req/min)
**Solución:** 
- Espera 60 segundos
- El contador se reinicia automáticamente

### Scripts no cargan
**Causa:** Rutas incorrectas
**Solución:** 
✅ YA CORREGIDO - verifica que uses:
```html
<script src="src/js/security-utils.js"></script>
<script src="src/js/script.js"></script>
```

### "SecurityUtils no está definido"
**Causa:** Orden de carga incorrecto
**Solución:** 
- security-utils.js DEBE cargar antes que script.js
- ✅ YA CONFIGURADO CORRECTAMENTE

---

## 📊 Arquitectura

```
index.html (UI + Lógica de pestañas)
    ↓
security-utils.js (Seguridad, rate limiting, sanitización)
    ↓
script.js (Llamadas a APIs, caché, procesamiento datos)
    ↓
Open-Meteo APIs (Datos meteorológicos)
```

---

## 📝 Notas Importantes

1. **Sin base de datos**: Los datos se almacenan solo en localStorage
2. **Sin autenticación**: Las APIs de Open-Meteo son públicas
3. **Caché automático**: Los datos se guardan 1 hora automáticamente
4. **Sincronización entre pestañas**: Si abres dos pestañas, comparten caché

---

## 🎯 Próximos Pasos Opcionales

- [ ] Agregar notificaciones push (Service Workers)
- [ ] Implementar modo oscuro
- [ ] Agregar gráficos con Chart.js
- [ ] Internacionalización (multi-idioma)
- [ ] Base de datos (para guardar preferencias de usuario)

---

**Última actualización:** 2026-04-25
**Estado:** ✅ LISTA PARA DESPLIEGUE
