var config = require('./config');
var record = require("./record_epicenter");

var logger = require('winston');
var sql = require("seriate");

// SQL Server config settings
var dbConfig = ***REMOVED***  
    "server": config.dbServer,
    "user": config.dbUser,
    "password": config.dbPassword,
    "database": config.dbDatabase
***REMOVED***;

sql.setDefaultConfig( dbConfig );

function saveResultGND(result, order)***REMOVED***
    return new Promise(
        function (resolve, reject) ***REMOVED***

            var logTime = new Date();
            var resultado = '';
            switch (result.testStatus)***REMOVED***
                case "INST_POSITIVE": resultado = 'Positivo'; break;
                case "INST_NEGATIVE": resultado = 'Negativo'; break;
        ***REMOVED***
            if (resultado != '')***REMOVED***
                    getProtocolByNro(order.accessionNumber).then( function( results ) ***REMOVED***
                    if (results[0])***REMOVED***
                        protocolId = results[0].idProtocolo;
                        sql.getPlainContext()
                        .step( "queryDetalleProtocolByProtocolId", function( execute, data ) ***REMOVED***
                            logger.info('queryDetalleProtocolByProtocolId...');
                            execute( ***REMOVED***
                                query: "SELECT TOP 1 idDetalleProtocolo FROM lab_DetalleProtocolo WHERE idProtocolo = @_protocolId " +
                                    "AND idSubItem IN(2204, 3216, 3220) AND resultadoCar='' ORDER BY idSubItem",
                                params: ***REMOVED***
                                    _protocolId: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                            ***REMOVED***
                        ***REMOVED*** );
                    ***REMOVED*** )
                        .end( function( sets )***REMOVED***
                            if (!sets.queryDetalleProtocolByProtocolId[0])***REMOVED***
                                errMessage = 'No se encontro el detalle del protocolo con numero de protocolo:' + protocolId;
                                logger.error(errMessage);
                                logMessages(errMessage,logTime);
                                throw new Error(errMessage);
                        ***REMOVED***
                            var idDetalleProtocolo = sets.queryDetalleProtocolByProtocolId[0].idDetalleProtocolo;
                            sql.execute( ***REMOVED***
                                query: "UPDATE lab_DetalleProtocolo set resultadoCar = @_resultado WHERE idDetalleProtocolo = @_idDetalleProtocolo",
                                params: ***REMOVED***
                                    _idDetalleProtocolo: ***REMOVED*** type: sql.INT, val: idDetalleProtocolo ***REMOVED***,
                                    _resultado: ***REMOVED*** type: sql.NVARCHAR, val: resultado ***REMOVED***,
                            ***REMOVED***
                        ***REMOVED*** ).then( function( results ) ***REMOVED***
                                logger.info('Guardando GND....');
                                logger.info( results );
                                resolve();
                        ***REMOVED***, function( err ) ***REMOVED***
                                logger.error( "Something bad happened:", err );
                                reject();
                        ***REMOVED*** );
                            
                            logger.info('lab_DetalleProtocolo actualizado con ProtocolId:', protocolId);
                    ***REMOVED*** )
                        .error( function( err )***REMOVED***
                            logger.error( err );
                            logMessages(errMessage,logTime);
                            reject();
                    ***REMOVED*** ); 
                ***REMOVED***
                    else***REMOVED***
                        errMessage = 'No se encontro el protocolo especificado con id:' + order.accessionNumber;
                        logger.error(errMessage);
                        logMessages(errMessage,logTime);
                        reject();
                ***REMOVED***
            
                ***REMOVED***, function( err ) ***REMOVED***
                    logger.error( "Something bad happened:", err );
                    reject()
            ***REMOVED*** );
        ***REMOVED***
            else***REMOVED***
                reject();
        ***REMOVED***
    ***REMOVED***
    );
***REMOVED***

