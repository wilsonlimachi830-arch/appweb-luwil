// URL de la API de Google Sheets (Apps Script).
const API_URL = "https://script.google.com/macros/s/AKfycbx6vZWBNMmCmj8uBTKe77RQYQY1F4KQ03RYjyTS7d_81bgFoAB9k_5O3Iwwn_J7q1U/exec";
// WhatsApp de Bolivia: código de país 591 + número 69756518.
const WHATSAPP_NUMBER = "59169756518";

const fallbackProducts = [
 {ID:"ORG-001",NOMBRE:"Organizador acrílico con cajones",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/815HJksuF0L._AC_SL1500_.jpg",DESCRIPCION:"Cajones transparentes apilables para mantener ordenados cosméticos, artículos de baño, medicamentos y accesorios. Su diseño permite ver el contenido y acceder fácilmente.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-002",NOMBRE:"Organizador transparente multiuso",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71QVFOcs0EL._AC_SL1500_.jpg",DESCRIPCION:"Solución práctica de almacenamiento para aprovechar mejor el espacio en armarios, estantes y encimeras. Permite clasificar y encontrar los artículos con facilidad.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-003",NOMBRE:"Caja organizadora para el hogar",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71jJzm+pjoL._AC_SL1500_.jpg",DESCRIPCION:"Contenedor versátil para organizar objetos de uso diario. Su acabado transparente facilita identificar lo guardado y mantener los espacios despejados.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-004",NOMBRE:"Organizador compacto",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71me4nDrYcL._AC_SL1500_.jpg",DESCRIPCION:"Accesorio funcional para ordenar productos pequeños y aprovechar espacios reducidos en el hogar.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-005",NOMBRE:"Caja de almacenamiento",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/61o81vPHbiL._AC_SL1500_.jpg",DESCRIPCION:"Caja multiuso para agrupar, proteger y mantener organizados artículos cotidianos. Ideal para aprovechar espacios en dormitorios, baños, cocinas y armarios. Su formato facilita guardar objetos y acceder a ellos cuando los necesites.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-006",NOMBRE:"Organizador de espacios",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/713zAnmGd6L._AC_SL1500_.jpg",DESCRIPCION:"Una alternativa sencilla para clasificar accesorios y mantener una presentación ordenada en tus espacios.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-007",NOMBRE:"Organizador apilable",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71VACwDk0HL._AC_SL1500_.jpg",DESCRIPCION:"Aprovecha el espacio vertical y facilita la organización de diferentes artículos en casa.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-008",NOMBRE:"Contenedor organizador",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71M8viXXxoL._AC_SL1500_.jpg",DESCRIPCION:"Contenedor multiuso que ayuda a mantener los objetos agrupados y accesibles.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-009",NOMBRE:"Accesorio de almacenamiento",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71y83QdHV5L._AC_SL1500_.jpg",DESCRIPCION:"Complemento práctico para ordenar y aprovechar mejor los espacios del hogar.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-010",NOMBRE:"Organizador para el hogar",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71W7vcgfKdL._AC_SL1500_.jpg",DESCRIPCION:"Una opción funcional para organizar productos y accesorios de uso frecuente.",DISPONIBLE:"Sí",CANTIDAD:10}
];

let products = [];
let quantities = {};
// Carrito indexado por ID de producto: { ID: cantidad }.
let cart = {};

