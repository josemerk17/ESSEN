// ESSEN — proceso simulado de compra
(() => {
  const CART_KEY = 'essen-cart';
  const STOCK_KEY = 'essen-sold-stock';
  const cartPanel = document.querySelector('#cart-panel');
  const checkoutButton = cartPanel?.querySelector('.checkout-start');
  if (!cartPanel || !checkoutButton) return;
  let productsById = new Map();
  checkoutButton.disabled = true;

  function readLocalJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) || fallback; }
    catch (error) { console.warn(`No se pudo leer ${key}:`, error); return fallback; }
  }
  function getCart() {
    const saved = readLocalJSON(CART_KEY, []);
    return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.cantidad) && item.cantidad > 0) : [];
  }
  function notify(options) {
    if (window.Swal) return window.Swal.fire(options);
    console.warn(options.title, options.text);
    return Promise.resolve({ isConfirmed: false });
  }
  function remainingStock(product, sold) { return Math.max(0, Number(product.stock || 0) - Number(sold[product.id] || 0)); }

  const dialog = document.createElement('section');
  dialog.className = 'checkout-dialog';
  dialog.hidden = true;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'checkout-title');
  document.body.append(dialog);

  function renderOrderSummary() {
    const summary = document.createElement('div');
    summary.className = 'checkout-summary';
    let total = 0;
    let unknownPrice = false;
    getCart().forEach(({ id, cantidad }) => {
      const product = productsById.get(id);
      if (!product) return;
      const row = document.createElement('p');
      row.textContent = `${product.nombre} × ${cantidad} — ${product.precio == null ? 'Consultar precio' : `$${product.precio * cantidad} MXN`}`;
      summary.append(row);
      if (product.precio == null) unknownPrice = true; else total += product.precio * cantidad;
    });
    const totalLine = document.createElement('strong');
    totalLine.textContent = `Total${unknownPrice ? ' parcial' : ''}: $${total} MXN${unknownPrice ? ' + productos por cotizar' : ''}`;
    summary.append(totalLine);
    return summary;
  }
  function closeCheckout() { dialog.hidden = true; checkoutButton.focus(); }

  function openCheckout() {
    dialog.replaceChildren();
    const heading = document.createElement('h2'); heading.id = 'checkout-title'; heading.textContent = 'Finalizar compra';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'checkout-close'; close.setAttribute('aria-label', 'Cerrar'); close.textContent = '×'; close.addEventListener('click', closeCheckout);
    const form = document.createElement('form'); form.className = 'checkout-form';
    form.innerHTML = '<label>Nombre completo<input name="nombre" autocomplete="name" minlength="3" maxlength="80" required></label><label>Correo electrónico<input name="correo" type="email" autocomplete="email" maxlength="120" required></label><label>Teléfono (10 dígitos)<input name="telefono" type="tel" autocomplete="tel" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required></label><label>Dirección de entrega<input name="direccion" autocomplete="street-address" minlength="8" maxlength="160" required></label><label>Ciudad<input name="ciudad" autocomplete="address-level2" minlength="2" maxlength="80" required></label><label>Código postal (5 dígitos)<input name="codigoPostal" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" required></label>';
    const title = document.createElement('h3'); title.textContent = 'Resumen del pedido';
    const actions = document.createElement('div'); actions.className = 'checkout-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'checkout-cancel'; cancel.textContent = 'Volver al carrito'; cancel.addEventListener('click', closeCheckout);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'checkout-submit'; submit.textContent = 'Confirmar pedido';
    actions.append(cancel, submit);
    form.append(title, renderOrderSummary(), actions);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      submit.disabled = true;
      try {
        const orderItems = getCart();
        if (!orderItems.length) throw new Error('El carrito está vacío.');
        const sold = readLocalJSON(STOCK_KEY, {});
        for (const { id, cantidad } of orderItems) {
          const product = productsById.get(id);
          if (!product) throw new Error('Hay un producto fuera del catálogo.');
          if (cantidad > remainingStock(product, sold)) throw new Error(`Ya no hay suficientes unidades de ${product.nombre}.`);
        }
        const folio = `ES-${Date.now().toString(36).toUpperCase()}`;
        orderItems.forEach(({ id, cantidad }) => { sold[id] = Number(sold[id] || 0) + cantidad; });
        localStorage.setItem(STOCK_KEY, JSON.stringify(sold));
        localStorage.setItem('essen-last-order', JSON.stringify({ folio, fecha: new Date().toISOString(), productos: orderItems }));
        localStorage.setItem(CART_KEY, '[]');
        window.dispatchEvent(new CustomEvent('essen:cart-cleared'));
        window.dispatchEvent(new CustomEvent('essen:stock-updated'));
        await notify({ icon: 'success', title: '¡Pedido registrado!', text: `Tu folio es ${folio}. Esta demostración no procesa pagos ni envía el pedido a una tienda.`, confirmButtonText: 'Listo', confirmButtonColor: '#090909' });
        dialog.hidden = true;
      } catch (error) {
        console.error('No se pudo confirmar el pedido:', error);
        await notify({ icon: 'error', title: 'No se pudo completar la compra', text: error.message || 'Inténtalo de nuevo.' });
      } finally { submit.disabled = false; }
    });
    dialog.append(close, heading, form);
    dialog.hidden = false;
    dialog.querySelector('input')?.focus();
  }

  checkoutButton.addEventListener('click', openCheckout);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeCheckout(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) closeCheckout(); });

  async function loadProducts() {
    try {
      const response = await fetch('assets/data/productos.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const products = await response.json();
      productsById = new Map(products.map(({ id, ...product }) => [id, { id, ...product }]));
      checkoutButton.disabled = false;
    } catch (error) {
      console.error('No fue posible validar el catálogo para la compra:', error);
      checkoutButton.disabled = true;
      await notify({ icon: 'error', title: 'Compra no disponible', text: 'No se pudieron verificar los productos.' });
    } finally { checkoutButton.setAttribute('aria-busy', String(checkoutButton.disabled)); }
  }
  loadProducts();
})();


