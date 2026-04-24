/**
 * ============================================
 * UTILIDADES DE SEGURIDAD
 * ============================================
 * Funciones para prevenir XSS, validar entrada,
 * y mejorar la seguridad de la aplicación
 */

/**
 * SANITIZACIÓN - Escapa caracteres HTML peligrosos
 * Previene inyección de código (XSS)
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto escapado
 */
function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Valida que un nombre de ciudad sea seguro
 * @param {string} city - Nombre de la ciudad
 * @returns {boolean} true si es válido
 */
function validateCityName(city) {
    if (!city || typeof city !== 'string') return false;
    if (city.trim().length < 2) return false;
    if (city.trim().length > 100) return false;
    
    // Solo permite letras, números, espacios, guiones y acentos
    const regex = /^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ',.]+$/;
    return regex.test(city.trim());
}

/**
 * Crea un elemento HTML de forma segura (evita innerHTML)
 * @param {string} tag - Nombre de la etiqueta
 * @param {string} text - Texto del elemento
 * @param {string} className - Clases CSS (opcional)
 * @returns {HTMLElement} Elemento creado
 */
function createSafeElement(tag, text = '', className = '') {
    const element = document.createElement(tag);
    if (text) {
        element.textContent = text; // Seguro contra XSS
    }
    if (className) {
        element.className = className;
    }
    return element;
}

/**
 * Rate Limiter - Previene abuso de API
 * Usa un sistema simple de ventana deslizante
 */
class RateLimiter {
    constructor(maxRequests = 30, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    /**
     * Verifica si la solicitud está permitida
     * @returns {boolean} true si está permitida
     */
    isAllowed() {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Eliminar solicitudes fuera de la ventana
        this.requests = this.requests.filter(time => time > windowStart);
        
        // Verificar límite
        if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return true;
        }
        
        return false;
    }

    /**
     * Obtiene información sobre el límite
     * @returns {Object} { remaining, resetIn }
     */
    getStatus() {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        this.requests = this.requests.filter(time => time > windowStart);
        
        const remaining = Math.max(0, this.maxRequests - this.requests.length);
        const oldestRequest = this.requests[0];
        const resetIn = oldestRequest ? Math.ceil((oldestRequest + this.windowMs - now) / 1000) : 0;
        
        return { remaining, resetIn, total: this.requests.length };
    }
}

// Instancia global de rate limiter
const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests por minuto

/**
 * Valida respuesta de API
 * @param {Response} response - Respuesta de fetch
 * @param {string} apiName - Nombre de la API (para mensajes)
 * @returns {boolean} true si es válida
 */
function validateAPIResponse(response, apiName = 'API') {
    if (!response) {
        console.error(`${apiName}: Respuesta nula`);
        return false;
    }
    
    if (!response.ok) {
        console.error(`${apiName}: HTTP ${response.status} - ${response.statusText}`);
        return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        console.error(`${apiName}: Content-Type inválido: ${contentType}`);
        return false;
    }
    
    return true;
}

/**
 * Valida estructura de datos JSON
 * @param {Object} data - Datos a validar
 * @param {Array<string>} requiredFields - Campos requeridos
 * @returns {boolean} true si es válido
 */