function saveResultAST(result,order)***REMOVED***
    return new Promise(
        function (resolve, reject) ***REMOVED***
            getGermenByCodigo(order.organism).then( function( results ) ***REMOVED***
                if (results[0])***REMOVED***
                    insertResultAST(result, order).then( function() ***REMOVED***
                        resolve();
                ***REMOVED***, function( err ) ***REMOVED***
                        logger.error( "Something bad happened:", err );
                        reject();
                ***REMOVED*** );

            ***REMOVED***
                else***REMOVED***
                    logger.info('Se intentará insertar el nuevo germen:'+ order.organism);
                    insertGermen(order.organism).then( function( results ) ***REMOVED***
                        insertResultAST(result, order).then( function() ***REMOVED***
                            resolve();
                    ***REMOVED***, function( err ) ***REMOVED***
                            logger.error( "Something bad happened:", err );
                            reject();
                    ***REMOVED*** );

                ***REMOVED***, function( err ) ***REMOVED***
                        logger.error( "Something bad happened:", err );
                        errMessage = 'No se pudo insertar el  germen con codigo:' + codigoGermen;
                        logMessages(errMessage,logTime);
                        throw new Error(errMessage);
                ***REMOVED*** );
            ***REMOVED***
        ***REMOVED***, function( err ) ***REMOVED***
                logger.error( "Something bad happened:", err );
                reject()
        ***REMOVED*** );
    ***REMOVED***
    );
***REMOVED***;


