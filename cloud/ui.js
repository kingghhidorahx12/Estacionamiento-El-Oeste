
/* Cloud-only composition. Money, permissions and mutations remain in app.js
   and the authoritative API. These functions replace historical views at build. */

function heading(eyebrow, title, subtitle, action = '') {
  const back = [
    'pensiones',
    'banos',
    'reportes',
    'tarjetas',
    'ajustes',
    'respaldos',
    'actualizaciones',
    'equipo',
    'perifericos',
    'clientes',
    'servicios'
  ].includes(tab)
    ? `<button class="back-link" data-tab="${tab==='pensiones'?'inicio':'admin'}">${icon('back')} ${tab==='pensiones'?'Operación':'Resumen'}</button>`
    : '';

  return `
    <header class="page-heading">
      <div>
        ${back}
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        ${subtitle ? `<p class="page-description">${subtitle}</p>` : ''}
      </div>
      ${action ? `<div class="heading-action">${action}</div>` : ''}
    </header>`;
}

function empty(title, text, action = '') {
  return `
    <div class="empty">
      <img
        src="/assets/oeste-patio-pintado.png"
        alt=""
        width="260"
        height="110">
      <h3>${title}</h3>
      <p>${text}</p>
      ${action}
    </div>`;
}

function home() {
  const n = state.stays.length;
  const r = state.report;
  const capacity = state.capacity ?? 60;

  const bathroomsEnabled =
    Number.isInteger(state.config?.bathroomPrice) &&
    state.config.bathroomPrice > 0;

  const bathroomAction = bathroomsEnabled
    ? `
      <div class="compact-actions gap-top">
        <button
          type="button"
          class="secondary"
          data-tab="banos">
          ${icon('check')} Registrar acceso a baños
        </button>
      </div>`
    : '';

  $('#main').innerHTML =
    heading(
      'OPERACIÓN',
      'Entradas y salidas',
      'Una tarjeta. El sistema identifica el movimiento.'
    ) +
    `
    <section
      class="work-status"
      aria-label="Estado del estacionamiento">

      <span>
        <b>${n}<small> / ${capacity}</small></b>
        <small>Ocupados</small>
      </span>

      <span>
        <b>${capacity - n}</b>
        <small>Disponibles</small>
      </span>

      <span>
        <b>${money(r.total)}</b>
        <small>
          ${state.role === 'admin'
            ? 'Ingresos de hoy'
            : 'Tu cobro de hoy'}
        </small>
      </span>

    </section>

    ${bathroomAction}

    <div class="section-heading">
      <h2>
        En el estacionamiento
        <span class="count">${n}</span>
      </h2>

      <label class="search">
        ${icon('search')}
        <input
          id="search"
          placeholder="Placa o tarjeta"
          aria-label="Buscar vehículo">
      </label>
    </div>

    <div class="vehicle-grid" id="vehicle-grid"></div>`;

  renderVehicles();
  $('#search').addEventListener('input', renderVehicles);
}

function renderVehicles() {
  if(state.config.catalog)return catalogRenderVehicles();
  const query = ($('#search')?.value || '')
    .toLocaleLowerCase('es-MX');

  const rows = state.stays.filter(s =>
    (s.vehicle + ' ' + s.card_id + ' ' + cardNumber(s.card_id))
      .toLocaleLowerCase('es-MX')
      .includes(query)
  );

  $('#vehicle-grid').innerHTML = rows.map(s => {
    const v = JSON.parse(s.vehicle);
    const service = JSON.parse(s.service);
    const q = s.quote;

    return `
      <article class="vehicle-row">

        <div
          class="card-badge"
          aria-label="Tarjeta ${cardNumber(s.card_id)}">
          ${icon('cards')}
          <b>${cardNumber(s.card_id)}</b>
        </div>

        <div class="vehicle-main">
          <h3 class="plate">
            ${esc(v.plate || 'Sin placas')}
          </h3>

          <p class="car-meta">
            ${esc(modes[service.mode])}
            ${service.wash &&
              !['day_wash', 'wash_only'].includes(service.mode)
                ? ' · Lavado'
                : ''}
            ${service.preferred &&
              ['hourly', 'free'].includes(service.mode)
                ? ' · Preferencial'
                : ''}
          </p>

          <p class="vehicle-time">
            ${clock(s.entered)}
            <span>· ${duration(s.entered)}</span>
          </p>

          ${v.notes
            ? `<p class="fine">${esc(v.notes)}</p>`
            : ''}
        </div>

        <div class="amount ${q.blocked ? 'needs-review' : ''}">
          ${q.blocked
            ? '<small>Revisar cobertura</small>'
            : ''}

          <b>${money(q.total)}</b>

          ${q.blocked
            ? '<small>Importe base</small>'
            : ''}
        </div>

        <button
          class="icon-button exit-button"
          data-checkout="${s.id}"
          aria-label="Revisar salida de ${esc(
            v.plate || 'tarjeta ' + cardNumber(s.card_id)
          )}">
          ${icon('arrow')}
        </button>

      </article>`;
  }).join('') || empty(
    query
      ? 'Sin coincidencias'
      : 'Listos para la siguiente llegada',
    query
      ? 'Busca por placa o número de tarjeta.'
      : 'Escanea una tarjeta para comenzar.'
  );
}

