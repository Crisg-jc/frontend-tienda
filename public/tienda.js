document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartIcon = document.getElementById('cart-icon');
  const cartModal = document.getElementById('cart-modal');
  const closeCart = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartSummary = document.getElementById('cart-summary');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartShipping = document.getElementById('cart-shipping');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const clearCartBtn = document.getElementById('clear-cart-btn');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Menú móvil
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  // Menú de usuario
  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.querySelector('.dropdown-menu');

  // Formatear números con separadores de miles
  function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
  }

  // Actualizar año en el footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Manejo del menú móvil
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
    });
  }

  // Manejo del menú de usuario
  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', function() {
      userMenu.classList.toggle('hidden');
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
    });

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', function(e) {
      if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.add('hidden');
        userMenuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Mostrar/ocultar carrito
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      cartModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      updateCartModal();
    });
  }

  if (closeCart) {
    closeCart.addEventListener('click', () => {
      cartModal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    });
  }

  // Cerrar carrito al hacer clic fuera
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) {
        cartModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Vaciar carrito
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }

  // Función para guardar carrito en localStorage
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // Función para actualizar el contador del carrito
  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    totalItems > 0 ? cartCount.classList.remove('hidden') : cartCount.classList.add('hidden');
  }

  // Función para actualizar el modal del carrito
  function updateCartModal() {
    if (cart.length === 0) {
      emptyCartMessage.classList.remove('hidden');
      cartSummary.classList.add('hidden');
      cartItemsContainer.innerHTML = '';
      cartItemsContainer.appendChild(emptyCartMessage);
    } else {
      emptyCartMessage.classList.add('hidden');
      cartSummary.classList.remove('hidden');
      
      let itemsHTML = '';
      let subtotal = 0;
      
      cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        itemsHTML += `
          <div class="cart-item flex justify-between items-center py-4 border-b border-gray-200" data-id="${item.id}">
            <div class="flex items-center space-x-4">
              <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded" loading="lazy">
              <div>
                <h4 class="font-medium">${item.name}</h4>
                ${item.category ? `<p class="text-sm text-gray-600">${item.category}</p>` : ''}
                <p class="text-sm text-gray-500">$${formatNumber(item.price)} c/u</p>
              </div>
            </div>
            <div class="flex items-center">
              <div class="flex items-center space-x-2 mr-6">
                <button class="decrease-quantity px-2 py-1 bg-gray-200 rounded hover:bg-gray-300" data-id="${item.id}">-</button>
                <span class="quantity w-6 text-center">${item.quantity}</span>
                <button class="increase-quantity px-2 py-1 bg-gray-200 rounded hover:bg-gray-300" data-id="${item.id}">+</button>
              </div>
              <div class="text-right">
                <p class="text-red-500 font-medium text-lg">$${formatNumber(itemTotal)}</p>
                <button class="remove-item text-red-500 text-sm hover:text-red-700 focus:outline-none" data-id="${item.id}">
                  <i class="fas fa-trash mr-1"></i>Eliminar
                </button>
              </div>
            </div>
          </div>
        `;
      });
      
      cartItemsContainer.innerHTML = itemsHTML;

      // Calcular envío (ejemplo: 10% del subtotal con mínimo $5)
      const shipping = Math.max(subtotal * 0.1, 5);
      const total = subtotal + shipping;
      
      cartSubtotal.textContent = `$${formatNumber(subtotal)}`;
      cartShipping.textContent = `$${formatNumber(shipping)}`;
      cartTotal.textContent = `$${formatNumber(total)}`;

      // Agregar eventos a los botones de cantidad y eliminar
      document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          increaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          decreaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          removeFromCart(id);
        });
      });
    }
  }

  // Función para aumentar cantidad de un item
  function increaseQuantity(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
      item.quantity++;
      saveCart();
      updateCartModal();
      updateCartCount();
    }
  }

  // Función para disminuir cantidad de un item
  function decreaseQuantity(id) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
      } else {
        cart.splice(itemIndex, 1);
      }
      saveCart();
      updateCartModal();
      updateCartCount();
    }
  }

  // Función para eliminar un producto del carrito
  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartModal();
    updateCartCount();
  }

  // Función para vaciar el carrito
  function clearCart() {
    cart = [];
    saveCart();
    updateCartModal();
    updateCartCount();
  }

  // Función para agregar al carrito
  window.addToCart = function(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: product.quantity || 1
      });
    }
    
    saveCart();
    updateCartCount();
    
    // Mostrar notificación
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center animate-fade-in';
    notification.innerHTML = `
      <i class="fas fa-check-circle mr-2"></i>
      <span>Producto agregado al carrito</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => notification.remove(), 500);
    }, 2000);
  };

  // Evento para el botón de pago
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('El carrito está vacío. Agrega productos antes de pagar.');
        return;
      }
      // Redirigir a pago.html
      window.location.href = 'pago.html';
    });
  }

  // Inicializar contador del carrito
  updateCartCount();
});