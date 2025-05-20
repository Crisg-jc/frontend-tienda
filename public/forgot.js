document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const submitBtn = document.getElementById('submitBtn');
  const messageBox = document.getElementById('messageBox');
  const buttonText = document.getElementById('buttonText');
  const buttonSpinner = document.getElementById('buttonSpinner');

  // Validación en tiempo real
  emailInput.addEventListener('input', validateEmail);

  // Manejar el envío del formulario
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail();

    if (!isEmailValid) return;

    try {
      setLoading(true);
      
      // Datos para enviar al backend
      const userData = {
        email: emailInput.value.trim()
      };

      // Llamada al backend
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Se ha enviado un enlace de restablecimiento a tu correo electrónico.', 'success');
        forgotPasswordForm.reset();
      } else {
        showMessage(result.message || 'Error al enviar el enlace de restablecimiento', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error de conexión. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setLoading(false);
    }
  });

  // Validar email
  function validateEmail() {
    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    emailError.textContent = 'Por favor ingresa un correo electrónico válido';
    emailError.hidden = isValid;
    emailInput.classList.toggle('invalid', !isValid);
    
    return isValid;
  }

  // Mostrar/ocultar spinner de carga
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    buttonText.hidden = isLoading;
    buttonSpinner.hidden = !isLoading;
  }

  // Mostrar mensajes
  function showMessage(message, type) {
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