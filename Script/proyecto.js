// ========== CONFIGURACIÓN SUPABASE ==========
const SUPABASE_URL = 'https://tyitfffjbttftznadtrm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXRmZmZqYnR0ZnR6bmFkdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzY1NDgsImV4cCI6MjA4MDk1MjU0OH0.UFw3kX6ay-hlYt-fALgu0wOOworkTIJTWcPX0CnUBqo';

// ========== VARIABLES GLOBALES ==========
let supabase = null;
let productos = [];
let categorias = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let usuario = null;

// ========== ELEMENTOS DEL DOM ==========
const elementos = {
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
    addProductBtn: document.getElementById('add-product-btn')
};

// ========== DATABASE SERVICE ==========
const DatabaseService = {
    // Obtener todos los productos
    async obtenerProductos(filtros = {}) {
        try {
            let query = supabase.from('productos').select('*');
            
            if (filtros.categoria && filtros.categoria !== 'all') {
                query = query.eq('categoria_id', filtros.categoria);
            }
            
            if (filtros.busqueda) {
                query = query.or(`nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            return { success: false, error: error.message, data: [] };
        }
    },
    
    // Obtener categorías
    async obtenerCategorias() {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .order('nombre');
            
            if (error) throw error;
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return { success: false, error: error.message, data: [] };
        }
    },
    
    // Obtener producto por ID
    async obtenerProductoPorId(id) {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
            
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            return { success: false, error: error.message };
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
            return null;
        }
    },
    
    // Guardar usuario en localStorage
    guardarSesion(usuario) {
        try {
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('user_role', usuario.rol_id);
        } catch (error) {
            console.error('Error guardando sesión:', error);
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
        // 1. Inicializar Supabase
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase inicializado');
        
        // 2. Configurar event listeners
        configurarEventListeners();
        
        // 3. Verificar autenticación
        verificarAutenticacion();
        
        // 4. Cargar categorías
        await cargarCategorias();
        
        // 5. Cargar productos
        await cargarProductos();
        
        // 6. Actualizar carrito
        actualizarCarrito();
        
        console.log('✅ Aplicación lista');
        
    } catch (error) {
        console.error('❌ Error inicializando:', error);
        mostrarError('Error al cargar la aplicación');
    }
}

function configurarEventListeners() {
    // Menú
    elementos.menuBtn?.addEventListener('click', toggleMenu);
    elementos.closeMenuBtn?.addEventListener('click', toggleMenu);
    
    // Carrito
    elementos.cartIcon?.addEventListener('click', toggleCart);
    elementos.closeCartBtn?.addEventListener('click', toggleCart);
    elementos.cartOverlay?.addEventListener('click', toggleCart);
    elementos.checkoutBtn?.addEventListener('click', realizarCompra);
    
    // Búsqueda
    elementos.searchBtn?.addEventListener('click', () => {
        buscarProductos(elementos.searchInput?.value);
    });
    
    elementos.searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            buscarProductos(elementos.searchInput.value);
        }
    });
    
    // Filtros
    elementos.filterCategory?.addEventListener('change', filtrarProductos);
    elementos.filterPrice?.addEventListener('change', filtrarProductos);
    
    // Filtros rápidos del menú
    elementos.filterAll?.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts('todos');
    });
    
    elementos.filterPhones?.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts('celulares');
    });
    
    elementos.filterComputers?.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts('computadores');
    });
    
    elementos.filterHeadphones?.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts('audifonos');
    });
    
    // Modal
    elementos.closeModalBtn?.addEventListener('click', cerrarModal);
    
    // Logout
    elementos.btnLogout?.addEventListener('click', logout);
    
    // Admin
    elementos.addProductBtn?.addEventListener('click', mostrarFormularioProducto);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === elementos.productModal) {
            cerrarModal();
        }
    });
}

function verificarAutenticacion() {
    usuario = AuthService.obtenerUsuarioLocal();
    
    if (usuario) {
        elementos.userName.textContent = usuario.nombre;
        elementos.loginLink.style.display = 'none';
        elementos.registerLink.style.display = 'none';
        elementos.btnLogout.style.display = 'inline-block';
        
        if (usuario.rol_id === 1) {
            elementos.adminPanel.style.display = 'block';
        }
    }
}

async function cargarCategorias() {
    try {
        const resultado = await DatabaseService.obtenerCategorias();
        
        if (resultado.success) {
            categorias = resultado.data;
            
            // Actualizar filtro de categorías
            const select = elementos.filterCategory;
            select.innerHTML = '<option value="all">Todas las categorías</option>';
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                select.appendChild(option);
            });
            
            console.log(`✅ ${categorias.length} categorías cargadas`);
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarProductos(filtros = {}) {
    try {
        mostrarCargando(true);
        
        const resultado = await DatabaseService.obtenerProductos(filtros);
        
        if (resultado.success) {
            productos = resultado.data;
            renderizarProductos();
            actualizarContadorResultados(productos.length);
        } else {
            throw new Error(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarErrorProductos();
    } finally {
        mostrarCargando(false);
    }
}

function renderizarProductos() {
    const container = elementos.productContainer;
    
    if (!container) return;
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>No hay productos disponibles</h3>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    productos.forEach(producto => {
        const tieneStock = producto.stock > 0;
        
        html += `
            <div class="product-card" data-id="${producto.id}">
                ${producto.stock <= 5 ? '<span class="product-badge">¡Últimas unidades!</span>' : ''}
                
                <div class="product-image">
                    <img src="${producto.imagen_url || 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Producto'}" 
                         alt="${producto.nombre}">
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion || 'Sin descripción'}</p>
                    
                    <div class="product-price">${formatearPrecio(producto.precio)}</div>
                    
                    <div class="product-details">
                        <span class="product-stock ${tieneStock ? 'disponible' : 'agotado'}">
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
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            agregarAlCarrito(id);
        });
    });
    
    container.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            verDetallesProducto(id);
        });
    });
}

