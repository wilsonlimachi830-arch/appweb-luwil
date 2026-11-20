// CONFIGURA aquí la URL de implementación de tu Apps Script (termina en /exec).
const API_URL = "https://script.google.com/macros/s/AKfycbx6vZWBNMmCmj8uBTKe77RQYQY1F4KQ03RYjyTS7d_81bgFoAB9k_5O3Iwwn_J7q1U/exec";
const WHATSAPP_NUMBER = "59169756518";

// Imágenes iniciales del catálogo. En producción, ID/NOMBRE/PRECIO/FOTO se leen de Google Sheets.
const fallbackProducts = [
 {ID:"ORG-001",NOMBRE:"Organizador acrílico con cajones",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/815HJksuF0L._AC_SL1500_.jpg",DESCRIPCION:"Cajones transparentes apilables para mantener ordenados cosméticos, artículos de baño, medicamentos y accesorios. Su diseño permite ver el contenido y acceder fácilmente.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-002",NOMBRE:"Organizador transparente multiuso",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71QVFOcs0EL._AC_SL1500_.jpg",DESCRIPCION:"Solución práctica de almacenamiento para aprovechar mejor el espacio en armarios, estantes y encimeras. Permite clasificar y encontrar los artículos con facilidad.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-003",NOMBRE:"Caja organizadora para el hogar",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71jJzm+pjoL._AC_SL1500_.jpg",DESCRIPCION:"Contenedor versátil para organizar objetos de uso diario. Su acabado transparente facilita identificar lo guardado y mantener los espacios despejados.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-004",NOMBRE:"Organizador compacto",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71me4nDrYcL._AC_SL1500_.jpg",DESCRIPCION:"Accesorio funcional para ordenar productos pequeños y aprovechar espacios reducidos en el hogar.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-005",NOMBRE:"Caja de almacenamiento",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/61o81vPHbiL._AC_SL1500_.jpg",DESCRIPCION:"Diseñada para agrupar y proteger artículos cotidianos, ayudando a conservar cada cosa en su lugar.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-006",NOMBRE:"Organizador de espacios",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/713zAnmGd6L._AC_SL1500_.jpg",DESCRIPCION:"Una alternativa sencilla para clasificar accesorios y mantener una presentación ordenada en tus espacios.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-007",NOMBRE:"Organizador apilable",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71VACwDk0HL._AC_SL1500_.jpg",DESCRIPCION:"Aprovecha el espacio vertical y facilita la organización de diferentes artículos en casa.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-008",NOMBRE:"Contenedor organizador",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71M8viXXxoL._AC_SL1500_.jpg",DESCRIPCION:"Contenedor multiuso que ayuda a mantener los objetos agrupados y accesibles.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-009",NOMBRE:"Accesorio de almacenamiento",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71y83QdHV5L._AC_SL1500_.jpg",DESCRIPCION:"Complemento práctico para ordenar y aprovechar mejor los espacios del hogar.",DISPONIBLE:"Sí",CANTIDAD:10},
 {ID:"ORG-010",NOMBRE:"Organizador para el hogar",PRECIO:0,FOTO:"https://m.media-amazon.com/images/I/71W7vcgfKdL._AC_SL1500_.jpg",DESCRIPCION:"Una opción funcional para organizar productos y accesorios de uso frecuente.",DISPONIBLE:"Sí",CANTIDAD:10}
];

let products = [];
let quantities = {};
const grid = document.getElementById("productGrid");
const money = value => "Bs " + Number(value || 0).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2});
const isAvailable = p => !["no","false","agotado","0"].includes(String(p.DISPONIBLE ?? "Sí").toLowerCase());

