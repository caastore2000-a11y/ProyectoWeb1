// conexion.js
const urlBase = "https://tyitfffjbttftznadtrm.supabase.co";
const API_KEY = 'sb_publishable_69KdogVBmY3-tnbubLspXQ_Dniol--y';

// ⚠️ URL de prueba general: Consulta el endpoint REST (todas las tablas) ⚠️
const TEST_URL = `${urlBase}/rest/v1/?select=`; 
// El parámetro '?select=' sin un valor pide una respuesta que confirma la conexión al endpoint REST.

console.log('Procesando prueba de conexión general a Supabase...');

fetch(TEST_URL, {
    method: 'GET',
    headers: {
        'apikey': API_KEY, 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    // Si la conexión es exitosa, response.ok será true (código 200) o 
    // recibiremos un código 4xx si la API Key es mala, pero al menos el servidor respondió.
    if (response.status === 200 || response.status === 401) {
        console.log('✅ ¡Conexión Exitosa con el Servidor de Supabase!');
        
        if (response.status === 200) {
            console.log('🎉 El servidor respondió correctamente y la API Key es válida.');
        } else if (response.status === 401) {
            // Este caso significa que el servidor te reconoció, pero rechazó la clave.
            // Si ves este error, el problema es SÓLO tu API_KEY (o permisos), no la red.
            console.warn('⚠️ Advertencia: El servidor respondió, pero la API Key puede ser incorrecta o no tener permisos de lectura (Error 401).');
        }
        
    } else {
        // Para cualquier otro error (como 404 o timeout), indicamos que falló.
        throw new Error(`Error en la solicitud HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Opcional: ver el JSON de respuesta para debug, aunque para la prueba no es crucial
    return response.json(); 
})
.then(data => {
    // Si la API Key es válida (200 OK), verás una lista de metadatos o las tablas.
    if (data && !data.error) {
        console.log('Detalles de la respuesta (metadatos de la API):', data);
    }
})
.catch(error => {
    // Esto captura errores de red (timeout, DNS fallido, etc.)
    console.error('❌ Error Crítico (Fallo de Red o URL base incorrecta):', error.message);
});


