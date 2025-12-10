// --- Datos de Productos (Simulados) ---

const products = [

    { id: 1, name: "iPhone 15 Pro", price: 999, category: "celulares", img: "https://via.placeholder.com/200?text=iPhone" },

    { id: 2, name: "Samsung S24 Ultra", price: 1100, category: "celulares", img: "https://via.placeholder.com/200?text=Samsung" },

    { id: 3, name: "MacBook Air M3", price: 1200, category: "computadores", img: "https://via.placeholder.com/200?text=MacBook" },

    { id: 4, name: "Laptop Gamer Asus", price: 1500, category: "computadores", img: "https://via.placeholder.com/200?text=Asus+Gamer" },

    { id: 5, name: "Sony WH-1000XM5", price: 350, category: "audifonos", img: "https://via.placeholder.com/200?text=Sony+XM5" },

    { id: 6, name: "AirPods Pro 2", price: 250, category: "audifonos", img: "https://via.placeholder.com/200?text=AirPods" }

];



let cart = [];



// --- Inicialización ---

document.addEventListener('DOMContentLoaded', () => {

    renderProducts(products);

});



// --- Funciones de Renderizado ---

function renderProducts(productList) {

    const container = document.getElementById('product-container');

    container.innerHTML = ''; // Limpiar



    productList.forEach(prod => {

        const card = document.createElement('div');

        card.classList.add('card');

        card.innerHTML = `

            <img src="${prod.img}" alt="${prod.name}">

            <h3>${prod.name}</h3>

            <span class="price">$${prod.price}</span>

            <button class="add-btn" onclick="addToCart(${prod.id})">Agregar</button>

        `;

        container.appendChild(card);

    });

}



function filterProducts(category) {

    if (category === 'todos') {

        renderProducts(products);

    } else {

        const filtered = products.filter(p => p.category === category);

        renderProducts(filtered);

    }

    toggleMenu(); // Cerrar menú en móvil al seleccionar

}



// --- Lógica del Carrito ---

function addToCart(id) {

    const product = products.find(p => p.id === id);

    cart.push(product);

    updateCartUI();

}



function removeFromCart(index) {

    cart.splice(index, 1);

    updateCartUI();

}



function updateCartUI() {

    const cartItemsContainer = document.getElementById('cart-items');

    const cartCount = document.getElementById('cart-count');

    const cartTotal = document.getElementById('cart-total');

   

    // Actualizar contador

    cartCount.textContent = cart.length;



    // Renderizar lista

    cartItemsContainer.innerHTML = '';

    let total = 0;



    cart.forEach((item, index) => {

        total += item.price;

        const div = document.createElement('div');

        div.classList.add('cart-item');

        div.innerHTML = `

            <div>

                <h4>${item.name}</h4>

                <span>$${item.price}</span>

            </div>

            <button class="remove-item" onclick="removeFromCart(${index})">X</button>

        `;

        cartItemsContainer.appendChild(div);

    });



    // Actualizar Total

    cartTotal.textContent = total;

}



function checkout() {

    if(cart.length === 0) return alert("Tu carrito está vacío");

    alert(`Gracias por tu compra! Total: $${document.getElementById('cart-total').textContent}`);

    cart = [];

    updateCartUI();

    toggleCart();

}



// --- Menú y Toggle ---

function toggleMenu() {

    const nav = document.getElementById('nav-menu');

    nav.classList.toggle('active');

}



function toggleCart() {

    const sidebar = document.getElementById('cart-sidebar');

    const overlay = document.getElementById('cart-overlay');

    sidebar.classList.toggle('active');

    overlay.classList.toggle('active');

}