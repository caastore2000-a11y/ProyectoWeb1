// admin-main.js
import { AdminService } from './admin-service.js';
import { AuthService } from './auth.js';

// Solo permite entrar si el rol es 1 (Administrador)
protegerRuta(1);
// Variables globales
let currentUser = null;
let charts = {};
let currentProducts = [];
let currentUsers = [];
let currentCategories = [];

// Inicializar la aplicación
async function initAdminPanel() {
    console.log('🚀 Iniciando Panel de Administración...');
    
    try {
        // Verificar autenticación y permisos
        currentUser = await AdminService.checkAdminPermissions();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Configurar UI
        setupUI();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log('✅ Panel de administración listo');
        
    } catch (error) {
        console.error('❌ Error inicializando panel:', error);
        
        if (error.message.includes('Permisos insuficientes')) {
            alert('No tienes permisos para acceder al panel de administración');
            window.location.href = 'proyecto.html';
        } else if (error.message.includes('No autenticado')) {
            window.location.href = 'login.html';
        } else {
            showNotification('Error al cargar el panel de administración', 'error');
        }
    }
}

// Configurar UI inicial
function setupUI() {
    // Mostrar información del usuario
    document.getElementById('user-name').textContent = currentUser.nombre;
    document.getElementById('welcome-message').textContent = `Bienvenido, ${currentUser.nombre}`;
    
    // Configurar título de página dinámico
    updatePageTitle('Dashboard');
    
    // Configurar sidebar activo
    setupActiveNav();
}

// Cargar datos iniciales
async function loadInitialData() {
    showLoading(true);
    
    try {
        // Cargar estadísticas
        const stats = await AdminService.getDashboardStats();
        if (stats.success) {
            updateDashboardStats(stats.data);
        }
        
        // Cargar productos
        await loadProducts();
        
        // Cargar usuarios
        await loadUsers();
        
        // Cargar categorías
        await loadCategories();
        
        // Cargar datos de gráficos
        await loadChartData();
        
        // Actualizar badge de órdenes
        updateOrdersBadge();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error al cargar los datos', 'error');
    } finally {
        showLoading(false);
    }
}

// Actualizar estadísticas del dashboard
function updateDashboardStats(stats) {
    // Productos
    document.getElementById('total-products').textContent = stats.totalProductos;
    document.getElementById('products-trend').innerHTML = `
        <i class="fas fa-arrow-up"></i> 
        ${Math.round((stats.totalProductos * 0.12))} este mes
    `;
    
    // Usuarios
    document.getElementById('total-users').textContent = stats.totalUsuarios;
    document.getElementById('users-trend').innerHTML = `
        <i class="fas fa-arrow-up"></i> 
        ${Math.round((stats.totalUsuarios * 0.08))} este mes
    `;
    
    // Órdenes (ejemplo)
    document.getElementById('orders-today').textContent = '15';
    document.getElementById('orders-trend').innerHTML = `
        <i class="fas fa-arrow-up"></i> 
        5% ayer
    `;
    
    // Ingresos
    document.getElementById('monthly-revenue').textContent = AdminService.formatCurrency(stats.valorInventario * 0.3);
    document.getElementById('revenue-trend').innerHTML = `
        <i class="fas fa-arrow-up"></i> 
        15% mes pasado
    `;
    
    // Actualizar productos con stock bajo
    updateLowStockTable(stats.productosBajoStock);
}