async function adminView() {
  if(state.config.catalog)return catalogAdminView();
  const r = state.report;
  const c = r.categories;
  const n = state.stays.length;
  const capacity = state.capacity ?? 60;

  const sum = keys =>
    keys.reduce((v, k) => v + (c[k] || 0), 0);

  const bathroomsEnabled =
    Number.isInteger(state.config?.bathroomPrice) &&
    state.config.bathroomPrice > 0;

  const modules = [
    ['reportes', 'report', 'Reportes', 'Ingresos y periodos'],
    ['pensiones', 'calendar', 'Pensiones', 'Contratos y pagos'],

    ...(bathroomsEnabled
      ? [['banos', 'check', 'Baños', 'Cobro por persona']]
      : []),

    ['tarjetas', 'cards', 'Tarjetas', 'QR e impresión'],
    ['equipo', 'shield', 'Equipo', 'Personas y accesos']
  ];

  const maintenance = [
    ['ajustes', 'settings', 'Tarifas y horarios'],
    ['perifericos', 'print', 'Periféricos'],
    ['respaldos', 'shield', 'Respaldos'],
    ['actualizaciones', 'download', 'Aplicación']
  ];

  const alerts = [
    ...state.stays
      .filter(s => s.quote.blocked)
      .map(s =>
        `Tarjeta ${cardNumber(s.card_id)} · ${s.quote.reason}`
      ),

    ...state.monthly
      .filter(m => !m.paid && m.end_at >= state.serverTime)
      .map(m =>
        `Mensualidad pendiente · ${
          JSON.parse(m.vehicle).plate || 'Sin placas'
        }`
      )
  ];

  const concepts = [
    [
      'Estacionamiento',
      sum([
        'parking_hourly_normal',
        'parking_hourly_preferred',
        'time_free_normal',
        'time_free_preferred',
        'day_addon'
      ])
    ],
    [
      'Lavados',
      sum([
        'wash_auto',
        'wash_camioneta',
        'wash_van',
        'wash_pickup'
      ])
    ],
    [
      'Pensiones',
      sum([
        'pension_temporary',
        'pension_monthly_12',
        'pension_monthly_24'
      ])
    ],
    ['Extravíos', c.lost_card || 0],

    ...(bathroomsEnabled
      ? [['Baños', c.bathroom || 0]]
      : [])
  ];

  $('#main').innerHTML =
    heading(
      'EL OESTE · ADMINISTRACIÓN',
      'Así va el día',
      dateTime(state.serverTime),
      `<button class="secondary" data-tab="inicio">
        ${icon('car')} Ver operación
      </button>`
    ) +
    `
    <section class="business-ledger">

      <div class="ledger-income">
        <span class="hero-label">Ingresos de hoy</span>
        <strong>${money(r.total)}</strong>
        <p>
          ${r.payments.length} pagos confirmados
          <span>· MXN</span>
        </p>
      </div>

      <div class="ledger-operation">

        <div class="ledger-occupancy">
          <span class="hero-label">Ocupación</span>

          <strong>
            ${n}<small> / ${capacity}</small>
          </strong>

          <p>${capacity - n} lugares disponibles</p>

          <div class="occupancy-track">
            <i
              data-occupancy="${Math.round(n / capacity * 100)}">
            </i>
          </div>
        </div>

        <div class="ledger-movements">
          <span>
            <b>${r.entries}</b>
            Entradas
          </span>

          <span>
            <b>${r.exits}</b>
            Salidas
          </span>
        </div>

      </div>
    </section>

    <section
      class="income-breakdown"
      aria-label="Ingresos por servicio"
      ${bathroomsEnabled
        ? 'style="grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr))"'
        : ''}>

      ${concepts.map(([label, total]) => `
        <div>
          <span>${label}</span>
          <b>${money(total)}</b>
        </div>
      `).join('')}

    </section>

    <nav class="admin-grid" aria-label="Administración">
      ${modules.map(([id, i, label, note]) => `
        <button class="admin-link" data-tab="${id}">
          ${icon(i)}
          <span>
            ${label}
            <small>${note}</small>
          </span>
          ${icon('arrow')}
        </button>
      `).join('')}
    </nav>

    ${alerts.length
      ? `
        <details class="attention-strip">
          <summary>
            ${icon('shield')}
            Requieren atención
            <b>${alerts.length}</b>
          </summary>

          <ul>
            ${alerts.map(a =>
              `<li>${esc(a)}</li>`
            ).join('')}
          </ul>
        </details>`
      : ''}

    <div class="overview-columns">

      <section class="panel chart-panel">

        <div class="row spread">
          <h2>Ingresos por día</h2>

          <div
            class="segmented"
            aria-label="Periodo de ingresos">

            <button
              data-period="7"
              aria-pressed="${overviewDays === 7}">
              7 días
            </button>

            <button
              data-period="30"
              aria-pressed="${overviewDays === 30}">
              30 días
            </button>

          </div>
        </div>

        <div
          id="overview-chart"
          class="gap-top"
          aria-live="polite">
          Consultando pagos confirmados…
        </div>

      </section>

      <section class="panel">
        <h2>Cobros por persona</h2>

        ${Object.entries(r.employees)
          .map(([actor, total]) => `
            <div class="summary-line">
              <span>${esc(actorLabel(actor))}</span>
              <b>${money(total)}</b>
            </div>
          `).join('')
          || '<p class="muted gap-top">Todavía no hay cobros hoy.</p>'}

      </section>
    </div>

    <section class="panel gap-top">

      <div class="row spread">
        <h2>Últimos cobros</h2>

        <button class="ghost" data-tab="reportes">
          Ver todos ${icon('arrow')}
        </button>
      </div>

      ${r.payments.slice(0, 5).map(p => `
        <div class="summary-line">
          <span>
            ${clock(p.paid)} · ${esc(actorLabel(p.actor))}

            <small class="payment-concepts">
              ${JSON.parse(p.lines)
                .map(l =>
                  esc(categories[l.category] || l.category)
                ).join(' · ')}
            </small>
          </span>

          <b>${money(p.total)}</b>
        </div>
      `).join('')
        || '<p class="muted gap-top">Aquí aparecerán los pagos al confirmarse.</p>'}

    </section>

    <details class="maintenance panel gap-top">
      <summary>
        ${icon('settings')}
        Configuración y mantenimiento
      </summary>

      <nav
        class="maintenance-grid gap-top"
        aria-label="Configuración y mantenimiento">

        ${maintenance.map(([id, i, label]) => `
          <button class="secondary" data-tab="${id}">
            ${icon(i)}
            ${label}
          </button>
        `).join('')}

      </nav>

      <p class="fine gap-top">
        Datos consultados al servidor:
        ${dateTime(state.serverTime)}
      </p>
    </details>`;

  $('[data-occupancy]')?.style.setProperty(
    '--occupancy',
    $('[data-occupancy]').dataset.occupancy + '%'
  );

  try {
    const to = r.date;
    const from = new Date(
      Date.parse(to + 'T12:00:00Z') -
      (overviewDays - 1) * 86400000
    ).toISOString().slice(0, 10);

    const history = await request(
      'history?from=' + from + '&to=' + to
    );

    if (tab !== 'admin') return;

    const max = Math.max(
      1,
      ...history.days.map(d => d.total)
    );

    $('#overview-chart').innerHTML = history.total
      ? `
        <div
          class="daily-chart ${overviewDays === 30 ? 'month-chart' : ''}"
          role="img"
          aria-label="Ingresos de ${from} a ${to}. Total ${money(history.total)}">

          ${history.days.map(d => `
            <div class="daily-column">
              <span class="daily-amount">
                ${money(d.total)}
              </span>

              <div class="daily-bar">
                <i
                  data-height="${Math.round(d.total / max * 100)}">
                </i>
              </div>

              <small>${d.date.slice(8)}</small>

              <span class="sr-only">
                ${d.date}: ${money(d.total)}
              </span>
            </div>
          `).join('')}

        </div>

        <p class="fine gap-top">
          ${from} → ${to}
          <b>· ${money(history.total)}</b>
        </p>`
      : '<p class="muted">Sin ingresos confirmados en este periodo.</p>';

    $$('.daily-column i').forEach(e =>
      e.style.setProperty(
        '--bar-height',
        e.dataset.height + '%'
      )
    );

  } catch (e) {
    if ($('#overview-chart')) {
      $('#overview-chart').textContent =
        'No se pudo consultar el periodo. ' + e.message;
    }
  }
}

