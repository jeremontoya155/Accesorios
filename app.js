const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const productosRouter = require('./routes/productos');

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Verificar si la carpeta 'uploads' existe, si no, crearla
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear datos del cuerpo de las solicitudes (para formularios y JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cargar las rutas
app.use('/productos', productosRouter);

// Ruta principal
app.get('/', (req, res) => {
    res.redirect('/productos'); // Redirigir a la página de productos
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
