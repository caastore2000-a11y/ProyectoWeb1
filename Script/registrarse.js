// Script/registro.js - Sistema completo de registro para CaseStore

// ============================================================
// CONFIGURACIÓN PRINCIPAL
// ============================================================

class RegistrationSystem {
    constructor() {
        this.supabase = null;
        this.isSubmitting = false;
        this.init();
    }
    
    init() {
        console.log('🚀 Iniciando sistema de registro...');
        
        // Inicializar Supabase
        this.initializeSupabase();
        
        // Configurar formulario
        this.setupForm();
        
        // Configurar validaciones en tiempo real
        this.setupRealTimeValidation();
        
        console.log('✅ Sistema de registro listo');
    }
    
    // ============================================================
    // 1. CONFIGURACIÓN SUPABASE
    // ============================================================
    
    initializeSupabase() {
        const SUPABASE_URL = 'https://tyitfffjbttftznadtrm.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXRmZmZqYnR0ZnR6bmFkdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY1NDgsImV4cCI6MjA4MDk1MjU0OH0.UFw3kX6ay-hlYt-fALgu0wOOworkTIJTWcPX0CnUBqo';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase configurado');
    }
    
    // ============================================================
    // 2. CONFIGURACIÓN DEL FORMULARIO
    // ============================================================
    
    setupForm() {
        const form = document.getElementById('registerForm');
        
        if (!form) {
            console.error('❌ Formulario de registro no encontrado');
            return;
        }
        
        // Prevenir envío por defecto
        form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Configurar toggle para mostrar/ocultar contraseña
        this.setupPasswordToggle();
        
        console.log('✅ Formulario configurado');
    }
    
