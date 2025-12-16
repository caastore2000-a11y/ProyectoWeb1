// Script/admin-main.js - VERSIÓN SIN MÓDULOS

console.log('🛠️ Admin Main cargando...');

// Variables globales
let currentUser = null;
let charts = {};
let currentProducts = [];
let currentUsers = [];
let currentCategories = [];

// ========== INICIALIZACIÓN ==========
async function initAdminPanel() {
    console.log('🚀 Iniciando Panel de Administración...');
    
    try {
        // Verificar autenticación
        const usuarioStr = localStorage.getItem('usuario');
        
        if (!usuarioStr) {
            alert('Debes iniciar sesión para acceder al panel de administración');
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = JSON.parse(usuarioStr);
        
        // Verificar que sea administrador
        if (currentUser.rol_id !== 1) {
            alert('No tienes permisos para acceder al panel de administración');
            window.location.href = 'proyecto.html';
            return;
        }
        
        console.log('✅ Usuario autorizado:', currentUser.nombre);
        
        // Configurar UI
        setupUI();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log('✅ Panel de administración listo');
        
    } catch (error) {
        console.error('❌ Error inicializando panel:', error);
        showNotification('Error al cargar el panel de administración', 'error');
    }
}

// ========== CONFIGURACIÓN UI ==========
function setupUI() {
    // Mostrar información del usuario
    const userNameElement = document.getElementById('user-name');
    const welcomeMessage = document.getElementById('welcome-message');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.nombre;
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;
    }
    
    // Configurar navegación activa
    setupActiveNav();
}

