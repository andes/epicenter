var config = require('./config');
var logger = require('winston');

var db = require('./db');
var record = require('./record_epicenter')

function processMessage(records)***REMOVED***
    // Determinar si la secuencia se trata una consulta o resultados
    // provenientes del EpiCenter
    var messageType = records[2][0];
    switch (messageType)***REMOVED***
        case "O": processMessageResults(records); break;
        case "Q": processMessageQueries(recordr); break;
***REMOVED***
***REMOVED***

function processMessageResults(records)***REMOVED***
    var record = [];
    var resultados = [];
    for (var i = 0; i < records.length; i++) ***REMOVED***
        record = records[i];
        switch (record[0])***REMOVED***
            case "H": handleHeader(record); break;
            case "P": handlePatient(record); break;
            case "O": orderRecord = record; break;
            case "R": resultados.push([record, orderRecord]); break;
            case "C": handleComment(record);  break;
            case "L": handleTerminator(record); break;
    ***REMOVED***
***REMOVED***
    processResultsAsPromises(resultados);
***REMOVED***

function processResultsAsPromises(resultados)***REMOVED***
    let chain = Promise.resolve();
    for (let rec of resultados) ***REMOVED***
        chain = chain.then(()=>handleResult(rec[0],rec[1]))
            // .then(Wait)
***REMOVED***
    return chain;
***REMOVED***

function Wait() ***REMOVED***
    return new Promise(r => setTimeout(r, 1000))
***REMOVED***

function processMessageQueries(records)***REMOVED***
    var record = [];
    for (var i = 0; i < records.length; i++) ***REMOVED***
        record = records[i];
        switch (record[0])***REMOVED***
            case "H": handleHeader(record); break;
            case "Q": handleInquiry(record); break;
            case "L": handleTerminator(record); break;
    ***REMOVED***
***REMOVED***
***REMOVED***


function handleHeader(record)***REMOVED******REMOVED***

function handleInquiry(record)***REMOVED******REMOVED***

function handlePatient(record)***REMOVED******REMOVED***

function handleComment(record)***REMOVED******REMOVED***

function handleOrder(order)***REMOVED******REMOVED***

function handleTerminator(record)***REMOVED******REMOVED***

function handleResult(resultRecord, orderRecord)***REMOVED***
    // Return a Promise
    var order = new record.OrderRecord();
    order.buildFromRecord(orderRecord);
    var result = new record.ResultRecord(); 
    result.buildFromRecord(resultRecord);
    switch (result.code)***REMOVED***
        case "GND": return db.saveResultGND(result, order); break;
        case "GND_MGIT": break;
        case "GND_PROBETEC": break;
        case "AST": return db.saveResultAST(result, order); break;
        case "AST_MGIT": break;
        case "AST_MIC": return db.saveResultAST(result, order); break;
        case "AST_DIA": break;
        case "ID": return db.saveResultID(result, order); break;
        case "OTHER": break;
***REMOVED***

    return Promise.resolve();
***REMOVED***


function composeOrderMessages(protocol)***REMOVED***
    var header = new record.HeaderRecord();
    var patient = createPatientRecordFromProtocol(protocol);
    var order = createOrderRecordFromProtocol(protocol);
    var termination = new record.TerminationRecord();
    console.log(patient.toASTM());
    console.log(order.toASTM());
    return [[header.toASTM(), patient.toASTM(), order.toASTM(), termination.toASTM()]];
***REMOVED***

function createPatientRecordFromProtocol(protocol)***REMOVED***
    var patient = new record.PatientRecord();
    patient.birthdate = protocol.anioNacimiento;
    patient.sex = protocol.sexo;
    patient.hospitalService = protocol.sectorSolicitante;
    datos_extras = protocol.paciente.split("-");
    patient.id = datos_extras[0];
    patient.name = datos_extras[1];
 
    return patient;
***REMOVED***

function replaceSpecialCharacters(r) ***REMOVED***
	r = r.replace(new RegExp(/[àáâãäå]/g),"a");
            
	r = r.replace(new RegExp(/[èéêë]/g),"e");
            
	r = r.replace(new RegExp(/[ìíîï]/g),"i");
            
	r = r.replace(new RegExp(/ñ/g),"n");                
            
	r = r.replace(new RegExp(/Ñ/g),"N");                
            
	r = r.replace(new RegExp(/[òóôõö]/g),"o");
            
	r = r.replace(new RegExp(/[ùúûü]/g),"u");
            
 
	return r;

***REMOVED***

function createOrderRecordFromProtocol(protocol)***REMOVED***
    var order = new record.OrderRecord();
    order.accessionNumber = protocol.numeroProtocolo.trim();
    order.specimenType = protocol.tipoMuestra;
    // // Tipo de muestra
    // var tipoMuestra = 1;
    // switch (tipoMuestraNombre)***REMOVED***
    //         case "Suero/Plasma": tipoMuestra=1;break;
    //         case "Orina": tipoMuestra=2;break;
    //         case "CSF": tipoMuestra=3;break;
    //         case "Suprnt": tipoMuestra=4;break;
    //         case "Otros": tipoMuestra=5;break;
    // ***REMOVED***
    return order;

***REMOVED***

module.exports = ***REMOVED***
    processMessage : processMessage,
    processMessageResults : processMessageResults,
    processMessageQueries : processMessageQueries,
    composeOrderMessages: composeOrderMessages
***REMOVED***;