function entryView(context = {}) {
  if(state.config.catalog)return catalogEntryView(context);
  const contract = state.monthly.find(m =>
    m.id === context.contractId &&
    m.paid &&
    m.start_at <= state.serverTime &&
    m.end_at >= state.serverTime
  );

  const c = state.config;

  const choices = [
    [
      'hourly',
      'car',
      'Por hora',
      money(c.ordinary) + '/h'
    ],
    [
      'free',
      'clock',
      'Tiempo libre',
      money(c.freeNormal)
    ],
    [
      'wash_only',
      'car',
      'Sólo lavado',
      'Desde ' + money(Math.min(...Object.values(c.wash)))
    ],
    [
      'temporary',
      'calendar',
      'Temporal',
      money(c.temporary.price) +
        ' / ' + c.temporary.hours + ' h · provisional'
    ]
  ];

  const contracts = state.monthly.filter(m =>
    m.paid &&
    m.start_at <= state.serverTime &&
    m.end_at >= state.serverTime
  );

  $('#main').innerHTML =
    heading(
      contract ? 'VISITA MENSUAL' : 'NUEVA ENTRADA',
      contract ? 'Acceso con pensión' : 'Registra la llegada',
      '',
      `<button class="back-link" data-tab="inicio">
        ${icon('back')} Operación
      </button>`
    ) +
    `
    <form id="entry-form" class="panel entry-quick">

      <div
        class="entry-card"
        id="entry-card"
        hidden>
      </div>

      <label id="entry-card-select">
        Tarjeta

        <select name="card" required>
          <option value="">Selecciona una tarjeta</option>

          ${state.cards
            .filter(c => c.state === 'available')
            .map(c => `
              <option value="${c.id}">
                ${cardNumber(c.id)}
              </option>
            `).join('')}
        </select>
      </label>

      <div class="plate-heading">

        <label for="entry-plate">
          Placa del vehículo
        </label>

        <label class="checkbox-row no-plate">
          <input
            name="noPlate"
            type="checkbox"
            data-no-plate>
          <span>Sin placas</span>
        </label>

      </div>

      <div class="plate-capture">

        <input
          id="entry-plate"
          name="plate"
          class="plate-input"
          required
          maxlength="20"
          autocapitalize="characters"
          autocomplete="off"
          placeholder="ABC-123-A">

        <button
          type="button"
          class="secondary"
          data-action="photo">
          ${icon('camera')}
          <span>Leer foto</span>
        </button>

      </div>

      ${contract
        ? `
          <input
            name="mode"
            type="hidden"
            value="monthly">

          <input
            name="monthlyId"
            type="hidden"
            value="${esc(contract.id)}">

          <div class="contract-context note gap-top">

            <b>
              ${esc(JSON.parse(contract.mode).name)}
            </b>

            <p>
              ${dateTime(contract.start_at)}
              →
              ${dateTime(contract.end_at)}
            </p>

            <button
              type="button"
              class="ghost"
              data-ui-ordinary>
              Usar otra modalidad
            </button>

          </div>`
        : `
          <input
            name="monthlyId"
            type="hidden"
            value="">

          <fieldset class="mode-selector">

            <legend>Modalidad de estancia</legend>

            <div class="mode-grid">

              ${choices.map(
                ([id, i, label, price], n) => `
                  <label class="mode-choice">

                    <input
                      type="radio"
                      name="mode"
                      value="${id}"
                      ${n === 0 ? 'checked' : ''}>

                    <span>
                      <b>${icon(i)}${label}</b>
                      <small>${price}</small>
                    </span>

                  </label>
                `
              ).join('')}

            </div>

          </fieldset>`
      }

      <label
        class="checkbox-row preference"
        id="preferred-label">

        <input
          type="checkbox"
          name="preferred">

        <span>
          Cliente preferencial
          <small id="preferred-help"></small>
        </span>
      </label>

      <details class="entry-complements gap-top">

        <summary>Opciones complementarias</summary>

        <div class="complement-fields">

          <label
            class="checkbox-row"
            id="wash-label">

            <input
              type="checkbox"
              name="wash">

            <span>
              Agregar lavado
              <b id="wash-price"></b>
            </span>
          </label>

          <label
            id="wash-type-label"
            hidden>

            Vehículo para el lavado

            <select name="type">
              <option value="">
                Selecciona el tipo
              </option>

              ${Object.entries(types)
                .map(([id, label]) => `
                  <option value="${id}">
                    ${label}
                    ${c.wash[id] !== undefined
                      ? ' · ' + money(c.wash[id])
                      : ' · Tarifa pendiente'}
                  </option>
                `).join('')}
            </select>
          </label>

          <label
            class="checkbox-row"
            id="addon-label"
            hidden>

            <input
              type="checkbox"
              name="addon">

            <span>
              Estacionamiento con lavado

              <small>
                +${money(c.dayAddon)} · Importe fijo
              </small>
            </span>
          </label>

        </div>
      </details>

      <details class="vehicle-notes">

        <summary>Agregar observación</summary>

        <label>
          Seña para identificar el vehículo

          <input
            name="notes"
            maxlength="500"
            placeholder="Obligatoria si no tiene placas">
        </label>

      </details>

      <div id="entry-summary"></div>

      <p class="fine" id="entry-notice"></p>

      <div class="modal-actions">
        <button class="primary" type="submit">
          ${icon('check')} Confirmar entrada
        </button>
      </div>

      ${!contract && contracts.length
        ? `
          <button
            type="button"
            class="ghost monthly-entry-link"
            data-ui-monthly>
            Usar pensión registrada
          </button>`
        : ''}

    </form>`;

  const form = $('#entry-form');

  if (context.card) {
    form.elements.card.value = context.card;
  }

  if (contract) {
    setVehicleFields(
      form,
      JSON.parse(contract.vehicle)
    );
  }

  form.addEventListener('change', updateEntry);
  form.addEventListener('input', updateEntry);

  updateEntry();
  warmOcr();
}

