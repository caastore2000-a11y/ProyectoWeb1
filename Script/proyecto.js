// Script/proyecto.js - TODA LA LÓGICA AQUÍ

console.log('🛒 Cargando CaseStore...');

// ========== VARIABLES GLOBALES ==========
let productos = [];
let categorias = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let temaActual = localStorage.getItem('theme') || 'light';
const LANGUAGES = {
    es: {
        search_placeholder: "Buscar productos...",
        all_categories: "Todas las categorías",
        results_zero: "No se encontraron productos",
        results_one: "producto encontrado",
        results_many: "productos encontrados",
        add: "Agregar",
        view: "Ver",
        out_stock: "Agotado",
        available: "disponibles",
        cart_empty: "Tu carrito está vacío",
        continue: "Continuar comprando",
        buy_success: "¡Compra realizada con éxito!",
        login_required: "Debes iniciar sesión para comprar",
        loading: "Cargando productos..."
    },
    en: {
        search_placeholder: "Search products...",
        all_categories: "All categories",
        results_zero: "No products found",
        results_one: "product found",
        results_many: "products found",
        add: "Add",
        view: "View",
        out_stock: "Out of stock",
        available: "available",
        cart_empty: "Your cart is empty",
        continue: "Continue shopping",
        buy_success: "Purchase completed successfully!",
        login_required: "You must log in to purchase",
        loading: "Loading products..."
    }
};

let currentLanguage = localStorage.getItem("language") || "es";

// ========== DATABASE SERVICE ==========
const DatabaseService = {
    // ========== PRODUCTOS ==========
    productos: {
        async obtenerTodos(filtros = {}) {
            try {
                console.log('📦 Obteniendo productos...');
                
                let query = window.supabase.from('productos').select('*');
                
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
                const { data, error } = await window.supabase
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
                
                const { data, error } = await window.supabase
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

// ========== AUTH SERVICE ==========
const AuthService = {
    obtenerUsuarioLocal() {
        try {
            const usuarioStr = localStorage.getItem('usuario');
            return usuarioStr ? JSON.parse(usuarioStr) : null;
        } catch (error) {
            console.error('Error obteniendo usuario local:', error);
            return null;
        }
    },
    
    guardarSesion(usuario) {
    try {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('user_role', usuario.rol_id); 
        console.log('✅ Sesión guardada con rol:', usuario.rol_id);
    } catch (error) {
        console.error('Error guardando sesión:', error);
    }
},
    
    async logout() {
        try {
            localStorage.removeItem('usuario');
            localStorage.removeItem('user_role');
            
            if (window.supabase && window.supabase.auth) {
                await window.supabase.auth.signOut();
            }
            
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    },
    
    estaAutenticado() {
        return !!this.obtenerUsuarioLocal();
    }
};
// ========== TEMA CLARO / OSCURO ==========
function aplicarTemaInicial() {
    if (temaActual === 'dark') {
        document.body.classList.add('dark-theme');
        actualizarIconoTema(true);
    }
}

function toggleTema() {
    document.body.classList.toggle('dark-theme');
    const esOscuro = document.body.classList.contains('dark-theme');

    temaActual = esOscuro ? 'dark' : 'light';
    localStorage.setItem('theme', temaActual);

    actualizarIconoTema(esOscuro);
}

function actualizarIconoTema(esOscuro) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;

    icon.textContent = esOscuro ? 'light_mode' : 'dark_mode';
}


// ========== FUNCIONES PRINCIPALES ==========
async function initApp() {
    console.log('🚀 Inicializando aplicación...');
    
    try {
        // Configurar event listeners
        configurarEventListeners();
        
        // 1. Verificar autenticación
        verificarAutenticacion();
        
        // 2. Cargar categorías
        await cargarCategorias();
        
        // 3. Cargar productos
        await cargarProductos();
        
        // 4. Actualizar carrito
        actualizarCarrito();
        
        console.log('✅ Aplicación lista');
        
    } catch (error) {
        console.error('❌ Error inicializando:', error);
        mostrarError('Error al cargar la aplicación');
    }
}

function configurarEventListeners() {
    // Menú
    document.querySelector('.menu-btn').addEventListener('click', toggleMenu);
    document.querySelector('.close-btn').addEventListener('click', toggleMenu);
    
    // Carrito
    document.querySelector('.cart-icon').addEventListener('click', toggleCart);
    document.querySelector('.close-cart').addEventListener('click', toggleCart);
    document.querySelector('.cart-overlay').addEventListener('click', toggleCart);
    
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            buscarProductos(this.value);
        }
    });
    
    searchButton.addEventListener('click', function() {
        buscarProductos(searchInput.value);
    });
    
    // Filtros
    document.getElementById('filter-category').addEventListener('change', filtrarProductos);
    document.getElementById('filter-price').addEventListener('change', filtrarProductos);
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    // Comprar
    document.getElementById('checkout-btn').addEventListener('click', realizarCompra);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
    
    // Admin
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', mostrarFormularioProducto);
    }
    
    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', guardarProducto);
    }
    const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
    themeBtn.addEventListener('click', toggleTema);
}
}

