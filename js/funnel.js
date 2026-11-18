/**
 * Perú Sano SRL - Controlador Modular del Embudo de Conversión (3 Pasos)
 * Envío directo y rápido hacia Gmail (serviciosanitariosdelperu@gmail.com)
 * mediante Google Apps Script Web App propio (sin depender de terceros como FormSubmit).
 */
(function () {
  'use strict';

  // Pegar aquí la URL /exec generada al implementar scripts/google-apps-script.gs
  // desde la cuenta serviciosanitariosdelperu@gmail.com
  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzd0ihflBl1R7lfx-bLUefJaPRm_uIWtJDRgpmnqOxgyMTArxDCPOm3G2dvSm9IBvjE/exec';

  const REQUEST_TIMEOUT_MS = 12000;
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

  async function postToGoogleScript(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // text/plain evita el preflight CORS OPTIONS en Google Apps Script y acelera el envío
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(
          result.error || 'No se recibió confirmación del servidor de correo.'
        );
      }
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
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

    if (!GOOGLE_SCRIPT_URL) {
      showError(
        'Falta configurar la URL del servicio de correo directo (GOOGLE_SCRIPT_URL en js/funnel.js). Revisa el README.md para activarlo en 2 minutos.',
        mailtoFallback
      );
      return;
    }

    setSubmitting(true);

    try {
      await postToGoogleScript({
        orderCode,
        vehicle: state.vehicle,
        placa,
        telefono: formattedPhone,
        ubicacion: ubicacionFinal,
        timestamp: fechaSolicitud,
        userAgent: navigator.userAgent
      });

      renderConfirmationStep();
      goToStep(3);
    } catch (error) {
      const msg =
        error && error.name === 'AbortError'
          ? 'La conexión tardó demasiado en responder. Por favor, intente nuevamente o use el enlace directo de correo.'
          : error && error.message
          ? error.message
          : 'Ocurrió un inconveniente temporal al enviar su solicitud.';
      showError(msg, mailtoFallback);
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

  // =========================================================================
  // Segundo Embudo: Contacto Control de Plagas (PerusanoApp)
  // =========================================================================
  function initPlagasFunnel() {
    const pDom = {
      progressBar: document.getElementById('plagas-progress-bar'),
      stepLabel: document.getElementById('plagas-step-label'),
      step1: document.getElementById('plagas-step-1'),
      step2: document.getElementById('plagas-step-2'),
      step3: document.getElementById('plagas-step-3'),
      cards: document.querySelectorAll('.plagas-card'),
      selectedBadge: document.getElementById('plagas-selected-badge'),
      btnBack: document.getElementById('plagas-btn-back'),
      form: document.getElementById('plagas-form'),
      inputNombre: document.getElementById('plagas-input-nombre'),
      inputTelefono: document.getElementById('plagas-input-telefono'),
      inputUbicacion: document.getElementById('plagas-input-ubicacion'),
      errorMsg: document.getElementById('plagas-error-msg'),
      btnSubmit: document.getElementById('plagas-btn-submit'),
      summaryOrder: document.getElementById('plagas-summary-order'),
      summaryService: document.getElementById('plagas-summary-service'),
      summaryNombre: document.getElementById('plagas-summary-nombre'),
      summaryTelefono: document.getElementById('plagas-summary-telefono'),
      summaryUbicacion: document.getElementById('plagas-summary-ubicacion'),
      btnReset: document.getElementById('plagas-btn-reset')
    };

    if (!pDom.step1 || !pDom.step2 || !pDom.step3) return;

    const pState = {
      service: '',
      isSubmitting: false
    };

    const labels = {
      1: 'PASO 1 DE 3 • ELIGE TU PLAN DE SUSCRIPCIÓN',
      2: 'PASO 2 DE 3 • DATOS DE CONTACTO',
      3: 'PASO 3 DE 3 • SOLICITUD ENVIADA'
    };

    function showPlagasError(msg, mailtoHref) {
      if (!pDom.errorMsg) return;
      pDom.errorMsg.textContent = '';
      const p = document.createElement('p');
      p.textContent = msg;
      pDom.errorMsg.appendChild(p);
      if (mailtoHref) {
        const link = document.createElement('a');
        link.href = mailtoHref;
        link.className =
          'inline-block mt-2 underline font-extrabold text-rojo-700 hover:text-rojo-800';
        link.textContent =
          'Enviar solicitud directamente por su aplicación de correo →';
        pDom.errorMsg.appendChild(link);
      }
      pDom.errorMsg.classList.remove('hidden');
    }

    function clearPlagasError() {
      if (!pDom.errorMsg) return;
      pDom.errorMsg.textContent = '';
      pDom.errorMsg.classList.add('hidden');
    }

    function setPlagasSubmitting(isLoading) {
      pState.isSubmitting = isLoading;
      if (!pDom.btnSubmit) return;
      pDom.btnSubmit.disabled = isLoading;
      if (isLoading) {
        pDom.btnSubmit.classList.add('opacity-80', 'cursor-wait');
        pDom.btnSubmit.innerHTML = `<span>${LOADING_SUBMIT_TEXT}</span>`;
      } else {
        pDom.btnSubmit.classList.remove('opacity-80', 'cursor-wait');
        pDom.btnSubmit.innerHTML = `
          <span>Solicitar Suscripción PerusanoApp</span>
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        `;
      }
    }

    function goPlagasStep(stepNumber) {
      [pDom.step1, pDom.step2, pDom.step3].forEach((el, idx) => {
        if (!el) return;
        if (idx + 1 === stepNumber) {
          el.classList.remove('hidden', 'funnel-step-enter');
          void el.offsetWidth;
          el.classList.add('funnel-step-enter');
        } else {
          el.classList.add('hidden');
        }
      });

      if (pDom.progressBar) {
        const widths = { 1: '33.33%', 2: '66.66%', 3: '100%' };
        pDom.progressBar.style.width = widths[stepNumber] || '33.33%';
      }
      if (pDom.stepLabel) {
        pDom.stepLabel.textContent = labels[stepNumber] || labels[1];
      }
      if (stepNumber === 2 && pDom.inputNombre) {
        setTimeout(() => pDom.inputNombre.focus(), 120);
      }
    }

    pDom.cards.forEach((card) => {
      card.addEventListener('click', () => {
        const service = card.getAttribute('data-plagas-service');
        if (!service) return;
        pState.service = service;
        pDom.cards.forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        if (pDom.selectedBadge) pDom.selectedBadge.textContent = service;
        clearPlagasError();
        goPlagasStep(2);
      });
    });

    if (pDom.btnBack) {
      pDom.btnBack.addEventListener('click', () => {
        clearPlagasError();
        goPlagasStep(1);
      });
    }

    if (pDom.inputTelefono) {
      pDom.inputTelefono.addEventListener('input', (e) => {
        e.target.value = normalizeTelefono(e.target.value);
      });
    }

    if (pDom.form) {
      pDom.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (pState.isSubmitting) return;
        clearPlagasError();

        const nombre = pDom.inputNombre ? pDom.inputNombre.value.trim() : '';
        const rawPhone = pDom.inputTelefono ? pDom.inputTelefono.value.trim() : '';
        const ubicacion =
          (pDom.inputUbicacion ? pDom.inputUbicacion.value.trim() : '') ||
          'Por confirmar';

        if (!pState.service) {
          goPlagasStep(1);
          return;
        }
        if (nombre.length < 2) {
          showPlagasError('Ingrese su nombre o razón social.');
          if (pDom.inputNombre) pDom.inputNombre.focus();
          return;
        }
        if (rawPhone.replace(/\D/g, '').length < 9) {
          showPlagasError('Ingrese un número celular de contacto válido de 9 dígitos.');
          if (pDom.inputTelefono) pDom.inputTelefono.focus();
          return;
        }

        const orderCode = `PP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const formattedPhone = formatPhoneDisplay(rawPhone);
        const timestamp = formatPeruTimestamp();
        const mailtoFallback = buildMailtoUrl({
          orderCode,
          vehicle: `Control de Plagas (${pState.service})`,
          placa: nombre,
          telefono: formattedPhone,
          ubicacion,
          fecha: timestamp
        });

        setPlagasSubmitting(true);
        try {
          await postToGoogleScript({
            orderCode,
            vehicle: `Control de Plagas (${pState.service})`,
            placa: nombre,
            telefono: formattedPhone,
            ubicacion,
            timestamp,
            userAgent: navigator.userAgent
          });

          if (pDom.summaryOrder) pDom.summaryOrder.textContent = orderCode;
          if (pDom.summaryService) pDom.summaryService.textContent = pState.service;
          if (pDom.summaryNombre) pDom.summaryNombre.textContent = nombre;
          if (pDom.summaryTelefono) pDom.summaryTelefono.textContent = formattedPhone;
          if (pDom.summaryUbicacion) pDom.summaryUbicacion.textContent = ubicacion;
          goPlagasStep(3);
        } catch (err) {
          showPlagasError(
            err && err.message
              ? err.message
              : 'Ocurrió un inconveniente temporal al enviar su solicitud.',
            mailtoFallback
          );
        } finally {
          setPlagasSubmitting(false);
        }
      });
    }

    if (pDom.btnReset) {
      pDom.btnReset.addEventListener('click', () => {
        pState.service = '';
        pDom.cards.forEach((c) => c.classList.remove('is-selected'));
        if (pDom.form) pDom.form.reset();
        clearPlagasError();
        goPlagasStep(1);
      });
    }

    goPlagasStep(1);
  }

  function initAll() {
    init();
    initPlagasFunnel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
