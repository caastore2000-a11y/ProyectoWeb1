// Script/admin-panel.js
import { DatabaseService } from './database.js';
import { AuthService } from './auth-service.js';

class AdminPanel {
    constructor() {
        this.init();
    }
    
    async init() {
        // Verificar que el usuario es administrador
        const rol = AuthService.obtenerRolUsuario();
        if (rol !== 1) { // 1 = Administrador
            alert('No tienes permisos para acceder al panel de administración');
            window.location.href = 'proyecto.html';
            return;
        }
        
        // Cargar datos
        await this.cargarDashboard();
        this.configurarEventos();
    }
    
    async cargarDashboard() {
        try {
            // Cargar estadísticas
            const { data: stats } = await DatabaseService.obtenerEstadisticas();
            this.actualizarEstadisticas(stats);
            
            // Cargar productos
            await this.cargarProductos();
            
            // Cargar usuarios
            await this.cargarUsuarios();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }
    
    actualizarEstadisticas(stats) {
        document.getElementById('total-productos').textContent = stats.totalProductos;
        document.getElementById('total-usuarios').textContent = stats.totalUsuarios;
        document.getElementById('valor-inventario').textContent = 
            this.formatearPrecio(stats.valorInventario);
    }
    
    async cargarProductos() {
        const { data: productos, error } = await DatabaseService.productos.obtenerTodos();
        
        if (error) {
            console.error('Error cargando productos:', error);
            return;
        }
        
        this.renderizarTablaProductos(productos);
    }
    
    async cargarUsuarios() {
        const { data: usuarios, error } = await DatabaseService.usuarios.obtenerTodos();
        
        if (error) {
            console.error('Error cargando usuarios:', error);
            return;
        }
        
        this.renderizarTablaUsuarios(usuarios);
    }
    
    renderizarTablaProductos(productos) {
        const tbody = document.getElementById('tabla-productos');
        tbody.innerHTML = '';
        
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categorias?.nombre || 'Sin categoría'}</td>
                <td>${this.formatearPrecio(producto.precio)}</td>
                <td>${producto.stock}</td>
                <td>
                    <button onclick="adminPanel.editarProducto(${producto.id})" class="btn-editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.eliminarProducto(${producto.id})" class="btn-eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    async eliminarProducto(id) {
        const confirmar = confirm('¿Estás seguro de eliminar este producto?');
        
        if (confirmar) {
            const { error } = await DatabaseService.productos.eliminar(id);
            
            if (error) {
                alert(`Error: ${error.message}`);
            } else {
                alert('✅ Producto eliminado');
                await this.cargarProductos();
                await this.cargarDashboard();
            }
        }
    }
    
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    }
    
    configurarEventos() {
        // Configurar eventos del formulario de nuevo producto
        document.getElementById('form-nuevo-producto')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.crearNuevoProducto();
        });
    }
    
    async crearNuevoProducto() {
        const formData = new FormData(document.getElementById('form-nuevo-producto'));
        
        const productoData = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            stock: parseInt(formData.get('stock')),
            categoria_id: parseInt(formData.get('categoria_id')),
            imagen_url: formData.get('imagen_url') || null
        };
        
        const { data, error } = await DatabaseService.productos.crear(productoData);
        
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert(`✅ Producto "${data[0].nombre}" creado`);
            document.getElementById('form-nuevo-producto').reset();
            await this.cargarProductos();
            await this.cargarDashboard();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});