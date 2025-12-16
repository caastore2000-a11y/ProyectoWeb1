// ========== CONFIGURACIÓN SUPABASE ==========
const SUPABASE_URL = 'https://tyitfffjbttftznadtrm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXRmZmZqYnR0ZnR6bmFkdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY1NDgsImV4cCI6MjA4MDk1MjU0OH0.UFw3kX6ay-hlYt-fALgu0wOOworkTIJTWcPX0CnUBqo';

// ========== VARIABLES GLOBALES ==========
let supabase = null;
let productos = [];
let categorias = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let usuario = null;
let filtrosActuales = {};

// ========== ELEMENTOS DEL DOM ==========
let elementos = {};

// ========== INICIALIZAR ELEMENTOS DOM ==========
function inicializarElementos() {
    elementos = {
        // Navegación
        menuBtn: document.getElementById('menu-btn'),
        closeMenuBtn: document.getElementById('close-menu-btn'),
        navMenu: document.getElementById('nav-menu'),
        
        // Usuario
        userInfo: document.getElementById('user-info'),
        userName: document.getElementById('user-name'),
        btnLogout: document.getElementById('btn-logout'),
        loginLink: document.getElementById('login-link'),
        registerLink: document.getElementById('register-link'),
        adminPanel: document.getElementById('admin-panel'),
        
        // Carrito
        cartIcon: document.getElementById('cart-icon'),
        cartCount: document.getElementById('cart-count'),
        cartSidebar: document.getElementById('cart-sidebar'),
        closeCartBtn: document.getElementById('close-cart-btn'),
        cartOverlay: document.getElementById('cart-overlay'),
        cartItems: document.getElementById('cart-items'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),
        
        // Productos y búsqueda
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        filterCategory: document.getElementById('filter-category'),
        filterPrice: document.getElementById('filter-price'),
        productContainer: document.getElementById('product-container'),
        resultsCount: document.getElementById('results-count'),
        
        // Modal
        productModal: document.getElementById('product-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        modalBody: document.getElementById('modal-body'),
        
        // Filtros rápidos
        filterAll: document.getElementById('filter-all'),
        filterPhones: document.getElementById('filter-phones'),
        filterComputers: document.getElementById('filter-computers'),
        filterHeadphones: document.getElementById('filter-headphones'),
        
        // Admin
        addProductBtn: document.getElementById('add-product-btn'),
        
        // Sección título
        sectionTitle: document.getElementById('section-title')
    };
}

// ========== DATABASE SERVICE ==========
const DatabaseService = {
    // Obtener todos los productos
    async obtenerProductos(filtros = {}) {
        console.log('📦 Solicitando productos con filtros:', filtros);
        
        try {
            let query = supabase.from('productos').select('*');
            
            if (filtros.categoria && filtros.categoria !== 'all') {
                console.log('Filtrando por categoría ID:', filtros.categoria);
                query = query.eq('categoria_id', parseInt(filtros.categoria));
            }
            
            if (filtros.busqueda) {
                console.log('Filtrando por búsqueda:', filtros.busqueda);
                query = query.or(`nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }
            
            console.log(`✅ Productos obtenidos: ${data?.length || 0}`);
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('❌ Error en obtenerProductos:', error.message);
            return { 
                success: false, 
                error: error.message, 
                data: [] 
            };
        }
    },
    
    // Obtener categorías
    async obtenerCategorias() {
        console.log('🏷️ Solicitando categorías...');
        
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .order('nombre');
            
            if (error) {
                console.error('❌ Error obteniendo categorías:', error);
                throw error;
            }
            
            console.log(`✅ Categorías obtenidas: ${data?.length || 0}`);
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('❌ Error en obtenerCategorias:', error.message);
            return { 
                success: false, 
                error: error.message, 
                data: [] 
            };
        }
    },
    
    // Obtener producto por ID
    async obtenerProductoPorId(id) {
        console.log(`🔍 Solicitando producto ID: ${id}`);
        
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            console.log('✅ Producto obtenido:', data?.nombre);
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error en obtenerProductoPorId:', error.message);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },
    
    // Método de prueba para verificar conexión
    async probarConexion() {
        try {
            console.log('🔌 Probando conexión a Supabase...');
            
            const { data, error } = await supabase
                .from('productos')
                .select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            
            console.log('✅ Conexión a Supabase exitosa');
            return true;
            
        } catch (error) {
            console.error('❌ Error de conexión a Supabase:', error.message);
            return false;
        }
    }
};

// ========== AUTH SERVICE ==========
const AuthService = {
    // Obtener usuario del localStorage
    obtenerUsuarioLocal() {
        try {
            const usuarioStr = localStorage.getItem('usuario');
            return usuarioStr ? JSON.parse(usuarioStr) : null;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    },
    
    // Cerrar sesión
    async logout() {
        try {
            localStorage.removeItem('usuario');
            localStorage.removeItem('user_role');
            if (supabase?.auth) {
                await supabase.auth.signOut();
            }
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    }
};

// ========== FUNCIONES PRINCIPALES ==========
async function initApp() {
    console.log('🚀 Inicializando aplicación...');
    
    try {
        // 1. Inicializar elementos DOM
        inicializarElementos();
        
        // 2. Verificar que todos los elementos necesarios existan
        if (!elementos.productContainer) {
            console.error('❌ No se encontró el contenedor de productos');
            return;
        }
        
        // 3. Inicializar Supabase
        await inicializarSupabase();
        
        // 4. Configurar event listeners
        configurarEventListeners();
        
        // 5. Verificar autenticación
        verificarAutenticacion();
        
        // 6. Cargar categorías y productos
        await cargarCategorias();
        await cargarProductos();
        
        // 7. Actualizar carrito
        actualizarCarrito();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico inicializando:', error);
        mostrarErrorInicial('Error al cargar la aplicación: ' + error.message);
    }
}

async function inicializarSupabase() {
    try {
        // Verificar si supabase está disponible globalmente
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase no está disponible en window.supabase');
            throw new Error('Supabase CDN no cargado correctamente');
        }
        
        // Crear cliente Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        console.log('✅ Cliente Supabase creado');
        
        // Probar conexión
        const conexionExitosa = await DatabaseService.probarConexion();
        if (!conexionExitosa) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        throw error;
    }
}

function configurarEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Menú
    if (elementos.menuBtn) {
        elementos.menuBtn.addEventListener('click', toggleMenu);
    }
    if (elementos.closeMenuBtn) {
        elementos.closeMenuBtn.addEventListener('click', toggleMenu);
    }
    
    // Carrito
    if (elementos.cartIcon) {
        elementos.cartIcon.addEventListener('click', toggleCart);
    }
    if (elementos.closeCartBtn) {
        elementos.closeCartBtn.addEventListener('click', toggleCart);
    }
    if (elementos.cartOverlay) {
        elementos.cartOverlay.addEventListener('click', toggleCart);
    }
    if (elementos.checkoutBtn) {
        elementos.checkoutBtn.addEventListener('click', realizarCompra);
    }
    
    // Búsqueda
    if (elementos.searchBtn && elementos.searchInput) {
        elementos.searchBtn.addEventListener('click', () => {
            buscarProductos(elementos.searchInput.value);
        });
        
        elementos.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                buscarProductos(elementos.searchInput.value);
            }
        });
    }
    
    // Filtros
    if (elementos.filterCategory) {
        elementos.filterCategory.addEventListener('change', filtrarProductos);
    }
    if (elementos.filterPrice) {
        elementos.filterPrice.addEventListener('change', filtrarProductos);
    }
    
    // Filtros rápidos del menú
    if (elementos.filterAll) {
        elementos.filterAll.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarPorCategoriaTexto('all');
        });
    }
    
    if (elementos.filterPhones) {
        elementos.filterPhones.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarPorCategoriaTexto('celulares');
        });
    }
    
    if (elementos.filterComputers) {
        elementos.filterComputers.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarPorCategoriaTexto('computadores');
        });
    }
    
    if (elementos.filterHeadphones) {
        elementos.filterHeadphones.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarPorCategoriaTexto('audifonos');
        });
    }
    
    // Modal
    if (elementos.closeModalBtn) {
        elementos.closeModalBtn.addEventListener('click', cerrarModal);
    }
    
    // Logout
    if (elementos.btnLogout) {
        elementos.btnLogout.addEventListener('click', logout);
    }
    
    // Admin
    if (elementos.addProductBtn) {
        elementos.addProductBtn.addEventListener('click', mostrarFormularioProducto);
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (elementos.productModal && e.target === elementos.productModal) {
            cerrarModal();
        }
    });
    
    console.log('✅ Event listeners configurados');
}

function verificarAutenticacion() {
    usuario = AuthService.obtenerUsuarioLocal();
    
    if (usuario) {
        console.log('👤 Usuario autenticado:', usuario.nombre);
        
        if (elementos.userName) {
            elementos.userName.textContent = usuario.nombre;
        }
        if (elementos.loginLink) {
            elementos.loginLink.style.display = 'none';
        }
        if (elementos.registerLink) {
            elementos.registerLink.style.display = 'none';
        }
        if (elementos.btnLogout) {
            elementos.btnLogout.style.display = 'inline-block';
        }
        
        if (usuario.rol_id === 1 && elementos.adminPanel) {
            elementos.adminPanel.style.display = 'block';
        }
    } else {
        console.log('👤 Usuario no autenticado (Invitado)');
    }
}

async function cargarCategorias() {
    try {
        console.log('🔄 Cargando categorías...');
        
        const resultado = await DatabaseService.obtenerCategorias();
        
        if (resultado.success && resultado.data) {
            categorias = resultado.data;
            
            // Actualizar filtro de categorías
            if (elementos.filterCategory) {
                elementos.filterCategory.innerHTML = '<option value="all">Todas las categorías</option>';
                
                categorias.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    elementos.filterCategory.appendChild(option);
                });
                
                console.log(`✅ ${categorias.length} categorías cargadas en el filtro`);
            }
        } else {
            console.warn('⚠️ No se pudieron cargar las categorías:', resultado.error);
            categorias = [];
        }
        
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        categorias = [];
    }
}

async function cargarProductos(filtros = {}) {
    try {
        console.log('🔄 Cargando productos...');
        
        mostrarCargando(true);
        filtrosActuales = { ...filtros };
        
        const resultado = await DatabaseService.obtenerProductos(filtros);
        
        if (resultado.success && resultado.data) {
            productos = resultado.data;
            console.log(`📊 ${productos.length} productos recibidos`);
            
            // Aplicar filtro de precio si existe
            if (filtros.precio) {
                aplicarFiltroPrecio(filtros.precio);
            }
            
            renderizarProductos();
            actualizarContadorResultados(productos.length);
        } else {
            console.error('❌ Error cargando productos:', resultado.error);
            mostrarErrorProductos(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Excepción en cargarProductos:', error);
        mostrarErrorProductos(error.message);
    } finally {
        mostrarCargando(false);
    }
}

function aplicarFiltroPrecio(tipoPrecio) {
    if (tipoPrecio === 'all' || !tipoPrecio) return;
    
    console.log(`💰 Aplicando filtro de precio: ${tipoPrecio}`);
    
    switch(tipoPrecio) {
        case 'low':
            productos = productos.filter(p => p.precio < 500000);
            break;
        case 'medium':
            productos = productos.filter(p => p.precio >= 500000 && p.precio <= 2000000);
            break;
        case 'high':
            productos = productos.filter(p => p.precio > 2000000);
            break;
    }
}

function renderizarProductos() {
    const container = elementos.productContainer;
    
    if (!container) {
        console.error('❌ No hay contenedor para productos');
        return;
    }
    
    console.log(`🎨 Renderizando ${productos.length} productos...`);
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>No hay productos disponibles</h3>
                <p>Intenta con otros filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    productos.forEach(producto => {
        const tieneStock = producto.stock > 0;
        const esOferta = producto.stock <= 5;
        
        html += `
            <div class="product-card" data-id="${producto.id}">
                ${esOferta ? '<span class="product-badge">¡Últimas unidades!</span>' : ''}
                
                <div class="product-image">
                    <img src="${producto.imagen_url || 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Sin+Imagen'}" 
                         alt="${producto.nombre}"
                         onerror="this.src='https://via.placeholder.com/300x200/CCCCCC/666666?text=Error+Imagen'">
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion ? producto.descripcion.substring(0, 80) + '...' : 'Sin descripción'}</p>
                    
                    <div class="product-price">${formatearPrecio(producto.precio)}</div>
                    
                    <div class="product-details">
                        <span class="product-stock ${tieneStock ? 'disponible' : 'agotado'}">
                            <i class="fas ${tieneStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${tieneStock ? `${producto.stock} disponibles` : 'Agotado'}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-add-cart" data-id="${producto.id}" 
                                ${!tieneStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                            ${tieneStock ? 'Agregar' : 'Agotado'}
                        </button>
                        <button class="btn-view-details" data-id="${producto.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Agregar event listeners a los botones recién creados
    agregarListenersProductos();
    
    console.log('✅ Productos renderizados');
}

function agregarListenersProductos() {
    const container = elementos.productContainer;
    if (!container) return;
    
    // Botones "Agregar al carrito"
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            agregarAlCarrito(id);
        });
    });
    
    // Botones "Ver detalles"
    container.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            verDetallesProducto(id);
        });
    });
}