const grid = document.getElementById("productGrid");
const money = value => "Bs " + Number(value || 0).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2});
const isAvailable = p => !["no","false","agotado","0"].includes(String(p.DISPONIBLE ?? "Sí").trim().toLowerCase());
const stockOf = p => Math.max(0, Number(p.CANTIDAD ?? 99) || 0);

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// Normaliza encabezados de Google Sheets y recupera datos de respaldo si vienen vacíos.
function normalizeProduct(raw) {
  const fields = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    fields[String(key).trim().toUpperCase().replace(/[ÁÀÄ]/g,"A").replace(/[ÉÈË]/g,"E").replace(/[ÍÌÏ]/g,"I").replace(/[ÓÒÖ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/[ _-]/g,"")] = value;
  });
  const id = String(fields.ID ?? "").trim();
  const fallback = fallbackProducts.find(item => item.ID === id) || {};
  const pick = (names, backup) => {
    for (const name of names) {
      const value = fields[name];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return backup;
  };
  let description = String(pick(["DESCRIPCION","DESCRIPCIONPRODUCTO","DETALLES","ESPECIFICACIONES"], fallback.DESCRIPCION || "Consulta con nosotros para conocer más detalles del producto."));
  // ORG-005 debe conservar una ficha útil aunque la fila de Sheets tenga una descripción genérica.
  if (id === "ORG-005" && description.trim().length < 70) description = fallback.DESCRIPCION;
  return {
    ...fallback,
    ...raw,
    ID: id || fallback.ID,
    NOMBRE: String(pick(["NOMBRE","PRODUCTO"], fallback.NOMBRE || "Producto")),
    PRECIO: Number(pick(["PRECIO","PRICE"], fallback.PRECIO || 0)) || 0,
    FOTO: String(pick(["FOTO","IMAGEN","IMAGE","URLIMAGEN"], fallback.FOTO || "")),
    DESCRIPCION: description,
    DISPONIBLE: pick(["DISPONIBLE","ESTADO"], fallback.DISPONIBLE || "Sí"),
    CANTIDAD: Number(pick(["CANTIDAD","STOCK","EXISTENCIAS"], fallback.CANTIDAD ?? 10)) || 0
  };
}

function render(list) {
  if (!list.length) {
    grid.innerHTML='<div class="empty-state">No encontramos productos con esa búsqueda.</div>';
    document.getElementById("resultCount").textContent="0 productos";
    return;
  }
  document.getElementById("resultCount").textContent=`${list.length} productos`;
  grid.innerHTML=list.map(p=>{
    const id=safe(p.ID), available=isAvailable(p) && stockOf(p)>0;
    const qty=Math.max(1,Number(quantities[p.ID]||1));
    return `<article class="product-card" data-id="${id}">
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="product-image-wrap">
            <span class="stock-pill ${available?'':'out'}">${available?'Disponible':'Agotado'}</span>
            <img class="product-image" src="${safe(p.FOTO)}" alt="${safe(p.NOMBRE)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://placehold.co/600x500/f1f5f9/64748b?text=Producto'">
          </div>
          <div class="card-front-info">
            <span class="product-id">ID: ${id}</span>
            <h3 class="product-title">${safe(p.NOMBRE)}</h3>
            <div class="front-bottom"><span class="price">${money(p.PRECIO)}</span><button class="details-btn" data-action="details" type="button">Ver detalles ↗</button></div>
          </div>
        </div>
        <div class="card-face card-back">
          <div class="back-top"><span class="back-label">DETALLES DEL PRODUCTO</span><button class="close-card" data-action="close" aria-label="Volver" type="button">×</button></div>
          <h3>${safe(p.NOMBRE)}</h3>
          <p class="description">${safe(p.DESCRIPCION || "Consulta con nosotros para conocer más detalles del producto.")}</p>
          <div class="back-meta"><span>ID: ${id}</span><strong>${money(p.PRECIO)}</strong></div>
          <div class="back-meta"><span>Stock disponible</span><strong>${stockOf(p)}</strong></div>
          <div class="quantity-row"><label>Cantidad</label><div class="qty-control">
            <button data-action="minus" aria-label="Disminuir" type="button">−</button>
            <output>${qty}</output>
            <button data-action="plus" aria-label="Aumentar" type="button">+</button>
          </div></div>
          <button class="add-cart-btn" data-action="add" type="button" ${available?'':'disabled'}>${available?'Agregar al carrito':'No disponible'}</button>
        </div>
      </div></article>`;
  }).join("");
}

function showSearch() {
  const q=document.getElementById("searchInput").value.trim().toLocaleLowerCase("es");
  render(products.filter(p=>[p.ID,p.NOMBRE,p.DESCRIPCION].join(" ").toLocaleLowerCase("es").includes(q)));
}

