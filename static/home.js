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

async function valorar(){
    try {
        let historial = await fetch('/getuser?Username=' + localStorage.getItem("username"));
        if(!historial) {
            throw new Error("No se pudo obtener el historial del usuario");
        }
        historial = await historial.json();
        historial = historial.History;

        historial = historial.splice(',');

        historial = [...new Set(historial)];

        for (let j = 0; j < historial.length; j++) {
            let movie = await fetch(`/getpeliculabyFuncion?id=${historial[j]}`);

            if (!movie.ok) {
                throw new Error("Error al obtener la película");
            }
            movie = await movie.json();
            console.log(movie);

            let cuentaContainer = document.getElementById("cuenta-container");
            let inicioContainer = document.getElementById("inicio-container");
            let peliculaContainer = document.getElementById("pelicula-container");
            if (peliculaContainer) { 
                peliculaContainer.remove();
            }

            if (cuentaContainer) {
                cuentaContainer.remove();
            } else if (inicioContainer) { 
                inicioContainer.remove();
            }
            

            peliculaContainer = document.createElement("div");
            peliculaContainer.id = "pelicula-container";


            let pelicula = document.createElement("div");
            pelicula.id = "valorarPelicula";
            let titulo = document.createElement("h1");
            titulo.innerText = movie.Titulo;

            let image = document.createElement("img");
            image.src = movie.Imagen;

            let maxStars = 5;
            const ratingDiv = document.createElement("div");
            ratingDiv.classList.add("rating");
            let ratingValue = 0;

            for (let i = maxStars; i >= 1; i--) {
                const starInput = document.createElement("input");
                starInput.type = "radio";
                starInput.name = "rating";
                starInput.value = i;
                starInput.id = `star${i}`;

                starInput.addEventListener("change", async (event)  =>  {
                    ratingValue = parseInt(event.target.value); 
                    console.log(`Calificación seleccionada para ${movie.Titulo}:`, ratingValue);
                    let response = await fetch('/puntuarPelicula', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            peliculaId: movie._id,
                            puntuacion: ratingValue,
                            Username: localStorage.getItem("username"),
                            Generos: movie.Generos
                        })
                    })
                    
                });

                // Create the label element for the star
                let starLabel = document.createElement("label");
                starLabel.htmlFor = `star${i}`;

                // Append input and label to the rating div
                ratingDiv.appendChild(starInput);
                ratingDiv.appendChild(starLabel);
            }
            pelicula.appendChild(titulo);
            pelicula.appendChild(image);
            pelicula.appendChild(ratingDiv);
            peliculaContainer.appendChild(pelicula);
            document.body.appendChild(peliculaContainer);
            
        }

    }catch (error) {
        console.error("Error al cargar la película:", error);
        const popup = document.createElement("div");
        popup.id = "popup-container";
        popup.classList.add("popup");
        popup.innerHTML = `
            <div class="popup-content">
                <span class="close">&times;</span>
                <h2>Error al cargar la película</h2>
                <p>${error.message}</p>
            </div>
        `;
        document.body.appendChild(popup);
        const closeBtn = popup.querySelector(".close");
        closeBtn.onclick = function() {
            popup.remove();
            document.body.classList.remove('body-no-scroll');
        };
    }
}


async function inicio() {
    try {
        closeBtn.onclick(); // Cierra el sidebar si está abierto
        let cuentaContainer = document.getElementById("cuenta-container");
        if (cuentaContainer) { // Asegúrate de que el elemento exista antes de intentar eliminarlo
            cuentaContainer.remove();
        }

        let inicioContainer = document.getElementById("inicio-container");
        if (inicioContainer) {
            return; // Si el contenedor ya existe, no hacemos nada
        }

        inicioContainer = document.createElement("div");
        inicioContainer.id = "inicio-container"; // Asigna un id para identificarlo
        let titulo = document.createElement("h1");
        titulo.innerText = "Peliculas en cartelera";

        inicioContainer.appendChild(titulo);
        let peliculas = document.createElement("div");
        peliculas.id = "peliculas-container"; // Asigna un id para identificarlo

        let response = await fetch("/getpeliculas");
        if (!response.ok) {
            throw new Error("Error al obtener las películas");
        }
        let data = await response.json();

        for (let pelicula of data) {
            let peliculaDiv = document.createElement("div");
            peliculaDiv.id = 'peliculaDiv';
            peliculaDiv.className = "pelicula";

            let imagenPelicula = document.createElement("img");
            imagenPelicula.src = pelicula.Imagen;

            let tituloPelicula = document.createElement("h2");
            tituloPelicula.innerText = pelicula.Titulo;

            let directorPelicula = document.createElement("p");
            directorPelicula.innerText = `Director: ${pelicula.Director}`;

            let generosPelicula = document.createElement("p");
            generosPelicula.innerText = `Géneros: ${pelicula.Generos.join(", ")}`;

            let yearPelicula = document.createElement("p");
            yearPelicula.innerText = `Año: ${pelicula.Year}`;

            let duracionPelicula = document.createElement("p");
            duracionPelicula.innerText = `Duración: ${pelicula.Duracion} minutos`;

            let comprarboleto = document.createElement("button");
            comprarboleto.innerText = "Comprar Boleto";
            comprarboleto.onclick = () => comprarBoleto(tituloPelicula.innerText);

            peliculaDiv.appendChild(tituloPelicula);
            peliculaDiv.appendChild(imagenPelicula);
            peliculaDiv.appendChild(directorPelicula);
            peliculaDiv.appendChild(generosPelicula);
            peliculaDiv.appendChild(yearPelicula);
            peliculaDiv.appendChild(duracionPelicula);
            peliculaDiv.appendChild(comprarboleto);


            peliculas.appendChild(peliculaDiv);
        }


        inicioContainer.appendChild(peliculas);
        document.body.appendChild(inicioContainer);
    }catch (error) {

    }
}

