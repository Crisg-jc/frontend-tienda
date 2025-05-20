// Actualizar año en el footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Menú móvil
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
    });
}

// Menú de usuario
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.querySelector('.dropdown-menu');

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

// Carrito de compras
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

// Obtener carrito de localStorage o crear uno nuevo
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Obtener información del usuario si existe
let user = JSON.parse(sessionStorage.getItem('user')) || {};

// Función para formatear precios
function formatPrice(price) {
    return `$${price.toLocaleString('es-CO')} COP`;
}

// Función para guardar el carrito
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Función para proceder al pago
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
        return;
    }
    
    // Guardar carrito y usuario en sessionStorage para asegurar la disponibilidad
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    sessionStorage.setItem('checkoutUser', JSON.stringify(user));
    
    // Redirigir a la página de pago
    window.location.href = 'pago.html';
}

// Función para actualizar el contador del carrito
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = count;
        count > 0 ? cartCount.classList.remove('hidden') : cartCount.classList.add('hidden');
    }
}

// Función para obtener el stock de un producto
async function getProductStock(productId) {
    try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}/stock`);
        if (!response.ok) throw new Error('Error al obtener stock');
        const stockData = await response.json();
        
        // Determinar el tipo de producto
        const isAccessory = productId.includes('gorra') || productId.includes('cinturon') || 
                          productId.includes('corbata') || productId.includes('panuela');
        const isSizeOnly = productId.includes('guantes') || productId.includes('rodilleras') || 
                         productId.includes('chaleco');
        
        if (isAccessory) {
            // Accesorios sin tallas/colores
            if (typeof stockData === 'number') return { 'default': { quantity: stockData } };
            if (typeof stockData === 'object') {
                const total = Object.values(stockData).reduce((sum, item) => sum + (typeof item === 'number' ? item : item.quantity || 0), 0);
                return { 'default': { quantity: total } };
            }
            return { 'default': { quantity: stockData } };
        } 
        
        if (isSizeOnly) {
            // Productos con tallas pero sin color
            const formattedStock = {};
            
            if (typeof stockData === 'object' && !Array.isArray(stockData)) {
                for (const [size, quantity] of Object.entries(stockData)) {
                    const sizeKey = size.toUpperCase();
                    formattedStock[sizeKey] = { quantity: typeof quantity === 'object' ? quantity.quantity : quantity };
                }
                return formattedStock;
            }
            
            if (Array.isArray(stockData)) {
                stockData.forEach(item => {
                    const size = item.size?.toUpperCase() || item.talla?.toUpperCase() || 'UNICA';
                    if (size) formattedStock[size] = { quantity: item.quantity || item.cantidad || 0 };
                });
                return formattedStock;
            }
            
            if (typeof stockData === 'number') return { 'UNICA': { quantity: stockData } };
        }
        
        // Para ropa/uniformes con talla y color
        return stockData;
    } catch (error) {
        console.error('Error:', error);
        return { 'default': { quantity: 10 } }; // Stock mínimo por defecto
    }
}

// Función para verificar stock (consistente en toda la app)
async function checkStock(productId, size, color, requestedQuantity = 1) {
    try {
        const stockData = await getProductStock(productId);
        let availableStock = 0;
        
        // Accesorios sin talla/color
        if (productId.includes('gorra') || productId.includes('cinturon') || 
            productId.includes('corbata') || productId.includes('panuela')) {
            availableStock = stockData.default?.quantity || stockData;
        } 
        // Productos con talla pero sin color
        else if (productId.includes('guantes') || productId.includes('rodilleras') || 
                productId.includes('chaleco')) {
            const sizeKey = size ? size.toUpperCase() : 'UNICA';
            const stockItem = stockData[sizeKey] || stockData[size] || stockData[size?.toLowerCase()];
            availableStock = stockItem?.quantity || 0;
            
            if (!size && Object.keys(stockData).length === 1 && stockData.UNICA) {
                availableStock = stockData.UNICA.quantity;
            }
        } 
        // Productos con talla y color
        else {
            if (!size || !color) return { valid: false, available: 0, message: 'Selecciona talla y color' };
            const key = `${size}-${color}`;
            availableStock = stockData[key]?.quantity || 0;
        }
        
        // Calcular cantidad actual en carrito
        const inCartQuantity = cart.reduce((total, item) => {
            if (item.id === productId && 
                (!size || item.size === size) && 
                (!color || item.color === color)) {
                return total + item.quantity;
            }
            return total;
        }, 0);
        
        const remainingStock = availableStock - inCartQuantity;
        
        return {
            valid: remainingStock >= requestedQuantity,
            available: remainingStock,
            message: remainingStock >= requestedQuantity 
                   ? '' 
                   : `Solo ${remainingStock} disponibles`
        };
        
    } catch (error) {
        console.error('Error al verificar stock:', error);
        return { valid: false, available: 0, message: 'Error al verificar stock' };
    }
}

// Función para actualizar los botones "Añadir al carrito"
async function updateAddToCartButtons() {
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    
    for (const button of buttons) {
        const productCard = button.closest('.product-card');
        if (!productCard) continue;
        
        const productId = button.dataset.id;
        const sizeSelectors = productCard.querySelectorAll('.size-btn');
        const colorSelectors = productCard.querySelectorAll('.color-btn');
        
        let size = null, color = null;
        
        if (sizeSelectors.length > 0) {
            const selectedSize = productCard.querySelector('.size-btn.selected');
            size = selectedSize?.dataset.size;
        }
        
        if (colorSelectors.length > 0) {
            const selectedColor = productCard.querySelector('.color-btn.selected');
            color = selectedColor?.dataset.color;
        }
        
        const stockCheck = await checkStock(productId, size, color, 1);
        
        // Actualizar estado del botón
        button.disabled = !stockCheck.valid;
        button.classList.toggle('bg-gray-400', !stockCheck.valid);
        button.classList.toggle('cursor-not-allowed', !stockCheck.valid);
        button.classList.toggle('bg-blue-600', stockCheck.valid);
        button.classList.toggle('hover:bg-blue-700', stockCheck.valid);
    }
}

// Función para actualizar el stock mostrado en la UI
async function updateStockDisplays() {
    const stockElements = {
        // Productos de ropa deportiva
        'camiseta1': 'stock-camiseta1',
        'pantaloneta1': 'stock-pantaloneta1',
        'leggins1': 'stock-leggins1',
        'sudadera1': 'stock-sudadera1',
        'chaqueta1': 'stock-chaqueta1',
        'top1': 'stock-top1',
        'gorra1': 'stock-gorra1',
        'guantes1': 'stock-guantes1',
        'cinturon1': 'stock-cinturon1',
        'rodilleras1': 'stock-rodilleras1',
        
        // Productos de uniformes
        'empresarial1': 'stock-empresarial1',
        'medico1': 'stock-medico1',
        'escolar1': 'stock-escolar1',
        'chef1': 'stock-chef1',
        'seguridad1': 'stock-seguridad1',
        'industrial1': 'stock-industrial1',
        'corbata1': 'stock-corbata1',
        'panuela1': 'stock-panuela1',
        'gorra11': 'stock-gorra11',
        'chaleco1': 'stock-chaleco1'
    };

    for (const [productId, elementId] of Object.entries(stockElements)) {
        const element = document.getElementById(elementId);
        if (!element) continue;
        
        const stockData = await getProductStock(productId);
        let totalStock = 0;
        
        if (productId.includes('gorra') || productId.includes('cinturon') || 
            productId.includes('corbata') || productId.includes('panuela')) {
            totalStock = stockData.default?.quantity || stockData;
        } else if (productId.includes('guantes') || productId.includes('rodilleras') || 
                  productId.includes('chaleco')) {
            for (const size of ['S', 'M', 'L', 'XL', 'XXL', 'UNICA']) {
                const stockItem = stockData[size] || stockData[size.toUpperCase()] || stockData[size.toLowerCase()];
                if (stockItem) totalStock += stockItem.quantity || 0;
            }
        } else {
            for (const item of Object.values(stockData)) {
                totalStock += typeof item === 'object' ? item.quantity || 0 : item || 0;
            }
        }
        
        element.textContent = `Stock: ${totalStock}`;
        element.className = '';
        
        if (totalStock > 10) {
            element.classList.add('text-green-600');
        } else if (totalStock > 0) {
            element.classList.add('text-yellow-600');
        } else {
            element.classList.add('text-red-600');
        }
    }
}

// Función para actualizar el modal del carrito
function updateCartModal() {
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (cartSummary) cartSummary.classList.add('hidden');
    } else {
        if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
        if (cartSummary) cartSummary.classList.remove('hidden');
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'flex justify-between items-center py-4 border-b border-gray-200 cart-item';
            cartItemElement.innerHTML = `
                <div class="flex items-center space-x-4 w-2/3">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div>
                        <h4 class="font-medium">${item.name}</h4>
                        <p class="text-sm text-gray-600">${item.category || (item.id.includes('empresarial') || item.id.includes('medico') || item.id.includes('escolar') || item.id.includes('chef') || item.id.includes('seguridad') || item.id.includes('industrial') ? 'Uniformes' : 'Ropa Deportiva')}</p>
                        ${item.size ? `<p class="text-xs text-gray-500">Talla: ${item.size}</p>` : ''}
                        ${item.color ? `<p class="text-xs text-gray-500">Color: ${item.color}</p>` : ''}
                        <p class="text-sm text-gray-500">${formatPrice(item.price)} c/u</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <button class="quantity-btn decrease-quantity px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" data-id="${item.id}">-</button>
                        <span class="quantity w-6 text-center">${item.quantity}</span>
                        <button class="quantity-btn increase-quantity px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" data-id="${item.id}">+</button>
                    </div>
                    <div class="text-right min-w-[100px]">
                        <p class="text-blue-600 font-medium text-lg">${formatPrice(itemTotal)}</p>
                        <button class="remove-item-btn text-gray-500 hover:text-blue-600 text-sm" data-id="${item.id}">
                            <i class="fas fa-trash mr-1"></i>Eliminar
                        </button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        // Calcular envío (ejemplo: 10% del subtotal con mínimo $5,000)
        const shipping = Math.max(subtotal * 0.1, 5000);
        const total = subtotal + shipping;
        
        if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
        if (cartShipping) cartShipping.textContent = formatPrice(shipping);
        if (cartTotal) cartTotal.textContent = formatPrice(total);
    }
    
    // Agregar event listeners a los botones de cantidad
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
    
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

