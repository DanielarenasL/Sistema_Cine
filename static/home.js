const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openSidebar');
const closeBtn = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');

openBtn.onclick = function() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
};

closeBtn.onclick = function() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
};

overlay.onclick = function() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
};


function logout(){
    localStorage.clear();
    window.location.href = "index.html";
    console.log("Sesión cerrada");
}

function cuenta() {
    let cuentaContainer = document.createElement("div");

    let titulo = document.createElement("h1");
    titulo.innerText = "Mi cuenta";
    cuentaContainer.appendChild(titulo);

    document.body.appendChild(cuentaContainer);
}