// Función auxiliar para convertir un índice numérico de fila a una letra de columna (A, B, C...)
function getLetraColumna(indice) {
    // El código ASCII de 'A' es 65
    return String.fromCharCode(65 + indice);
}


let asientosAcomprar = 0;
let valorBoleta = 0;

function seleccionado(elemento) {
    const estilosComputados = window.getComputedStyle(elemento);
    let cantAsientos = document.getElementById("cantAsientos");
    let precio = document.getElementById("precio");
    if (estilosComputados.backgroundColor === 'rgb(33, 136, 56)') {
        elemento.style.backgroundColor = '#dc3545'
        elemento.className = 'asiento-ocupado';
        asientosAcomprar += 1;
    }else {
        elemento.style.backgroundColor = '#218838';
        elemento.className = 'asiento-disponible';
        asientosAcomprar -= 1;
    }
    cantAsientos.innerText = `Asientos seleccionados: ${asientosAcomprar}`;

    precio.innerText = `Precio: $${valorBoleta * asientosAcomprar}`;
}

async function comprarBoleto(tituloPelicula) {
    try {
        alert("comprando..")
        const popup = document.createElement("div");
        popup.id = "popup-container";
        popup.classList.add("popup");
        document.body.classList.add('body-no-scroll');

        let funciones = await fetch(`/getfunciones?pelicula=${tituloPelicula}`);
        funciones = await funciones.json();
        console.log(funciones);
        

        if (funciones.length === 0) {
            popup.innerHTML = `
                <div class="popup-content">
                    <span class="close">&times;</span>
                    <h2>No hay funciones disponibles para ${tituloPelicula}</h2>
                </div>
            `;
            document.body.appendChild(popup);
            const closeBtn = popup.querySelector(".close");
            closeBtn.onclick = function() {
                popup.remove();
                document.body.classList.remove('body-no-scroll');
            };
            return;
        }
        

        popup.innerHTML = `
            <div class="popup-content">
                <span class="close">&times;</span>
                <h2>${tituloPelicula}</h2>
                <p>Seleccione una función:</p>
                
                <select id="funciones-select">
                    ${funciones.map(funcion => `<option value="${funcion._id}">${IsoToHour(funcion.Hora)}</option>`).join('')}
                </select>
                <div id="selectAsiento"></div>
                <div id="funcion"></div>
            </div>
        `;
        document.body.appendChild(popup);

        // Obtener una referencia al elemento select
        const funcionesSelect = document.getElementById('funciones-select');
        const detallesFuncion = document.getElementById('funcion');

        funcionesSelect.addEventListener('change', (event) => {
            const idFuncionSeleccionada = event.target.value;
            const funcionSeleccionada = funciones.find(funcion => funcion._id === idFuncionSeleccionada);
            let tablaHTML = '<table id="tabla-asientos">';
            let filas = funcionSeleccionada.Asientos.length;
            let columnas = funcionSeleccionada.Asientos[0].length;

            for (let i = 0; i < filas; i++) {
                const letraFila = getLetraColumna(i);
                tablaHTML += '<tr>'; // Abre una fila
                for (let j = 0; j < columnas; j++) {
                    const estadoAsiento = funcionSeleccionada.Asientos[i][j];
                    const numeroColumna = j + 1; // La columna es 1-indexada (1, 2, 3...)
                    const idAsiento = `${letraFila}${numeroColumna}`; // Ej: A1, B2

                    // Ahora incluimos la posición del asiento directamente en el texto de la celda
                    if (estadoAsiento === 0) { // Asumiendo que 0 significa disponible
                        tablaHTML += `<td onclick="seleccionado(this)" class="asiento-disponible" data-fila="${i}" data-columna="${j}">${idAsiento} </td>`;
                    } else { // Cualquier otro valor (por ejemplo, 1 o true) significa ocupado
                        tablaHTML += `<td class="asiento-ocupado" data-fila="${i}" data-columna="${j}">${idAsiento}</td>`;
                    }
                }
                tablaHTML += '</tr>'; // Cierra la fila
            }
            valorBoleta = funcionSeleccionada.Precio;

            if (funcionSeleccionada) {
                // Aquí puedes formatear y mostrar los detalles de la función seleccionada
                detallesFuncion.innerHTML = `
                    <h3>Detalles de la Función:</h3>
                    <p><strong>Hora:</strong> ${IsoToHour(funcionSeleccionada.Hora)}</p>
                    <p><strong>Sala:</strong> ${funcionSeleccionada.Sala}</p>
                    <p id="precio">Precio: $${funcionSeleccionada.Precio}</p>
                    ${tablaHTML}
                    <p id="cantAsientos">Asientos seleccionados: 0</p>
                `;

                const send = document.createElement("button");
                send.innerText = "Comprar Boletos";
                send.onclick = () => confirmarcompra(funcionSeleccionada);

                detallesFuncion.appendChild(send);

            } else {
                detallesFuncion.innerHTML = '<p>No se encontraron detalles para la función seleccionada.</p>';
            }
        });


        const closeBtn = popup.querySelector(".close");
        closeBtn.onclick = function() {
            popup.remove();
            document.body.classList.remove('body-no-scroll');
        };


    }catch (error) {
        console.error("Error al comprar boleto:", error);
        const popup = document.createElement("div");
        popup.id = "popup-container";
        popup.classList.add("popup");
        popup.innerHTML = `
            <div class="popup-content">
                <span class="close">&times;</span>
                <h2>Error al comprar boleto</h2>
                <p>${error.message}</p>
            </div>
        `;
        document.body.appendChild(popup);
        const closeBtn = popup.querySelector(".close");
        closeBtn.onclick = function() {
            popup.remove();
            document.body.classList.remove('body-no-scroll');
        };
    }
}