function safe(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(list){
  if(!list.length){grid.innerHTML='<div class="empty-state">No encontramos productos con esa búsqueda.</div>';document.getElementById("resultCount").textContent="0 productos";return;}
  document.getElementById("resultCount").textContent=`${list.length} productos`;
  grid.innerHTML=list.map((p)=>{
    const id=safe(p.ID), available=isAvailable(p), qty=Math.max(1,Number(quantities[p.ID]||1));
    return `<article class="product-card" data-id="${id}">
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="product-image-wrap">
            <span class="stock-pill ${available?'':'out'}">${available?'Disponible':'Agotado'}</span>
            <img class="product-image" src="${safe(p.FOTO)}" alt="${safe(p.NOMBRE)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://placehold.co/600x500/f1f5f9/64748b?text=Producto'">
          </div>
          <div class="card-front-info"><span class="product-id">ID: ${id}</span><h3 class="product-title">${safe(p.NOMBRE)}</h3><div class="front-bottom"><span class="price">${money(p.PRECIO)}</span><button class="details-btn" data-action="details">Ver detalles ↗</button></div></div>
        </div>
        <div class="card-face card-back">
          <div class="back-top"><span class="back-label">DETALLES DEL PRODUCTO</span><button class="close-card" data-action="close" aria-label="Volver">×</button></div>
          <h3>${safe(p.NOMBRE)}</h3><p class="description">${safe(p.DESCRIPCION || "Consulta con nosotros para conocer más detalles del producto.")}</p>
          <div class="back-meta"><span>ID: ${id}</span><strong>${money(p.PRECIO)}</strong></div>
          <div class="back-meta"><span>Disponibilidad</span><strong>${available?'Disponible':'Agotado'}</strong></div>
          <div class="quantity-row"><label for="qty-${id}">Cantidad</label><div class="qty-control"><button data-action="minus" aria-label="Disminuir">−</button><output id="qty-${id}">${qty}</output><button data-action="plus" aria-label="Aumentar">+</button></div></div>
          <button class="buy-btn" data-action="buy" ${available?'':'disabled'}>${available?'Pedir por WhatsApp':'No disponible'}</button>
        </div>
      </div></article>`;
  }).join("");
}
function showSearch(){
 const q=document.getElementById("searchInput").value.trim().toLocaleLowerCase("es");
 render(products.filter(p=>[p.ID,p.NOMBRE,p.DESCRIPCION].join(" ").toLocaleLowerCase("es").includes(q)));
}
async function loadProducts(){
  products=fallbackProducts;
  render(products);
  if(!API_URL || API_URL.includes("PEGA_AQUI")) return;
  try{
    const response=await fetch(API_URL,{cache:"no-store"});
    if(!response.ok) throw new Error("No se pudo consultar el catálogo");
    const data=await response.json();
    if(Array.isArray(data) && data.length){
      products=data.map(p=>({...p,PRECIO:Number(p.PRECIO||0),CANTIDAD:Number(p.CANTIDAD??10)}));
      showSearch();
    }
  }catch(error){console.warn("Se muestra el catálogo de respaldo:",error);}
}
function orderOnWhatsApp(product){
 const quantity=Math.max(1,Number(quantities[product.ID]||1));
 const total=Number(product.PRECIO||0)*quantity;
 const message=`¡Hola! Quiero realizar este pedido:\n\nProducto: ${product.NOMBRE}\nID: ${product.ID}\nCantidad: ${quantity}\nPrecio unitario: ${money(product.PRECIO)}\nTotal: ${money(total)}\n\n¿Podrían confirmarme la disponibilidad?`;
 window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,"_blank","noopener");
}
grid.addEventListener("click",event=>{
 const button=event.target.closest("[data-action]");
 if(!button)return;
 const card=button.closest(".product-card");
 const product=products.find(p=>String(p.ID)===card.dataset.id);
 if(!product)return;
 const action=button.dataset.action;
 if(action==="details") card.classList.add("flipped");
 if(action==="close") card.classList.remove("flipped");
 if(action==="plus"){quantities[product.ID]=Math.min(Number(quantities[product.ID]||1)+1,Math.max(1,Number(product.CANTIDAD||99)));card.querySelector("output").textContent=quantities[product.ID];}
 if(action==="minus"){quantities[product.ID]=Math.max(1,Number(quantities[product.ID]||1)-1);card.querySelector("output").textContent=quantities[product.ID];}
 if(action==="buy")orderOnWhatsApp(product);
});
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();showSearch();});
document.getElementById("searchInput").addEventListener("input",showSearch);
document.getElementById("year").textContent=new Date().getFullYear();
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".main-nav").classList.toggle("open"));

// Carrusel automático: cambia cada 2 segundos.
const slides=[...document.querySelectorAll(".hero-slide")], dots=document.getElementById("heroDots");
let slideIndex=0;
slides.forEach((_,i)=>{const dot=document.createElement("button");dot.className=i===0?"active":"";dot.setAttribute("aria-label",`Mostrar imagen ${i+1}`);dot.addEventListener("click",()=>setSlide(i));dots.appendChild(dot);});
function setSlide(i){slides[slideIndex].classList.remove("active");dots.children[slideIndex].classList.remove("active");slideIndex=i;slides[slideIndex].classList.add("active");dots.children[slideIndex].classList.add("active");}
setInterval(()=>setSlide((slideIndex+1)%slides.length),2000);

// Renderiza solo el catálogo visible y usa loading="lazy" para imágenes fuera de pantalla.
loadProducts();