function verificarAutenticacion() {
    const usuario = AuthService.obtenerUsuarioLocal();
    
    if (usuario) {
        document.getElementById('user-name').textContent = usuario.nombre;
        document.getElementById('login-link').style.display = 'none';
        document.getElementById('register-link').style.display = 'none';
        document.getElementById('btn-logout').style.display = 'inline-block';
        
        if (usuario.rol_id === 1) {
            document.getElementById('admin-panel').style.display = 'block';
        }
    } else {
        document.getElementById('btn-logout').style.display = 'none';
    }
}

async function cargarCategorias() {
    try {
        const resultado = await DatabaseService.categorias.obtenerTodas();
        
        if (resultado.success) {
            categorias = resultado.data;
            actualizarFiltroCategorias();
            console.log(`✅ ${categorias.length} categorías cargadas`);
        } else {
            console.warn('No se pudieron cargar categorías:', resultado.error);
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

function actualizarFiltroCategorias() {
    const select = document.getElementById('filter-category');
    if (!select) return;
    
    select.innerHTML = '<option value="all">Todas las categorías</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        select.appendChild(option);
    });
}

async function cargarProductos(filtros = {}) {
    try {
        mostrarCargando(true);
        
        const resultado = await DatabaseService.productos.obtenerTodos(filtros);
        
        if (resultado.success) {
            productos = resultado.data;
            renderizarProductos();
            actualizarContadorResultados(productos.length);
            console.log(`✅ ${productos.length} productos cargados`);
        } else {
            throw new Error(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarErrorProductos(error.message);
    } finally {
        mostrarCargando(false);
    }
}

function renderizarProductos() {
    const container = document.getElementById('product-container');
    
    if (!container) {
        console.error('Contenedor de productos no encontrado');
        return;
    }
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>No hay productos disponibles</h3>
                <p>Intenta con otros filtros o vuelve más tarde</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    productos.forEach(producto => {
        const tieneStock = producto.stock > 0;
        const stockBajo = producto.stock <= 5 && producto.stock > 0;
        
        html += `
            <div class="product-card" data-id="${producto.id}">
                ${stockBajo ? '<span class="product-badge">¡Últimas unidades!</span>' : ''}
                
                <div class="product-image">
                    <img src="${producto.imagen_url || 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Producto'}" 
                    data-hover="${producto.imagen_hover_url || producto.imagen_url}"     
                    alt="${producto.nombre}"
                    class="product-img"
                         onerror="this.src='https://via.placeholder.com/300x200/CCCCCC/666666?text=Imagen+No+Disponible'">
                         </div>
                

                
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion || 'Sin descripción disponible'}</p>
                    
                    <div class="product-price">${formatearPrecio(producto.precio)}</div>
                    
                    <div class="product-details">
                        <span class="product-stock ${tieneStock ? 'disponible' : 'agotado'}">
                            ${tieneStock ? `${producto.stock} disponibles` : 'AGOTADO'}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-add-cart" data-id="${producto.id}" ${!tieneStock ? 'disabled' : ''}>
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
    
    // Agregar event listeners a los botones
    container.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productoId = parseInt(this.dataset.id);
            agregarAlCarrito(productoId);
        });
    });
    
    container.querySelectorAll('.btn-view-details').forEach(button => {
        button.addEventListener('click', function() {
            const productoId = parseInt(this.dataset.id);
            verDetallesProducto(productoId);
        });
    });
}

// ========== FUNCIONES DEL CARRITO ==========
function agregarAlCarrito(productoId) {
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto || producto.stock === 0) {
        mostrarNotificacion('Este producto no está disponible', 'error');
        return;
    }
    
    const itemIndex = carrito.findIndex(item => item.id === productoId);
    
    if (itemIndex > -1) {
        if (carrito[itemIndex].cantidad >= producto.stock) {
            mostrarNotificacion(`Solo quedan ${producto.stock} unidades disponibles`, 'warning');
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
    mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
}

function actualizarCarrito() {
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('cart-count').textContent = totalItems;
    
    // Guardar en localStorage
    try {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    } catch (error) {
        console.warn('Error guardando carrito en localStorage:', error);
    }
    
    // Actualizar vista del carrito si está abierto
    if (document.getElementById('cart-sidebar').classList.contains('active')) {
        renderizarCarritoVista();
    }
}

function renderizarCarritoVista() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (!container || !totalElement) return;
    
    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <p>Tu carrito está vacío</p>
                <button class="btn-continue" onclick="toggleCart()">Continuar comprando</button>
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
                <img src="${item.imagen || 'https://via.placeholder.com/60x60/CCCCCC/666666?text=Prod'}" 
                     alt="${item.nombre}"
                     onerror="this.src='https://via.placeholder.com/60x60/CCCCCC/666666?text=Img'">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>${formatearPrecio(item.precio)} c/u</p>
                </div>
                <div class="cart-item-quantity">
                    <button data-index="${index}" data-change="-1" class="btn-quantity">-</button>
                    <span>${item.cantidad}</span>
                    <button data-index="${index}" data-change="1" class="btn-quantity">+</button>
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
    container.querySelectorAll('.btn-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const change = parseInt(this.dataset.change);
            actualizarCantidad(index, change);
        });
    });
    
    container.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
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
}

function eliminarDelCarrito(index) {
    const productoNombre = carrito[index].nombre;
    carrito.splice(index, 1);
    actualizarCarrito();
    mostrarNotificacion(`${productoNombre} eliminado del carrito`, 'info');
}

// ========== FUNCIONES DE UI ==========
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.toggle('active');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    if (!cartSidebar || !cartOverlay) return;
    
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    
    if (cartSidebar.classList.contains('active')) {
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
        const resultado = await DatabaseService.productos.obtenerPorId(id);
        
        if (!resultado.success) throw new Error(resultado.error);
        
        const producto = resultado.data;
        const modalBody = document.getElementById('modal-body');
        const modal = document.getElementById('product-modal');
        
        modalBody.innerHTML = `
            <div class="product-detail">
                <img src="${producto.imagen_url || 'https://via.placeholder.com/400x300/CCCCCC/666666?text=Producto'}" 
                     alt="${producto.nombre}"
                     onerror="this.src='https://via.placeholder.com/400x300/CCCCCC/666666?text=Imagen+No+Disponible'">
                <h2>${producto.nombre}</h2>
                <p class="description">${producto.descripcion || 'Sin descripción disponible'}</p>
                <div class="price">${formatearPrecio(producto.precio)}</div>
                <p class="stock ${producto.stock > 0 ? 'disponible' : 'agotado'}">
                    Stock: ${producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'AGOTADO'}
                </p>
                <button class="btn-buy" data-id="${producto.id}" ${producto.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                    ${producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                </button>
            </div>
        `;
        
        modal.showModal();
        
        // Agregar event listener al botón
        modalBody.querySelector('.btn-buy').addEventListener('click', function() {
            const productoId = parseInt(this.dataset.id);
            agregarAlCarrito(productoId);
            cerrarModal();
        });
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        mostrarNotificacion('Error al cargar los detalles del producto', 'error');
    }
}

function cerrarModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.close();
}

function realizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'warning');
        return;
    }
    
    if (!AuthService.estaAutenticado()) {
        mostrarNotificacion('Debes iniciar sesión para comprar', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Simular compra
    mostrarNotificacion('¡Compra realizada con éxito!', 'success');
    carrito = [];
    actualizarCarrito();
    toggleCart();
}

function logout() {
    AuthService.logout();
}

function filtrarProductos() {
    const categoria = document.getElementById('filter-category').value;
    const precio = document.getElementById('filter-price').value;
    
    const filtros = {};
    
    if (categoria !== 'all') {
        filtros.categoria = categoria;
    }
    
    cargarProductos(filtros);
}

function mostrarFormularioProducto() {
    const modal = document.getElementById('add-product-modal');
    modal.showModal();
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const form = e.target;
    const productoData = {
        nombre: document.getElementById('product-name').value,
        descripcion: document.getElementById('product-desc').value,
        precio: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        categoria_id: parseInt(document.getElementById('product-category').value),
        imagen_url: document.getElementById('product-image').value || null
    };
    
    try {
        // Aquí implementarías la creación del producto
        mostrarNotificacion('Producto guardado correctamente', 'success');
        form.reset();
        document.getElementById('add-product-modal').close();
        
        // Recargar productos
        await cargarProductos();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarNotificacion('Error al guardar el producto', 'error');
    }
}

// ========== FUNCIONES AUXILIARES ==========
function formatearPrecio(precio) {
    if (!precio) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precio);
}

function mostrarCargando(mostrar) {
    const container = document.getElementById('product-container');
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

function mostrarErrorProductos(mensaje) {
    const container = document.getElementById('product-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <h3>Error al cargar productos</h3>
            <p>${mensaje || 'No se pudieron cargar los productos'}</p>
            <div class="error-actions">
                <button id="retry-btn" class="btn-retry">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        </div>
    `;
    
    // Agregar event listener al botón de reintentar
    document.getElementById('retry-btn').addEventListener('click', cargarProductos);
}

function mostrarError(mensaje) {
    const container = document.getElementById('product-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <h3>${mensaje}</h3>
            <button id="reload-btn">Reintentar</button>
        </div>
    `;
    
    document.getElementById('reload-btn').addEventListener('click', () => location.reload());
}

function actualizarContadorResultados(count) {
    const element = document.getElementById('results-count');
    if (!element) return;
    
    if (count === 0) {
        element.textContent = 'No se encontraron productos';
    } else {
        element.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    document.addEventListener('mouseover', e => {
    const img = e.target.closest('.product-img');
    if (!img || !img.dataset.hover) return;

    img.dataset.original = img.src;
    img.src = img.dataset.hover;
});

document.addEventListener('mouseout', e => {
    const img = e.target.closest('.product-img');
    if (!img || !img.dataset.original) return;

    img.src = img.dataset.original;
});

   

}

// ========== INICIALIZACIÓN ==========
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Hacer funciones disponibles globalmente si es necesario
window.toggleMenu = toggleMenu;
window.toggleCart = toggleCart;
window.cerrarModal = cerrarModal;

console.log('✅ Script de proyecto cargado');