async function confirmarcompra(funcion) {
    try {
        let asientosSeleccionados = funcion.Asientos;
        let Hora = funcion.Hora;
        let _id = funcion._id;
        let matriz = document.querySelectorAll("#tabla-asientos td");
        console.log(matriz);
        for (let i = 0; i < matriz.length; i++) {
            if(matriz[i].className == "asiento-ocupado") {
                let fila = matriz[i].dataset.fila;
                let columna = matriz[i].dataset.columna;
                asientosSeleccionados[fila][columna] = 1;
            }
        }

        let data = await fetch('/actualizarfuncion', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ _id, Asientos: asientosSeleccionados })
        });

        if (!data.ok) {
            throw new Error("Error al actualizar la función");
        }

        let username = localStorage.getItem("username");

        let response = await fetch('/addToHistory', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ BoletoId: _id, Username: username })
        });

    }catch (error) {
        console.error("Error al confirmar compra:", error);
    }
}

async function cuenta() {
    try {
        closeBtn.onclick(); // Cierra el sidebar si está abierto
        let inicioContainer = document.getElementById("inicio-container");
        if (inicioContainer) { // Asegúrate de que el elemento exista antes de intentar eliminarlo
            inicioContainer.remove();
        }
        let peliculaContainer = document.getElementById("pelicula-container");
        if (peliculaContainer) { // Asegúrate de que el elemento exista antes de intentar eliminarlo
            peliculaContainer.remove();
        }
        // Verifica si el div de la cuenta ya existe
        let cuentaContainer = document.getElementById("cuenta-container");
        if (cuentaContainer) {
            return;
        }

        cuentaContainer = document.createElement("div");
        cuentaContainer.id = "cuenta-container"; // Asigna un id para identificarlo

        let response = await fetch(`/getuser?Username=${localStorage.getItem("username")}`);
        let data = await response.json();

        let preferencias = data.Prefences;
        preferencias = preferencias.map(item => [item]);
        
        if (preferencias.length > 0) {
            for(let i = 0; i < preferencias.length; i++) {
                preferencias[i].unshift(i+1);
            }
        }
        preferencias.sort((a, b) => b[1] - a[1]);
        console.log(preferencias);
        let generos = ["Accion", "Terror", "Comedia", "Romance", "Ciencia ficcion", "Anime", "Infantil", "Drama", "Fantasia", "espacial", "Suspenso"]

        let gustos = [];
        for (let i = 0; i < 3; i++) {
            let id = preferencias[i][0];
            gustos.push(generos[id - 1]);
        }

        let titulo = document.createElement("h1");
        titulo.innerText = "Mi cuenta";
        cuentaContainer.appendChild(titulo);
        
        let table = document.createElement("table");
        table.id = "prefences-table";

        table.style.borderCollapse = 'collapse'; 
        table.style.width = '100%';

        let thead = document.createElement("thead");
        let headerRow = document.createElement("tr");

        generos.forEach(genero => {
            let th = document.createElement("th");
            th.textContent = genero; 
            th.style.border = '1px solid black'; 
            th.style.padding = '8px';
            th.style.backgroundColor = '#f2f2f2'; 
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        let tbody = document.createElement("tbody");
        let dataRow = document.createElement("tr");

        let values = math.matrix(data.Prefences);
        let unitario = math.matrix(Array(((data.Prefences).length)).fill(1))
        let size = 1 / (math.dot(values, unitario));


        let percentages = math.multiply(size, values);

        percentages = percentages.toArray()

        percentages.forEach(puntuacion => {
            let td = document.createElement("td");
            td.textContent = `${(puntuacion * 100).toFixed(2)}%`;
            td.style.border = '1px solid black'; 
            td.style.padding = '8px';
            td.style.textAlign = 'center'; 
            dataRow.appendChild(td);
        });

        tbody.appendChild(dataRow);
        table.appendChild(tbody);
        

        function crearCampo(labelText, value, key, editable = true) {
            let wrapper = document.createElement("div");
            wrapper.className = "cuenta-campo";

            let label = document.createElement("span");
            label.innerText = `${labelText}: `;
            label.style.fontWeight = "bold";

            let valueSpan = document.createElement("span");
            valueSpan.innerText = value || "";
            valueSpan.id = `cuenta-${key}`;

            wrapper.appendChild(label);
            wrapper.appendChild(valueSpan);

            if (editable) {
                let editBtn = document.createElement("button");
                editBtn.innerText = "Editar";
                editBtn.onclick = function() {
                    editarCampo(key, valueSpan);
                };
                wrapper.appendChild(editBtn);
            }

            return wrapper;
        }

        // Crea todos los campos y sus botones
        cuentaContainer.appendChild(crearCampo("Email", data?.Email, "Email", false));
        cuentaContainer.appendChild(crearCampo("Username", data?.Username, "Username", true));
        cuentaContainer.appendChild(crearCampo("Password", "********", "Password", true));
        cuentaContainer.appendChild(crearCampo("Preferences", gustos, "Preferences", false));
        cuentaContainer.appendChild(table);


        document.body.appendChild(cuentaContainer);

        // Función para editar campos
        function editarCampo(key, valueSpan) {
            console.log('Zapato', key);
            
            let currentValue = valueSpan.innerText;
            if (key === "Password") {
                currentValue = "";
            }
            let input = document.createElement("input");
            input.type = (key === "password") ? "password" : "text";
            input.value = (key === "password") ? "" : currentValue;

            let saveBtn = document.createElement("button");
            saveBtn.innerText = "Guardar";
            saveBtn.onclick = async function() {
                let response;
                let gmail = document.getElementById('cuenta-Email').textContent;
                console.log(gmail);
                
                if (key === "Username") {
                    response = await fetch(`/editAccount`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: gmail,
                            campo: key,
                            valor: input.value
                        })
                    });

                    if (!response) {
                        return res.status(404).send("Usuario no encontrado con el ID proporcionado.");
                    }
                    alert('Campo modificado')
                }
                console.log(input.value);
                
                valueSpan.innerText = (key === "password") ? "********" : input.value;
                valueSpan.style.display = "";
                input.remove();
                saveBtn.remove();
            };

            valueSpan.style.display = "none";
            valueSpan.parentNode.insertBefore(input, valueSpan.nextSibling);
            valueSpan.parentNode.insertBefore(saveBtn, input.nextSibling);
            input.focus();
        }

    } catch (error) {
        console.error("Error al obtener la cuenta:", error);
    }
}

function IsoToHour(iso) {
    let hora = iso.slice(11, 19);
    console.log(hora);
    return hora;
}

document.addEventListener('DOMContentLoaded', () => {
  inicio();
});
