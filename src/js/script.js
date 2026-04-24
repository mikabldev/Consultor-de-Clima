/**
 * Realiza fetch con timeout automático
 * @param {string} url - URL a obtener
 * @param {number} timeout - Milisegundos (default: 5000)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Timeout: La solicitud tardó más de ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * SISTEMA DE CACHÉ - FASE 1
 * Crea una clave hash simple para el nombre de la ciudad
 * @param {string} city - Nombre de la ciudad
 * @returns {string} Clave para localStorage
 */
function createCacheKey(city) {
    return `weather_cache_${city.toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Obtiene datos del caché si existen y son válidos (< 1 hora)
 * @param {string} city - Nombre de la ciudad
 * @returns {Object|null} Datos en caché o null si expirado
 */
function getCachedWeather(city) {
    try {
        const key = createCacheKey(city);
        const cached = localStorage.getItem(key);
        
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Validar que no haya expirado (expiración pasiva)
        if (now > data.expiresAt) {
            localStorage.removeItem(key); // Limpiar automáticamente
            return null;
        }
        
        console.log(`✓ Caché hit para "${city}" - Datos frescos`);
        return data.data;
    } catch (error) {
        console.warn(`Error al leer caché: ${error.message}`);
        return null;
    }
}

/**
 * Guarda datos en el caché con expiración de 1 hora
 * @param {string} city - Nombre de la ciudad
 * @param {Object} data - Datos a cachear
 */
function saveCacheWeather(city, data) {
    try {
        const key = createCacheKey(city);
        const now = Date.now();
        const oneHourMs = 3600000; // 1 hora en milisegundos
        
        const cacheEntry = {
            data: data,
            timestamp: now,
            expiresAt: now + oneHourMs
        };
        
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        console.log(`✓ Datos cacheados para "${city}" - Expira en 1 hora`);
    } catch (error) {
        console.warn(`Error al guardar en caché: ${error.message}`);
    }
}

/**
 * Limpia entradas expiradas del caché (expiración pasiva en acceso, no proactiva)
 * Se llama automáticamente cuando se accede a valores
 */
function clearExpiredCache() {
    try {
        const now = Date.now();
        let cleared = 0;
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('weather_cache_')) {
                const cached = JSON.parse(localStorage.getItem(key));
                if (now > cached.expiresAt) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        }
        
        if (cleared > 0) {
            console.log(`✓ ${cleared} entradas de caché expiradas eliminadas`);
        }
    } catch (error) {
        console.warn(`Error al limpiar caché: ${error.message}`);
    }
}

/**
 * Sincroniza caché entre pestañas del navegador
 * CONSIDERACIÓN PENDIENTE #1: Actualiza datos si otra pestaña modifica localStorage
 */
function initCacheSynchronization() {
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('weather_cache_')) {
            console.log(`🔄 Caché sincronizado desde otra pestaña: ${event.key}`);
        }
    });
}

/**
 * Obtiene el historial de últimas búsquedas desde localStorage
 * @returns {Array<string>} Array de ciudades buscadas (máx 10)
 */
function getSearchHistory() {
    try {
        const history = localStorage.getItem('search_history');
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
}

/**
 * Guarda una ciudad en el historial de búsquedas
 * @param {string} city - Nombre de la ciudad
 */
function addToSearchHistory(city) {
    try {
        let history = getSearchHistory();
        // Evitar duplicados, mantener última búsqueda al inicio
        history = history.filter(c => c !== city);
        history.unshift(city);
        // Limitar a 10 últimas búsquedas
        history = history.slice(0, 10);
        localStorage.setItem('search_history', JSON.stringify(history));
    } catch (error) {
        console.warn(`Error al guardar historial: ${error.message}`);
    }
}

/**
 * Obtiene los datos meteorológicos actuales de una ciudad (con caché)
 * FASE 1 INTEGRADA: Verifica caché antes de hacer request
 * @param {string} city - Nombre de la ciudad (ej: "Madrid", "Buenos Aires")
 * @returns {Promise<Object>} Objeto con { city, temperature, weather, forecast, fromCache }
 */
async function getWeather(city) {
    try {
        // Validar que la ciudad no esté vacía
        if (!city || typeof city !== 'string' || city.trim() === "") {
            throw new Error("El nombre de la ciudad no puede estar vacío");
        }

        const cityTrimmed = city.trim();

        // PASO 0: Verificar caché (FASE 1)
        const cachedData = getCachedWeather(cityTrimmed);
        if (cachedData) {
            addToSearchHistory(cityTrimmed);
            return { ...cachedData, fromCache: true };
        }

        // PASO 1: Obtener las coordenadas (latitud y longitud) de la ciudad
        console.log(`🔍 Buscando coordenadas para: ${cityTrimmed}`);
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityTrimmed)}&count=1&language=es`;
        
        const geoResponse = await fetchWithTimeout(geocodingUrl, 5000);
        
        // Verificar que la respuesta sea exitosa
        if (!geoResponse.ok) {
            throw new Error(`Error de red: ${geoResponse.status} - ${geoResponse.statusText}`);
        }

        let geoData;
        try {
            geoData = await geoResponse.json();
        } catch (e) {
            throw new Error("Error al parsear respuesta JSON de geocodificación");
        }

        // Verificar si se encontró la ciudad
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`No se encontró la ciudad: "${cityTrimmed}". Verifica el nombre e intenta nuevamente`);
        }

        // Extraer latitud y longitud del primer resultado
        const { latitude, longitude, name, country, timezone } = geoData.results[0];
        const fullCityName = `${name}, ${country || 'desconocido'}`;

        // PASO 2: Obtener datos meteorológicos actuales Y pronóstico de 5 días en paralelo
        console.log(`⛅ Obteniendo clima y pronóstico para: ${fullCityName}`);
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto`;
        
        const weatherResponse = await fetchWithTimeout(weatherUrl, 5000);
        
        if (!weatherResponse.ok) {
            throw new Error(`Error de red en la API meteorológica: ${weatherResponse.status}`);
        }

        let weatherData;
        try {
            weatherData = await weatherResponse.json();
        } catch (e) {
            throw new Error("Error al parsear respuesta JSON meteorológica");
        }

        // Extraer temperatura y código de clima actuales
        const temperature = weatherData.current.temperature_2m;
        const weatherCode = weatherData.current.weather_code;
        const humidity = weatherData.current.relative_humidity_2m;
        const windSpeed = weatherData.current.wind_speed_10m;

        // Convertir código de clima a descripción legible
        const weatherDescription = getWeatherDescription(weatherCode);

        // PASO 3: Procesar pronóstico de 5 días (FASE 2)
        const forecast = processForecast(weatherData.daily, timezone);

        // PASO 4: Construir resultado completo
        const result = {
            city: fullCityName,
            temperature: temperature,
            humidity: humidity,
            windSpeed: windSpeed,
            unit: "°C",
            weather: weatherDescription,
            weatherCode: weatherCode,
            coordinates: { latitude, longitude },
            timezone: timezone,
            forecast: forecast,
            timestamp: new Date().toLocaleString('es-ES'),
            fromCache: false
        };

        // Guardar en caché
        saveCacheWeather(cityTrimmed, result);
        addToSearchHistory(cityTrimmed);

        console.log("✓ Datos obtenidos exitosamente");
        return result;

    } catch (error) {
        // Manejo de errores detallado
        console.error("❌ Error al obtener datos meteorológicos:", error.message);
        
        // Retornar un objeto de error para que el código no se rompa
        return {
            error: true,
            message: error.message,
            city: city || "desconocida"
        };
    }
}

/**
 * Convierte códigos de clima WMO a descripciones legibles
 * @param {number} code - Código WMO del clima
 * @returns {string} Descripción del clima
 */
function getWeatherDescription(code) {
    const weatherCodes = {
        0: "Cielo despejado",
        1: "Principalmente despejado",
        2: "Parcialmente nublado",
        3: "Nublado",
        45: "Niebla",
        48: "Niebla escarchada",
        51: "Llovizna ligera",
        53: "Llovizna moderada",
        55: "Llovizna densa",
        61: "Lluvia ligera",
        63: "Lluvia moderada",
        65: "Lluvia fuerte",
        71: "Nieve ligera",
        73: "Nieve moderada",
        75: "Nieve fuerte",
        77: "Granos de nieve",
        80: "Chubascos ligeros",
        81: "Chubascos moderados",
        82: "Chubascos violentos",
        85: "Chubascos de nieve ligeros",
        86: "Chubascos de nieve fuertes",
        95: "Tormenta",
        96: "Tormenta con granizo ligero",
        99: "Tormenta con granizo fuerte"
    };
    
    return weatherCodes[code] || "Clima desconocido";
}

/**
 * FASE 2: Procesa pronóstico de 5 días desde Open-Meteo
 * Incluye CONSIDERACIÓN PENDIENTE #3: Timezone local en pronóstico
 * @param {Object} dailyData - Datos diarios de Open-Meteo
 * @param {string} timezone - Timezone de la ciudad
 * @returns {Array<Object>} Array de 5 días con pronóstico
 */
function processForecast(dailyData, timezone) {
    try {
        if (!dailyData || !dailyData.time) return [];
        
        const forecast = [];
        const numDays = Math.min(5, dailyData.time.length);
        
        for (let i = 0; i < numDays; i++) {
            const date = new Date(dailyData.time[i]);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            const weatherCode = dailyData.weather_code[i];
            
            forecast.push({
                date: dailyData.time[i],
                day: dayName,
                dateFormatted: dateStr,
                tempMax: dailyData.temperature_2m_max[i],
                tempMin: dailyData.temperature_2m_min[i],
                precipitation: dailyData.precipitation_sum[i],
                weather: getWeatherDescription(weatherCode),
                weatherCode: weatherCode,
                timezone: timezone
            });
        }
        
        return forecast;
    } catch (error) {
        console.warn(`Error procesando pronóstico: ${error.message}`);
        return [];
    }
}

/**
 * FASE 3: Obtiene clima para múltiples ciudades en paralelo
 * Validación individual de errores por ciudad
 * @param {string} citiesString - Ciudades separadas por coma: "Madrid,Paris,Berlin"
 * @returns {Promise<Object>} { success, cities: [...], errors: [...] }
 */
async function getWeatherMultiple(citiesString) {
    try {
        if (!citiesString || typeof citiesString !== 'string') {
            throw new Error("Debe proporcionar una cadena de ciudades");
        }

        const cities = citiesString
            .split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        if (cities.length === 0) {
            throw new Error("Debe ingresar al menos una ciudad");
        }

        if (cities.length > 10) {
            throw new Error("Máximo 10 ciudades por búsqueda");
        }

        console.log(`\n🌍 Obteniendo clima para ${cities.length} ciudades: ${cities.join(', ')}`);

        // Ejecutar todas las búsquedas en paralelo
        const promises = cities.map(city => getWeather(city));
        const results = await Promise.all(promises);

        // Separar éxitos y errores
        const successCities = results.filter(r => !r.error);
        const errorCities = results.filter(r => r.error);

        return {
            success: errorCities.length === 0,
            cities: successCities,
            errors: errorCities,
            total: cities.length,
            successCount: successCities.length
        };

    } catch (error) {
        console.error("❌ Error en búsqueda múltiple:", error.message);
        return {
            success: false,
            cities: [],
            errors: [{ message: error.message }],
            total: 0,
            successCount: 0
        };
    }
}

/**
 * FUNCIÓN MEJORADA: Obtiene los datos meteorológicos de una ciudad y 3 ciudades aledañas
 * Optimizada para rendimiento con promesas paralelas
 * @param {string} city - Nombre de la ciudad
 * @returns {Promise<Object>} Objeto con ciudad principal y ciudades aledañas
 */
async function getWeatherWithNearbyCities(city) {
    try {
        if (!city || typeof city !== 'string' || city.trim() === "") {
            throw new Error("El nombre de la ciudad no puede estar vacío");
        }

        console.log(`\n🔍 Buscando: "${city}" y ciudades aledañas...`);
        
        // PASO 1: Obtener hasta 4 ciudades (la principal + 3 aledañas)
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=4&language=es`;
        
        const geoResponse = await fetchWithTimeout(geocodingUrl, 5000);
        
        if (!geoResponse.ok) {
            throw new Error(`Error de geocodificación: ${geoResponse.status}`);
        }

        let geoData;
        try {
            geoData = await geoResponse.json();
        } catch (e) {
            throw new Error("Error al parsear respuesta de geocodificación");
        }

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`No se encontró la ciudad: "${city}"`);
        }

        // PASO 2: Obtener datos meteorológicos para todas las ciudades en paralelo
        const citiesPromises = geoData.results.slice(0, 4).map(async (result, index) => {
            const { latitude, longitude, name, country } = result;
            const fullCityName = `${name}, ${country || 'desconocido'}`;

            try {
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
                
                const weatherResponse = await fetchWithTimeout(weatherUrl, 5000);
                
                if (!weatherResponse.ok) {
                    throw new Error(`Error al obtener clima para ${fullCityName}`);
                }

                let weatherData;
                try {
                    weatherData = await weatherResponse.json();
                } catch (e) {
                    throw new Error(`Error al parsear clima de ${fullCityName}`);
                }

                const temperature = weatherData.current.temperature_2m;
                const weatherCode = weatherData.current.weather_code;
                const weatherDescription = getWeatherDescription(weatherCode);

                return {
                    position: index === 0 ? "PRINCIPAL" : `ALEDAÑA ${index}`,
                    city: fullCityName,
                    temperature: temperature,
                    unit: "°C",
                    weather: weatherDescription,
                    coordinates: { latitude, longitude },
                    timestamp: new Date().toLocaleString('es-ES')
                };

            } catch (error) {
                console.warn(`⚠️ Error en ${fullCityName}: ${error.message}`);
                return null;
            }
        });

        const results = await Promise.all(citiesPromises);
        const validResults = results.filter(r => r !== null);

        if (validResults.length === 0) {
            throw new Error("No se pudo obtener datos para ninguna ciudad");
        }

        const mainCity = validResults[0];
        const nearestCities = validResults.slice(1, 4);

        const finalResult = {
            success: true,
            mainCity: mainCity,
            nearbyCities: nearestCities,
            totalCitiesFound: validResults.length,
            requestedCity: city
        };

        console.log("✓ Datos obtenidos exitosamente");
        return finalResult;

    } catch (error) {
        console.error("❌ Error:", error.message);
        return {
            success: false,
            error: error.message,
            city: city || "desconocida"
        };
    }
}