// ========== FUNCIONES DEL CARRITO ==========
function agregarAlCarrito(productoId) {
    console.log(`🛒 Agregando producto ID ${productoId} al carrito`);
    
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto) {
        console.error('❌ Producto no encontrado');
        mostrarNotificacion('Producto no encontrado', 'error');
        return;
    }
    
    if (producto.stock === 0) {
        mostrarNotificacion('Producto agotado', 'error');
        return;
    }
    
    const itemIndex = carrito.findIndex(item => item.id === productoId);
    
    if (itemIndex > -1) {
        if (carrito[itemIndex].cantidad >= producto.stock) {
            mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'warning');
            return;
        }
        carrito[itemIndex].cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen_url,
            cantidad: 1,
            stock: producto.stock
        });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito`, 'success');
}

function actualizarCarrito() {
    console.log('🔄 Actualizando carrito...');
    
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (elementos.cartCount) {
        elementos.cartCount.textContent = totalItems;
    }
    
    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));
    console.log(`💾 Carrito guardado: ${totalItems} items`);
    
    // Actualizar vista si está abierta
    if (elementos.cartSidebar && elementos.cartSidebar.classList.contains('active')) {
        renderizarCarritoVista();
    }
}

function renderizarCarritoVista() {
    const container = elementos.cartItems;
    const totalElement = elementos.cartTotal;
    
    if (!container || !totalElement) return;
    
    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <p>Tu carrito está vacío</p>
                <p class="empty-cart-hint">Agrega productos desde el catálogo</p>
            </div>
        `;
        totalElement.textContent = '0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    carrito.forEach((item, index) => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;
        
        html += `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${item.imagen || 'https://via.placeholder.com/60/CCCCCC/666666?text=Prod'}" 
                         alt="${item.nombre}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p class="cart-item-price">${formatearPrecio(item.precio)} c/u</p>
                    <p class="cart-item-stock">Disponible: ${item.stock || '?'}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-minus" data-index="${index}">-</button>
                    <span class="qty-value">${item.cantidad}</span>
                    <button class="qty-plus" data-index="${index}">+</button>
                </div>
                <div class="cart-item-total">${formatearPrecio(itemTotal)}</div>
                <button class="cart-item-remove" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalElement.textContent = formatearPrecio(total);
    
    // Agregar event listeners a los botones del carrito
    agregarListenersCarrito();
}

function agregarListenersCarrito() {
    const container = elementos.cartItems;
    if (!container) return;
    
    // Botones de cantidad
    container.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            actualizarCantidad(index, -1);
        });
    });
    
    container.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            actualizarCantidad(index, 1);
        });
    });
    
    // Botones de eliminar
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            eliminarDelCarrito(index);
        });
    });
}

function actualizarCantidad(index, cambio) {
    if (index < 0 || index >= carrito.length) return;
    
    const nuevaCantidad = carrito[index].cantidad + cambio;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }
    
    // Verificar stock disponible
    const productoOriginal = productos.find(p => p.id === carrito[index].id);
    if (productoOriginal && nuevaCantidad > productoOriginal.stock) {
        mostrarNotificacion(`Solo hay ${productoOriginal.stock} unidades disponibles`, 'warning');
        return;
    }
    
    carrito[index].cantidad = nuevaCantidad;
    actualizarCarrito();
    renderizarCarritoVista();
}

function eliminarDelCarrito(index) {
    if (index < 0 || index >= carrito.length) return;
    
    const productoNombre = carrito[index].nombre;
    carrito.splice(index, 1);
    actualizarCarrito();
    renderizarCarritoVista();
    mostrarNotificacion(`"${productoNombre}" eliminado del carrito`, 'info');
}

// ========== FUNCIONES AUXILIARES ==========
function formatearPrecio(precio) {
    if (precio === undefined || precio === null) return '$0';
    
    try {
        // Convertir a número si es string
        const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
        
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precioNum);
    } catch (error) {
        console.error('Error formateando precio:', error);
        return `$${precio}`;
    }
}

function mostrarCargando(mostrar) {
    const container = elementos.productContainer;
    if (!container) return;
    
    if (mostrar) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Cargando productos...</p>
                <p class="loading-subtitle">Espera un momento por favor</p>
            </div>
        `;
    }
}