function validateJSONStructure(data, requiredFields = []) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    for (const field of requiredFields) {
        if (!(field in data)) {
            console.error(`Campo requerido ausente: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Encripta datos simples para localStorage (ROT13)
 * NOTA: ROT13 NO es encriptación real, es obfuscación
 * Para seguridad real, usar librerías como crypto-js
 * @param {string} text - Texto a obfuscar
 * @returns {string} Texto obfuscado
 */
function simpleObfuscate(text) {
    return text.replace(/[a-zA-Z]/g, function(c) {
        return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
}

/**
 * Desencripta datos simples de localStorage
 * @param {string} text - Texto obfuscado
 * @returns {string} Texto original
 */
function simpleDeobfuscate(text) {
    return simpleObfuscate(text); // ROT13 es reversible aplicándolo dos veces
}

/**
 * Limpia localStorage de datos sensibles
 * Útil para logout o cambio de usuario
 */
function clearSensitiveData() {
    try {
        // Limpiar búsquedas (contienen localización)
        localStorage.removeItem('search_history');
        
        // Limpiar caché de clima
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('weather_cache_')) {
                localStorage.removeItem(key);
            }
        }
        
        console.log('✓ Datos sensibles limpiados');
        return true;
    } catch (error) {
        console.error('Error al limpiar datos sensibles:', error);
        return false;
    }
}

/**
 * Loguea intentos de acceso sospechosos
 * @param {string} action - Acción realizada
 * @param {Object} details - Detalles adicionales
 */
function logSecurityEvent(action, details = {}) {
    const timestamp = new Date().toISOString();
    const event = {
        action,
        timestamp,
        userAgent: navigator.userAgent.substring(0, 50),
        ...details
    };
    
    // Aquí podrías enviar a un servidor de logging
    console.warn('🔒 Evento de seguridad:', event);
}

/**
 * Verifica si la aplicación se ejecuta en HTTPS
 * @returns {boolean}
 */
function isSecureConnection() {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

/**
 * Valida una URL antes de hacer fetch
 * @param {string} url - URL a validar
 * @returns {boolean} true si es segura
 */
function isValidURL(url) {
    try {
        const urlObj = new URL(url);
        // Solo HTTPS o HTTP (en desarrollo)
        return ['https:', 'http:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

/**
 * Crea un contenedor seguro para insertar HTML
 * Usa textContent para contenido de texto
 * @param {HTMLElement} container - Contenedor destino
 * @param {Object} data - Datos a mostrar
 */
function renderSafeContent(container, data) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear elementos de forma segura
    const title = createSafeElement('h2', data.title, 'safe-title');
    const content = createSafeElement('p', data.content, 'safe-content');
    
    container.appendChild(title);
    container.appendChild(content);
}

/**
 * Genera un hash simple para verificar integridad de datos
 * @param {string} text - Texto a hashear
 * @returns {number} Hash simple
 */
function simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a entero de 32 bits
    }
    return Math.abs(hash);
}

/**
 * Validador de privacidad
 * Advierte si se almacenan datos de ubicación
 */
class PrivacyValidator {
    constructor() {
        this.allowLocationTracking = false;
    }

    /**
     * Establece preferencia de privacidad
     * @param {boolean} allow - Permitir seguimiento de ubicación
     */
    setLocationTracking(allow) {
        this.allowLocationTracking = allow;
        if (allow) {
            logSecurityEvent('location_tracking_enabled');
        }
    }

    /**
     * Verifica antes de guardar localización
     * @returns {boolean} true si está permitido
     */
    canSaveLocation() {
        return this.allowLocationTracking;
    }

    /**
     * Obtiene información de privacidad
     * @returns {string} Descripción de datos almacenados
     */
    getPrivacyInfo() {
        return `
            Datos almacenados en este navegador:
            - Historial de búsquedas de ciudades (localStorage)
            - Datos climáticos cacheados (expira en 1 hora)
            - Preferencias de la aplicación
            
            Los datos NO se envían a servidores externos.
            Las APIs de clima (Open-Meteo) no almacenan datos personales.
        `;
    }
}

// Exportar para uso en otros archivos
window.SecurityUtils = {
    sanitizeHTML,
    validateCityName,
    createSafeElement,
    RateLimiter,
    apiRateLimiter,
    validateAPIResponse,
    validateJSONStructure,
    simpleObfuscate,
    simpleDeobfuscate,
    clearSensitiveData,
    logSecurityEvent,
    isSecureConnection,
    isValidURL,
    renderSafeContent,
    simpleHash,
    PrivacyValidator
};
