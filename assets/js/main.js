// ESSEN — menú, catálogo y búsqueda
(() => {
  const searchToggle = document.querySelector('.search-icon');
  const menuToggle = document.querySelector('.menu-icon');
  const searchPanel = document.querySelector('#site-search');
  const menuPanel = document.querySelector('#site-menu');
  const searchInput = document.querySelector('#search-input');
  const searchFeedback = document.querySelector('.search-feedback');
  const productGrid = document.querySelector('#product-grid');
  const searchResults = document.querySelector('#search-results');
  if (!searchToggle || !menuToggle || !searchPanel || !menuPanel) return;

  let products = [];
  const setPanel = (button, panel, open) => {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };
  const normalize = value => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-image';
    card.dataset.search = `${product.nombre} ${product.marca} ${product.categoria}`;

    const link = document.createElement('a');
    link.className = 'product-card-link';
    link.href = product.url || 'producto.html';
    link.setAttribute('aria-label', `Ver ${product.nombre}`);
    const image = document.createElement('img');
    image.src = product.imagen;
    image.alt = product.nombre;
    image.loading = 'lazy';
    link.append(image);

    const details = document.createElement('div');
    details.className = 'product-details';
    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = product.nombre;
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = product.precio == null ? 'Consultar precio' : `$${product.precio}`;
    const addButton = document.createElement('button');
    addButton.className = 'add-to-cart-button';
    addButton.type = 'button';
    addButton.dataset.productId = product.id;
    addButton.textContent = 'Añadir';
    try {
      const sold = JSON.parse(localStorage.getItem('essen-sold-stock') || '{}') || {};
      if (Number(product.stock || 0) - Number(sold[product.id] || 0) <= 0) {
        addButton.disabled = true;
        addButton.textContent = 'Agotado';
      }
    } catch (error) { console.warn('No se pudo leer el stock local:', error); }
    details.append(name, price, addButton);
    card.append(link, details);
    return card;
  }

  function renderProducts(query = '') {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    const matches = products.filter(product => {
      const text = normalize(`${product.nombre} ${product.marca} ${product.categoria} ${product.descripcion}`);
      return terms.every(term => text.includes(term));
    });
    const cards = matches.map(createProductCard);
    productGrid?.replaceChildren(...cards.map(card => card.cloneNode(true)));
    searchResults?.replaceChildren(...cards);
    return matches.length;
  }

  function updateFeedback(query, count) {
    if (!searchFeedback) return;
    searchFeedback.textContent = !query
      ? (products.length ? 'Productos disponibles' : '')
      : count ? `${count} resultado${count === 1 ? '' : 's'}` : 'No encontramos fragancias con ese nombre.';
  }

  searchToggle.addEventListener('click', () => {
    const open = searchPanel.hidden;
    setPanel(menuToggle, menuPanel, false);
    setPanel(searchToggle, searchPanel, open);
    if (open) {
      if (searchInput) searchInput.value = '';
      renderProducts('');
      updateFeedback('', products.length);
      searchInput?.focus();
    } else {
      renderProducts('');
      updateFeedback('', 0);
    }
  });
  menuToggle.addEventListener('click', () => {
    const open = menuPanel.hidden;
    setPanel(searchToggle, searchPanel, false);
    setPanel(menuToggle, menuPanel, open);
  });
  searchPanel.querySelector('.search-close')?.addEventListener('click', () => {
    setPanel(searchToggle, searchPanel, false);
    searchToggle.focus();
  });
  menuPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setPanel(menuToggle, menuPanel, false)));
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim();
    updateFeedback(query, renderProducts(query));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setPanel(searchToggle, searchPanel, false);
      setPanel(menuToggle, menuPanel, false);
    }
  });
  document.addEventListener('click', event => {
    if (!searchPanel.hidden && !searchPanel.contains(event.target) && !searchToggle.contains(event.target)) setPanel(searchToggle, searchPanel, false);
    if (!menuPanel.hidden && !menuPanel.contains(event.target) && !menuToggle.contains(event.target)) setPanel(menuToggle, menuPanel, false);
  });

  async function loadCatalog() {
    if (!productGrid) return;
    productGrid.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('assets/data/productos.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new TypeError('El catálogo debe ser una lista.');
      products = data.filter(({ id, nombre, imagen }) => id && nombre && imagen);
      renderProducts('');
      if (!searchPanel.hidden) updateFeedback(searchInput?.value || '', products.length);
    } catch (error) {
      console.error('No fue posible cargar productos.json:', error);
      const message = document.createElement('p');
      message.className = 'catalog-message';
      message.textContent = location.protocol === 'file:'
        ? 'Abre el proyecto con Live Server para cargar el catálogo.'
        : 'No se pudo cargar el catálogo. Revisa productos.json e inténtalo de nuevo.';
      productGrid.replaceChildren(message);
      searchResults?.replaceChildren();
      if (searchFeedback) searchFeedback.textContent = message.textContent;
      window.Swal?.fire({ icon: 'error', title: 'Catálogo no disponible', text: message.textContent });
    } finally {
      productGrid.removeAttribute('aria-busy');
    }
  }

  window.addEventListener('essen:stock-updated', () => renderProducts(searchInput?.value || ''));
  loadCatalog();
})();



