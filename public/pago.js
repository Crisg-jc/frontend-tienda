// Variables globales
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

// 1. Función para guardar el carrito en localStorage
function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cartItems));
}

// 2. Función para actualizar el contador del carrito
function updateCartCount() {
  const count = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = count;
    count > 0 ? cartCount.classList.remove('hidden') : cartCount.classList.add('hidden');
  }
}

// 3. Función para formatear precios
function formatPrice(price) {
  return `$${price.toLocaleString('es-CO')} COP`;
}

// 4. Función para calcular costo de envío
function calculateShippingCost(subtotal) {
  // 10% del subtotal con mínimo $5,000
  const shipping = subtotal * 0.1;
  return Math.max(shipping, 5000);
}

// 5. Función para actualizar el resumen del carrito con imágenes
function updateCartSummary() {
  const cartSummary = document.getElementById('cartSummary');
  const emptyCartMessage = document.getElementById('emptyCartMessage');
  const cartContent = document.getElementById('cartContent');
  
  if (cartItems.length === 0) {
    if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
    if (cartContent) cartContent.classList.add('hidden');
    return;
  }
  
  if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
  if (cartContent) cartContent.classList.remove('hidden');
  
  cartSummary.innerHTML = '';
  
  cartItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <div class="flex-shrink-0">
        <img src="${item.image || 'https://via.placeholder.com/100'}" 
             alt="${item.name}" 
             class="cart-item-image">
      </div>
      <div class="flex-grow">
        <h4 class="font-medium">${item.name}</h4>
        <p class="text-sm text-gray-600">
          ${item.size ? 'Talla: ' + item.size : ''} 
          ${item.color ? 'Color: ' + item.color : ''}
        </p>
      </div>
      <div class="text-right">
        <p>${item.quantity} x ${formatPrice(item.price)}</p>
        <p class="font-medium">${formatPrice(item.price * item.quantity)}</p>
      </div>
    `;
    cartSummary.appendChild(itemElement);
  });
  
  calculateTotals();
}

// 6. Función para calcular totales
function calculateTotals() {
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = calculateShippingCost(subtotal);
  const total = subtotal + shipping;
  
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('shippingCost').textContent = formatPrice(shipping);
  document.getElementById('total').textContent = formatPrice(total);
}

// 7. Función mejorada para verificar y actualizar stock (simulación)
async function checkAndUpdateStock() {
  try {
    console.log("Verificando stock para los items:", cartItems);
    
    // Simulación: Usamos localStorage para el stock
    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    
    // Primero verificamos todo el stock
    for (const item of cartItems) {
      const itemKey = `${item.id}-${item.size || ''}-${item.color || ''}`;
      
      // Si no existe en stockData, inicializamos con 10 unidades
      if (!stockData[itemKey]) {
        stockData[itemKey] = 10;
      }
      
      if (stockData[itemKey] < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name} (${stockData[itemKey]} disponibles)`);
      }
    }
    
    // Si todo está bien, actualizamos el stock
    for (const item of cartItems) {
      const itemKey = `${item.id}-${item.size || ''}-${item.color || ''}`;
      stockData[itemKey] -= item.quantity;
    }
    
    localStorage.setItem('stockData', JSON.stringify(stockData));
    return true;
  } catch (error) {
    console.error('Error en verificación de stock:', error);
    
    // Actualizar el carrito si hay productos sin stock
    const updatedCart = [];
    const stockData = JSON.parse(localStorage.getItem('stockData')) || {};
    
    for (const item of cartItems) {
      const itemKey = `${item.id}-${item.size || ''}-${item.color || ''}`;
      const availableStock = stockData[itemKey] || 10; // Valor por defecto para simulación
      
      if (availableStock > 0) {
        updatedCart.push({
          ...item,
          quantity: Math.min(item.quantity, availableStock)
        });
      }
    }
    
    // Actualizar el carrito
    cartItems = updatedCart;
    saveCartToLocalStorage();
    updateCartSummary();
    updateCartCount();
    
    throw error;
  }
}

// 8. Función para mostrar notificaciones
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// 9. Función para validar campos del formulario
function validateFormFields() {
  let isValid = true;
  
  // Validar nombre completo
  const fullName = document.getElementById('fullName');
  const fullNameError = document.getElementById('fullNameError');
  const fullNameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,50}$/;
  
  if (!fullNameRegex.test(fullName.value)) {
    fullName.classList.add('border-red-500');
    fullNameError.classList.remove('hidden');
    isValid = false;
  } else {
    fullName.classList.remove('border-red-500');
    fullNameError.classList.add('hidden');
  }
  
  // Validar email
  const email = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
  
  if (!emailRegex.test(email.value)) {
    email.classList.add('border-red-500');
    emailError.classList.remove('hidden');
    isValid = false;
  } else {
    email.classList.remove('border-red-500');
    emailError.classList.add('hidden');
  }
  
  // Validar teléfono
  const phone = document.getElementById('phone');
  const phoneError = document.getElementById('phoneError');
  const phoneRegex = /^3[0-9]{9}$/;
  
  if (!phoneRegex.test(phone.value)) {
    phone.classList.add('border-red-500');
    phoneError.classList.remove('hidden');
    isValid = false;
  } else {
    phone.classList.remove('border-red-500');
    phoneError.classList.add('hidden');
  }
  
  // Validar dirección
  const address = document.getElementById('address');
  const addressError = document.getElementById('addressError');
  const addressRegex = /^[A-Za-z0-9 #\-.,áéíóúñÑ]{5,100}$/;
  
  if (!addressRegex.test(address.value)) {
    address.classList.add('border-red-500');
    addressError.classList.remove('hidden');
    isValid = false;
  } else {
    address.classList.remove('border-red-500');
    addressError.classList.add('hidden');
  }
  
  // Validar ciudad
  const city = document.getElementById('city');
  const cityError = document.getElementById('cityError');
  const cityRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,40}$/;
  
  if (!cityRegex.test(city.value)) {
    city.classList.add('border-red-500');
    cityError.classList.remove('hidden');
    isValid = false;
  } else {
    city.classList.remove('border-red-500');
    cityError.classList.add('hidden');
  }
  
  return isValid;
}

