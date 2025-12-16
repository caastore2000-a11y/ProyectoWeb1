// Script/auth-service.js
import { SUPABASE_CONFIG } from './config.js';

const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.URL, 
    SUPABASE_CONFIG.PUBLISHABLE_KEY
);

export const AuthService = {
    
    // ==================== REGISTRO ====================
    async registrarUsuario(datosUsuario) {
        const { email, password, nombre, rol_id } = datosUsuario;
        
        // 1. Crear usuario en Auth de Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre: nombre,
                    rol_id: rol_id
                }
            }
        });
        
        if (authError) {
            return { error: authError };
        }
        
        // 2. Guardar en tabla usuarios
        const { data: userData, error: userError } = await supabase
            .from(SUPABASE_CONFIG.TABLES.USUARIOS)
            .insert([{
                id: authData.user.id,
                nombre: nombre,
                email: email,
                rol_id: rol_id
            }])
            .select();
        
        if (userError) {
            // Si falla, eliminar el usuario de Auth
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: userError };
        }
        
        return { 
            data: { 
                auth: authData, 
                user: userData[0] 
            }, 
            error: null 
        };
    },
    
    // ==================== LOGIN ====================
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return { error };
        }
        
        // Obtener datos adicionales del usuario
        const { data: usuario, error: userError } = await supabase
            .from(SUPABASE_CONFIG.TABLES.USUARIOS)
            .select(`
                *,
                roles:rol_id (nombre)
            `)
            .eq('id', data.user.id)
            .single();
        
        if (userError) {
            return { error: userError };
        }
        
        // Guardar en localStorage
        this.guardarSesion(usuario, data.session);
        
        return { data: { usuario, session: data.session }, error: null };
    },
    
    // ==================== SESIÓN ====================
    async obtenerSesionActual() {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            return { data: null, error: error || new Error('No hay sesión activa') };
        }
        
        // Obtener datos del usuario
        const { data: usuario, error: userError } = await supabase
            .from(SUPABASE_CONFIG.TABLES.USUARIOS)
            .select(`
                *,
                roles:rol_id (nombre)
            `)
            .eq('id', session.user.id)
            .single();
        
        return { data: { usuario, session }, error: userError };
    },
    
    async cerrarSesion() {
        // Limpiar localStorage
        localStorage.removeItem('usuario');
        localStorage.removeItem('session');
        localStorage.removeItem('user_role');
        
        // Cerrar sesión en Supabase
        const { error } = await supabase.auth.signOut();
        return { error };
    },
    
    // ==================== HELPERS ====================
    guardarSesion(usuario, session) {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('session', JSON.stringify(session));
        localStorage.setItem('user_role', usuario.rol_id);
    },
    
    obtenerUsuarioLocal() {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
    },
    
    verificarAutenticacion() {
        const usuario = this.obtenerUsuarioLocal();
        return !!usuario;
    },
    
    obtenerRolUsuario() {
        const usuario = this.obtenerUsuarioLocal();
        return usuario ? usuario.rol_id : null;
    }
};

// Hacer disponible globalmente
window.AuthService = AuthService;