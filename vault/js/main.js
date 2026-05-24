// vault/js/main.js

let products = [];
let cart = JSON.parse(localStorage.getItem('vault_cart')) || [];

/* -----------------------------------------
   INIT ASYNC APP (MOCK API)
----------------------------------------- */
async function initApp() {
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error("Failed to load products");
        products = await response.json();
        
        if (window.location.pathname.includes('product.html')) {
            renderProductDetails();
        } else if (window.location.pathname.includes('shop.html')) {
            handleFilters();
        }
        
        updateCartUI();
        setupSearch();
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

/* -----------------------------------------
   TOAST NOTIFICATION
----------------------------------------- */
function showToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-6 right-6 z-[60] flex flex-col gap-4 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-vault-black text-vault-white border-l-4 border-vault-red px-6 py-4 shadow-[6px_6px_0px_0px_#b91c1c] font-body text-base font-normal transform translate-x-full opacity-0 transition-all duration-300 pointer-events-auto flex items-center justify-between min-w-[300px]';
    
    toast.innerHTML = `
        <span>${message}</span>
        <button class="ml-4 hover:text-vault-red transition-colors material-symbols-outlined text-xl">close</button>
    `;

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    const closeBtn = toast.querySelector('button');
    let timeout;

    const removeToast = () => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
        clearTimeout(timeout);
    };

    closeBtn.addEventListener('click', removeToast);
    timeout = setTimeout(removeToast, 4000);
}

/* -----------------------------------------
   CART LOGIC (LOCAL STORAGE)
----------------------------------------- */
function saveCart() {
    localStorage.setItem('vault_cart', JSON.stringify(cart));
    updateCartUI();
}

