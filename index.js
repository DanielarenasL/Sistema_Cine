const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { connection } = require('./connection');
const mongoose = require('mongoose');
const { object, double } = require('webidl-conversions');
const { ObjectId, Decimal128, Double } = require('bson');
const math = require('mathjs');

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
    Prefences: {
        type: [Number],
        default: () => new Array(11).fill(0)
    },
    History: [ObjectId],
});

let peliculaSchema = new mongoose.Schema({

    Titulo: String,
    Imagen: String,
    Director: String,
    Generos: [String],
    Year: Number,
    Duracion: Number,
    Puntuacion: {
        type: Number,
        default: 0
    },
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

        const usuario = await coleccion.findOne({ Username: Username });

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

        console.log("Email:", Email);
        console.log("Username:", Username);
        console.log("Password:", Password);


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

app.get('/getpeliculabyFuncion', async (req, res) => {
    try {
        let coleccion = mongoose.model('funciones', funcionSchema); 

        if (!req.query.id) {
            return res.status(400).send("El parámetro 'id' es obligatorio.");
        }

        let funcionId = new ObjectId(req.query.id);

        const funcion = await coleccion.findById(funcionId);
        if (!funcion) {
            return res.status(404).send("Función no encontrada.");
        }
        coleccion = mongoose.model('peliculas', peliculaSchema);

        const pelicula = await coleccion.findOne({Titulo: funcion.Pelicula});

        if (!pelicula) {
            return res.status(404).send("Película no encontrada.");
        }
        
        res.status(200).json(pelicula);

    }catch (error) {
        console.error("Error al obtener película por ID:", error);
        res.status(500).send("Error al obtener película por ID.");
    }
});

app.put('/puntuarPelicula', async (req, res) => {
    try {
        let coleccion = mongoose.model('peliculas', peliculaSchema);

        let { peliculaId, puntuacion, Username, Generos } = req.body;
        console.log("Puntuacion: ", puntuacion);

        if (!peliculaId || !puntuacion ) {
            return res.status(400).send("Los campos 'peliculaId' y 'puntuacion' son obligatorios.");
        }
        peliculaId = new ObjectId(peliculaId);

        const pelicula = await coleccion.findByIdAndUpdate(
            peliculaId,
            { $inc: { Puntuacion: puntuacion } },
            { new: true, runValidators: true }
        )
        if (!pelicula) {
            return res.status(404).send("Película no encontrada con el ID proporcionado.");
        }

        coleccion = mongoose.model('users', userSchema);

        let usuario = await coleccion.findOne({ Username: Username });
        if (!usuario) {
            return res.status(404).send("Usuario no encontrado.");
        }
        console.log(usuario);

        let userpreferences = usuario.Prefences;
        let genre = ["Accion", "Terror", "Comedia", "Romance", "Ciencia ficcion", "Anime", "Infantil", "Drama", "Fantasia", "Espacial", "Suspenso", "Mounstruos"]

        for (let genero of Generos) {
            let index = genre.indexOf(genero);
            userpreferences[index] += puntuacion;
        }

        usuario = await coleccion.findByIdAndUpdate(
            usuario._id,
            { Prefences: userpreferences },
            { new: true, runValidators: true }
        )
        if (!usuario) {
            return res.status(404).send("No se pudo actualizar el usuario.");
        }
        res.status(200).send("Película puntuada exitosamente.");

    }catch (error) {
        console.error("Error al puntuar película:", error);
        res.status(500).send("Error al puntuar película.");
    }
});

app.post('/addpelicula', async (req, res) => {
    try {
        const coleccion = mongoose.model('peliculas', peliculaSchema); 

        let { Titulo, Imagen ,Director, Generos, Year, Duracion, Puntuacion } = req.body;

        if (!Titulo || Imagen || !Director || !Generos || !Year || !Duracion ) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        const nuevaPelicula = new coleccion({
            Titulo,
            Imagen,
            Director,
            Generos,
            Year,
            Duracion,
            Puntuacion
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

app.post('/editAccount', async (req, res) => {
    try {
        const coleccion = mongoose.model('user', userSchema)

        if (!req.body.campo || !req.body.email || !req.body.valor) {
            return res.status(400).send("El campo a modificar, el valor y el gmail son requeridos.");
        }

        let campo = req.body.campo;
        let email = req.body.email;
        let nuevoValor = req.body.valor;

        let response = await coleccion.findOneAndUpdate(
            { Email: email },
            { $set: { [campo]: nuevoValor }},
            { new: true, runValidators: true }
        )

        if (!response) {
            return res.status(404).send("Usuario no encontrado con el ID proporcionado.");
        }

        res.status(200).json(response);


    }catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).send("Error al actualizar función.");
    }

});

app.put('/addToHistory', async (req, res) => {
    try {

        const coleccion = mongoose.model('users', userSchema); 

        let { Username, BoletoId } = req.body;

        console.log("Username: ", Username);
        console.log("BoletoId: ", BoletoId);

        BoletoId = new ObjectId(BoletoId);

        if (!Username || !BoletoId) {
            return res.status(400).send("Los campos 'Username' y 'BoletoId' son obligatorios.");
        }

        const usuario = await coleccion.findOne({ Username: Username});

        if (!usuario) {
            return res.status(404).send("Usuario no encontrado.");
        }

        let response = await coleccion.findOneAndUpdate(
            { Username: Username },
            { $push: { History: BoletoId } },
            { new: true, runValidators: true }
        )

        if (!response) {
            return res.status(404).send("No se pudo agregar al historial.");
        }

    }catch (error) {
        console.error("Error al agregar a historial:", error);
        res.status(500).send("Error al agregar a historial.");
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


