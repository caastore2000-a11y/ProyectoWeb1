// Script/auth.js - VERSIÓN MÓDULO ES6

// Verificar que Supabase esté disponible
if (!window.supabase) {
    console.error('❌ Supabase no está disponible para AuthService');
}

// Exportar AuthService como módulo ES6
export const AuthService = {
    
    // ==================== REGISTRO ====================
    async registrarUsuario(datosUsuario) {
        const { email, password, nombre, rol_id, telefono, direccion } = datosUsuario;
        
        try {
            console.log('📝 Registrando usuario:', email);
            
            // 1. Crear usuario en Auth de Supabase
            const { data: authData, error: authError } = await window.supabase.auth.signUp({
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
                console.error('Error en registro Auth:', authError);
                return { 
                    success: false, 
                    error: authError.message 
                };
            }
            
            // 2. Guardar en tabla usuarios
            const { data: userData, error: userError } = await window.supabase
                .from('usuarios')
                .insert([{
                    id: authData.user.id,
                    nombre: nombre,
                    email: email,
                    rol_id: rol_id,
                    telefono: telefono || null,
                    direccion: direccion || null,
                    creado_en: new Date().toISOString()
                }])
                .select();
            
            if (userError) {
                // Si falla, eliminar el usuario de Auth
                await window.supabase.auth.admin.deleteUser(authData.user.id);
                console.error('Error en registro tabla:', userError);
                return { 
                    success: false, 
                    error: userError.message 
                };
            }
            
            return { 
                success: true, 
                data: userData[0],
                message: 'Usuario registrado exitosamente'
            };
            
        } catch (error) {
            console.error('Error general en registro:', error);
            return { 
                success: false, 
                error: 'Error al registrar usuario' 
            };
        }
    },
    
    // ==================== LOGIN ====================
    async login(email, password) {
        try {
            console.log('🔑 Iniciando sesión para:', email);
            
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('Error en login:', error);
                return { 
                    success: false, 
                    error: 'Credenciales incorrectas' 
                };
            }
            
            // Obtener datos adicionales del usuario
            const { data: usuario, error: userError } = await window.supabase
                .from('usuarios')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (userError) {
                console.error('Error obteniendo usuario:', userError);
                return { 
                    success: false, 
                    error: 'Error al obtener información del usuario' 
                };
            }
            
            // Guardar en localStorage
            this.guardarSesionLocal(usuario);
            
            return { 
                success: true, 
                usuario: usuario,
                session: data.session
            };
            
        } catch (error) {
            console.error('Error general en login:', error);
            return { 
                success: false, 
                error: 'Error de conexión' 
            };
        }
    },
    
    // ==================== SESIÓN ====================
    async obtenerSesionActual() {
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error || !session) {
                return { 
                    success: false, 
                    error: 'No hay sesión activa' 
                };
            }
            
            // Obtener datos del usuario
            const { data: usuario, error: userError } = await window.supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (userError) {
                return { 
                    success: false, 
                    error: userError.message 
                };
            }
            
            return { 
                success: true, 
                data: { usuario, session } 
            };
            
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return { 
                success: false, 
                error: 'Error al verificar sesión' 
            };
        }
    },
    
    async cerrarSesion() {
        try {
            // Limpiar localStorage
            localStorage.removeItem('usuario');
            localStorage.removeItem('session');
            localStorage.removeItem('user_role');
            
            // Cerrar sesión en Supabase
            const { error } = await window.supabase.auth.signOut();
            
            if (error) {
                console.error('Error cerrando sesión:', error);
                return { 
                    success: false, 
                    error: error.message 
                };
            }
            
            return { 
                success: true, 
                message: 'Sesión cerrada exitosamente' 
            };
            
        } catch (error) {
            console.error('Error general cerrando sesión:', error);
            return { 
                success: false, 
                error: 'Error al cerrar sesión' 
            };
        }
    },
    
    // ==================== HELPERS ====================
    guardarSesionLocal(usuario) {
        try {
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('user_role', usuario.rol_id);
            console.log('✅ Sesión guardada en localStorage');
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    },
    
    obtenerUsuarioLocal() {
        try {
            const usuarioStr = localStorage.getItem('usuario');
            return usuarioStr ? JSON.parse(usuarioStr) : null;
        } catch (error) {
            console.error('Error obteniendo usuario local:', error);
            return null;
        }
    },
    
    verificarAutenticacion() {
        const usuario = this.obtenerUsuarioLocal();
        return !!usuario;
    },
    
    obtenerRolUsuario() {
        const usuario = this.obtenerUsuarioLocal();
        return usuario ? usuario.rol_id : null;
    },
    
    obtenerRedireccionPorRol(rol_id) {
        const rutas = {
            1: 'admin.html',
            2: 'vendedor.html',
            3: 'proyecto.html'
        };
        return rutas[rol_id] || 'proyecto.html';
    }
};

// Hacer disponible globalmente para compatibilidad
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}

console.log('✅ AuthService cargado como módulo ES6');