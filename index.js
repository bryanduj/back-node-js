const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const cors = require('cors'); // Importa el paquete CORS
app.use(express.json());
app.use(cors()); // Usa el middleware CORS

// Configuración de la conexión a la base de datos
const config = {
    user: 'bryan1',
    password: '123',
    server: 'localhost',
    database: 'PROSPECTOS_PRUEBA',
    options: {
        encrypt: true, // Encriptación requerida para conexiones SSL
        trustServerCertificate: true // Confía en el certificado autofirmado
    }
};



// Endpoint para obtener todos los prospectos
app.get('/prospectos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT ProspectoID, Nombre, PrimerApellido, SegundoApellido, Calle, Numero, Colonia, CodigoPostal, Telefono, RFC, Estatus, Comentarios, EmpleadoCreo, EmpleadoModifico, NombreDocumento FROM Prospectos;');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor.');
    }
});

app.get('/documentos/:prospectoID', async (req, res) => {
    try {
        const prospectoID = req.params.prospectoID;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('prospectoID', sql.Int, prospectoID)
            .query(`SELECT NombreDocumento, Archivo FROM Prospectos WHERE ProspectoID = @prospectoID`);

        if (result.recordset.length > 0) {
            const documento = {
                nombreDocumento: result.recordset[0].NombreDocumento,
                archivo: result.recordset[0].Archivo
            };
            // Envía el documento en formato JSON
            res.json(documento);
        } else {
            res.status(404).json({ message: 'No se encontraron documentos para el ProspectoID proporcionado.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor.');
    }
});






// Endpoint para obtener un prospecto por ID
app.get('/prospectos/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT TOP 1 * FROM Prospectos WHERE ProspectoID = @id');
        if (result.recordset.length > 0) {
            // Si se encontró un prospecto, enviar el primer registro
            res.set('X-Request-Type', 'ProspectoEspecifico'); // Encabezado personalizado
            res.json(result.recordset[0]);
        } else {
            // Si no se encontró ningún prospecto, devolver un mensaje de error
            res.status(404).json({ message: 'Prospecto no encontrado.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor.');
    }
});

        
     
            
            
        

// Endpoint para insertar un nuevo prospecto
app.post('/prospectos', async (req, res) => {
    try {
        const { nombre, primerApellido, segundoApellido, calle, numero, colonia, codigoPostal, telefono, rfc, estatus, comentarios, empleadoCreo, empleadoModifico, nombreDocumento, archivo } = req.body;

        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombre)
            .input('primerApellido', sql.NVarChar(100), primerApellido)
            .input('segundoApellido', sql.NVarChar(100), segundoApellido)
            .input('calle', sql.NVarChar(100), calle)
            .input('numero', sql.NVarChar(20), numero)
            .input('colonia', sql.NVarChar(100), colonia)
            .input('codigoPostal', sql.NVarChar(10), codigoPostal)
            .input('telefono', sql.NVarChar(20), telefono)
            .input('rfc', sql.NVarChar(20), rfc)
            .input('estatus', sql.Int, estatus)
            .input('comentarios', sql.NVarChar(100), comentarios)
            .input('empleadoCreo', sql.Int, empleadoCreo)
            .input('empleadoModifico', sql.Int, empleadoModifico)
            .input('nombreDocumento', sql.NVarChar(100), nombreDocumento)
            .input('archivo', sql.VarChar(sql.MAX), archivo) // Aquí se cambió de sql.VarBinary(sql.MAX) a sql.VarChar(sql.MAX)
            .query(`INSERT INTO Prospectos (Nombre, PrimerApellido, SegundoApellido, Calle, Numero, Colonia, CodigoPostal, Telefono, RFC, Estatus, Comentarios, EmpleadoCreo, EmpleadoModifico, NombreDocumento, Archivo) 
                    VALUES (@nombre, @primerApellido, @segundoApellido, @calle, @numero, @colonia, @codigoPostal, @telefono, @rfc, @estatus, @comentarios, @empleadoCreo, @empleadoModifico, @nombreDocumento, @archivo)`);
        
        res.status(201).json({ message: 'Prospecto creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor.');
    }
});
// Endpoint para actualizar un prospecto por ID
app.put('/prospectos/:id', async (req, res) => {
    try {
        const { comentarios, empleadoModifico, estatus } = req.body;
        const prospectoId = req.params.id;
        
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('comentarios', sql.NVarChar(100), comentarios)
            .input('empleadoModifico', sql.Int, empleadoModifico)
            .input('estatus', sql.Int, estatus)
            .input('prospectoId', sql.Int, prospectoId)
            .query(`UPDATE Prospectos 
                    SET Comentarios = @comentarios, EmpleadoModifico = @empleadoModifico, Estatus = @estatus
                    WHERE ProspectoID = @prospectoId`);
        
        res.json({ message: 'Prospecto actualizado correctamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor.');
    }
});


// Otros endpoints para manejar operaciones CRUD en Prospectos y Documentos

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