function insertResultAST(result,order)***REMOVED***
    return new Promise(
        function (resolve, reject) ***REMOVED***
            try ***REMOVED***
                var logTime = new Date();
                getProtocolByNro(order.accessionNumber).then( function( results ) ***REMOVED***
                    if (results[0])***REMOVED***
                        protocolId = results[0].idProtocolo;
                        sql.getPlainContext()
                            .step( "queryAntibioticByName", ***REMOVED***
                                query: "SELECT TOP 1 idAntibiotico FROM LAB_Antibiotico WHERE nombreCorto = @_antibiotic AND baja=0",
                                params: ***REMOVED***
                                    _antibiotic: ***REMOVED*** type: sql.NVARCHAR, val: result.antibiotic ***REMOVED***
                            ***REMOVED***
                        ***REMOVED*** )
                            .step( "queryProtocoloGermenByProtocolId", function( execute, data ) ***REMOVED***
                                execute( ***REMOVED***
                                    query: "SELECT TOP 1 idProtocoloGermen,atb FROM lab_ProtocoloGermen WHERE idProtocolo = @_protocolId",
                                    params: ***REMOVED***
                                        _protocolId: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                                ***REMOVED***
                            ***REMOVED*** );
                        ***REMOVED*** )
                            .step( "queryGermenByCodigo", function( execute, data ) ***REMOVED***
                                logger.info('queryGermenByCodigo. Ultimo intento');
                                execute( ***REMOVED***
                                    query: "SELECT TOP 1 idGermen FROM LAB_Germen WHERE codigo = @_organism AND baja=0",
                                    params: ***REMOVED***
                                        _organism: ***REMOVED*** type: sql.NVARCHAR, val: order.organism ***REMOVED*** // Organism take from Order (not Result as ID Results)
                                ***REMOVED***
                            ***REMOVED*** );
                        ***REMOVED*** )
                            .step( "queryDetalleProtocolByProtocolId", function( execute, data ) ***REMOVED***
                                logger.info('queryDetalleProtocolByProtocolId...');
                                execute( ***REMOVED***
                                    query: "SELECT TOP 1 idItem FROM lab_DetalleProtocolo WHERE idProtocolo = @_protocolId",
                                    params: ***REMOVED***
                                        _protocolId: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                                ***REMOVED***
                            ***REMOVED*** );
                        ***REMOVED*** )
                            .end( function( sets )***REMOVED***
                                if (!sets.queryDetalleProtocolByProtocolId[0])***REMOVED***
                                    errMessage = 'No se encontro el detalle del protocolo con numero de protocolo:' + protocolId;
                                    logger.error(errMessage);
                                    logMessages(errMessage,logTime);
                                    throw new Error(errMessage);
                            ***REMOVED***
                                if (!sets.queryGermenByCodigo[0])***REMOVED***
                                    errMessage = 'No se encontro el germen con codigo:' + order.organism;
                                    logger.error(errMessage);
                                    logMessages(errMessage,logTime);
                                    throw new Error(errMessage);
                            ***REMOVED***
                                
                                var idItem = sets.queryDetalleProtocolByProtocolId[0].idItem;
                                var idGermen = sets.queryGermenByCodigo[0].idGermen;

                                if (!sets.queryAntibioticByName[0])***REMOVED***
                                    errMessage = 'No se encontro el antibiotico con nombre:' + result.antibiotic;
                                    logger.error(errMessage);
                                    logMessages(errMessage,logTime);
                                    // @todo: verificar si no deberia ser un reject
                                    resolve();
                                    // throw new Error(errMessage);
                            ***REMOVED***
                                if (sets.queryProtocoloGermenByProtocolId[0])***REMOVED***
                                    var idProtocoloGermen = sets.queryProtocoloGermenByProtocolId[0].idProtocoloGermen;
                                    var atb = sets.queryProtocoloGermenByProtocolId[0].atb;
                                    if (!atb || atb==0)***REMOVED***
                                        sql.execute( ***REMOVED***
                                            query: "UPDATE lab_ProtocoloGermen set atb=1 WHERE idProtocoloGermen= @_idProtocoloGermen",
                                            params: ***REMOVED***
                                                _idProtocoloGermen: ***REMOVED*** type: sql.INT, val: idProtocoloGermen ***REMOVED***,
                                        ***REMOVED***
                                    ***REMOVED*** );
                                ***REMOVED***
                            ***REMOVED***
                                
                                var idAntibiotico = sets.queryAntibioticByName[0].idAntibiotico;
                                var resultado = "";
                                var susceptibility = "";
                                switch (result.code)***REMOVED***
                                    case "AST": susceptibility = result.ASTsusceptibilityFinal; break;
                                    case "AST_MIC": susceptibility = result.ASTsusceptibilityInterpreted; break;
                            ***REMOVED*** 

                                // var idGermen = sets.queryGermenByCodigo[0].idGermen;
                                switch (susceptibility)***REMOVED***
                                    case "S": resultado = "Sensible"; break;
                                    case "I": resultado = "Intermedio"; break;
                                    case "R": resultado = "Resistente";  break;
                                    case "N": resultado = "No sensible"; break;
                                    case "X": resultado = "Error"; break;
                            ***REMOVED*** 
                                
                                sql.execute( ***REMOVED***
                                    query: "INSERT INTO LAB_Antibiograma (" +
                                        "idEfector,idProtocolo,numeroAislamiento,idGermen,idAntibiotico," +
                                        "resultado,idUsuarioRegistro,fechaRegistro,idUsuarioValida,fechaValida," +
                                        "idItem,idMetodologia,valor) VALUES (" +
                                        "@_idEfector,@_idProtocolo,@_numeroAislamiento,@_idGermen,@_idAntibiotico," +
                                        "@_resultado,@_idUsuarioRegistro,@_fechaRegistro,@_idUsuarioValida,@_fechaValida," +
                                        "@_idItem,@_idMetodologia,@_valor)",
                                    params: ***REMOVED***
                                        _idEfector: ***REMOVED*** type: sql.INT, val: 205 ***REMOVED***,
                                        _idProtocolo: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                                        _numeroAislamiento: ***REMOVED*** type: sql.INT, val: order.isolateNumber ***REMOVED***,
                                        _idGermen: ***REMOVED*** type: sql.INT, val: idGermen ***REMOVED***, // TODO Determinar si es correcto este dato
                                        _idAntibiotico: ***REMOVED*** type: sql.INT, val: idAntibiotico ***REMOVED***,
                                        _resultado: ***REMOVED*** type: sql.NVARCHAR, val: resultado***REMOVED***,
                                        _idUsuarioRegistro: ***REMOVED*** type: sql.INT, val: 0 ***REMOVED***,                            
                                        _fechaRegistro: ***REMOVED*** type: sql.DATETIME, val: new Date() ***REMOVED***,                            
                                        _idUsuarioValida: ***REMOVED*** type: sql.INT, val: 0 ***REMOVED***,                            
                                        _fechaValida: ***REMOVED*** type: sql.DATETIME, val: new Date() ***REMOVED***,                            
                                        _idItem: ***REMOVED*** type: sql.INT, val: idItem ***REMOVED***, // TODO Determinar si es correcto este dato
                                        _idMetodologia: ***REMOVED*** type: sql.INT, val: 1 ***REMOVED***,                            
                                        _valor: ***REMOVED*** type: sql.NVARCHAR, val: result.minimumInhibitoryConcentration ? result.minimumInhibitoryConcentration : '' ***REMOVED***, // TODO Validar que sea esa campo para AST Results
                                ***REMOVED***
                            ***REMOVED*** ).then( function( results ) ***REMOVED***
                                    logger.info('Guardando....');
                                    logger.info( results );
                                    resolve();
                            ***REMOVED***, function( err ) ***REMOVED***
                                    logger.error( "Something bad happened:", err );
                                    reject();
                            ***REMOVED*** );
                                
                                logger.info('LAB_Antibiograma actualizado con ProtocolId:', protocolId);
                            

                        ***REMOVED*** )
                            .error( function( err )***REMOVED***
                                logger.error( err );
                                logMessages(errMessage,logTime);
                                reject();
                        ***REMOVED*** ); 
                ***REMOVED***
                    else***REMOVED***
                        errMessage = 'No se encontro el protocolo especificado con id:' + order.accessionNumber;
                        logger.error(errMessage);
                        logMessages(errMessage,logTime);
                        throw new Error(errMessage);
                ***REMOVED***

                ***REMOVED***, function( err ) ***REMOVED***
                    logger.error( "Something bad happened:", err );
                    reject();
            ***REMOVED*** );
            
        ***REMOVED*** catch(err) ***REMOVED***
                logger.error( "Something bad happened:", err );
                reject();
        ***REMOVED***
    ***REMOVED***);
