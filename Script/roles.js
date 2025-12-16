// roles.js
// Protección de rutas según el rol del usuario

// Función para obtener el rol guardado en localStorage
function getUserRole() {
  return localStorage.getItem('rol');
}

// Función para saber si el usuario está logueado
function isLoggedIn() {
  return localStorage.getItem('usuario_id') !== null;
}

// Función principal de protección
function protegerRuta(rolPermitido) {
  if (!isLoggedIn()) {
    alert('Debes iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const rolActual = getUserRole();

  if (rolActual !== rolPermitido) {
    alert('No tienes permiso para acceder a esta página.');

    // Redirección inteligente según el rol
    if (rolActual === 'administrador') window.location.href = 'dashboard_admin.html';
    if (rolActual === 'vendedor') window.location.href = 'dashboard_vendedor.html';
    if (rolActual === 'cliente') window.location.href = 'dashboard_cliente.html';
  }
}

// Ejemplo de uso para cada dashboard:
// En dashboard_admin.html → protegerRuta('administrador');
// En dashboard_vendedor.html → protegerRuta('vendedor');
// En dashboard_cliente.html → protegerRuta('cliente');
