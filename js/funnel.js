/**
 * Perú Sano SRL - Controlador Modular del Embudo de Conversión (3 Pasos)
 * Toda conexión y solicitud se gestiona directamente vía formulario (FormSubmit AJAX)
 */
(function () {
  'use strict';

  const FORMSUBMIT_ENDPOINT =
    'https://formsubmit.co/ajax/serviciosanitariosdelperu@gmail.com';

  const DEFAULT_SUBMIT_TEXT = 'Solicitar Desinfección y Certificado Ahora';
  const LOADING_SUBMIT_TEXT = 'Enviando solicitud a central...';

  const STEP_LABELS = {
    1: 'PASO 1 DE 3 • SELECCIONA TU VEHÍCULO',
    2: 'PASO 2 DE 3 • DATOS DE TU UNIDAD',
    3: 'PASO 3 DE 3 • SOLICITUD CONFIRMADA'
  };

  const state = {
    currentStep: 1,
    vehicle: '',
    placa: '',
    telefono: '',
    ubicacion: '',
    orderCode: '',
    isSubmitting: false
  };

  const dom = {
    progressBar: document.getElementById('funnel-progress-bar'),
    stepLabel: document.getElementById('funnel-step-label'),

    step1: document.getElementById('step-1'),
    step2: document.getElementById('step-2'),
    step3: document.getElementById('step-3'),

    vehicleCards: document.querySelectorAll('.vehicle-card'),
    selectedVehicleBadge: document.getElementById('selected-vehicle-badge'),
    btnBackStep1: document.getElementById('btn-back-step-1'),

    form: document.getElementById('funnel-form'),
    inputPlaca: document.getElementById('input-placa'),
    inputTelefono: document.getElementById('input-telefono'),
    inputUbicacion: document.getElementById('input-ubicacion'),
    formErrorMsg: document.getElementById('form-error-msg'),
    btnSubmit: document.getElementById('btn-submit-funnel'),

    summaryOrderCode: document.getElementById('summary-order-code'),
    summaryStatus: document.getElementById('summary-status'),
    summaryVehicle: document.getElementById('summary-vehicle'),
    summaryPlaca: document.getElementById('summary-placa'),
    summaryTelefono: document.getElementById('summary-telefono'),
    summaryUbicacion: document.getElementById('summary-ubicacion'),
    btnResetFunnel: document.getElementById('btn-reset-funnel')
  };

  function generateOrderCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PS-2026-${randomNum}`;
  }

  function formatPeruTimestamp() {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Lima'
    }).format(new Date());
  }

  function normalizePlaca(value) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 10);
  }

  function normalizeTelefono(value) {
    return value.replace(/[^\d+\s-]/g, '').slice(0, 15);
  }

  function formatPhoneDisplay(rawPhone) {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('51') && digits.length >= 11) {
      return `+${digits}`;
    }
    return `+51 ${digits}`;
  }

  function showError(message, mailtoHref) {
    if (!dom.formErrorMsg) return;
    dom.formErrorMsg.textContent = '';

    const p = document.createElement('p');
    p.textContent = message;
    dom.formErrorMsg.appendChild(p);

    if (mailtoHref) {
      const link = document.createElement('a');
      link.href = mailtoHref;
      link.className =
        'inline-block mt-2 underline font-extrabold text-rojo-700 hover:text-rojo-800';
      link.textContent = 'Enviar solicitud directamente por su aplicación de correo →';
      dom.formErrorMsg.appendChild(link);
    }

    dom.formErrorMsg.classList.remove('hidden');
  }

  function buildMailtoUrl(data) {
    const subject = `URGENTE: Solicitud Certificado SENASA - Placa ${data.placa}`;
    const body = [
      `Código de Orden: ${data.orderCode}`,
      `Tipo de Vehículo: ${data.vehicle}`,
      `Placa del Vehículo: ${data.placa}`,
      `Celular de Contacto: ${data.telefono}`,
      `Garita / Ubicación: ${data.ubicacion}`,
      `Fecha y Hora: ${data.fecha}`
    ].join('\n');

    return `mailto:serviciosanitariosdelperu@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  function clearError() {
    if (!dom.formErrorMsg) return;
    dom.formErrorMsg.textContent = '';
    dom.formErrorMsg.classList.add('hidden');
  }

  function setSubmitting(isLoading) {
    state.isSubmitting = isLoading;
    if (!dom.btnSubmit) return;

    dom.btnSubmit.disabled = isLoading;
    if (isLoading) {
      dom.btnSubmit.classList.add('opacity-80', 'cursor-wait');
      dom.btnSubmit.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span>${LOADING_SUBMIT_TEXT}</span>
      `;
    } else {
      dom.btnSubmit.classList.remove('opacity-80', 'cursor-wait');
      dom.btnSubmit.innerHTML = `
        <span>${DEFAULT_SUBMIT_TEXT}</span>
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      `;
    }
  }

  function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    const steps = [dom.step1, dom.step2, dom.step3];
    steps.forEach((stepEl, index) => {
      if (!stepEl) return;
      const isTarget = index + 1 === stepNumber;
      if (isTarget) {
        stepEl.classList.remove('hidden', 'funnel-step-enter');
        void stepEl.offsetWidth;
        stepEl.classList.add('funnel-step-enter');
      } else {
        stepEl.classList.add('hidden');
      }
    });

    if (dom.progressBar) {
      const widths = { 1: '33.33%', 2: '66.66%', 3: '100%' };
      dom.progressBar.style.width = widths[stepNumber] || '33.33%';
    }

    if (dom.stepLabel) {
      dom.stepLabel.textContent = STEP_LABELS[stepNumber] || STEP_LABELS[1];
    }

    if (stepNumber === 2 && dom.inputPlaca) {
      setTimeout(() => dom.inputPlaca.focus(), 120);
    }
  }

  function handleVehicleSelection(card) {
    const vehicleType = card.getAttribute('data-vehicle');
    if (!vehicleType) return;

    state.vehicle = vehicleType;

    dom.vehicleCards.forEach((el) => el.classList.remove('is-selected'));
    card.classList.add('is-selected');

    if (dom.selectedVehicleBadge) {
      dom.selectedVehicleBadge.textContent = vehicleType;
    }

    clearError();
    goToStep(2);
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (state.isSubmitting) return;

    clearError();

    const rawPlaca = dom.inputPlaca ? dom.inputPlaca.value.trim() : '';
    const rawTelefono = dom.inputTelefono ? dom.inputTelefono.value.trim() : '';
    const rawUbicacion = dom.inputUbicacion ? dom.inputUbicacion.value.trim() : '';

    const placa = normalizePlaca(rawPlaca);
    const digitsPhone = rawTelefono.replace(/\D/g, '');

    if (!state.vehicle) {
      showError('Por favor, seleccione primero el tipo de vehículo.');
      goToStep(1);
      return;
    }

    if (placa.length < 5) {
      showError('Ingrese una placa vehicular válida (ej. ABC-123).');
      if (dom.inputPlaca) dom.inputPlaca.focus();
      return;
    }

    if (digitsPhone.length < 9) {
      showError('Ingrese un número celular de contacto válido de 9 dígitos.');
      if (dom.inputTelefono) dom.inputTelefono.focus();
      return;
    }

    const orderCode = generateOrderCode();
    const formattedPhone = formatPhoneDisplay(rawTelefono);
    const ubicacionFinal = rawUbicacion || 'Por confirmar en coordinación';
    const fechaSolicitud = formatPeruTimestamp();

    state.placa = placa;
    state.telefono = formattedPhone;
    state.ubicacion = ubicacionFinal;
    state.orderCode = orderCode;

    const mailtoFallback = buildMailtoUrl({
      orderCode,
      vehicle: state.vehicle,
      placa,
      telefono: formattedPhone,
      ubicacion: ubicacionFinal,
      fecha: fechaSolicitud
    });

    if (window.location.protocol === 'file:') {
      showError(
        'Estás abriendo la página como archivo local (file://). Para enviar automáticamente a serviciosanitariosdelperu@gmail.com, ábrela desde GitHub Pages (https://) o un servidor local (http://localhost).',
        mailtoFallback
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append(
        '_subject',
        `URGENTE: Solicitud Certificado SENASA - Placa ${placa}`
      );
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      formData.append('Código de Orden', orderCode);
      formData.append('Tipo de Vehículo', state.vehicle);
      formData.append('Placa del Vehículo', placa);
      formData.append('Celular de Contacto', formattedPhone);
      formData.append('Garita / Ubicación', ubicacionFinal);
      formData.append('Fecha y Hora de Solicitud', fechaSolicitud);

      const response = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });

      const result = await response.json().catch(() => ({}));
      const isSuccess =
        response.ok && (result.success === true || result.success === 'true');

      if (!isSuccess) {
        const serverMsg = String(result.message || '');
        if (serverMsg.toLowerCase().includes('activation')) {
          throw new Error(
            'El correo serviciosanitariosdelperu@gmail.com aún requiere activación en FormSubmit. Revisa la bandeja de entrada (o Spam) y haz clic en "Activate Form".'
          );
        }
        throw new Error(
          serverMsg || 'No se pudo completar el envío al servidor de correo.'
        );
      }

      renderConfirmationStep();
      goToStep(3);
    } catch (error) {
      showError(
        error && error.message
          ? error.message
          : 'Ocurrió un inconveniente temporal al enviar su solicitud. Por favor, intente nuevamente.',
        mailtoFallback
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderConfirmationStep() {
    if (dom.summaryOrderCode) {
      dom.summaryOrderCode.textContent = state.orderCode;
    }
    if (dom.summaryStatus) {
      dom.summaryStatus.textContent =
        'Solicitud enviada al correo central de Perú Sano SRL';
    }
    if (dom.summaryVehicle) {
      dom.summaryVehicle.textContent = state.vehicle;
    }
    if (dom.summaryPlaca) {
      dom.summaryPlaca.textContent = state.placa;
    }
    if (dom.summaryTelefono) {
      dom.summaryTelefono.textContent = state.telefono;
    }
    if (dom.summaryUbicacion) {
      dom.summaryUbicacion.textContent = state.ubicacion;
    }
  }

  function resetFunnel() {
    state.vehicle = '';
    state.placa = '';
    state.telefono = '';
    state.ubicacion = '';
    state.orderCode = '';

    dom.vehicleCards.forEach((el) => el.classList.remove('is-selected'));
    if (dom.form) dom.form.reset();
    clearError();
    goToStep(1);
  }

  function init() {
    if (!dom.step1 || !dom.step2 || !dom.step3) return;

    dom.vehicleCards.forEach((card) => {
      card.addEventListener('click', () => handleVehicleSelection(card));
    });

    if (dom.btnBackStep1) {
      dom.btnBackStep1.addEventListener('click', () => {
        clearError();
        goToStep(1);
      });
    }

    if (dom.inputPlaca) {
      dom.inputPlaca.addEventListener('input', (e) => {
        e.target.value = normalizePlaca(e.target.value);
      });
    }

    if (dom.inputTelefono) {
      dom.inputTelefono.addEventListener('input', (e) => {
        e.target.value = normalizeTelefono(e.target.value);
      });
    }

    if (dom.form) {
      dom.form.addEventListener('submit', handleFormSubmit);
    }

    if (dom.btnResetFunnel) {
      dom.btnResetFunnel.addEventListener('click', resetFunnel);
    }

    goToStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