***REMOVED***

function saveResultID(result,order)***REMOVED***
    return new Promise(
        function (resolve, reject) ***REMOVED***
            logger.info('Saving ID results...');
            var logTime = new Date();
            logger.info('queryGermenByCodigo. Primer intento.');
            getGermenByCodigo(result.organism).then( function( results ) ***REMOVED***
                if (results[0])***REMOVED***
                    insertResultID(result, order).then( function() ***REMOVED***
                        resolve();
                ***REMOVED***, function( err ) ***REMOVED***
                        logger.error( "Something bad happened:", err );
                        reject();
                ***REMOVED*** );
            ***REMOVED***
                else***REMOVED***
                    logger.info('Se intentará insertar el nuevo germen:' + result.organism)
                    insertGermen(result.organism).then( function( results ) ***REMOVED***
                        insertResultID(result, order).then( function() ***REMOVED***
                            resolve();
                    ***REMOVED***, function( err ) ***REMOVED***
                            logger.error( "Something bad happened:", err );
                            reject();
                    ***REMOVED*** );
                ***REMOVED***, function( err ) ***REMOVED***
                        logger.error( "Something bad happened:", err );
                        errMessage = 'No se pudo insertar el  germen con codigo:' + codigoGermen;
                        logMessages(errMessage,logTime);
                        throw new Error(errMessage);
                ***REMOVED*** );
            ***REMOVED***
        ***REMOVED***, function( err ) ***REMOVED***
                logger.error( "Something bad happened:", err );
                reject();
        ***REMOVED*** );


    ***REMOVED***
    );
***REMOVED***