// ========== CARGA DE DATOS ==========
async function loadInitialData() {
    showLoading(true);
    
    try {
        // Cargar estadísticas
        if (window.AdminService) {
            const stats = await window.AdminService.getDashboardStats();
            if (stats.success) {
                updateDashboardStats(stats.data);
            }
        }
        
        // Cargar productos
        await loadProducts();
        
        // Cargar usuarios
        await loadUsers();
        
        // Cargar categorías
        await loadCategories();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error al cargar los datos', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProducts(filters = {}) {
    try {
        if (!window.AdminService) {
            throw new Error('AdminService no disponible');
        }
        
        const result = await window.AdminService.getAllProducts(filters);
        
        if (result.success) {
            currentProducts = result.data;
            renderProductsTable(currentProducts);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        showNotification('Error al cargar los productos', 'error');
    }
}

async function loadUsers() {
    try {
        if (!window.AdminService) {
            throw new Error('AdminService no disponible');
        }
        
        const result = await window.AdminService.getAllUsers();
        
        if (result.success) {
            currentUsers = result.data;
            renderUsersTable(currentUsers);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showNotification('Error al cargar los usuarios', 'error');
    }
}

async function loadCategories() {
    try {
        if (!window.AdminService) {
            throw new Error('AdminService no disponible');
        }
        
        const result = await window.AdminService.getAllCategories();
        
        if (result.success) {
            currentCategories = result.data;
            renderCategoriesGrid(currentCategories);
            populateCategorySelects();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        showNotification('Error al cargar las categorías', 'error');
    }
}

// ========== RENDERIZADO ==========
function renderProductsTable(products) {
    const tbody = document.getElementById('products-body');
    
    if (!tbody) return;
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-box-open fa-2x"></i>
                        <p>No hay productos registrados</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const stockClass = product.stock > 10 ? 'success' : 
                          product.stock > 0 ? 'warning' : 'danger';
        
        html += `
            <tr>
                <td>${product.id}</td>
                <td>
                    <img src="${product.imagen_url || 'https://via.placeholder.com/50'}" 
                         alt="${product.nombre}"
                         class="product-thumbnail">
                </td>
                <td>
                    <strong>${product.nombre}</strong>
                    <small class="text-muted d-block">${product.descripcion?.substring(0, 50) || 'Sin descripción'}...</small>
                </td>
                <td>${product.categoria_id}</td>
                <td>${formatCurrency(product.precio)}</td>
                <td>
                    <span class="badge badge-${stockClass}">
                        ${product.stock} unidades
                    </span>
                </td>
                <td>
                    <span class="badge badge-success">Activo</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editProduct(${product.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon btn-view" onclick="viewProduct(${product.id})" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-body');
    
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-users fa-2x"></i>
                        <p>No hay usuarios registrados</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    users.forEach(user => {
        const roleName = window.AdminService ? window.AdminService.getRoleName(user.rol_id) : 'Usuario';
        
        html += `
            <tr>
                <td>${user.id.substring(0, 8)}...</td>
                <td>
                    <strong>${user.nombre}</strong>
                    <small class="text-muted d-block">${user.email}</small>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge badge-primary">
                        ${roleName}
                    </span>
                </td>
                <td>${new Date(user.creado_en).toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="badge badge-success">Activo</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function renderCategoriesGrid(categories) {
    const grid = document.getElementById('categories-grid');
    
    if (!grid) return;
    
    if (!categories || categories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state full-width">
                <i class="fas fa-tags fa-2x"></i>
                <p>No hay categorías registradas</p>
                <button class="btn btn-primary" onclick="showCategoryModal()">
                    <i class="fas fa-plus"></i> Crear primera categoría
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    categories.forEach(category => {
        html += `
            <div class="category-card" onclick="editCategory(${category.id})">
                <div class="category-icon">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="category-name">${category.nombre}</div>
                <div class="category-actions">
                    <button class="btn-icon btn-edit" onclick="editCategory(${category.id}, event)" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteCategory(${category.id}, event)" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// ========== FUNCIONES AUXILIARES ==========
function formatCurrency(amount) {
    if (!amount) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function updateDashboardStats(stats) {
    // Productos
    const totalProducts = document.getElementById('total-products');
    if (totalProducts) totalProducts.textContent = stats.totalProductos;
    
    // Usuarios
    const totalUsers = document.getElementById('total-users');
    if (totalUsers) totalUsers.textContent = stats.totalUsuarios;
    
    // Actualizar productos con stock bajo
    updateLowStockTable(stats.productosBajoStock);
}

function updateLowStockTable(lowStockCount) {
    const body = document.getElementById('low-stock-body');
    
    if (!body) return;
    
    if (lowStockCount === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-check-circle fa-2x"></i>
                        <p>Todos los productos tienen stock suficiente</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
}

function populateCategorySelects() {
    const selects = document.querySelectorAll('#product-category, #category-filter');
    
    selects.forEach(select => {
        if (!select) return;
        
        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar categorías
        currentCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.nombre;
            select.appendChild(option);
        });
    });
}

function setupActiveNav() {
    // Por defecto, dashboard está activo
    showSection('dashboard');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========== FUNCIONES DE NAVEGACIÓN ==========
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-links a[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Actualizar título
    updatePageTitle(getSectionTitle(sectionId));
}

function getSectionTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Productos',
        'users': 'Usuarios',
        'categories': 'Categorías',
        'orders': 'Órdenes',
        'analytics': 'Analítica',
        'settings': 'Configuración'
    };
    
    return titles[sectionId] || 'Panel de Administración';
}

function updatePageTitle(title) {
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ========== FUNCIONES DE MODALES ==========
function showProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    
    if (!modal || !title) return;
    
    if (productId) {
        title.textContent = 'Editar Producto';
        const product = currentProducts.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('product-name').value = product.nombre;
            document.getElementById('product-description').value = product.descripcion || '';
            document.getElementById('product-price').value = product.precio;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-category').value = product.categoria_id;
            document.getElementById('product-image').value = product.imagen_url || '';
        }
    } else {
        title.textContent = 'Nuevo Producto';
        document.getElementById('product-form').reset();
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
}

// ========== FUNCIONES CRUD ==========
async function saveProduct(e) {
    e.preventDefault();
    
    const form = e.target;
    
    const productData = {
        nombre: document.getElementById('product-name').value,
        descripcion: document.getElementById('product-description').value,
        precio: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        categoria_id: parseInt(document.getElementById('product-category').value),
        imagen_url: document.getElementById('product-image').value || null
    };
    
    try {
        if (!window.AdminService) {
            throw new Error('AdminService no disponible');
        }
        
        const productId = form.dataset.editId;
        let result;
        
        if (productId) {
            result = await window.AdminService.updateProduct(productId, productData);
        } else {
            result = await window.AdminService.createProduct(productData);
        }
        
        if (result.success) {
            showNotification(
                productId ? 'Producto actualizado' : 'Producto creado',
                'success'
            );
            
            closeProductModal();
            await loadProducts();
            await loadInitialData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification(error.message, 'error');
    }
}

function editProduct(productId) {
    showProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
        if (!window.AdminService) {
            throw new Error('AdminService no disponible');
        }
        
        const result = await window.AdminService.deleteProduct(productId);
        
        if (result.success) {
            showNotification('Producto eliminado', 'success');
            await loadProducts();
            await loadInitialData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification(error.message, 'error');
    }
}

// ========== CONFIGURACIÓN DE EVENTOS ==========
function setupEventListeners() {
    // Formulario de producto
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }
    
    // Búsqueda de productos
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = currentProducts.filter(product => 
                product.nombre.toLowerCase().includes(searchTerm) ||
                product.descripcion?.toLowerCase().includes(searchTerm)
            );
            renderProductsTable(filtered);
        });
    }
}

// ========== LOGOUT ==========
async function logout() {
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
}

// ========== INICIALIZACIÓN ==========
// Hacer funciones globales
window.initAdminPanel = initAdminPanel;
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.showProductModal = showProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.logout = logout;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}

console.log('✅ Admin Main cargado');