// Script/database.js - VERSIÓN SIMPLIFICADA

console.log('🗄️ DatabaseService cargando...');

// Verificar que Supabase esté disponible
if (!window.supabase) {
    console.error('❌ Supabase no está disponible');
    throw new Error('Supabase no inicializado');
}

const supabase = window.supabase;

export const DatabaseService = {
    
    // ========== PRODUCTOS ==========
    productos: {
        async obtenerTodos(filtros = {}) {
            try {
                console.log('📦 Obteniendo productos...');
                
                let query = supabase
                    .from('productos')
                    .select('*');
                
                if (filtros.categoria && filtros.categoria !== 'all') {
                    query = query.eq('categoria_id', filtros.categoria);
                }
                
                if (filtros.busqueda) {
                    query = query.or(`nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
                }
                
                const { data, error } = await query;
                
                if (error) {
                    console.error('Error obteniendo productos:', error.message);
                    return { 
                        success: false, 
                        error: error.message,
                        data: []
                    };
                }
                
                return { 
                    success: true, 
                    data: data || [],
                    error: null
                };
                
            } catch (error) {
                console.error('Excepción en obtenerTodos:', error);
                return { 
                    success: false, 
                    error: error.message,
                    data: []
                };
            }
        },
        
        async obtenerPorId(id) {
            try {
                const { data, error } = await supabase
                    .from('productos')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                return { 
                    success: true, 
                    data,
                    error: null
                };
                
            } catch (error) {
                console.error('Error en obtenerPorId:', error);
                return { 
                    success: false, 
                    error: error.message,
                    data: null
                };
            }
        }
    },
    
    // ========== CATEGORÍAS ==========
    categorias: {
        async obtenerTodas() {
            try {
                console.log('🏷️ Obteniendo categorías...');
                
                const { data, error } = await supabase
                    .from('categorias')
                    .select('*')
                    .order('nombre');
                
                if (error) {
                    console.error('Error obteniendo categorías:', error.message);
                    return { 
                        success: false, 
                        error: error.message,
                        data: []
                    };
                }
                
                return { 
                    success: true, 
                    data: data || [],
                    error: null
                };
                
            } catch (error) {
                console.error('Excepción en obtenerTodas:', error);
                return { 
                    success: false, 
                    error: error.message,
                    data: []
                };
            }
        }
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
}

console.log('✅ DatabaseService cargado');