function insertResultID(result, order)***REMOVED***
    return new Promise(
        function (resolve, reject) ***REMOVED***
            var logTime = new Date();
            return getProtocolByNro(order.accessionNumber).then( function( results ) ***REMOVED***
                if (results[0])***REMOVED***
                    protocolId = results[0].idProtocolo;
                    logger.info('queryGermenByCodigo. Ultimo intento');
                    sql.getPlainContext()
                    .step( "queryGermenByCodigo", ***REMOVED***
                        query: "SELECT TOP 1 idGermen FROM LAB_Germen WHERE codigo = @_organism AND baja=0",
                        params: ***REMOVED***
                            _organism: ***REMOVED*** type: sql.NVARCHAR, val: result.organism ***REMOVED***
                    ***REMOVED***
                ***REMOVED*** )
                    .step( "queryDetalleProtocolByProtocolId", function( execute, data ) ***REMOVED***
                        logger.info('queryDetalleProtocolByProtocolId...');
                        execute( ***REMOVED***
                            query: "SELECT TOP 1 idItem FROM lab_DetalleProtocolo WHERE idProtocolo = @_protocolId",
                            params: ***REMOVED***
                                _protocolId: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                        ***REMOVED***
                    ***REMOVED*** );
                ***REMOVED*** )
                    .end( function( sets )***REMOVED***
                        if (!sets.queryDetalleProtocolByProtocolId[0])***REMOVED***
                            errMessage = 'No se encontro el detalle del protocolo con numero de protocolo:' + protocolId;
                            logger.error(errMessage);
                            logMessages(errMessage,logTime);
                            throw new Error(errMessage);
                    ***REMOVED***
                        if (!sets.queryGermenByCodigo[0])***REMOVED***
                            errMessage = 'No se encontro el germen con codigo:' + result.organism;
                            logger.error(errMessage);
                            logMessages(errMessage,logTime);
                            throw new Error(errMessage);
                    ***REMOVED***
                        var idGermen = sets.queryGermenByCodigo[0].idGermen;
                        var idItem = sets.queryDetalleProtocolByProtocolId[0].idItem;
                        
                        sql.execute( ***REMOVED***
                            query: "INSERT INTO LAB_ProtocoloGermen (" +
                                "idProtocolo, numeroAislamiento, idGermen, atb, observaciones, baja," +
                                "idUsuarioRegistro, fechaRegistro, idItem) VALUES (" +
                                "@_idProtocolo, @_numeroAislamiento, @_idGermen, 0, @_observaciones, 0," + 
                                "@_idUsuarioRegistro, @_fechaRegistro, @_idItem)",
                            params: ***REMOVED***
                                _idProtocolo: ***REMOVED*** type: sql.INT, val: protocolId ***REMOVED***,
                                _numeroAislamiento: ***REMOVED*** type: sql.INT, val: order.isolateNumber ***REMOVED***,
                                _idGermen: ***REMOVED*** type: sql.INT, val: idGermen ***REMOVED***,
                                _observaciones: ***REMOVED*** type: sql.NVARCHAR, val:'' ***REMOVED***,
                                _idUsuarioRegistro: ***REMOVED*** type: sql.INT, val: 0 ***REMOVED***,
                                _fechaRegistro: ***REMOVED*** type: sql.DATETIME, val: new Date()***REMOVED***,
                                _idItem: ***REMOVED*** type: sql.INT, val: idItem ***REMOVED***,                            
                        ***REMOVED***
                    ***REMOVED*** ).then( function( results ) ***REMOVED***
                            logger.info('Guardando....');
                            logger.info( results );
                            resolve();
                    ***REMOVED***, function( err ) ***REMOVED***
                            logger.error( "Something bad happened:", err );
                            reject();
                    ***REMOVED*** );
                        
                        logger.info('LAB_ProtocoloGermen actualizado con ProtocolId:', protocolId);
                ***REMOVED*** )
                    .error( function( err )***REMOVED***
                        logger.error( err );
                        logMessages(errMessage,logTime);
                        reject();
                ***REMOVED*** ); 
            ***REMOVED***
                else***REMOVED***
                    errMessage = 'No se encontro el protocolo especificado con id:' + order.accessionNumber;
                    logger.error(errMessage);
                    logMessages(errMessage,logTime);
                    throw new Error(errMessage);
            ***REMOVED***
        
            ***REMOVED***, function( err ) ***REMOVED***
                logger.error( "Something bad happened:", err );
                reject();
        ***REMOVED*** );
    ***REMOVED***
    );
***REMOVED***

function insertGermen(codigoGermen)***REMOVED***
    return sql.execute( ***REMOVED***
        query: "INSERT INTO LAB_Germen (" +
            "idEfector, codigo, nombre, idUsuarioRegistro, fechaRegistro, baja) VALUES (" +
            "@_idEfector, @_codigo, @_nombre, @_idUsuarioRegistro, @_fechaRegistro, @_baja)",
        params: ***REMOVED***
            _idEfector: ***REMOVED*** type: sql.INT, val: 205 ***REMOVED***,
            _codigo: ***REMOVED*** type: sql.NVARCHAR, val: codigoGermen ***REMOVED***,
            _nombre: ***REMOVED*** type: sql.NVARCHAR, val: 'Codigo:'+codigoGermen +'.Nombre Generado por Interface LIS/Epicenter. Reemplazar' ***REMOVED***,
            _idUsuarioRegistro: ***REMOVED*** type: sql.INT, val: 2 ***REMOVED***,
            _fechaRegistro: ***REMOVED*** type: sql.DATETIME, val: new Date()***REMOVED***,
            _baja: ***REMOVED*** type: sql.INT, val: 0 ***REMOVED***,
    ***REMOVED***
***REMOVED*** )
***REMOVED***

function getGermenByCodigo(codigoGermen)***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "SELECT TOP 1 idGermen FROM LAB_Germen WHERE codigo = @_organism AND baja=0",
        params: ***REMOVED***
            _organism: ***REMOVED*** type: sql.NVARCHAR, val: codigoGermen ***REMOVED***
    ***REMOVED***