function updateEntry() {
  if($('#entry-form')?.dataset.catalog)return catalogUpdateEntry();
  const f = $('#entry-form');
  if (!f) return;

  syncVehicleFields(f);

  const mode = f.elements.mode.value;
  const c = state.config;

  $('#entry-card-select').hidden =
    !!f.elements.card.value;

  $('#entry-card').hidden =
    !f.elements.card.value;

  $('#entry-card').innerHTML = `
    <span>
      ${icon('cards')}
      Tarjeta
      <b>${cardNumber(f.elements.card.value)}</b>
    </span>

    <button
      class="ghost"
      type="button"
      data-action="manual-card">
      Cambiar
    </button>`;

  const washOnly = mode === 'wash_only';

  if (washOnly) {
    f.elements.wash.checked = true;
  }

  f.elements.wash.disabled = washOnly;

  const wash = f.elements.wash.checked;
  const type = f.elements.type.value;
  const hasPrice = c.wash[type] !== undefined;

  $('#wash-label').hidden = washOnly;
  $('#wash-type-label').hidden = !wash;

  f.elements.type.required = wash;

  $('#wash-price').textContent =
    wash && hasPrice
      ? '· ' + money(c.wash[type])
      : '';

  const canAddon =
    wash &&
    hasPrice &&
    ['hourly', 'wash_only'].includes(mode);

  $('#addon-label').hidden = !canAddon;

  if (!canAddon) {
    f.elements.addon.checked = false;
  }

  if (washOnly) {
    f.querySelector('.entry-complements').open = true;
  }

  const addon = f.elements.addon.checked;

  $('#preferred-label').hidden =
    !['hourly', 'free'].includes(mode) || addon;

  $('#preferred-help').textContent =
    mode === 'free'
      ? money(c.freePreferred) + ' tiempo libre'
      : money(c.preferred) + ' por hora';

  const parking = addon
    ? c.dayAddon
    : mode === 'temporary'
      ? c.temporary.price
      : mode === 'free'
        ? c[
            f.elements.preferred.checked
              ? 'freePreferred'
              : 'freeNormal'
          ]
        : 0;

  const fixed =
    parking +
    (wash && hasPrice ? c.wash[type] : 0);

  const hourly =
    mode === 'hourly' && !addon;

  $('#entry-summary').innerHTML = `
    <div class="summary-line">

      <span>
        ${addon
          ? 'Lavado con estacionamiento'
          : esc(modes[mode])}

        ${f.elements.preferred.checked &&
          ['hourly', 'free'].includes(mode) &&
          !addon
            ? ' · Preferencial'
            : ''}
      </span>

      <b>
        ${hourly
          ? wash && hasPrice
            ? money(c.wash[type]) + ' + estancia'
            : 'Cobro a la salida'
          : money(fixed)}
      </b>

    </div>`;

  $('#entry-notice').textContent =
    wash && !hasPrice
      ? 'Elige un vehículo con tarifa de lavado confirmada.'
      : mode === 'monthly'
        ? 'Se respetan las fechas y cobertura de la pensión pagada.'
        : mode === 'temporary'
          ? 'Provisional. Los excedentes requieren autorización administrativa.'
          : addon || mode === 'free'
            ? c.opening && c.closing
              ? `Cobertura: ${c.opening} a ${c.closing}.`
              : 'Horario pendiente: la salida requerirá revisión administrativa.'
            : 'El servidor calcula el total al salir.';
}