// Función para aumentar cantidad en el carrito
async function increaseQuantity(id) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    const stockCheck = await checkStock(item.id, item.size, item.color, item.quantity + 1);
    
    if (!stockCheck.valid) {
        showNotification(stockCheck.message || 'No hay suficiente stock', 'error');
        return;
    }
    
    item.quantity++;
    saveCart();
    updateCartModal();
    updateCartCount();
    showNotification('Cantidad actualizada');
    updateAddToCartButtons();
    updateStockDisplays();
}

// Función para disminuir cantidad en el carrito
function decreaseQuantity(id) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity--;
            showNotification('Cantidad actualizada');
        } else {
            cart.splice(itemIndex, 1);
            showNotification('Producto eliminado');
        }
        saveCart();
        updateCartModal();
        updateCartCount();
        updateAddToCartButtons();
        updateStockDisplays();
    }
}

// Función para eliminar item del carrito
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartModal();
    updateCartCount();
    showNotification('Producto eliminado');
    updateAddToCartButtons();
    updateStockDisplays();
}

// Función para vaciar el carrito
function clearCart() {
    if (cart.length === 0) {
        showNotification('El carrito ya está vacío');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        saveCart();
        updateCartModal();
        updateCartCount();
        showNotification('Carrito vaciado');
        updateAddToCartButtons();
        updateStockDisplays();
    }
}