// 10. Función para manejar el envío del formulario
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const confirmButton = document.getElementById('confirmButton');
  
  // Validar campos primero
  if (!validateFormFields()) {
    showNotification('Por favor corrige los errores en el formulario', 'error');
    return;
  }
  
  confirmButton.disabled = true;
  confirmButton.textContent = 'Procesando...';
  
  try {
    // Validar que hay productos en el carrito
    if (cartItems.length === 0) {
      throw new Error('No hay productos en el carrito');
    }
    
    // Verificar y actualizar stock
    await checkAndUpdateStock();
    
    // Crear datos del pedido
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = calculateShippingCost(subtotal);
    
    const orderData = {
      orderId: 'ORD-' + Date.now(),
      customer: {
        email: document.getElementById('email').value,
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value
      },
      shipping: {
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        method: document.getElementById('shippingMethod').value,
        instructions: document.getElementById('deliveryInstructions').value || 'Ninguna'
      },
      payment: {
        method: 'cash' // Siempre será contraentrega ahora
      },
      items: [...cartItems],
      subtotal: subtotal,
      shippingCost: shippingCost,
      total: subtotal + shippingCost,
      status: 'pending',
      date: new Date().toISOString()
    };
    
    // Guardar el pedido en localStorage (simulación)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Mostrar confirmación
    document.getElementById('confirmationMessage').textContent = 
      `Pedido #${orderData.orderId} procesado. Total: ${formatPrice(orderData.total)}. Pago contra entrega.`;
    document.getElementById('successModal').classList.remove('hidden');
    
    // Limpiar carrito después de éxito
    cartItems = [];
    localStorage.removeItem('cart');
    updateCartCount();
    updateCartSummary();
    
    showNotification('Compra realizada con éxito. Pago contra entrega.');
    
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    showNotification(error.message, 'error');
    
    // Mostrar sugerencias para errores comunes
    if (error.message.includes('Stock insuficiente')) {
      showNotification('Hemos ajustado tu carrito según el stock disponible', 'info');
    }
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Confirmar Compra';
  }
}

// 11. Función para cargar el carrito al iniciar
function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cartItems = JSON.parse(savedCart);
      
      // Verificar que los items del carrito sean válidos
      cartItems = cartItems.filter(item => 
        item && item.id && item.name && item.price && item.quantity
      );
      
      if (cartItems.length === 0) {
        localStorage.removeItem('cart');
      } else {
        saveCartToLocalStorage(); // Guardar de nuevo por si hubo filtrado
      }
    } catch (e) {
      console.error('Error al parsear el carrito:', e);
      cartItems = [];
      localStorage.removeItem('cart');
    }
  }
  
  return cartItems.length > 0;
}

// Event Listeners mejorados
document.addEventListener('DOMContentLoaded', () => {
  // Cargar el carrito
  const hasCartItems = loadCart();
  
  // Mostrar el carrito al iniciar la página
  updateCartSummary();
  updateCartCount();
  
  if (!hasCartItems) {
    // Redirigir a la tienda si no hay productos
    showNotification('No hay productos en tu carrito', 'error');
    setTimeout(() => {
      window.location.href = 'tienda.html';
    }, 2000);
    return;
  }
  
  // Configurar el año actual en el footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Configurar el formulario
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', handleFormSubmit);
    
    // Agregar validación en tiempo real para cada campo
    const fieldsToValidate = ['fullName', 'email', 'phone', 'address', 'city'];
    fieldsToValidate.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', validateFormFields);
        field.addEventListener('blur', validateFormFields);
      }
    });
  }
  
  // Configurar el botón de continuar comprando
  const continueShopping = document.getElementById('continueShopping');
  if (continueShopping) {
    continueShopping.addEventListener('click', () => {
      const successModal = document.getElementById('successModal');
      if (successModal) {
        successModal.classList.add('hidden');
      }
      window.location.href = 'tienda.html';
    });
  }
  
  // Configurar el icono del carrito
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      window.location.href = 'carrito.html';
    });
  }
  
  // Guardar el carrito antes de salir de la página
  window.addEventListener('beforeunload', () => {
    saveCartToLocalStorage();
  });
});