function checkoutView(id) {
  if(JSON.parse(state.stays.find(s=>s.id===id)?.service||'{}').schema===2)return catalogCheckoutView(id);
  const stay = state.stays.find(s => s.id === id);

  if (!stay) {
    toast('La estancia ya no está activa.');
    return;
  }

  const v = JSON.parse(stay.vehicle);
  const s = JSON.parse(stay.service);
  const q = stay.quote;

  const canClose =
    !q.blocked || state.role === 'admin';

  openModal(
    'Registrar salida',
    `
    <div class="checkout-vehicle">

      <span class="card-badge">
        ${icon('cards')}
        <b>${cardNumber(stay.card_id)}</b>
      </span>

      <div>
        <h3 class="plate">
          ${esc(v.plate || 'Sin placas')}
        </h3>

        <p>
          ${esc(modes[s.mode])}
          · ${duration(stay.entered)}
        </p>

        <p class="fine">
          Entrada ${dateTime(stay.entered)}
        </p>
      </div>

    </div>

    ${v.notes
      ? `<p class="note gap-top">${esc(v.notes)}</p>`
      : ''}

    <form
      id="checkout-form"
      data-id="${id}"
      data-total="${q.total}"
      data-blocked="${q.blocked}">

      ${q.lines.length > 1
        ? `
          <div class="checkout-lines">
            ${q.lines.map(l => `
              <div class="summary-line">
                <span>${esc(l.label)}</span>
                <b>${money(l.cents)}</b>
              </div>
            `).join('')}
          </div>`
        : ''}

      <div class="summary-total">

        <span>
          ${q.blocked
            ? 'Importe base · Requiere revisión'
            : 'Total a cobrar'}
        </span>

        <strong>${money(q.total)}</strong>

      </div>

      ${q.blocked
        ? `
          <div class="note">
            ${esc(q.reason)}
          </div>

          <p class="fine gap-top">
            ${state.role === 'admin'
              ? 'Confirmar autoriza este importe sin cargo adicional. Se conserva la decisión en auditoría.'
              : 'El administrador debe revisar y autorizar esta salida.'}
          </p>`
        : `
          <p class="fine checkout-instruction">
            Verifica la placa y recupera la tarjeta.
          </p>`}

      <div class="modal-actions">

        <button
          class="primary"
          type="submit"
          ${canClose ? '' : 'disabled'}>

          ${icon('check')}

          ${q.blocked
            ? 'Autorizar importe y cerrar'
            : q.total === 0
              ? 'Confirmar salida'
              : 'Confirmar pago y cerrar'}
        </button>

        <button
          type="button"
          class="ghost"
          data-action="close-modal">
          Volver
        </button>

      </div>
    </form>

    <details class="checkout-incidents">

      <summary>
        Incidencias y cancelaciones
      </summary>

      <div class="compact-actions gap-top">

        <button
          class="ghost"
          data-cancel-entry="${id}">
          Cancelar entrada
        </button>

        <button
          class="ghost"
          data-lost="${id}"
          ${s.lostCard ? 'disabled' : ''}>
          Tarjeta extraviada
        </button>

        ${s.wash
          ? `
            <button
              class="ghost"
              data-cancel-wash="${id}">
              Cancelar lavado
            </button>`
          : ''}

        ${s.lostCard &&
          state.role === 'admin' &&
          stay.card_state === 'lost'
            ? `
              <button
                class="secondary"
                data-replace-card="${id}">
                Asignar reposición
              </button>`
            : ''}

      </div>
    </details>`
  );
}

