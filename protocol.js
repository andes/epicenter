var logger = require('winston');
var SerialPort = require('serialport');

// Internal Dependencies
var config = require('./config');
var token = require('./constants');
var codec = require('./codec');
var app = require('./app');
var db = require('./db');

// Init logging
logger.level = config.logLevel;

// Global variables for Client and Server mode
var isTransferState = false;
var isClientMode = false;
var port = null; // COM Port Communication

init();

function init()***REMOVED***
    SerialPort.list(function(err, ports)***REMOVED***
        initPort(err,ports);
***REMOVED***);
***REMOVED***

function initPort(err, ports)***REMOVED***
    // var portNumber = ports[0].comName;   
    var portNumber = 'COM4';
    port = new SerialPort(portNumber);
    port.on('open', handlePortOpen);
    port.on('close', handlePortClose);
    port.on('data', handlePortData);
    port.on('error', function(err) ***REMOVED***
          logger.error(err.message);
      throw new Error('Port Error: ' + err.message);
***REMOVED***)
***REMOVED***


function handlePortOpen() ***REMOVED***
    logger.info('Port open. Data rate: ' + port.options.baudRate);
***REMOVED***

function handlePortClose() ***REMOVED***
    logger.info('Port Closed.');
***REMOVED***

function handlePortWrite(data)***REMOVED***
    
    logger.info('RESPONSE');   
    logger.info(data);
    port.write(data);
    initTimer();
***REMOVED***

function handlePortData(data)***REMOVED***
    logger.info('REQUEST'); 
    logger.info(data); // Raw Buffer Data  
    var data = data.toString('ascii');
    
     if (isTransferState)***REMOVED***
         if (isClientMode)***REMOVED***
            
             readDataAsClient(data);
             
     ***REMOVED***
         else***REMOVED***
             readDataAsServer(data);
     ***REMOVED***    
 ***REMOVED***
     else***REMOVED***
            readDataAsServer(data);
 ***REMOVED***
***REMOVED***

////////////////// SERVER MODE //////////////////////

var inputChunks = [];

function readDataAsServer(data)***REMOVED***
    var response = '';
    
    if (data === token.ENQ)***REMOVED***
        logger.info('Request: ENQ');
        if (!isTransferState)***REMOVED***
            isTransferState = true;
            response = token.ACK;
    ***REMOVED***
        else***REMOVED***
            logger.error('ENQ is not expected. Transfer state already.');
            response = token.NAK;
    ***REMOVED***
***REMOVED***
    else if (data === token.ACK)***REMOVED***
        logger.error('ACK is not expected.');
        throw new Error('ACK is not expected.');
***REMOVED***
    else if (data === token.NAK)***REMOVED***
        logger.error('NAK is not expected.');
        throw new Error('NAK is not expected.');
***REMOVED***
    else if (data === token.EOT)***REMOVED***
        if (isTransferState)***REMOVED***
            isTransferState = false;
            logger.info('EOT accepted. OK');
    ***REMOVED***
        else***REMOVED***
            logger.error('Not ready to accept EOT message.');
            response = token.NAK;
    ***REMOVED***
***REMOVED***
    else if (data.startsWith(token.STX))***REMOVED***
        if (!isTransferState)***REMOVED***
            discard_input_buffers();
            logger.error('Not ready to accept messages');
            response = token.NAK;
    ***REMOVED***
        else***REMOVED***
            try***REMOVED***
                logger.info('Accept message.Handling message');
                response = token.ACK;
                handleMessage(data);
        ***REMOVED***
            catch(err)***REMOVED***
                logger.error('Error occurred on message handling.' + err)
                // response = token.NAK;
        ***REMOVED***
    ***REMOVED***
***REMOVED***
    else ***REMOVED***
        logger.error('Invalid data.');
        throw new Error('Invalid data.');
***REMOVED***
    
    handlePortWrite(response);
***REMOVED***;

function handleMessage(message)***REMOVED***
    if (codec.isChunkedMessage(message))***REMOVED***
        logger.debug('handleMessage: Is chunked transfer.');
        inputChunks.push(message);
***REMOVED***
    else if (typeof inputChunks !== 'undefined' && inputChunks.length > 0)***REMOVED***
        logger.debug('handleMessage: Previous chunks. This must be the last one');
        inputChunks.push(message);
        dispatchMessage(inputChunks.join(''),token.ENCODING);
        inputChunks = [];
***REMOVED***
    else***REMOVED***
        logger.debug('handleMessage: Complete message. Dispatching');
        dispatchMessage(message,token.ENCODING); 
***REMOVED***
***REMOVED***

function dispatchMessage(message)***REMOVED***
    console.log(message);
    var records = codec.decodeMessage(message);
    logger.info(records);
    app.processMessage(records);
***REMOVED***

function discard_input_buffers()***REMOVED***
    inputChunks = [];
***REMOVED***



////////////////// CLIENT MODE //////////////////////

var outputChunks = []; 
var outputMessages = []; 
var retryCounter = 0;
var lastSendOk = false;
var lastSendData = "";
var timer;

function readDataAsClient(data)***REMOVED***
    console.log('11')
    if (data === token.ENQ)***REMOVED***
        if (lastSendData === token.ENQ)***REMOVED***
            //TODO: Link Contention??
    ***REMOVED***
        throw new Error('Client should not receive ENQ.');
