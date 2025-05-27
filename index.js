const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { connection } = require('./connection');
const mongoose = require('mongoose');
const { object } = require('webidl-conversions');
const { ObjectId } = require('bson');

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

async function conexion() {
    await connection();
}
conexion();
let userSchema = new mongoose.Schema({

    Email: String,
    Username: String,
    Password: String,
    Prefences: [String],
    History: [ObjectId], 
});

let peliculaSchema = new mongoose.Schema({

    Titulo: String,
    Director: String,
    Generos: [String],
    Year: Number,
    Duracion: Number,
});

let boletoSchema = new mongoose.Schema({

    Hora: Date,
    Funcion: String,
    Asiento: Number,
});

let funcionSchema = new mongoose.Schema({

    Hora: Date,
    Pelicula: String,
    Sala: Number,
    Asientos: [Array],
    Precio: Number,
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'static')));


app.get('/login', async (req, res) => {

    try {

        let { Username, Password } = req.query;

        const coleccion = mongoose.model('users', userSchema); 

        const usuario = await coleccion.findOne({});

        if (!usuario) {
            return res.status(404).send("Usuario no encontrado.");
        }

        let isvalid = bcrypt.compare(Password, usuario.Password);

        if(Username == usuario.Username && isvalid) {
            res.status(200).send("Usuario encontrado.");
        }else {
            res.status(401).send("Usuario o contraseña incorrectos.");
        }


    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        res.status(500).send("Error al conectar a la base de datos");
    }
});


app.post('/register', async (req,res) => {

    try {

        const User = mongoose.model('Users', userSchema); 

        let { Email, Username, Password, Prefences, History } = req.body;

        const existUser = await User.findOne({ Email });

        if (existUser) {
            return res.status(400).send("El correo ya está registrado.");
        }
        const saltRounds = 10;
        Password = bcrypt.hashSync(Password, saltRounds);

        const nuevoUsuario = new User({
            Email, 
            Username,
            Password,
            Prefences: Prefences || [],
            History: History || [],
        });

        await nuevoUsuario.save();

        res.status(201).send("Usuario registrado exitosamente.");

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).send("Error al registrar usuario.");
    }

});

app.get('/getuser', async (req, res) => {
    try {

        const coleccion = mongoose.model('users', userSchema); 

        const usuarios = await coleccion.findOne({Username: req.query.Username});

        if (!usuarios) {
            return res.status(404).send("No se encontraron usuarios.");
        }else {
            res.status(200).json(usuarios);
        }

    }catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).send("Error al obtener usuarios.");
    }

});

app.get('/getpeliculas', async (req, res) => {

    try {
        const coleccion = mongoose.model('peliculas', peliculaSchema); 

        const peliculas = await coleccion.find({});

        if (peliculas.length === 0) {
            return res.status(404).send("No se encontraron películas.");
        }else {
            res.status(200).json(peliculas);
        }
    }catch (error) {
        console.error("Error al obtener películas:", error);
        res.status(500).send("Error al obtener películas.");
    }
});

app.post('/addpelicula', async (req, res) => {
    try {
        const coleccion = mongoose.model('peliculas', peliculaSchema); 

        let { Titulo, Director, Generos, Year, Duracion } = req.body;

        if (!Titulo || !Director || !Generos || !Year || !Duracion) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        const nuevaPelicula = new coleccion({
            Titulo,
            Director,
            Generos,
            Year,
            Duracion
        });

        await nuevaPelicula.save();

        res.status(201).send("Película agregada exitosamente.");
    }catch (error) {
        console.error("Error al agregar película:", error);
        res.status(500).send("Error al agregar película.");
    }
});

app.get('/getfunciones', async (req, res) => {

    try {
        const coleccion = mongoose.model('funciones', funcionSchema); 
        const pelicula = req.query.pelicula;

        if (!pelicula) {
            return res.status(400).send("El parámetro 'pelicula' es obligatorio.");
        }
        const funciones = await coleccion.find({Pelicula: pelicula});

        res.status(200).json(funciones);
    }catch (error) {
        console.error("Error al obtener funciones:", error);
        res.status(500).send("Error al obtener funciones.");
    }
});

app.post('/addboleto', async (req, res) => {
    try {
        const coleccion = mongoose.model('boletos', boletoSchema); 

        let { Hora, Funcion, Asiento } = req.body;

        if (!Hora || !Funcion || !Asiento) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        let response = new coleccion({

            Hora: new Date(Hora),
            Funcion,
            Asiento
        });

        await response.save();
        res.status(201).send("Boleto agregado exitosamente.");

    }catch (error) {
        console.error("Error al agregar boleto:", error);
    }
});

app.put('/actualizarfuncion', async (req, res) => {
    try {
        const coleccion = mongoose.model('funciones', funcionSchema); 

        let { _id, Asientos} = req.body;

        if (!_id || !Asientos) {
            return res.status(400).send("Los campos '_id' y 'Asientos' son obligatorios.");
        }

        let response = await coleccion.findByIdAndUpdate(
            _id,
            { Asientos: Asientos },
            { new: true, runValidators: true }
        )

        if (!response) {
            return res.status(404).send("Función no encontrada con el ID proporcionado.");
        }

        res.status(200).json(response);

    }catch (error) {
        console.error("Error al actualizar función:", error);
        res.status(500).send("Error al actualizar función.");
    }

});

app.post('/addfuncion', async (req, res) => {

    try {
        const coleccion = mongoose.model('funciones', funcionSchema); 

        let { Hora, Pelicula, Sala, Asientos, Precio } = req.body;

        if (!Hora || !Pelicula || !Sala || !Asientos || !Precio) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        const nuevaFuncion = new coleccion({
            Hora,
            Pelicula,
            Sala,
            Asientos,
            Precio
        });

        await nuevaFuncion.save();

        res.status(201).send("Función agregada exitosamente.");
    }catch (error) {
        console.error("Error al agregar función:", error);
        res.status(500).send("Error al agregar función.");
    }
});

app.listen(PORT,  () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});