// Event listeners para el carrito
if (cartIcon && cartModal) {
    cartIcon.addEventListener('click', function() {
        cartModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        updateCartModal();
    });
}

if (closeCart && cartModal) {
    closeCart.addEventListener('click', function() {
        cartModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });
}

if (cartModal) {
    cartModal.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            cartModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToCheckout);
}

// Event listeners para selectores de talla y color
document.querySelectorAll('.size-btn').forEach(button => {
    button.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        if (productCard) {
            productCard.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.remove('selected', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            this.classList.add('selected', 'bg-blue-500', 'text-white');
            this.classList.remove('bg-gray-200');
        }
        updateAddToCartButtons();
    });
});

document.querySelectorAll('.color-btn').forEach(button => {
    button.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        if (productCard) {
            productCard.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('selected', 'ring-2', 'ring-offset-2', 'ring-blue-500');
            });
            this.classList.add('selected', 'ring-2', 'ring-offset-2', 'ring-blue-500');
        }
        updateAddToCartButtons();
    });
});

// Event listeners para botones "Añadir al carrito"
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const productCard = this.closest('.product-card');
        if (!productCard) return;
        
        const sizeSelectors = productCard.querySelectorAll('.size-btn');
        const colorSelectors = productCard.querySelectorAll('.color-btn');
        
        let size = null, color = null;
        const productId = this.dataset.id;
        
        // Determinar tipo de producto
        const isAccessory = productId.includes('gorra') || productId.includes('cinturon') || 
                          productId.includes('corbata') || productId.includes('panuela');
        const isSizeOnly = productId.includes('guantes') || productId.includes('rodilleras') || 
                         productId.includes('chaleco');
        
        // Solo requerir talla si el producto no es un accesorio
        if (sizeSelectors.length > 0 && !isAccessory) {
            const selectedSize = productCard.querySelector('.size-btn.selected');
            if (!selectedSize && !isSizeOnly) {
                showNotification('Por favor selecciona una talla', 'error');
                return;
            }
            size = selectedSize?.dataset.size;
        }
        
        // Solo requerir color si el producto no es accesorio ni solo talla
        if (colorSelectors.length > 0 && !isAccessory && !isSizeOnly) {
            const selectedColor = productCard.querySelector('.color-btn.selected');
            if (!selectedColor) {
                showNotification('Por favor selecciona un color', 'error');
                return;
            }
            color = selectedColor?.dataset.color;
        }
        
        // Verificación de stock consistente
        const stockCheck = await checkStock(productId, size, color, 1);
        if (!stockCheck.valid) {
            showNotification(stockCheck.message || 'No hay suficiente stock', 'error');
            return;
        }
        
        const product = {
            id: productId,
            name: this.dataset.name,
            price: parseFloat(this.dataset.price),
            image: this.dataset.image,
            category: this.dataset.category || (productId.includes('empresarial') || 
                                             productId.includes('medico') || 
                                             productId.includes('escolar') || 
                                             productId.includes('chef') || 
                                             productId.includes('seguridad') || 
                                             productId.includes('industrial') ? 'Uniformes' : 'Ropa Deportiva'),
            quantity: 1,
            size: size || undefined,
            color: color || undefined
        };
        
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && 
            item.size === product.size && 
            item.color === product.color
        );
        
        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
            showNotification('Cantidad actualizada en el carrito');
        } else {
            cart.push(product);
            showNotification('Producto agregado al carrito');
        }
        
        saveCart();
        updateCartCount();
        updateCartModal();
        updateAddToCartButtons();
        updateStockDisplays();
    });
});

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg flex items-center notification animate-fade-in`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateStockDisplays();
    updateAddToCartButtons();
});