***REMOVED***
    else if (data === token.ACK)***REMOVED***
        logger.debug('ACK Response');
        lastSendOk = true;
        try***REMOVED*** 
            console.log('22') 
            sendMessage();
    ***REMOVED***
        catch(error)***REMOVED***
            logger.debug(error);
            closeClientSession();
    ***REMOVED***
***REMOVED***
    else if (data === token.NAK)***REMOVED***
        // Handles NAK response from server.

        // The client tries to repeat last
        // send for allowed amount of attempts. 
        logger.debug('NAK Response');
        if (lastSendData === token.ENQ)***REMOVED***
            openClientSession();
    ***REMOVED***
        else***REMOVED***
            try***REMOVED***
                lastSendOk = false;
                sendMessage();
        ***REMOVED***
            catch(error)***REMOVED***
                closeClientSession();
        ***REMOVED***
    ***REMOVED***
***REMOVED***
    else if (data === token.EOT)***REMOVED***
        isTransferState = false;
        throw new Error('Client should not receive EOT.');
***REMOVED***
    else if (data.startsWith(token.STX))***REMOVED***
        isTransferState = false;
        throw new Error('Client should not receive ASTM message.');
***REMOVED***
    else ***REMOVED***
        throw new Error('Invalid data.');
***REMOVED***
***REMOVED***

function prepareMessagesToSend(protocol)***REMOVED***
    outputMessages = []; // Global variable
    outputMessages = app.composeOrderMessages(protocol);
***REMOVED***

function prepareNextEncodedMessage()***REMOVED***
    outputChunks = []; // Global variable
    outputChunks = codec.encode(outputMessages.shift());
***REMOVED***

function sendMessage()***REMOVED***
    if (lastSendData === token.ENQ)***REMOVED***
        if (outputMessages.length > 0)***REMOVED***
            // Still exists messages to send
            prepareNextEncodedMessage();
            sendData();
    ***REMOVED***
        else***REMOVED***
            db.getNextProtocolToSend().then( function( results ) ***REMOVED***
            for (var i = 0; i < results.length; i++) ***REMOVED*** // Always only 1 iteration
                var protocol = results[i]; 
                prepareMessagesToSend(protocol)
                prepareNextEncodedMessage();
                sendData();
        ***REMOVED***
        ***REMOVED***, function( err ) ***REMOVED***
                logger.error( "Something bad happened:", err );
        ***REMOVED*** );
    ***REMOVED***
***REMOVED***
    else***REMOVED***
        sendData();
***REMOVED***
***REMOVED***

function sendData()***REMOVED***
    if (!lastSendOk)***REMOVED***
        if (retryCounter > 6)***REMOVED***
            logger.error("Luego de probar 6 veces.... y falla");
            closeClientSession();
            if (lastSendData !== token.ENQ)***REMOVED***
               // pone en fail le protocolo si tuvo algún problema
                db.setFailLastProtocolSent();
        ***REMOVED***
            return;
    ***REMOVED***
        else***REMOVED***
            logger.error("Dio fallo....contando: ", retryCounter);
            retryCounter = retryCounter + 1;
    ***REMOVED***
***REMOVED***
    else***REMOVED***
        retryCounter = 0;
        if (outputChunks.length > 0)***REMOVED***
            lastSendData = outputChunks.shift();
    ***REMOVED***
        else***REMOVED***
            closeClientSession();
            if (outputMessages.length > 0)***REMOVED***
                openClientSession();
        ***REMOVED***
            else***REMOVED***
                // Borra el protocolo si lo mando ok
                logger.error("Va a borrar el protocolo de la tabla porque pasó ok");
                db.removeLastProtocolSent();
        ***REMOVED***
            
            return;
    ***REMOVED***
***REMOVED***
    handlePortWrite(lastSendData);
***REMOVED***


function openClientSession()***REMOVED***
    logger.info('Open Client Session');
    retryCounter = retryCounter + 1;
    if (retryCounter > 6)***REMOVED***
        logger.error('Exceed number of retries');
        closeClientSession();
***REMOVED***
    else***REMOVED***
        handlePortWrite(token.ENQ);
        lastSendData = token.ENQ;
        isTransferState = true;
        isClientMode = true;
***REMOVED***
***REMOVED***

function closeClientSession()***REMOVED***
    logger.debug('Close Client Session');
    handlePortWrite(token.EOT);
    isTransferState = false;
    isClientMode = false;
    retryCounter = 0;
***REMOVED***

function checkDataToSend()***REMOVED***
    db.hasProtocolsToSend().then( function( results ) ***REMOVED***
        if (results[0].total > 0)***REMOVED***
            logger.info("Exist data to send");
            if (!isClientMode)***REMOVED***
                openClientSession();
        ***REMOVED***
    ***REMOVED***
        else***REMOVED***
            if (isClientMode)***REMOVED***
            isClientMode = false;
        ***REMOVED***
            else***REMOVED***
                return;
                logger.info('Waiting for data to send');
        ***REMOVED***
    ***REMOVED***
***REMOVED***, function( err ) ***REMOVED***
        logger.error( "Something bad happened:", err );
***REMOVED*** );
***REMOVED***

function initTimer()***REMOVED***
    clearTimeout(timer);
    timer = setTimeout(timeoutCommunication,5000);
***REMOVED***

function timeoutCommunication()***REMOVED***
 console.log(isTransferState);
    if (isTransferState)***REMOVED***
        throw new Error('Timeout Communication');
***REMOVED***
***REMOVED***

function runIntervalCheck() ***REMOVED***
  setInterval(checkDataToSend, 10000);
***REMOVED***;


runIntervalCheck();