function monthlyView() {
  if(state.config.catalog)return catalogMonthlyView();
  const rows = state.monthly || [];
  const c = state.config;
  const now = state.serverTime;

  const status = m => {
    if (m.end_at < now) {
      return ['Vigencia terminada', 'gray'];
    }

    if (!m.paid) {
      return ['Pago pendiente', 'orange'];
    }

    if (m.start_at > now) {
      return ['Próxima vigencia', 'gray'];
    }

    return ['Vigente · pagada', ''];
  };

  const sorted = [...rows].sort((a, b) => {
    const rank = m =>
      m.paid &&
      m.start_at <= now &&
      m.end_at >= now
        ? 0
        : !m.paid && m.end_at >= now
          ? 1
          : m.start_at > now
            ? 2
            : 3;

    return (
      rank(a) - rank(b) ||
      b.start_at - a.start_at
    );
  });

  $('#main').innerHTML =
    heading(
      'CONTRATOS Y COBERTURA',
      'Pensiones mensuales',
      'Consulta contratos, pagos y vigencias acordadas.',
      `<button class="primary" data-action="new-monthly">
        ${icon('calendar')} Alta mensual
      </button>`
    ) +
    `
    <div class="monthly-rates">

      ${c.monthly.map(m => `
        <div>
          <span>${esc(m.name)}</span>

          <b>
            ${money(m.price)}
            <small> / mes</small>
          </b>

          <small>
            ${Number(m.hours) === 12
              ? 'Cobertura de 12 horas'
              : Number(m.hours) === 24
                ? 'Cobertura de 24 horas'
                : ''}
          </small>
        </div>
      `).join('')}

    </div>

    <p class="fine gap-top">
      Las fechas se establecen manualmente.
      No hay renovación ni cobros automáticos.
    </p>

    <div class="monthly-list gap-top">

      ${sorted.map(m => {
        const v = JSON.parse(m.vehicle);
        const mode = JSON.parse(m.mode);

        const valid =
          !!m.paid &&
          m.start_at <= now &&
          m.end_at >= now;

        const inParking =
          valid &&
          state.stays.some(s => {
            const stayService = JSON.parse(s.service);

            return (
              stayService.mode === 'monthly' &&
              stayService.monthlyId === m.id
            );
          });

        const [label, color] = status(m);

        return `
          <article class="panel monthly-contract">

            <div>

              <h2 class="plate">
                ${esc(v.plate || 'Sin placas')}
              </h2>

              <p>
                ${esc(mode.name)} · ${money(mode.price)}
              </p>

              <p class="fine">
                Inicio: ${dateTime(m.start_at)}
                <br>
                Fin: ${dateTime(m.end_at)}
              </p>

            </div>

            <span class="pill ${color}">
              ${label}
            </span>

            ${!m.paid && m.end_at >= now
              ? `
                <button
                  type="button"
                  class="secondary"
                  data-monthly-pay="${esc(m.id)}">
                  Registrar pago
                </button>`
              : ''}

            ${valid && !inParking
              ? `
                <button
                  type="button"
                  class="secondary"
                  data-monthly-visit="${esc(m.id)}">
                  Registrar visita ${icon('arrow')}
                </button>`
              : ''}

            ${inParking
              ? `
                <span class="pill">
                  En el estacionamiento
                </span>`
              : ''}

          </article>`;
      }).join('') || empty(
        'Sin contratos mensuales',
        'Registra una pensión con modalidad y fechas explícitas.'
      )}

    </div>`;
}