    setupPasswordToggle() {
        document.querySelectorAll('.password-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const inputId = button.getAttribute('aria-controls');
                const input = document.getElementById(inputId);
                
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                    }
                    
                    button.setAttribute('aria-label', 
                        type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
                }
            });
        });
    }
    
    // ============================================================
    // 3. VALIDACIONES
    // ============================================================
    
    setupRealTimeValidation() {
        // Validar fortaleza de contraseña en tiempo real
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
        
        // Validar unicidad de email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', async (e) => {
                await this.validateEmailUniqueness(e.target.value);
            });
        }
    }
    
    updatePasswordStrength(password) {
        const strength = this.calculatePasswordStrength(password);
        const strengthText = this.getStrengthText(strength);
        
        // Actualizar meter
        const meter = document.getElementById('password-strength');
        if (meter) {
            meter.value = strength;
        }
        
        // Actualizar texto
        const textElement = document.getElementById('password-strength-text');
        if (textElement) {
            textElement.textContent = `Fortaleza: ${strengthText}`;
            textElement.className = `strength-text strength-${strength}`;
        }
    }
    
    calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let score = 0;
        
        // Longitud
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Complejidad
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        return Math.min(score, 4); // Máximo 4
    }
    
    getStrengthText(score) {
        const levels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
        return levels[score] || 'Muy débil';
    }
    
    async validateEmailUniqueness(email) {
        if (!email || !this.isValidEmail(email)) return;
        
        const errorElement = document.getElementById('email-error');
        if (!errorElement) return;
        
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .maybeSingle();
            
            if (error) {
                console.warn('Error verificando email:', error);
                return;
            }
            
            if (data) {
                errorElement.textContent = 'Este correo ya está registrado';
                document.getElementById('email').setAttribute('aria-invalid', 'true');
            } else {
                errorElement.textContent = '';
                document.getElementById('email').removeAttribute('aria-invalid');
            }
        } catch (error) {
            console.error('Error en validación de email:', error);
        }
    }
    
    // ============================================================
    // 4. VALIDACIÓN DE FORMULARIO
    // ============================================================
    
    validateForm() {
        let isValid = true;
        const errors = {};
        
        // Obtener valores
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        
        // Validar nombre
        if (!nombre) {
            errors.nombre = 'El nombre es requerido';
            isValid = false;
        } else if (nombre.length < 3) {
            errors.nombre = 'El nombre debe tener al menos 3 caracteres';
            isValid = false;
        } else if (nombre.length > 100) {
            errors.nombre = 'El nombre no puede exceder 100 caracteres';
            isValid = false;
        }
        
        // Validar email
        if (!email) {
            errors.email = 'El correo electrónico es requerido';
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            errors.email = 'Ingresa un correo electrónico válido';
            isValid = false;
        }
        
        // Validar contraseña
        if (!password) {
            errors.password = 'La contraseña es requerida';
            isValid = false;
        } else if (password.length < 8) {
            errors.password = 'La contraseña debe tener al menos 8 caracteres';
            isValid = false;
        }
        
        // Validar confirmación
        if (!confirmPassword) {
            errors.confirmPassword = 'Confirma tu contraseña';
            isValid = false;
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
            isValid = false;
        }
        
        // Validar términos
        if (!terms) {
            errors.terms = 'Debes aceptar los términos y condiciones';
            isValid = false;
        }
        
        // Mostrar errores
        this.displayFormErrors(errors);
        
        return isValid;
    }
    
    displayFormErrors(errors) {
        // Limpiar errores anteriores
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.removeAttribute('aria-invalid');
        });
        
        // Mostrar nuevos errores
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}-error`);
            const inputElement = document.getElementById(field);
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                inputElement.setAttribute('aria-invalid', 'true');
            }
        });
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // ============================================================
    // 5. MANEJO DEL ENVÍO DEL FORMULARIO
    // ============================================================
    
    async handleSubmit(event) {
    event.preventDefault();
    
    // Evitar múltiples envíos
    if (this.isSubmitting) return;
    
    // Validar formulario
    if (!this.validateForm()) {
        this.showNotification('Por favor, corrige los errores en el formulario', 'error');
        return;
    }
    
    this.isSubmitting = true;
    this.updateSubmitButton(true);
    
    try {
        const formData = new FormData(event.target);
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            nombre: formData.get('nombre')
        };
        
        console.log('📤 Procesando registro para:', userData.email);
        
        // PASO 1: Registro en Supabase Auth
        // Es vital que registerInAuth envíe el 'nombre' en options.data
        const authResult = await this.registerInAuth(userData);
        
        if (!authResult.success) {
            throw new Error(authResult.error);
        }

        // ✅ IMPORTANTE: Aquí NO debe haber ningún insert manual.
        // El Trigger en la base de datos se activa automáticamente 
        // después de que registerInAuth tiene éxito.
           
        // PASO 2: Manejo de éxito local (Local Storage y Redirección)
        await this.handleRegistrationSuccess(userData, authResult.userId);
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        this.showNotification(error.message || 'Error al crear la cuenta', 'error');
    } finally {
        this.isSubmitting = false;
        this.updateSubmitButton(false);
    }
}
    
    async registerInAuth(userData) {
    console.log('🔐 Registrando en Supabase Auth...');
    
    try {
        const { data, error } = await this.supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                // Asegúrate de que 'nombre' sea exactamente lo que espera el Trigger SQL
                data: {
                    nombre: userData.nombre,
                    rol_id: 2 // Enviamos el ID numérico que espera tu tabla 'usuarios'
                },
                emailRedirectTo: `${window.location.origin}/proyecto.html`
            }
        });
        
        if (error) {
            console.error('❌ Error en auth.signUp:', error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error)
            };
        }
        
        // Supabase puede devolver un usuario pero pedir confirmación de email
        if (!data.user) {
            return {
                success: false,
                error: 'No se pudo crear el usuario. Verifica los datos.'
            };
        }
        
        console.log('✅ Auth exitoso. User ID:', data.user.id);
        
        return {
            success: true,
            userId: data.user.id,
            authData: data
        };

    } catch (err) {
        console.error('❌ Error inesperado:', err);
        return { success: false, error: 'Ocurrió un error inesperado en el servidor' };
    }
}
    
    async insertIntoUsers(userData) {
        console.log('💾 Insertando en tabla usuarios...');
        
        // IMPORTANTE: NO incluir el campo 'id' - se generará automáticamente con auth.uid()
        const { data, error } = await this.supabase
            .from('usuarios')
            .insert({
                rol_id: 2,  // ID del rol 'cliente' en tu base de datos
                nombre: userData.nombre,
                email: userData.email
               
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error al insertar en usuarios:', error);
            return {
                success: false,
                error: `Error al crear perfil de usuario: ${error.message}`
            };
        }
        
        console.log('✅ Usuario insertado en tabla:', data);
        
        return {
            success: true,
            userData: data
        };
    }
    
    async cleanupFailedRegistration(userId) {
        try {
            // Intentar eliminar el usuario de auth si falló el registro completo
            const { error } = await this.supabase.auth.admin.deleteUser(userId);
            if (error) {
                console.warn('⚠️ No se pudo limpiar usuario fallido:', error);
            }
        } catch (cleanupError) {
            console.warn('⚠️ Error en limpieza:', cleanupError);
        }
    }
    
    async handleRegistrationSuccess(userData, userId) {
    // 1. Guardar información localmente
    // Cambiamos rol_id a 2 (Cliente) para que coincida con tu base de datos
    localStorage.setItem('usuario', JSON.stringify({
        id: userId,
        nombre: userData.nombre,
        email: userData.email,
        rol_id: 2 // Antes tenías 3, pero en SQL configuramos 2 para Clientes
    }));
    
    // 2. Mostrar mensaje de éxito
    this.showNotification(
        '¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.',
        'success'
    );
    
    // 3. Redirigir al inicio
    setTimeout(() => {
        window.location.href = 'proyecto.html';
    }, 3000);
}
    
    getAuthErrorMessage(authError) {
        const messages = {
            'User already registered': 'Este correo ya está registrado',
            'Invalid email': 'Correo electrónico inválido',
            'Weak password': 'La contraseña es muy débil',
            'Email rate limit exceeded': 'Demasiados intentos. Intenta más tarde'
        };
        
        return messages[authError.message] || authError.message || 'Error de autenticación';
    }
    
    // ============================================================
    // 6. INTERFAZ DE USUARIO
    // ============================================================
    
    updateSubmitButton(isLoading) {
        const button = document.querySelector('.btn-registro');
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Creando cuenta...</span>
            `;
        } else {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.innerHTML = `
                <i class="fas fa-user-plus" aria-hidden="true"></i>
                <span>Crear Cuenta</span>
            `;
        }
    }
    
    showNotification(message, type = 'info') {
        // Eliminar notificaciones anteriores
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        // Determinar icono
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas ${icon}" aria-hidden="true"></i>
            <span>${message}</span>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${this.getNotificationColor(type)};
            color: white;
            z-index: 10000;
            animation: notificationSlideIn 0.3s ease;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: inherit;
        `;
        
        // Agregar estilos de animación si no existen
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes notificationSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
    
    // ============================================================
    // 7. FUNCIONES DE DEPURACIÓN (DEBUG)
    // ============================================================
    
    debugTestConnection() {
        console.log('🔍 Probando conexión...');
        
        this.supabase.from('usuarios').select('count', { count: 'exact', head: true })
            .then(({ count, error }) => {
                if (error) {
                    console.error('❌ Error de conexión:', error.message);
                } else {
                    console.log('✅ Conexión exitosa. Usuarios en BD:', count);
                }
            })
            .catch(err => {
                console.error('❌ Error fatal:', err.message);
            });
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema de registro
    window.registrationSystem = new RegistrationSystem();
    
    // Opcional: Probar conexión al cargar
    // window.registrationSystem.debugTestConnection();
    
    // Hacer funciones disponibles globalmente para debugging
    window.testRegistration = async () => {
        const testEmail = `test${Date.now()}@test.com`;
        const testPassword = 'Test123456!';
        const testNombre = 'Usuario Test';
        
        console.log('🧪 Ejecutando prueba de registro...');
        console.log('Email:', testEmail);
        
        const result = await window.registrationSystem.registerInAuth({
            email: testEmail,
            password: testPassword,
            nombre: testNombre
        });
        
        if (result.success) {
            console.log('✅ Auth exitoso, ahora insertando en tabla...');
            
            const dbResult = await window.registrationSystem.insertIntoUsers({
                email: testEmail,
                nombre: testNombre
            });
            
            if (dbResult.success) {
                console.log('✅ Registro completo exitoso:', dbResult.userData);
            } else {
                console.error('❌ Error en inserción:', dbResult.error);
            }
        } else {
            console.error('❌ Error en auth:', result.error);
        }
    };
    
    console.log('🎉 Sistema de registro completamente cargado');
});

// ============================================================
// POLYFILLS Y COMPATIBILIDAD
// ============================================================

// Polyfill para FormData.entries() si es necesario
if (!FormData.prototype.entries && !FormData.prototype.keys) {
    FormData.prototype.entries = function() {
        const result = [];
        this.forEach((value, key) => {
            result.push([key, value]);
        });
        return result[Symbol.iterator]();
    };
}

// Polyfill para Object.fromEntries si es necesario
if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
        const result = {};
        for (const [key, value] of entries) {
            result[key] = value;
        }
        return result;
    };
}

// Exportar para módulos (si se usa type="module")
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegistrationSystem;
}