// Cargar productos
async function loadProducts(filters = {}) {
    try {
        const result = await AdminService.getAllProducts(filters);
        
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

// Renderizar tabla de productos
function renderProductsTable(products) {
    const tbody = document.getElementById('products-body');
    
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
                <td>${product.categoria}</td>
                <td>${AdminService.formatCurrency(product.precio)}</td>
                <td>
                    <span class="badge badge-${stockClass}">
                        ${product.stock} unidades
                    </span>
                </td>
                <td>
                    <span class="badge badge-${stockClass}">
                        ${product.estado}
                    </span>
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

// Cargar usuarios
async function loadUsers() {
    try {
        const result = await AdminService.getAllUsers();
        
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

// Renderizar tabla de usuarios
function renderUsersTable(users) {
    const tbody = document.getElementById('users-body');
    
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
        const roleClass = user.rol_id === 1 ? 'primary' : 
                         user.rol_id === 2 ? 'info' : 'success';
        
        html += `
            <tr>
                <td>${user.id.substring(0, 8)}...</td>
                <td>
                    <strong>${user.nombre}</strong>
                    <small class="text-muted d-block">${user.email}</small>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge badge-${roleClass}">
                        ${user.rol}
                    </span>
                </td>
                <td>${user.creado_en}</td>
                <td>
                    <span class="badge badge-success">
                        ${user.estado}
                    </span>
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

// Cargar categorías
async function loadCategories() {
    try {
        const result = await AdminService.getAllCategories();
        
        if (result.success) {
            currentCategories = result.data;
            renderCategoriesGrid(currentCategories);
            
            // Llenar select de categorías en formularios
            populateCategorySelects();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        showNotification('Error al cargar las categorías', 'error');
    }
}

// Renderizar grid de categorías
function renderCategoriesGrid(categories) {
    const grid = document.getElementById('categories-grid');
    
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
                <div class="category-count">
                    ${category.productCount} productos
                </div>
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

// Llenar selects de categorías
function populateCategorySelects() {
    const selects = document.querySelectorAll('#product-category, #category-filter');
    
    selects.forEach(select => {
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

// Cargar datos para gráficos
async function loadChartData() {
    try {
        const result = await AdminService.getChartData();
        
        if (result.success) {
            initCharts(result.data);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error cargando datos de gráficos:', error);
    }
}

// Inicializar gráficos
function initCharts(chartData) {
    // Gráfico de ventas
    const salesCtx = document.getElementById('sales-chart').getContext('2d');
    charts.sales = new Chart(salesCtx, {
        type: 'line',
        data: chartData.sales,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return AdminService.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de productos más vendidos
    const productsCtx = document.getElementById('top-products-chart').getContext('2d');
    charts.topProducts = new Chart(productsCtx, {
        type: 'bar',
        data: chartData.topProducts,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Actualizar tabla de productos con stock bajo
function updateLowStockTable(lowStockCount) {
    const body = document.getElementById('low-stock-body');
    
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
    
    // Filtrar productos con stock bajo
    const lowStockProducts = currentProducts.filter(p => p.stock < 10);
    
    let html = '';
    
    lowStockProducts.forEach(product => {
        const stockLevel = product.stock < 5 ? 'Crítico' : 'Bajo';
        const stockClass = product.stock < 5 ? 'danger' : 'warning';
        
        html += `
            <tr>
                <td>
                    <strong>${product.nombre}</strong>
                </td>
                <td>${product.categoria}</td>
                <td>
                    <span class="badge badge-${stockClass}">
                        ${product.stock} unidades
                    </span>
                </td>
                <td>10 unidades</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="restockProduct(${product.id})">
                        <i class="fas fa-box"></i> Reponer
                    </button>
                </td>
            </tr>
        `;
    });
    
    body.innerHTML = html;
}

// Actualizar badge de órdenes
function updateOrdersBadge() {
    // Simular órdenes pendientes (en una app real esto vendría de la API)
    const pendingOrders = Math.floor(Math.random() * 10);
    const badge = document.getElementById('orders-badge');
    
    if (pendingOrders > 0) {
        badge.textContent = pendingOrders;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Funciones de navegación
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
    
    // Actualizar título de página
    updatePageTitle(getSectionTitle(sectionId));
    
    // Cargar datos específicos de la sección si es necesario
    switch(sectionId) {
        case 'products':
            loadProducts();
            break;
        case 'users':
            loadUsers();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
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
    document.getElementById('page-title').textContent = title;
    document.title = `${title} | CaseStore Admin`;
}

function setupActiveNav() {
    // Por defecto, dashboard está activo
    showSection('dashboard');
}

// Funciones del sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        mainContent.style.marginLeft = 'var(--sidebar-width)';
    } else {
        mainContent.style.marginLeft = '0';
    }
}

// Funciones de modales
function showProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (productId) {
        // Modo edición
        title.textContent = 'Editar Producto';
        const product = currentProducts.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('product-name').value = product.nombre;
            document.getElementById('product-description').value = product.descripcion || '';
            document.getElementById('product-price').value = product.precio;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-category').value = product.categoria_id;
            document.getElementById('product-image').value = product.imagen_url || '';
            
            // Mostrar preview de imagen si existe
            updateImagePreview(product.imagen_url);
            
            // Guardar ID en el formulario
            form.dataset.editId = productId;
        }
    } else {
        // Modo creación
        title.textContent = 'Nuevo Producto';
        form.reset();
        form.dataset.editId = '';
        updateImagePreview('');
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function showUserModal() {
    document.getElementById('user-modal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('user-modal').style.display = 'none';
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    confirmBtn.onclick = function() {
        onConfirm();
        closeConfirmModal();
    };
    
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// Funciones CRUD
async function saveProduct(e) {
    e.preventDefault();
    
    const form = e.target;
    const productId = form.dataset.editId;
    
    const productData = {
        nombre: document.getElementById('product-name').value,
        descripcion: document.getElementById('product-description').value,
        precio: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        categoria_id: parseInt(document.getElementById('product-category').value),
        imagen_url: document.getElementById('product-image').value || null
    };
    
    try {
        let result;
        
        if (productId) {
            // Actualizar
            result = await AdminService.updateProduct(productId, productData);
        } else {
            // Crear
            result = await AdminService.createProduct(productData);
        }
        
        if (result.success) {
            showNotification(
                productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                'success'
            );
            
            closeProductModal();
            await loadProducts();
            await loadInitialData(); // Para actualizar estadísticas
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
    showConfirmModal(
        'Eliminar Producto',
        '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.',
        async () => {
            try {
                const result = await AdminService.deleteProduct(productId);
                
                if (result.success) {
                    showNotification('Producto eliminado exitosamente', 'success');
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
    );
}

function viewProduct(productId) {
    // Redirigir a la vista de detalles del producto
    window.open(`producto-detalle.html?id=${productId}`, '_blank');
}

async function restockProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    
    if (!product) return;
    
    const newStock = prompt(`¿Cuántas unidades agregar a "${product.nombre}"? (Stock actual: ${product.stock})`, '10');
    
    if (newStock && !isNaN(newStock)) {
        try {
            const result = await AdminService.updateProduct(productId, {
                stock: product.stock + parseInt(newStock)
            });
            
            if (result.success) {
                showNotification(`Stock actualizado: ${result.data.stock} unidades`, 'success');
                await loadProducts();
                await loadInitialData();
            }
        } catch (error) {
            console.error('Error actualizando stock:', error);
            showNotification(error.message, 'error');
        }
    }
}

// Funciones de usuarios
async function saveUser(e) {
    e.preventDefault();
    
    const userData = {
        nombre: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value,
        rol_id: parseInt(document.getElementById('user-role').value)
    };
    
    try {
        const result = await AdminService.createUser(userData);
        
        if (result.success) {
            showNotification('Usuario creado exitosamente', 'success');
            closeUserModal();
            await loadUsers();
            await loadInitialData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error creando usuario:', error);
        showNotification(error.message, 'error');
    }
}

function editUser(userId) {
    // Implementar edición de usuario
    alert('Función de edición de usuario en desarrollo');
}

async function deleteUser(userId) {
    showConfirmModal(
        'Eliminar Usuario',
        '¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.',
        async () => {
            try {
                const result = await AdminService.deleteUser(userId);
                
                if (result.success) {
                    showNotification('Usuario eliminado exitosamente', 'success');
                    await loadUsers();
                    await loadInitialData();
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error eliminando usuario:', error);
                showNotification(error.message, 'error');
            }
        }
    );
}

// Funciones de categorías
function showCategoryModal() {
    // Implementar modal de categoría
    alert('Modal de categoría en desarrollo');
}

function editCategory(categoryId, event) {
    if (event) event.stopPropagation();
    // Implementar edición de categoría
    alert('Función de edición de categoría en desarrollo');
}

async function deleteCategory(categoryId, event) {
    if (event) event.stopPropagation();
    
    showConfirmModal(
        'Eliminar Categoría',
        '¿Estás seguro de eliminar esta categoría? Los productos con esta categoría quedarán sin categoría.',
        async () => {
            try {
                const result = await AdminService.deleteCategory(categoryId);
                
                if (result.success) {
                    showNotification('Categoría eliminada exitosamente', 'success');
                    await loadCategories();
                    await loadProducts();
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error eliminando categoría:', error);
                showNotification(error.message, 'error');
            }
        }
    );
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de producto
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    
    // Formulario de usuario
    document.getElementById('user-form').addEventListener('submit', saveUser);
    
    // Búsqueda de productos
    document.getElementById('product-search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = currentProducts.filter(product => 
            product.nombre.toLowerCase().includes(searchTerm) ||
            product.descripcion?.toLowerCase().includes(searchTerm) ||
            product.categoria.toLowerCase().includes(searchTerm)
        );
        renderProductsTable(filtered);
    });
    
    // Filtro de categoría
    document.getElementById('category-filter').addEventListener('change', function(e) {
        const categoryId = e.target.value;
        if (categoryId) {
            loadProducts({ categoria: categoryId });
        } else {
            loadProducts();
        }
    });
    
    // Preview de imagen
    document.getElementById('product-image').addEventListener('input', function(e) {
        updateImagePreview(e.target.value);
    });
    
    // Configuración de tienda
    document.getElementById('store-settings').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Configuración guardada exitosamente', 'success');
    });
}

function updateImagePreview(url) {
    const preview = document.getElementById('image-preview');
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        preview.innerHTML = `<img src="${url}" alt="Preview">`;
    } else {
        preview.innerHTML = '<i class="fas fa-image fa-2x"></i><p>Preview de imagen</p>';
    }
}

// Funciones de utilidad
function showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.querySelector('.content');
    
    if (show) {
        loading.style.display = 'block';
        content.style.opacity = '0.5';
        content.style.pointerEvents = 'none';
    } else {
        loading.style.display = 'none';
        content.style.opacity = '1';
        content.style.pointerEvents = 'auto';
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
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
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
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Animaciones para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Logout
async function logout() {
    try {
        await AuthService.logout();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error en logout:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Funciones para órdenes y analítica (placeholders)
function loadOrders() {
    // Implementar carga de órdenes
    console.log('Cargando órdenes...');
}

function loadAnalytics() {
    // Implementar carga de analítica
    console.log('Cargando analítica...');
}

function showLowStockProducts() {
    showSection('products');
    document.getElementById('stock-filter').value = 'low';
    loadProducts({ stock: 'low' });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAdminPanel);

// Exportar funciones para uso global
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.showProductModal = showProductModal;
window.closeProductModal = closeProductModal;
window.showUserModal = showUserModal;
window.closeUserModal = closeUserModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.restockProduct = restockProduct;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showCategoryModal = showCategoryModal;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.showLowStockProducts = showLowStockProducts;
window.logout = logout;