window.addToCart = function(productId, size = 'OS') {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId && item.size === size);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, size, quantity: 1 });
    }
    
    saveCart();
    showToast(`Added ${product.name} to your Vault.`);
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
};

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    if (!container || !subtotalEl) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-vault-black/50 font-display text-xl text-center mt-10">YOUR VAULT IS EMPTY.</p>';
        subtotalEl.innerText = '$0.00';
        return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        const itemHTML = `
            <div class="flex gap-4 items-center bg-vault-white border-2 border-vault-black p-3 relative shadow-[4px_4px_0px_0px_#0a0a0a]">
                <img src="${item.image}" alt="${item.name}" class="w-20 aspect-[3/4] object-cover border-2 border-vault-black">
                <div class="flex-1">
                    <h5 class="font-display text-lg leading-tight uppercase">${item.name}</h5>
                    <p class="font-normal text-sm text-vault-black/80 uppercase">Size: ${item.size} | Qty: ${item.quantity}</p>
                    <p class="font-display text-vault-red mt-1">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-vault-black/50 hover:text-vault-red transition-colors">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });

    subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
}

// Cart Drawer Toggles
function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if(drawer && overlay) {
        drawer.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    }
}

function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if(drawer && overlay) {
        drawer.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

// Mobile Menu Toggles
function openMobileMenu() {
    const drawer = document.getElementById('mobile-menu-drawer');
    if(drawer) {
        drawer.classList.remove('-translate-x-full');
    }
}

function closeMobileMenu() {
    const drawer = document.getElementById('mobile-menu-drawer');
    if(drawer) {
        drawer.classList.add('-translate-x-full');
    }
}

/* -----------------------------------------
   SEARCH LOGIC
----------------------------------------- */
function setupSearch() {
    const searchForm = document.getElementById('header-search-form');
    const searchInput = document.getElementById('header-search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;
            
            if (window.location.pathname.includes('shop.html')) {
                const url = new URL(window.location);
                url.searchParams.set('q', query);
                url.searchParams.delete('category'); 
                window.history.pushState({}, '', url);
                handleFilters();
            } else {
                window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
            }
        });
    }
}

/* -----------------------------------------
   SHOP PAGE RENDERING
----------------------------------------- */
function renderProducts(productArray) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (productArray.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-16 text-center text-vault-black opacity-50 font-display text-2xl">NO PRODUCTS FOUND.</div>`;
        return;
    }

    productArray.forEach((p, index) => {
        const badgeHTML = p.badge ? `
            <div class="absolute top-4 left-4 bg-${p.badge === 'SALE' ? 'vault-black' : 'vault-red'} text-vault-white font-display px-3 py-1 text-lg z-10 border-2 border-${p.badge === 'SALE' ? 'vault-white' : 'vault-black'}">
                ${p.badge}
            </div>` : '';

        const priceHTML = p.originalPrice ? `
            <div class="flex flex-col">
                <span class="font-display text-sm text-vault-black line-through opacity-50">$${p.originalPrice.toFixed(2)}</span>
                <span class="font-display text-2xl text-vault-red">$${p.price.toFixed(2)}</span>
            </div>` : `
            <span class="font-display text-2xl text-vault-red">$${p.price.toFixed(2)}</span>`;

        const card = `
            <a href="product.html?id=${p.id}" class="product-card block stagger-up bg-vault-white text-vault-black border-2 border-vault-black relative" style="animation-delay: ${(index % 4) * 0.1}s">
                ${badgeHTML}
                <div class="aspect-[3/4] w-full bg-gray-200 overflow-hidden border-b-2 border-vault-black">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <h4 class="font-display text-2xl mb-2 leading-none">${p.name}</h4>
                    <p class="font-normal text-sm mb-4 uppercase text-vault-black/60">${p.category} / ${p.subcategory}</p>
                    <div class="flex justify-between items-center mt-auto">
                        ${priceHTML}
                        <button class="w-12 h-12 bg-vault-black text-vault-white flex items-center justify-center hover:bg-vault-red transition-colors duration-300 shadow-[4px_4px_0px_0px_#0a0a0a] hover:shadow-none hover:translate-y-1 hover:translate-x-1" onclick="event.preventDefault(); addToCart(${p.id}, 'M')">
                            <span class="material-symbols-outlined">add</span>
                        </button>
                    </div>
                </div>
            </a>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
}

function handleFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    let activeCategory = urlParams.get('category') || 'all';
    let searchQuery = urlParams.get('q') || '';
    let activeSubcategory = 'all';

    const categoryBtns = document.querySelectorAll('.category-btn');
    const subcategoryBtns = document.querySelectorAll('.subcategory-btn');
    const pageTitle = document.getElementById('shop-title');

    function updateTitle() {
        if (!pageTitle) return;
        if (searchQuery) {
            pageTitle.innerHTML = `SEARCH <span class="text-vault-white">"${searchQuery.toUpperCase()}"</span>`;
            return;
        }
        const catName = activeCategory === 'all' ? 'All Collections' : activeCategory.toUpperCase();
        const subName = activeSubcategory === 'all' ? '' : ` - ${activeSubcategory.toUpperCase()}`;
        pageTitle.innerHTML = `${catName}<span class="text-vault-white">${subName}</span>`;
    }

    function applyFilters() {
        let filtered = products;
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.category.toLowerCase().includes(q) ||
                p.subcategory.toLowerCase().includes(q) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
            );
        }

        if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
        if (activeSubcategory !== 'all') filtered = filtered.filter(p => p.subcategory === activeSubcategory);
        
        renderProducts(filtered);
        updateTitle();
        
        categoryBtns.forEach(btn => {
            if (btn.dataset.category === activeCategory && !searchQuery) {
                btn.classList.add('active', 'text-vault-red');
                btn.classList.remove('text-vault-black');
            } else {
                btn.classList.remove('active', 'text-vault-red');
                btn.classList.add('text-vault-black');
            }
        });

        subcategoryBtns.forEach(btn => {
            if (btn.dataset.subcategory === activeSubcategory) {
                btn.classList.add('border-vault-red', 'text-vault-red');
                btn.classList.remove('border-transparent', 'text-vault-black');
            } else {
                btn.classList.remove('border-vault-red', 'text-vault-red');
                btn.classList.add('border-transparent', 'text-vault-black');
            }
        });
    }

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.dataset.category;
            activeSubcategory = 'all';
            searchQuery = ''; 
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('q');
            if(activeCategory === 'all') newUrl.searchParams.delete('category');
            else newUrl.searchParams.set('category', activeCategory);
            
            window.history.pushState({}, '', newUrl);
            applyFilters();
        });
    });

    subcategoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeSubcategory = e.target.dataset.subcategory;
            applyFilters();
        });
    });

    if (document.getElementById('product-grid')) applyFilters();
}

/* -----------------------------------------
   PRODUCT DETAILS PAGE
----------------------------------------- */
function renderProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('pd-title').innerText = product.name;
    document.getElementById('pd-category').innerText = `${product.category} / ${product.subcategory}`;
    document.getElementById('pd-image').src = product.image;
    
    const priceContainer = document.getElementById('pd-price-container');
    if (product.originalPrice) {
        priceContainer.innerHTML = `
            <span class="font-display text-4xl lg:text-5xl text-vault-black line-through opacity-50 mr-4">$${product.originalPrice.toFixed(2)}</span>
            <span class="font-display text-6xl lg:text-8xl text-vault-red">$${product.price.toFixed(2)}</span>
            <span class="ml-4 inline-block bg-vault-black text-vault-white font-display px-3 py-1 text-xl border-2 border-vault-white align-top mt-2 lg:mt-6">SALE</span>
        `;
    } else {
        priceContainer.innerHTML = `
            <span class="font-display text-6xl lg:text-8xl text-vault-red">$${product.price.toFixed(2)}</span>
        `;
    }

    let selectedSize = null;
    const sizeBtns = document.querySelectorAll('.size-btn');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const errorMsg = document.getElementById('size-error');

    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('bg-vault-black', 'text-vault-white', 'border-vault-red'));
            btn.classList.add('bg-vault-black', 'text-vault-white', 'border-vault-red');
            selectedSize = btn.dataset.size;
            errorMsg.classList.add('hidden');
        });
    });

    if (addToCartBtn) {
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        
        newBtn.addEventListener('click', () => {
            if (!selectedSize && sizeBtns.length > 0) {
                errorMsg.classList.remove('hidden');
                return;
            }
            addToCart(product.id, selectedSize || 'OS');
        });
    }

    renderRelatedProducts(product);
}

function renderRelatedProducts(currentProduct) {
    const relatedContainer = document.getElementById('related-products-grid');
    if (!relatedContainer) return;

    // Find products in the same category, excluding the current one
    let related = products.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id);
    // If not enough, fill with random ones
    if (related.length < 3) {
        const others = products.filter(p => p.id !== currentProduct.id && !related.includes(p));
        related = related.concat(others);
    }
    
    // Take exactly 3
    related = related.slice(0, 3);
    
    relatedContainer.innerHTML = '';
    
    related.forEach((p, index) => {
        const priceHTML = p.originalPrice ? `
            <div class="flex flex-col">
                <span class="font-display text-sm text-vault-black line-through opacity-50">$${p.originalPrice.toFixed(2)}</span>
                <span class="font-display text-xl text-vault-red">$${p.price.toFixed(2)}</span>
            </div>` : `
            <span class="font-display text-xl text-vault-red">$${p.price.toFixed(2)}</span>`;

        const card = `
            <a href="product.html?id=${p.id}" class="block bg-vault-white border-2 border-vault-black hover:border-vault-red transition-colors group">
                <div class="aspect-[3/4] w-full bg-gray-200 overflow-hidden border-b-2 border-vault-black">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-4">
                    <h4 class="font-display text-xl mb-1 leading-none truncate">${p.name}</h4>
                    <p class="font-normal text-xs mb-3 uppercase text-vault-black/60">${p.category}</p>
                    <div class="flex justify-between items-center">
                        ${priceHTML}
                    </div>
                </div>
            </a>
        `;
        relatedContainer.insertAdjacentHTML('beforeend', card);
    });
}

/* -----------------------------------------
   GLOBAL BINDINGS
----------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.cart-toggle-btn')) {
            e.preventDefault();
            openCart();
        }
        if (e.target.closest('#close-cart-btn') || e.target.closest('#cart-overlay')) {
            closeCart();
        }
        if (e.target.closest('#mobile-menu-btn')) {
            e.preventDefault();
            openMobileMenu();
        }
        if (e.target.closest('#close-mobile-menu-btn')) {
            e.preventDefault();
            closeMobileMenu();
        }
    });
});