// ========== FUNCIONES DEL CARRITO ==========
function agregarAlCarrito(productoId) {
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto || producto.stock === 0) {
        mostrarNotificacion('Producto no disponible', 'error');
        return;
    }
    
    const itemIndex = carrito.findIndex(item => item.id === productoId);
    
    if (itemIndex > -1) {
        if (carrito[itemIndex].cantidad >= producto.stock) {
            mostrarNotificacion(`Solo hay ${producto.stock} unidades`, 'warning');
            return;
        }
        carrito[itemIndex].cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen_url,
            cantidad: 1
        });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`${producto.nombre} agregado`, 'success');
}

function actualizarCarrito() {
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    elementos.cartCount.textContent = totalItems;
    
    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Actualizar vista si está abierta
    if (elementos.cartSidebar.classList.contains('active')) {
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
            <div class="cart-item">
                <img src="${item.imagen || 'https://via.placeholder.com/60'}" 
                     alt="${item.nombre}">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>${formatearPrecio(item.precio)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button data-index="${index}" data-change="-1">-</button>
                    <span>${item.cantidad}</span>
                    <button data-index="${index}" data-change="1">+</button>
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
    container.querySelectorAll('.cart-item-quantity button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const change = parseInt(e.target.dataset.change);
            actualizarCantidad(index, change);
        });
    });
    
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            eliminarDelCarrito(index);
        });
    });
}

function actualizarCantidad(index, cambio) {
    const nuevaCantidad = carrito[index].cantidad + cambio;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }
    
    carrito[index].cantidad = nuevaCantidad;
    actualizarCarrito();
    renderizarCarritoVista();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    renderizarCarritoVista();
    mostrarNotificacion('Producto eliminado', 'info');
}

// ========== FUNCIONES AUXILIARES ==========
function formatearPrecio(precio) {
    if (!precio) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precio).replace('COP', '$').trim();
}

function mostrarCargando(mostrar) {
    const container = elementos.productContainer;
    if (!container) return;
    
    if (mostrar) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Cargando productos...</p>
            </div>
        `;
    }
}

function mostrarErrorProductos() {
    const container = elementos.productContainer;
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <h3>Error al cargar los productos</h3>
            <p>No se pudieron cargar los productos. Verifica tu conexión.</p>
            <button id="retry-btn" class="btn-retry">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
    
    // Agregar event listener al botón de reintentar
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', cargarProductos);
    }
}

function actualizarContadorResultados(count) {
    const element = elementos.resultsCount;
    if (!element) return;
    
    element.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

// ========== FUNCIONES DE UI ==========
function toggleMenu() {
    elementos.navMenu.classList.toggle('active');
}

function toggleCart() {
    elementos.cartSidebar.classList.toggle('active');
    elementos.cartOverlay.classList.toggle('active');
    
    if (elementos.cartSidebar.classList.contains('active')) {
        renderizarCarritoVista();
    }
}

async function buscarProductos(termino) {
    if (!termino || termino.trim() === '') {
        await cargarProductos();
    } else {
        await cargarProductos({ busqueda: termino.trim() });
    }
}

async function verDetallesProducto(id) {
    try {
        const resultado = await DatabaseService.obtenerProductoPorId(id);
        
        if (!resultado.success) throw new Error(resultado.error);
        
        const producto = resultado.data;
        const modalBody = elementos.modalBody;
        const modal = elementos.productModal;
        
        modalBody.innerHTML = `
            <div class="product-detail">
                <img src="${producto.imagen_url || 'https://via.placeholder.com/400'}" 
                     alt="${producto.nombre}">
                <h2>${producto.nombre}</h2>
                <p class="description">${producto.descripcion || 'Sin descripción'}</p>
                <div class="price">${formatearPrecio(producto.precio)}</div>
                <p class="stock">Stock: ${producto.stock} unidades</p>
                <button class="btn-buy" data-id="${producto.id}" 
                        ${producto.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                    ${producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Agregar event listener al botón del modal
        const buyBtn = modalBody.querySelector('.btn-buy');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                agregarAlCarrito(producto.id);
                cerrarModal();
            });
        }
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        mostrarNotificacion('Error al cargar detalles', 'error');
    }
}

