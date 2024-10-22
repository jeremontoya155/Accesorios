const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Crear una conexión a la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jKdOXjIslnsUxdiLIkhxJscOHMFgZNha@junction.proxy.rlwy.net:42536/railway'
});

// Ruta principal (no carga todos los productos)
router.get('/', (req, res) => {
    res.render('index', { productos: [], ids: '', codebars: '' });
});

// Ruta para buscar productos por ID o código de barras
router.get('/buscar', async (req, res) => {
    const { ids, codebars } = req.query;
    let query = 'SELECT * FROM productos WHERE 1=1';  // Empezamos con una consulta siempre válida
    let params = [];

    // Manejo de IDs
    if (ids) {
        const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (idArray.length > 0) {
            query += ` AND idproducto = ANY($1::bigint[])`;
            params.push(idArray);
        }
    }

    // Manejo de códigos de barras
    if (codebars) {
        const codebarArray = codebars.split(',').map(codebar => codebar.trim()).filter(codebar => codebar !== '');
        if (codebarArray.length > 0) {
            if (params.length > 0) {
                query += ` AND codebar = ANY($2::varchar[])`;
            } else {
                query += ` AND codebar = ANY($1::varchar[])`;
            }
            params.push(codebarArray);
        }
    }

    if (params.length === 0) {
        return res.render('index', { productos: [], ids: '', codebars: '' });
    }

    try {
        const result = await pool.query(query, params);
        res.render('index', { productos: result.rows, ids: ids || '', codebars: codebars || '' });
    } catch (err) {
        console.error('Error al buscar productos:', err);
        res.status(500).send('Error al buscar productos');
    }
});

// Ruta para descargar todos los productos de la base de datos
router.get('/descargar-todo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        worksheet.columns = [
            { header: 'ID Producto', key: 'idproducto', width: 15 },
            { header: 'Código de Barras', key: 'codebar', width: 25 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Costo', key: 'costo', width: 15 },
            { header: 'Precio PVP', key: 'precio_pvp', width: 15 }
        ];

        result.rows.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="productos_todos.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error al generar el archivo Excel:', err);
        res.status(500).send('Error al generar el archivo Excel');
    }
});

// Ruta para descargar los resultados filtrados que se están mostrando en la tabla
router.post('/descargar-filtrados', async (req, res) => {
    const productosFiltrados = JSON.parse(req.body.productos);

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos Filtrados');

        worksheet.columns = [
            { header: 'ID Producto', key: 'idproducto', width: 15 },
            { header: 'Código de Barras', key: 'codebar', width: 25 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Costo', key: 'costo', width: 15 },
            { header: 'Precio PVP', key: 'precio_pvp', width: 15 }
        ];

        // Agregar las filas solo con los productos filtrados que están en la tabla actualmente
        productosFiltrados.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="productos_filtrados.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error al generar el archivo Excel:', err);
        res.status(500).send('Error al generar el archivo Excel');
    }
});


// Ruta para descargar los resultados filtrados en un archivo Excel
router.get('/descargar-excel', async (req, res) => {
    const { ids, codebars } = req.query;

    let query = 'SELECT * FROM productos WHERE 1=1';
    let params = [];

    if (ids) {
        const idArray = ids.split(',').map(id => parseInt(id.trim()));
        query += ` AND idproducto = ANY($1::bigint[])`;
        params.push(idArray);
    }

    if (codebars) {
        const codebarArray = codebars.split(',').map(codebar => codebar.trim());
        query += ` AND codebar = ANY($2::varchar[])`;
        params.push(codebarArray);
    }

    try {
        const result = await pool.query(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        worksheet.columns = [
            { header: 'ID Producto', key: 'idproducto', width: 15 },
            { header: 'Código de Barras', key: 'codebar', width: 25 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Costo', key: 'costo', width: 15 },
            { header: 'Precio PVP', key: 'precio_pvp', width: 15 }
        ];

        result.rows.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="productos_filtrados.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error al generar el archivo Excel:', err);
        res.status(500).send('Error al generar el archivo Excel');
    }
});

// Ruta para subir archivo Excel y completar datos usando codebar o idproducto
// Ruta para subir archivo Excel y completar datos usando codebar o idproducto
router.post('/subir-excel', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo');
    }

    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        // Determinar si estamos buscando por idproducto o codebar
        const header = worksheet.getRow(1); // Fila de encabezado
        let columnToSearch = null;
        let columnName = '';

        // Verificar si la columna es 'idproducto' o 'codebar'
        if (header.getCell(1).value.toLowerCase() === 'idproducto') {
            columnToSearch = 'idproducto';
            columnName = 'idproducto';
        } else if (header.getCell(1).value.toLowerCase() === 'codebar') {
            columnToSearch = 'codebar';
            columnName = 'codebar';
        } else {
            return res.status(400).send('El archivo debe contener una columna llamada "idproducto" o "codebar"');
        }

        let productosEncontrados = [];
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const valueToSearch = worksheet.getRow(i).getCell(1).value;

            if (valueToSearch) {
                let result;
                if (columnToSearch === 'idproducto') {
                    result = await pool.query('SELECT * FROM productos WHERE idproducto = $1', [valueToSearch]);
                } else if (columnToSearch === 'codebar') {
                    result = await pool.query('SELECT * FROM productos WHERE codebar = $1', [valueToSearch]);
                }

                if (result && result.rows.length > 0) {
                    productosEncontrados.push(result.rows[0]);
                }
            }
        }

        // Renderizar la vista con los productos encontrados
        res.render('index', { productos: productosEncontrados, ids: '', codebars: '' });

    } catch (err) {
        console.error('Error al procesar el archivo Excel:', err);
        res.status(500).send('Error al procesar el archivo Excel');
    } finally {
        fs.unlinkSync(filePath);  // Eliminar archivo después de procesarlo
    }
});


module.exports = router;