async function loadProducts() {
  products=fallbackProducts;
  render(products);
  renderCart();
  if(!API_URL || API_URL.includes("PEGA_AQUI")) return;
  try {
    const response=await fetch(API_URL,{cache:"no-store"});
    if(!response.ok) throw new Error("No se pudo consultar el catálogo");
    const data=await response.json();
    if(Array.isArray(data) && data.length) {
      products=data.map(normalizeProduct);
      showSearch();
      renderCart();
    }
  } catch(error) {
    console.warn("Se muestra el catálogo de respaldo:",error);
  }
}

function addToCart(product) {
  if (!isAvailable(product) || stockOf(product)<1) {
    alert("Este producto no está disponible actualmente.");
    return;
  }
  const requested=Math.max(1,Number(quantities[product.ID]||1));
  const current=Number(cart[product.ID]||0);
  if(current+requested>stockOf(product)) {
    alert(`Solo hay ${stockOf(product)} unidad(es) disponibles de este producto.`);
    return;
  }
  cart[product.ID]=current+requested;
  renderCart();
  document.getElementById("carrito").classList.remove("cart-collapsed");
  document.getElementById("cartFloatingToggle").setAttribute("aria-expanded","true");
}

function changeCartQuantity(id, delta) {
  const product=products.find(p=>String(p.ID)===String(id));
  if(!product || !cart[id]) return;
  const next=cart[id]+delta;
  if(next<=0) delete cart[id];
  else if(next>stockOf(product)) alert(`Stock máximo disponible: ${stockOf(product)} unidad(es).`);
  else cart[id]=next;
  renderCart();
}

function renderCart() {
  const items=Object.entries(cart).filter(([id,qty])=>qty>0);
  const count=items.reduce((sum,[,qty])=>sum+qty,0);
  const total=items.reduce((sum,[id,qty])=>{
    const product=products.find(p=>String(p.ID)===String(id));
    return sum+(product?Number(product.PRECIO||0)*qty:0);
  },0);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("floatingCartCount").textContent=count;
  document.getElementById("cartTotal").textContent=money(total);
  document.getElementById("checkoutWhatsApp").disabled=items.length===0;

  if(!items.length) {
    document.getElementById("cartItems").innerHTML='<p class="cart-empty">Aún no agregaste productos. Explora el catálogo y agrega tus favoritos.</p>';
    return;
  }
  document.getElementById("cartItems").innerHTML=items.map(([id,qty])=>{
    const p=products.find(item=>String(item.ID)===String(id));
    if(!p) return "";
    return `<div class="cart-row" data-cart-id="${safe(id)}">
      <div><div class="cart-product-name">${safe(p.NOMBRE)}</div><div class="cart-product-price">${money(p.PRECIO)} c/u · ID: ${safe(id)}</div></div>
      <div class="cart-qty">
        <button type="button" data-cart-action="minus" aria-label="Restar una unidad">−</button>
        <output>${qty}</output>
        <button type="button" data-cart-action="plus" aria-label="Agregar una unidad">+</button>
      </div>
      <strong class="cart-line-total">${money(Number(p.PRECIO||0)*qty)}</strong>
      <button class="cart-remove" type="button" data-cart-action="remove" aria-label="Quitar producto">×</button>
    </div>`;
  }).join("");
}

function checkoutWhatsApp() {
  const items=Object.entries(cart).filter(([,qty])=>qty>0);
  if(!items.length) return;
  let total=0;
  const lines=items.map(([id,qty],index)=>{
    const p=products.find(item=>String(item.ID)===String(id));
    if(!p) return "";
    const subtotal=Number(p.PRECIO||0)*qty;
    total+=subtotal;
    return `${index+1}. ${p.NOMBRE}\n   Código: ${p.ID}\n   Cantidad: ${qty}\n   Precio unitario: ${money(p.PRECIO)}\n   Subtotal: ${money(subtotal)}`;
  }).filter(Boolean);
  const totalUnits=items.reduce((sum,[,qty])=>sum+qty,0);
  const message=`¡Hola, LU-WIL Store! Quiero realizar el siguiente pedido:\n\n${lines.join("\n\n")}\n\n------------------------------\nCantidad total de unidades: ${totalUnits}\nTOTAL A PAGAR: ${money(total)}\n\n¿Podrían confirmar la disponibilidad y coordinar la entrega?`;
  const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url,"_blank","noopener,noreferrer");
}