function cloudMonthlyPicker() {
  const now = state.serverTime;

  const rows = state.monthly.filter(m =>
    m.paid &&
    m.start_at <= now &&
    m.end_at >= now
  );

  openModal(
    'Pensión registrada',
    `
    <p class="muted">
      Selecciona un contrato pagado y vigente.
    </p>

    <div class="monthly-picker gap-top">

      ${rows.map(m => {
        const inParking = state.stays.some(s => {
          const service = JSON.parse(s.service);

          return (
            service.mode === 'monthly' &&
            service.monthlyId === m.id
          );
        });

        return `
          <button
            type="button"
            class="secondary"
            data-monthly-visit="${esc(m.id)}"
            ${inParking ? 'disabled' : ''}>

            <span>
              <b>
                ${esc(
                  JSON.parse(m.vehicle).plate || 'Sin placas'
                )}
              </b>

              <small>
                ${esc(JSON.parse(m.mode).name)}

                ${inParking
                  ? ' · En el estacionamiento'
                  : ''}
              </small>
            </span>

            ${icon('arrow')}

          </button>`;
      }).join('')
        || '<p>No hay contratos pagados vigentes.</p>'}

    </div>`
  );
}

// Vista del servicio independiente de baños.
function bathroomView() {
  const price = state.config?.bathroomPrice;

  const enabled =
    Number.isInteger(price) &&
    price > 0;

  $('#main').innerHTML =
    heading(
      'SERVICIOS',
      'Baños',
      'Selecciona cuántas personas entran y confirma el cobro.'
    ) +
    `
    <section class="panel bathroom-panel">



      ${enabled
        ? `
          <form id="bathroom-form">

            <label
              for="bathroom-quantity"
              class="gap-top">
              Número de personas
            </label>

            <div class="bathroom-counter">

              <button
                type="button"
                class="secondary"
                data-bathroom-step="-1"
                aria-label="Restar una persona">
                −
              </button>

              <input
                id="bathroom-quantity"
                name="quantity"
                class="bathroom-count"
                style="max-width:100px;text-align:center"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                value="1"
                required>

              <button
                type="button"
                class="secondary"
                data-bathroom-step="1"
                aria-label="Sumar una persona">
                +
              </button>

            </div>

            <div class="bathroom-totals">

              <div class="summary-line">
                <span>Tarifa por persona</span>
                <b>${money(price)}</b>
              </div>

              <div class="summary-line">
                <span>Total a cobrar</span>
                <b
                  id="bathroom-total"
                  aria-live="polite">
                  ${money(price)}
                </b>
              </div>

            </div>

            <input type="checkbox" name="paymentConfirmed" checked hidden>

            <div class="bathroom-actions"><button type="button" class="secondary" data-tab="inicio">Cancelar</button>

              <button
                type="submit"
                class="primary">
                ${icon('check')} Confirmar cobro
              </button>

            </div>

          </form>`
        : `
          <p class="note gap-top">
            La tarifa de baños todavía no está configurada.
            El cobro permanece deshabilitado.
          </p>`}

    </section>`;
}

