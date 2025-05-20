document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const registerForm = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const submitBtn = document.getElementById('submitBtn');
  const messageBox = document.getElementById('messageBox');
  const buttonText = document.getElementById('buttonText');
  const buttonSpinner = document.getElementById('buttonSpinner');

  // Dominios permitidos
  const ALLOWED_DOMAINS = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];

  // Constantes de validación
  const MAX_EMAIL_LENGTH = 254;
  const MAX_LOCAL_PART_LENGTH = 64;
  const MIN_PASSWORD_LENGTH = 6;
  const MAX_PASSWORD_LENGTH = 16;

  // Validación en tiempo real
  emailInput.addEventListener('input', validateEmail);
  passwordInput.addEventListener('input', validatePassword);

  // Manejar el envío del formulario
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) return;

    try {
      setLoading(true);
      
      // Datos para enviar al backend
      const userData = {
        email: emailInput.value.trim(),
        password: passwordInput.value
      };

      // Llamada real al backend
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('¡Registro exitoso! Redirigiendo a la tienda...', 'success');
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = 'tienda.html';
        }, 2000);
      } else {
        showMessage(result.message || 'Error al registrar el usuario', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  });

  // Validar email con todas las reglas
  function validateEmail() {
    const email = emailInput.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    if (email === '') {
      errorMessage = 'El correo electrónico es requerido';
      isValid = false;
    } else if (email.length > MAX_EMAIL_LENGTH) {
      errorMessage = `El correo no puede exceder los ${MAX_EMAIL_LENGTH} caracteres`;
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage = 'Formato de correo electrónico inválido';
      isValid = false;
    } else {
      const [localPart, domain] = email.split('@');
      
      if (localPart.length > MAX_LOCAL_PART_LENGTH) {
        errorMessage = `La parte antes del @ no puede exceder ${MAX_LOCAL_PART_LENGTH} caracteres`;
        isValid = false;
      } else if (!ALLOWED_DOMAINS.includes(domain)) {
        errorMessage = `Dominios permitidos: ${ALLOWED_DOMAINS.map(d => `@${d}`).join(', ')}`;
        isValid = false;
      } else if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
        errorMessage = 'Solo se permiten letras, números, puntos (.), guiones bajos (_) y medios (-)';
        isValid = false;
      } else if (localPart.startsWith('.') || localPart.endsWith('.')) {
        errorMessage = 'El correo no puede comenzar o terminar con punto';
        isValid = false;
      } else if (localPart.includes('..')) {
        errorMessage = 'No se permiten dos puntos seguidos (..)';
        isValid = false;
      }
    }
    
    emailError.textContent = errorMessage;
    emailError.hidden = isValid;
    emailInput.classList.toggle('invalid', !isValid);
    
    return isValid;
  }

  // Validar contraseña
  function validatePassword() {
    const password = passwordInput.value;
    let isValid = true;
    let errorMessage = '';
    
    if (password === '') {
      errorMessage = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errorMessage = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
      isValid = false;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errorMessage = `La contraseña no puede exceder los ${MAX_PASSWORD_LENGTH} caracteres`;
      isValid = false;
    }
    
    passwordError.textContent = errorMessage;
    passwordError.hidden = isValid;
    passwordInput.classList.toggle('invalid', !isValid);
    
    return isValid;
  }

  // Mostrar/ocultar spinner de carga
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    buttonText.hidden = isLoading;
    buttonSpinner.hidden = !isLoading;
  }

  // Mostrar mensajes de éxito/error
  function showMessage(message, type) {
    // Crear icono según el tipo
    const icon = type === 'success' ? 
      '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' :
      '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';
    
    messageBox.innerHTML = `${icon} ${message}`;
    messageBox.className = `message-box ${type}`;
    messageBox.hidden = false;
    
    // Ocultar mensajes de error después de 5 segundos
    if (type === 'error') {
      setTimeout(() => {
        messageBox.hidden = true;
      }, 5000);
    }
  }
});