***REMOVED*** )
***REMOVED***

function getProtocolByNro(nroProtocolo)***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "SELECT TOP 1 idProtocolo FROM LAB_Protocolo WHERE numero = @_nroProtocolo AND baja=0 AND estado<2",
        params: ***REMOVED***
            _nroProtocolo: ***REMOVED***type: sql.INT, val: nroProtocolo***REMOVED***
    ***REMOVED***
***REMOVED*** )
***REMOVED***

function hasProtocolsToSend()***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "SELECT count(*) as total FROM LAB_TempProtocoloEnvio WHERE equipo = @equipo and fail = 0",
        params: ***REMOVED***
            equipo: ***REMOVED***
                type: sql.NVARCHAR,
                val: config.analyzer,
        ***REMOVED***
    ***REMOVED***
***REMOVED*** )
    
***REMOVED***

function getNextProtocolToSend()***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "SELECT TOP 1 * FROM LAB_TempProtocoloEnvio WHERE equipo = @equipo and fail = 0",
        params: ***REMOVED***
            equipo: ***REMOVED***
                type: sql.NVARCHAR,
                val: config.analyzer,
        ***REMOVED***
    ***REMOVED***
***REMOVED*** )
***REMOVED***

function removeLastProtocolSent()***REMOVED***
    getNextProtocolToSend().then( function( results ) ***REMOVED***
        for (var i = 0; i < results.length; i++) ***REMOVED*** // Always only 1 iteration
            var protocol = results[i]; 
            removeProtocol(protocol.idTempProtocoloEnvio);
    ***REMOVED***
    ***REMOVED***, function( err ) ***REMOVED***
            logger.error( "Something bad happened:", err );
    ***REMOVED*** );
***REMOVED***

function setFailLastProtocolSent() ***REMOVED***
    getNextProtocolToSend().then( function( results ) ***REMOVED***
        for (var i = 0; i < results.length; i++) ***REMOVED*** // Always only 1 iteration
            var protocol = results[i]; 
            failProtocol(protocol.idTempProtocoloEnvio);
    ***REMOVED***
    ***REMOVED***, function( err ) ***REMOVED***
            logger.error( "Something bad happened:", err );
    ***REMOVED*** );
***REMOVED***

function removeProtocol(idTempProtocolo)***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "DELETE FROM LAB_TempProtocoloEnvio WHERE idTempProtocoloEnvio = @_id",
        params: ***REMOVED***
            _id: ***REMOVED***
                type: sql.INT,
                val: idTempProtocolo,
        ***REMOVED***
    ***REMOVED***
***REMOVED*** )
***REMOVED***

function failProtocol(idTempProtocolo)***REMOVED***
    return sql.execute( ***REMOVED***  
        query: "UPDATE LAB_TempProtocoloEnvio SET fail=1 WHERE idTempProtocoloEnvio = @_id",
        params: ***REMOVED***
            _id: ***REMOVED***
                type: sql.INT,
                val: idTempProtocolo,
        ***REMOVED***
    ***REMOVED***
***REMOVED*** )
***REMOVED***


function logMessages(logMessage,logTime)***REMOVED***
    sql.execute( ***REMOVED***  
        query: "INSERT INTO Temp_Mensaje(mensaje,fechaRegistro) VALUES (@_mensaje,@_fechaRegistro)",
        params: ***REMOVED***
            _mensaje: ***REMOVED*** type: sql.NVARCHAR, val: logMessage***REMOVED***,
            _fechaRegistro: ***REMOVED*** type: sql.DATETIME, val: logTime***REMOVED***,
    ***REMOVED***
***REMOVED*** ).then( function( results ) ***REMOVED***
        logger.info( results );
***REMOVED***, function( err ) ***REMOVED***
        logger.error( "Something bad happened:", err );
***REMOVED*** );
    
***REMOVED***


module.exports = ***REMOVED***
    saveResultID: saveResultID,
    saveResultAST: saveResultAST,
    hasProtocolsToSend: hasProtocolsToSend,
    getNextProtocolToSend: getNextProtocolToSend,
    removeProtocol: removeProtocol,
    setFailLastProtocolSent: setFailLastProtocolSent,
    failProtocol: failProtocol,
    removeLastProtocolSent: removeLastProtocolSent,
    saveResultGND : saveResultGND
***REMOVED***;