function usersView() {
  $('#main').innerHTML =
    heading(
      'ACCESOS DEL EQUIPO',
      'Personas y permisos',
      'Cada persona conserva su historial. Eliminar un acceso conserva sus movimientos y pagos.',
      `<button class="secondary" data-action="cloud-devices">
        ${icon('shield')} Dispositivos
      </button>`
    ) +
    `
    <div class="team-layout">

      <section class="panel">

        <h2>Equipo</h2>

        ${state.users.map(u => `
          <div class="summary-line">

            <span>
              <b>
                ${esc(u.display_name || u.name)}
              </b>

              <small class="payment-concepts">
                ${u.role === 'admin'
                  ? 'Administrador'
                  : 'Empleado'}
                ·
                ${u.active
                  ? 'Activo'
                  : 'Inactivo'}

                <br>

                Acceso: ${esc(u.login_name||u.name)}
              </small>
            </span>

            <div class="device-actions">

              <button
                class="secondary"
                data-user-update="${u.id}">
                ${icon('settings')} Ajustar
              </button>

              ${u.name !== state.login
                ? `
                  <button
                    class="ghost"
                    data-user-delete="${u.id}"
                    aria-label="Eliminar acceso de ${esc(
                      u.display_name || u.name
                    )}">
                    Eliminar
                  </button>`
                : `
                  <span class="device-current">
                    Tu cuenta
                  </span>`}

            </div>

          </div>
        `).join('')}

      </section>

      <section class="panel">

        <details>

          <summary>
            ${icon('users')} Agregar persona
          </summary>

          <form id="user-form" class="gap-top">

            <label>
              Usuario

              <input
                name="name"
                required
                pattern="[a-zA-Z0-9._-]{3,40}"
                maxlength="40"
                autocomplete="off"
                placeholder="Ej. Empleado1">
            </label>

            <label class="gap-top">
              PIN personal

              <input
                name="password"
                type="password"
                inputmode="numeric"
                pattern="[0-9]{6,12}"
                required
                maxlength="12"
                autocomplete="new-password"
                placeholder="6 a 12 dígitos">
            </label>

            ${cloudUserFields()}

            <label class="gap-top">
              Permiso

              <select name="role">
                <option value="employee">
                  Empleado
                </option>

                <option value="admin">
                  Administrador
                </option>
              </select>
            </label>

            <button
              class="primary gap-top"
              type="submit">
              Crear usuario ${icon('check')}
            </button>

          </form>

        </details>

        <p class="fine gap-top">
          Autoriza dispositivos nuevos desde
          el botón Dispositivos.
        </p>

      </section>

    </div>`;
}

// Acciones propias de las pantallas de Cloud.
document.addEventListener('click', async event => {
  const b = event.target.closest(
    '[data-monthly-visit],' +
    '[data-ui-monthly],' +
    '[data-ui-ordinary],' +
    '[data-bathroom-step]'
  );

  if (!b) return;

  if (b.hasAttribute('data-bathroom-step')) {
    const input = $('#bathroom-quantity');

    if (!input) return;

    input.value = String(
      Math.max(
        1,
        (Number(input.value) || 1) +
        Number(b.dataset.bathroomStep)
      )
    );

    input.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    return;
  }

  if (b.hasAttribute('data-ui-monthly')) {
    cloudMonthlyPicker();
    return;
  }

  const card =
    $('#entry-form')?.elements.card.value || '';

  if (b.hasAttribute('data-ui-ordinary')) {
    entryView({ card });
    return;
  }

  if (b.dataset.monthlyVisit) {
    await navigate('entrada');

    entryView({
      contractId: b.dataset.monthlyVisit,
      card
    });
  }
});

// Actualización del importe mostrado para baños.
document.addEventListener('input', event => {
  if (event.target?.id !== 'bathroom-quantity') {
    return;
  }

  const quantity = Math.max(
    1,
    Number(event.target.value) || 1
  );

  const price = state?.config?.bathroomPrice;
  const total = $('#bathroom-total');

  if (total && Number.isInteger(price)) {
    total.textContent = money(
      Math.round(quantity) * price
    );
  }
});

function userUpdate(id){
 const u=state.users.find(u=>u.id===id);if(!u)return;
 const own=u.name===state.login;
 const login=u.login_name||u.name,visible=u.display_name?.toLowerCase()===login?u.display_name:login;
 openModal('Acceso de '+esc(u.display_name||u.name),`<form class="management-form" id="user-update-form" data-id="${esc(id)}"><label>Usuario<input name="loginName" required pattern="[a-zA-Z0-9._-]{3,40}" maxlength="40" autocomplete="off" value="${esc(visible)}"></label><p class="fine">Este es el usuario para iniciar sesión y el nombre que aparece en la aplicación.</p><label class="gap-top">Permiso<select name="role"><option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option><option value="employee" ${u.role==='employee'?'selected':''}>Empleado</option></select></label><label class="checkbox-row gap-top"><input name="active" type="checkbox" ${u.active?'checked':''}><span>Usuario activo</span></label><label class="gap-top">Nuevo PIN · opcional<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{6,12}" maxlength="12" autocomplete="new-password" placeholder="Deja vacío para conservarlo"></label><p class="fine gap-top">${own?'Al cambiar tu usuario o PIN se cierran las otras sesiones; este navegador conserva el acceso.':'Un cambio de usuario, PIN o permisos cierra las sesiones de esta persona.'}</p>${managementActions('Guardar cambios',false)}</form>`);
 managementForm('user-update-form',async f=>{
  const name=f.elements.loginName.value.trim();
  const result=await request('user-update',{id,loginName:name,displayName:name,role:f.elements.role.value,active:f.elements.active.checked,pin:f.elements.pin.value,identity:u.identity||''});
  closeModal();
  if(own){const login=document.querySelector('#login-form');if(login){login.elements.name.value=result.loginName;login.elements.password.value='';}}
  if(result.reauthenticate){showLogin();toast('Cambios guardados. Entra con el usuario y PIN actualizados.');}
  else{await refresh();toast('Acceso actualizado.');}
 });
}