function mostrarErrorProductos(mensajeError = '') {
    const container = elementos.productContainer;
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle fa-3x"></i>
            <h3>Error al cargar los productos</h3>
            <p>No se pudieron cargar los productos. Intenta de nuevo más tarde.</p>
            ${mensajeError ? `<p class="error-detail">Error: ${mensajeError}</p>` : ''}
            <button class="btn-retry" id="retry-load-btn">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
    
    // Agregar event listener al botón de reintentar
    const retryBtn = document.getElementById('retry-load-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            cargarProductos(filtrosActuales);
        });
    }
}

function mostrarErrorInicial(mensaje) {
    const container = elementos.productContainer;
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-inicial">
            <i class="fas fa-exclamation-circle fa-4x"></i>
            <h2>Error de carga</h2>
            <p>${mensaje}</p>
            <p>Por favor, recarga la página o verifica tu conexión a internet.</p>
            <button class="btn-retry" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Recargar Página
            </button>
        </div>
    `;
}

function actualizarContadorResultados(count) {
    if (!elementos.resultsCount) return;
    
    elementos.resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

// ========== FUNCIONES DE UI ==========
function toggleMenu() {
    if (!elementos.navMenu) return;
    
    elementos.navMenu.classList.toggle('active');
    console.log('🍔 Menú ' + (elementos.navMenu.classList.contains('active') ? 'abierto' : 'cerrado'));
}

function toggleCart() {
    if (!elementos.cartSidebar || !elementos.cartOverlay) return;
    
    elementos.cartSidebar.classList.toggle('active');
    elementos.cartOverlay.classList.toggle('active');
    
    const estaAbierto = elementos.cartSidebar.classList.contains('active');
    console.log('🛒 Carrito ' + (estaAbierto ? 'abierto' : 'cerrado'));
    
    if (estaAbierto) {
        renderizarCarritoVista();
    }
}

async function buscarProductos(termino) {
    console.log('🔍 Buscando productos:', termino);
    
    if (!termino || termino.trim() === '') {
        await cargarProductos();
    } else {
        await cargarProductos({ ...filtrosActuales, busqueda: termino.trim() });
    }
}

async function verDetallesProducto(id) {
    console.log(`🔍 Viendo detalles del producto ID: ${id}`);
    
    try {
        const resultado = await DatabaseService.obtenerProductoPorId(id);
        
        if (!resultado.success) {
            throw new Error(resultado.error || 'Error al cargar detalles');
        }
        
        const producto = resultado.data;
        
        if (elementos.modalBody && elementos.productModal) {
            elementos.modalBody.innerHTML = `
                <div class="product-detail">
                    <div class="product-detail-image">
                        <img src="${producto.imagen_url || 'https://via.placeholder.com/400/CCCCCC/666666?text=Sin+Imagen'}" 
                             alt="${producto.nombre}"
                             onerror="this.src='https://via.placeholder.com/400/CCCCCC/666666?text=Error+Imagen'">
                    </div>
                    <div class="product-detail-content">
                        <h2>${producto.nombre}</h2>
                        <div class="product-detail-price">${formatearPrecio(producto.precio)}</div>
                        
                        <div class="product-detail-description">
                            <h3>Descripción</h3>
                            <p>${producto.descripcion || 'No hay descripción disponible para este producto.'}</p>
                        </div>
                        
                        <div class="product-detail-specs">
                            <div class="spec">
                                <i class="fas fa-box"></i>
                                <span>Stock: <strong>${producto.stock} unidades</strong></span>
                            </div>
                            <div class="spec">
                                <i class="fas fa-tag"></i>
                                <span>Categoría: <strong>${obtenerNombreCategoria(producto.categoria_id)}</strong></span>
                            </div>
                        </div>
                        
                        <button class="btn-buy" data-id="${producto.id}" 
                                ${producto.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                            ${producto.stock === 0 ? 'Producto Agotado' : 'Agregar al carrito'}
                        </button>
                    </div>
                </div>
            `;
            
            elementos.productModal.style.display = 'block';
            
            // Agregar event listener al botón del modal
            const buyBtn = elementos.modalBody.querySelector('.btn-buy');
            if (buyBtn) {
                buyBtn.addEventListener('click', () => {
                    agregarAlCarrito(producto.id);
                    cerrarModal();
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando detalles:', error);
        mostrarNotificacion('Error al cargar detalles del producto', 'error');
    }
}

function obtenerNombreCategoria(categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Desconocida';
}

function cerrarModal() {
    if (elementos.productModal) {
        elementos.productModal.style.display = 'none';
    }
}

function realizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'warning');
        return;
    }
    
    if (!usuario) {
        if (confirm('Debes iniciar sesión para realizar la compra. ¿Quieres ir a la página de inicio de sesión?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Calcular total
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (confirm(`¿Confirmas la compra de ${carrito.length} producto(s) por un total de ${formatearPrecio(total)}?`)) {
        // Aquí iría la lógica real de compra (conexión a Supabase)
        mostrarNotificacion('¡Compra realizada con éxito!', 'success');
        
        // Limpiar carrito
        carrito = [];
        actualizarCarrito();
        toggleCart();
        
        // Actualizar productos (reducir stock en una implementación real)
        console.log('✅ Compra simulada realizada');
    }
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        AuthService.logout();
    }
}

function filtrarProductos() {
    const categoria = elementos.filterCategory ? elementos.filterCategory.value : 'all';
    const precio = elementos.filterPrice ? elementos.filterPrice.value : 'all';
    
    console.log(`🎯 Aplicando filtros - Categoría: ${categoria}, Precio: ${precio}`);
    
    const filtros = {};
    
    if (categoria !== 'all') {
        filtros.categoria = categoria;
    }
    
    if (precio !== 'all') {
        filtros.precio = precio;
    }
    
    cargarProductos(filtros);
}

function filtrarPorCategoriaTexto(categoriaTexto) {
    console.log(`🎯 Filtrando por categoría texto: ${categoriaTexto}`);
    
    if (categoriaTexto === 'all') {
        if (elementos.filterCategory) {
            elementos.filterCategory.value = 'all';
        }
        if (elementos.filterPrice) {
            elementos.filterPrice.value = 'all';
        }
        cargarProductos();
        toggleMenu();
        return;
    }
    
    // Buscar categoría por nombre
    const categoria = categorias.find(c => 
        c.nombre.toLowerCase().includes(categoriaTexto.toLowerCase())
    );
    
    if (categoria && elementos.filterCategory) {
        elementos.filterCategory.value = categoria.id;
        filtrarProductos();
    } else {
        // Si no encuentra exacto, hacer búsqueda
        buscarProductos(categoriaTexto);
    }
    
    toggleMenu();
}

function mostrarFormularioProducto() {
    if (!usuario || usuario.rol_id !== 1) {
        mostrarNotificacion('No tienes permisos de administrador', 'error');
        return;
    }
    
    mostrarNotificacion('Panel de administración en desarrollo', 'info');
    // Aquí iría el formulario para agregar productos
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Eliminar notificaciones anteriores
    const notificacionesAnteriores = document.querySelectorAll('.notification');
    notificacionesAnteriores.forEach(n => n.remove());
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    
    // Icono según tipo
    let icono = 'info-circle';
    switch(tipo) {
        case 'success': icono = 'check-circle'; break;
        case 'error': icono = 'exclamation-circle'; break;
        case 'warning': icono = 'exclamation-triangle'; break;
    }
    
    notification.innerHTML = `
        <i class="fas fa-${icono}"></i>
        <span>${mensaje}</span>
    `;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#4CAF50' : 
                     tipo === 'error' ? '#f44336' : 
                     tipo === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: notificationSlideIn 0.3s ease;
        max-width: 400px;
        font-size: 14px;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#notification-animation')) {
        const style = document.createElement('style');
        style.id = 'notification-animation';
        style.textContent = `
            @keyframes notificationSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes notificationSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'notificationSlideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    console.log(`📢 Notificación: ${mensaje} (${tipo})`);
}

// ========== INICIALIZACIÓN ==========
// Esperar a que el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM completamente cargado, iniciando aplicación...');
        initApp();
    });
} else {
    console.log('📄 DOM ya está cargado, iniciando aplicación...');
    initApp();
}

// Hacer algunas funciones disponibles globalmente para depuración
window.debugApp = {
    recargarProductos: () => cargarProductos(filtrosActuales),
    verCarrito: () => console.log('Carrito:', carrito),
    verProductos: () => console.log('Productos:', productos),
    verCategorias: () => console.log('Categorías:', categorias),
    limpiarCarrito: () => {
        carrito = [];
        actualizarCarrito();
        console.log('Carrito limpiado');
    }
};

console.log('✅ Script proyecto.js cargado');