function cerrarModal() {
    elementos.productModal.style.display = 'none';
}

function realizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'warning');
        return;
    }
    
    if (!usuario) {
        alert('Debes iniciar sesión para comprar');
        window.location.href = 'login.html';
        return;
    }
    
    if (confirm('¿Confirmas la compra de los productos en tu carrito?')) {
        alert('¡Compra realizada con éxito!');
        carrito = [];
        actualizarCarrito();
        toggleCart();
        mostrarNotificacion('Compra realizada con éxito', 'success');
    }
}

function logout() {
    AuthService.logout();
}

function filtrarProductos() {
    const categoria = elementos.filterCategory.value;
    const precio = elementos.filterPrice.value;
    const filtros = {};
    
    if (categoria !== 'all') {
        filtros.categoria = categoria;
    }
    
    // Filtrar por precio en el cliente (por simplicidad)
    if (precio !== 'all') {
        // Este filtro se aplicará después de cargar todos los productos
        // Para una implementación real, debería hacerse en el servidor
        cargarProductos(filtros).then(() => {
            if (precio === 'low') {
                productos = productos.filter(p => p.precio < 500000);
            } else if (precio === 'medium') {
                productos = productos.filter(p => p.precio >= 500000 && p.precio <= 2000000);
            } else if (precio === 'high') {
                productos = productos.filter(p => p.precio > 2000000);
            }
            renderizarProductos();
            actualizarContadorResultados(productos.length);
        });
        return;
    }
    
    cargarProductos(filtros);
}

function filterProducts(categoriaTexto) {
    // Mapear texto a IDs de categoría (esto es temporal)
    // En una implementación real, buscarías el ID en las categorías cargadas
    let categoriaId = 'all';
    
    if (categoriaTexto === 'celulares') {
        // Buscar ID de celulares en las categorías
        const categoria = categorias.find(c => c.nombre.toLowerCase().includes('celular'));
        if (categoria) categoriaId = categoria.id;
    } else if (categoriaTexto === 'computadores') {
        const categoria = categorias.find(c => c.nombre.toLowerCase().includes('computador'));
        if (categoria) categoriaId = categoria.id;
    } else if (categoriaTexto === 'audifonos') {
        const categoria = categorias.find(c => c.nombre.toLowerCase().includes('audífono') || c.nombre.toLowerCase().includes('audifono'));
        if (categoria) categoriaId = categoria.id;
    }
    
    elementos.filterCategory.value = categoriaId;
    filtrarProductos();
    toggleMenu(); // Cerrar menú después de seleccionar
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Eliminar notificaciones anteriores
    const notificacionesAnteriores = document.querySelectorAll('.notification');
    notificacionesAnteriores.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    
    const icon = tipo === 'success' ? 'check-circle' : 
                 tipo === 'error' ? 'exclamation-circle' : 
                 tipo === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${mensaje}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#4CAF50' : 
                     tipo === 'error' ? '#f44336' : 
                     tipo === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function mostrarFormularioProducto() {
    mostrarNotificacion('Función de agregar producto en desarrollo', 'info');
}

function mostrarError(mensaje) {
    alert(`Error: ${mensaje}`);
}

// ========== INICIALIZACIÓN ==========
// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exportar funciones globalmente (si es necesario)
window.agregarAlCarrito = agregarAlCarrito;
window.verDetallesProducto = verDetallesProducto;
window.buscarProductos = buscarProductos;
window.filtrarProductos = filtrarProductos;
window.toggleMenu = toggleMenu;
window.toggleCart = toggleCart;