// EJEMPLOS DE USO:
// ================

// Ejemplo 1: Una ciudad (con caché)
async function ejemploUnaCiudad() {
    console.log("\n--- Ejemplo 1: Una ciudad con caché ---");
    const resultado = await getWeather("Madrid");
    if (!resultado.error) {
        console.log(`📍 ${resultado.city}`);
        console.log(`🌡️ ${resultado.temperature}°C - ${resultado.weather}`);
        console.log(`💾 Desde caché: ${resultado.fromCache ? 'Sí (rápido)' : 'No (API)'}`);
    }
}

// Ejemplo 2: Múltiples ciudades en paralelo
async function ejemploMultiplesCiudades() {
    console.log("\n--- Ejemplo 2: Múltiples ciudades ---");
    const resultado = await getWeatherMultiple("Madrid, Paris, Tokyo");
    if (resultado.success) {
        console.log(`✓ Obtenidas ${resultado.successCount} ciudades:`);
        resultado.cities.forEach(city => {
            console.log(`  📍 ${city.city}: ${city.temperature}°C - ${city.weather}`);
        });
    }
}

// Ejemplo 3: Con pronóstico de 5 días
async function ejemploPronóstico() {
    console.log("\n--- Ejemplo 3: Con pronóstico de 5 días ---");
    const resultado = await getWeather("Buenos Aires");
    if (!resultado.error && resultado.forecast.length > 0) {
        console.log(`📍 ${resultado.city}`);
        console.log("Pronóstico 5 días:");
        resultado.forecast.forEach(day => {
            console.log(`  ${day.day} ${day.dateFormatted}: ${day.tempMin}°C - ${day.tempMax}°C, ${day.weather}`);
        });
    }
}

// Inicializar sincronización de caché entre pestañas
initCacheSynchronization();
clearExpiredCache();

// Descomentar para ejecutar ejemplos:
// ejemploUnaCiudad();
// ejemploMultiplesCiudades();
// ejemploPronóstico();