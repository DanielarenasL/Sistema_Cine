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

let salaSchema = new mongoose.Schema({

    Numero: Number,
    Tipo: String,
    Asientos: Number,
    Libre: Boolean,
});

let boletoSchema = new mongoose.Schema({

    Hora: Date,
    Funcion: Object,
    Asiento: Number,
});

let funcionSchema = new mongoose.Schema({

    Hora: Date,
    Pelicula: String,
    Sala: Number,
    Asiento: Number,
    Tipo: String,
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



app.listen(PORT,  () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});