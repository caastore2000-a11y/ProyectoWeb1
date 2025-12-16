// Script/config.js - VERSIÓN SIMPLE SIN EXPORT
export const SUPABASE_CONFIG = {
    URL: "https://tyitfffjbttftznadtrm.supabase.co",
    PUBLISHABLE_KEY: "sb_publishable_69KdogVBmY3-tnbubLspXQ_Dniol--y",
    SERVICE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXRmZmZqYnR0ZnR6bmFkdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY1NDgsImV4cCI6MjA4MDk1MjU0OH0.UFw3kX6ay-hlYt-fALgu0wOOworkTIJTWcPX0CnUBqo",
    
    TABLES: {
        USUARIOS: "usuarios",
        ROLES: "roles",
        PRODUCTOS: "productos",
        CATEGORIAS: "categorias"
    }
};

// Hacer disponible globalmente
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
console.log('✅ Config.js cargado');