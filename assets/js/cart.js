// ESSEN — carrito, persistencia y control de existencias
(() => {
  const CART_KEY = 'essen-cart';
  const STOCK_KEY = 'essen-sold-stock';
  const cartLink = document.querySelector('.cart-icon');
  if (!cartLink) return;
  const productsById = new Map();
  let cart = readCart();

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) || fallback; }
    catch (error) { console.warn(`No se pudo leer ${key}:`, error); return fallback; }
  }
  function readCart() {
    const saved = readJSON(CART_KEY, []);
    return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.cantidad) && item.cantidad > 0) : [];
  }
  function readSoldStock() { return readJSON(STOCK_KEY, {}); }
  function availableStock(product) {
    const sold = readSoldStock();
    return Math.max(0, Number(product.stock || 0) - Number(sold[product.id] || 0));
  }
  function notify(options) {
    if (window.Swal) return window.Swal.fire(options);
    console.warn(options.text || options.title);
    return Promise.resolve({ isConfirmed: options.confirmButtonText === 'Aceptar' });
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderBadge(); return true; }
    catch (error) { console.error('No se pudo guardar el carrito:', error); void notify({ icon: 'error', title: 'No se pudo guardar', text: 'Revisa el almacenamiento disponible en el navegador.' }); return false; }
  }

  const badge = document.createElement('span');
  badge.className = 'cart-count';
  badge.setAttribute('aria-live', 'polite');
  cartLink.append(badge);
  const panel = document.createElement('section');
  panel.className = 'cart-panel';
  panel.id = 'cart-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Carrito de compras');
  panel.innerHTML = '<div class="cart-panel-heading"><h2>Tu carrito</h2><button class="cart-close" type="button" aria-label="Cerrar carrito">×</button></div><div class="cart-items"></div><p class="cart-total"></p><button class="checkout-start" type="button">Continuar compra</button><button class="cart-clear" type="button">Vaciar carrito</button>';
  document.body.append(panel);
  panel.querySelector('.checkout-start').hidden = true;
  cartLink.setAttribute('aria-controls', panel.id);
  cartLink.setAttribute('aria-expanded', 'false');

  function renderBadge() {
    const count = cart.reduce((sum, { cantidad }) => sum + cantidad, 0);
    badge.textContent = count ? String(count) : '';
    badge.hidden = count === 0;
    cartLink.setAttribute('aria-label', count ? `Carrito, ${count} productos` : 'Carrito vacío');
  }
  function changeQuantity(id, amount) {
    const item = cart.find(entry => entry.id === id);
    const product = productsById.get(id);
    if (!item || !product) return;
    if (amount > 0 && item.cantidad >= availableStock(product)) {
      void notify({ icon: 'warning', title: 'Límite de existencias', text: `Solo hay ${availableStock(product)} unidad(es) disponibles.` });
      return;
    }
    item.cantidad += amount;
    if (item.cantidad <= 0) cart = cart.filter(entry => entry.id !== id);
    saveCart();
    renderCart();
  }
  function renderCart() {
    const items = panel.querySelector('.cart-items');
    items.replaceChildren();
    let total = 0;
    let hasUnknownPrice = false;
    const availableItems = cart.filter(({ id }) => productsById.has(id));
    if (!availableItems.length) {
      const empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.textContent = 'Tu carrito está vacío.';
      items.append(empty);
    }
    availableItems.forEach(({ id, cantidad }) => {
      const product = productsById.get(id);
      const stock = availableStock(product);
      const row = document.createElement('article');
      row.className = 'cart-item';
      const image = document.createElement('img'); image.src = product.imagen; image.alt = '';
      const info = document.createElement('div'); info.className = 'cart-item-info';
      const name = document.createElement('strong'); name.textContent = product.nombre;
      const price = document.createElement('span'); price.textContent = product.precio == null ? 'Consultar precio' : `$${product.precio} MXN`;
      const inventory = document.createElement('small'); inventory.textContent = `${stock} disponible(s)`;
      info.append(name, price, inventory);
      const controls = document.createElement('div'); controls.className = 'cart-quantity';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Quitar una unidad de ${product.nombre}`); minus.addEventListener('click', () => changeQuantity(id, -1));
      const quantity = document.createElement('span'); quantity.textContent = String(cantidad);
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.disabled = cantidad >= stock; plus.setAttribute('aria-label', `Añadir una unidad de ${product.nombre}`); plus.addEventListener('click', () => changeQuantity(id, 1));
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = 'Quitar'; remove.setAttribute('aria-label', `Eliminar ${product.nombre} del carrito`); remove.addEventListener('click', () => { cart = cart.filter(entry => entry.id !== id); saveCart(); renderCart(); });
      controls.append(minus, quantity, plus, remove);
      row.append(image, info, controls); items.append(row);
      if (product.precio == null) hasUnknownPrice = true; else total += product.precio * cantidad;
    });
    panel.querySelector('.cart-total').textContent = availableItems.length
      ? `Total${hasUnknownPrice ? ' parcial' : ''}: $${total} MXN${hasUnknownPrice ? ' + productos por cotizar' : ''}` : '';
    panel.querySelector('.cart-clear').hidden = availableItems.length === 0;
    panel.querySelector('.checkout-start').hidden = availableItems.length === 0;
  }
  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    window.dispatchEvent(new CustomEvent('essen:cart-cleared'));
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest?.('.add-to-cart-button');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const product = productsById.get(button.dataset.productId);
    if (!product) { await notify({ icon: 'error', title: 'Producto no disponible', text: 'No se encontró este producto en el catálogo.' }); return; }
    const item = cart.find(entry => entry.id === product.id);
    if ((item?.cantidad || 0) >= availableStock(product)) { await notify({ icon: 'warning', title: 'Sin existencias suficientes', text: 'No hay más unidades disponibles de esta fragancia.' }); return; }
    if (item) item.cantidad += 1; else cart.push({ id: product.id, cantidad: 1 });
    if (!saveCart()) return;
    renderCart();
    const oldText = button.textContent;
    button.textContent = 'Añadido';
    window.setTimeout(() => { button.textContent = oldText || 'Añadir'; }, 1200);
    await notify({ toast: true, position: 'top-end', icon: 'success', title: 'Añadido al carrito', text: product.nombre, showConfirmButton: false, timer: 1400 });
  });
  cartLink.addEventListener('click', event => { event.preventDefault(); panel.hidden = !panel.hidden; cartLink.setAttribute('aria-expanded', String(!panel.hidden)); renderCart(); });
  panel.querySelector('.cart-close').addEventListener('click', () => { panel.hidden = true; cartLink.setAttribute('aria-expanded', 'false'); });
  panel.querySelector('.cart-clear').addEventListener('click', async () => {
    const result = window.Swal
      ? await window.Swal.fire({ icon: 'question', title: '¿Vaciar el carrito?', text: 'Se quitarán todos los productos.', showCancelButton: true, confirmButtonText: 'Vaciar', cancelButtonText: 'Conservar', confirmButtonColor: '#090909' })
      : { isConfirmed: true };
    if (result.isConfirmed) clearCart();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { panel.hidden = true; cartLink.setAttribute('aria-expanded', 'false'); } });
  window.addEventListener('essen:cart-cleared', () => { cart = []; saveCart(); renderCart(); });
  window.addEventListener('storage', event => { if (event.key === CART_KEY) { cart = readCart(); renderBadge(); renderCart(); } });

  async function loadProducts() {
    try {
      const response = await fetch('assets/data/productos.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const products = await response.json();
      products.forEach(({ id, ...product }) => productsById.set(id, { id, ...product }));
      cart = cart.filter(item => productsById.has(item.id));
      saveCart();
      renderCart();
    } catch (error) {
      console.error('No fue posible cargar el catálogo para el carrito:', error);
      await notify({ icon: 'error', title: 'Carrito no disponible', text: 'No se pudo leer el catálogo de productos.' });
    } finally { renderBadge(); }
  }
  renderBadge();
  loadProducts();
})();


