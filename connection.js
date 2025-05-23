const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const URI = process.env.MONGOURI;

let db;

async function connection() {
    if (db) {
        console.log("Ya existe una conexion");
        return db;
    }else {
        try {
            db = await mongoose.connect(URI)
            console.log("Conectado a la base de datos");
            return db;
        } catch (error) {
            console.error("Error al conectar a la base de datos:", error);
            throw error;
        }
    }
}

module.exports = {connection};