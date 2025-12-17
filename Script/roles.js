// roles.js
// Protección de rutas según el rol del usuario

// roles.js actualizado
function getUserRole() {
    // Convertimos a número para asegurar la comparación
    return parseInt(localStorage.getItem('rol'));
}

function isLoggedIn() {
    return localStorage.getItem('usuario_id') !== null;
}

function protegerRuta(rolPermitido) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const rolActual = getUserRole();

    // Comparamos números (1 = Admin, 2 = Vendedor, 3 = Cliente)
    if (rolActual !== rolPermitido) {
        alert('No tienes permiso para acceder a esta página.');
        
        // Redirección inteligente
        const rutas = {
            1: 'admin.html',
            2: 'vendedor.html',
            3: 'proyecto.html'
        };
        window.location.href = rutas[rolActual] || 'proyecto.html';
    }
}