grid.addEventListener("click",event=>{
  const productImage = event.target.closest(".product-image");
  if (productImage) {
    const lightbox = document.getElementById("imageLightbox");
    document.getElementById("lightboxImage").src = productImage.src;
    document.getElementById("lightboxImage").alt = productImage.alt;
    document.getElementById("lightboxCaption").textContent = productImage.alt;
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden","false");
    return;
  }
  const button=event.target.closest("[data-action]");
  if(!button) return;
  const card=button.closest(".product-card");
  const product=products.find(p=>String(p.ID)===card?.dataset.id);
  if(!product) return;
  const action=button.dataset.action;
  if(action==="details") card.classList.add("flipped");
  if(action==="close") card.classList.remove("flipped");
  if(action==="plus") {
    quantities[product.ID]=Math.min(Number(quantities[product.ID]||1)+1,Math.max(1,stockOf(product)));
    card.querySelector("output").textContent=quantities[product.ID];
  }
  if(action==="minus") {
    quantities[product.ID]=Math.max(1,Number(quantities[product.ID]||1)-1);
    card.querySelector("output").textContent=quantities[product.ID];
  }
  if(action==="add") addToCart(product);
});

document.getElementById("cartItems").addEventListener("click",event=>{
  const button=event.target.closest("[data-cart-action]");
  if(!button) return;
  const row=button.closest("[data-cart-id]");
  const id=row?.dataset.cartId;
  if(!id) return;
  if(button.dataset.cartAction==="minus") changeCartQuantity(id,-1);
  if(button.dataset.cartAction==="plus") changeCartQuantity(id,1);
  if(button.dataset.cartAction==="remove") { delete cart[id]; renderCart(); }
});

document.getElementById("clearCart").addEventListener("click",()=>{
  cart={};
  renderCart();
});
document.getElementById("checkoutWhatsApp").addEventListener("click",checkoutWhatsApp);
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();showSearch();});
document.getElementById("searchInput").addEventListener("input",showSearch);
// Controles del carrito flotante y visor de fotografías.
const cartPanel = document.getElementById("carrito");
const cartFloatingToggle = document.getElementById("cartFloatingToggle");
function toggleCart() {
  const collapsed = cartPanel.classList.toggle("cart-collapsed");
  cartFloatingToggle.setAttribute("aria-expanded", String(!collapsed));
}
cartFloatingToggle.addEventListener("click", () => {
  cartPanel.classList.remove("cart-collapsed");
  cartFloatingToggle.setAttribute("aria-expanded","true");
});
document.getElementById("cartCollapse").addEventListener("click", toggleCart);
const lightbox = document.getElementById("imageLightbox");
function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden","true");
  document.getElementById("lightboxImage").src = "";
}
document.getElementById("lightboxClose").addEventListener("click",closeLightbox);
lightbox.addEventListener("click",event=>{ if(event.target===lightbox) closeLightbox(); });
document.addEventListener("keydown",event=>{ if(event.key==="Escape") closeLightbox(); });

document.getElementById("year").textContent=new Date().getFullYear();
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".main-nav").classList.toggle("open"));

// Carrusel automático.
const slides=[...document.querySelectorAll(".hero-slide")], dots=document.getElementById("heroDots");
let slideIndex=0;
slides.forEach((_,i)=>{
  const dot=document.createElement("button");
  dot.className=i===0?"active":"";
  dot.setAttribute("aria-label",`Mostrar imagen ${i+1}`);
  dot.addEventListener("click",()=>setSlide(i));
  dots.appendChild(dot);
});
function setSlide(i) {
  if(!slides.length) return;
  slides[slideIndex].classList.remove("active");
  dots.children[slideIndex].classList.remove("active");
  slideIndex=i;
  slides[slideIndex].classList.add("active");
  dots.children[slideIndex].classList.add("active");
}
if(slides.length>1) setInterval(()=>setSlide((slideIndex+1)%slides.length),5000);

loadProducts();
