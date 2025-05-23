localStorage.clear();
async function login() {
    let Username = document.getElementById("usernameInput").value;
    let Password = document.getElementById("passwordInput").value;
    try {
        let response = await fetch(`/login?Username=${Username}&Password=${Password}`);

        if (response.ok) {
            console.log("Inicio de sesión exitoso");
            localStorage.setItem("sesion", "true");
            window.location.href = "home.html";
        } else {
            console.error("Error en el inicio de sesión:", response.statusText);
        }

    } catch (error) {
        console.error("Error al iniciar sesion:", error);
        res.status(500).send("Error al iniciar sesion");
    }
    
}