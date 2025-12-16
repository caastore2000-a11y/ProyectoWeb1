// Script/conexion.js - VERSIÓN SIN IMPORT
// Usar la configuración global
const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || "https://tyitfffjbttftznadtrm.supabase.co";
const SUPABASE_KEY = window.SUPABASE_CONFIG?.PUBLISHABLE_KEY || "sb_publishable_69KdogVBmY3-tnbubLspXQ_Dniol--y";

// Crear cliente de Supabase GLOBAL
if (!window.supabase) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase cliente creado:', SUPABASE_URL);
}

// Función para probar conexión
async function probarConexion() {
    console.log('🔌 Probando conexión con Supabase...');
    
    try {
        const { data, error } = await window.supabase
            .from('usuarios')
            .select('count')
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión exitosa con Supabase');
        return true;
    } catch (error) {
        console.error('❌ Error crítico:', error);
        return false;
    }
}

// Hacer disponible globalmente
window.probarConexion = probarConexion;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;

// Probar conexión automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    await probarConexion();
});