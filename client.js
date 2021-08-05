var config = require('./config');

var logger = require('winston');
logger.level = config.logLevel;
// logger.exitOnError = false;
// logger.handleExceptions(new (logger.transports.Console)());

// var SerialPort = require('serialport');
var port; //= new SerialPort(config.comPort, ***REMOVED*** autoOpen: false ***REMOVED***); 


// Internal Dependencies
var token = require('./constants');
var codec = require('./codec');
var app = require('./app');

var isTransferState = false;
var isSender = false;

// Flag about chunked transfer.
var is_chunked_transfer = '';
//
var lastRecvData = '';

var _chunks = [];


var db = require('./dbsqlite');

function hasDataToSend()***REMOVED***
    // logger.info("Antes del Query");
    // db.getStatus(function(error, data)***REMOVED***
        // logger.info(data.data_to_send);
        // if (data.data_to_send === 'True')***REMOVED***
            // return true;
        // ***REMOVED***
        // else***REMOVED***
            // return true;
        // ***REMOVED***
    // ***REMOVED***);
    return false;
***REMOVED***

function openCOMPort()***REMOVED***
    port.open(function (err) ***REMOVED***
    if (err) ***REMOVED***
        return logger.error('Error opening port: ', err.message);
***REMOVED***
***REMOVED***);
***REMOVED***

function closeCOMPort()***REMOVED***
    port.open(function (err) ***REMOVED***
    if (err) ***REMOVED***
        return logger.error('Error opening port: ', err.message);
***REMOVED***
***REMOVED***);
***REMOVED***

function initClient()***REMOVED***
    if (hasDataToSend)***REMOVED***
        if (!isTransferState)***REMOVED***
            closeCOMPort();
            openCOMPort();
            openSession();
    ***REMOVED***
***REMOVED***
    else***REMOVED***
        if (port.isOpen() && isTransferState)***REMOVED***
            timeoutCommunication();
            port.closeCOMPort();
    ***REMOVED***
        else***REMOVED***
            logger.info('Waiting for data to send');
    ***REMOVED***
***REMOVED***
***REMOVED***

function run(port)***REMOVED***
    port = port;
    setInterval(initClient(), 10000);
***REMOVED***;

function timeoutCommunication()***REMOVED***
    if (isTransferState)***REMOVED***
        isTransferState = false;
***REMOVED***
***REMOVED***


port.on('open', handlePortOpen);
port.on('close', handlePortClose);
port.on('data', handlePortData);
port.on('error', function(err) ***REMOVED***
  logger.error(err.message);
***REMOVED***)


function handlePortOpen() ***REMOVED***
    logger.info('Port open. Data rate: ' + port.options.baudRate);
***REMOVED***

function handlePortClose() ***REMOVED***
    logger.info('Port Closed.');
***REMOVED***

function handlePortData(data)***REMOVED***
    logger.info(data); // Raw Buffer Data
    var data = data.toString('ascii');
    lastRecvData = data;
     
     if (!isTransferState)***REMOVED***
         //initTimer
         readDataAsReceiver(data);
 ***REMOVED***
     else***REMOVED***
         if (!isSender)***REMOVED***
             readDataAsReceiver(data);
     ***REMOVED***
         else***REMOVED***
             readDataAsSender(data);
     ***REMOVED***
 ***REMOVED***
***REMOVED***

/////// LOW LEVEL PROTOCOL- LINK LAYER ///////

function readDataAsReceiver(data)***REMOVED***
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
        response = token.NAK;
***REMOVED***
    else if (data === token.NAK)***REMOVED***
        logger.error('NAK is not expected.');
        response = token.NAK;
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
                handleMessage(data);
                response = token.ACK;
        ***REMOVED***
            catch(err)***REMOVED***
                logger.error('Error occurred on message handling.' + err)
                response = token.NAK;
        ***REMOVED***
    ***REMOVED***
***REMOVED***
    else ***REMOVED***
        logger.error('Invalid data');
        response = token.NAK;
***REMOVED***
    
    port.write(response);
***REMOVED***;

function handleMessage(message)***REMOVED***
    is_chunked_transfer = codec.isChunkedMessage(message);
    if (is_chunked_transfer)***REMOVED***
        logger.debug('handleMessage: Is chunked transfer.');
        _chunks.push(message);
***REMOVED***
    else if (typeof _chunks !== 'undefined' && _chunks.length > 0)***REMOVED***
        logger.debug('handleMessage: Previous chunks. This must be the last one');
        _chunks.push(message);
        dispatchMessage(_chunks.join(''),token.ENCODING);
        _chunks = [];
***REMOVED***
    else***REMOVED***
        logger.debug('handleMessage: Complete message. Dispatching');
        dispatchMessage(message,token.ENCODING); 
***REMOVED***
***REMOVED***

function dispatchMessage(message)***REMOVED***
    var records = codec.decodeMessage(message,token.ENCODING);
    app.processRecords(records);
    // logger.debug(records);
    // TODO: Tratamiento de cada record
    
***REMOVED***

function discard_input_buffers()***REMOVED*** // TODO: Revisar si son necesarias todas las variables 
    _chunks = [];
    // _input_buffer = b('');
    // inbox.clear();
***REMOVED***

/////////////////// Client //////////////////////////

var dataChunks = []; 
var retryCounter = 0;
var lastSendOk = false;
var lastSendData = "";

function sendMessage()***REMOVED***
    if (lastSendData === token.ENQ)***REMOVED***
        dataChunks = prepareMessage();
***REMOVED***
    
    if (!lastSendOk)***REMOVED***
        if (retryCounter > 6)***REMOVED***
            closeSession();
            return;
    ***REMOVED***
        else***REMOVED***
            retryCounter = retryCounter + 1;
    ***REMOVED***
***REMOVED***
    else***REMOVED***
        retryCounter = 0;
        lastSendData = dataChunks.shift();
***REMOVED***
    if (dataChunks.length > 0)***REMOVED***
        port.write(lastSendData);
        //initTimer
***REMOVED***
    else***REMOVED***
        closeSession();
        return;
***REMOVED***
***REMOVED***

function prepareMessage()***REMOVED***
    logger.debug('Prepare Message');
    var messageChunks = codec.encode(recordDataToSend);
    logger.debug(messageChunks);
    return messageChunks;
    
***REMOVED***

function readDataAsSender(data)***REMOVED***
    
    if (data === token.ENQ)***REMOVED***
        if (lastSendData === token.ENQ)***REMOVED***
            //TODO: Link Contention??
    ***REMOVED***
        throw new Error('Client should not receive ENQ.'); // TODO Que hacer con el error
***REMOVED***
    else if (data === token.ACK)***REMOVED***
        logger.debug('ACK Response'); // TODO: Remove line
        lastSendOk = true;
        try***REMOVED*** 
            sendMessage();
    ***REMOVED***
        catch(error)***REMOVED***
            logger.debug(error);
            closeSession();
    ***REMOVED***
        //port.write(message); //self.push(message)
        // TODO: Revisar la condicion de abajo
        // if (message === token.EOT)***REMOVED***
            // self.openSession()
        // ***REMOVED***
***REMOVED***
    else if (data === token.NAK)***REMOVED***
        // Handles NAK response from server.

        // If it was received on ENQ request, the client tries to repeat last
        // request for allowed amount of attempts. For others it send callback
        // value :const:`False` to the emitter.
        // TODO: Reescribir comentarios sobre esta condicion
        logger.debug('NAK Response'); // TODO: Remove line
        if (lastSendData === token.ENQ)***REMOVED***
            openSession();
    ***REMOVED***
        else***REMOVED***
            try***REMOVED***
                lastSendOk = false;
                sendMessage();
        ***REMOVED***
            catch(error)***REMOVED***
                closeSession();
                // except StopIteration:
                    // self.closeSession(True)
                // except Exception:
                    // self.closeSession(True)
                // TODO: Si se dispone de tiempo analizar las excepciones anteriores 
        ***REMOVED***
    ***REMOVED***
        
        // TODO: Revisar la condicion de abajo
        // if message == EOT:
            // self.openSession()
***REMOVED***
    else if (data === token.EOT)***REMOVED***
        isTransferState = false; // TODO: Validar que ante un EOT se tengan que realizar estos pasos
        throw new Error('Client should not receive EOT.');
***REMOVED***
    else if (data.startsWith(token.STX))***REMOVED***
        isTransferState = false; // TODO: Validar que ante un message se tengan que realizar estos pasos
        throw new Error('Client should not receive ASTM message.');
***REMOVED***
    else ***REMOVED***
        throw new Error('Invalid data.');
***REMOVED***
***REMOVED***

function openSession()***REMOVED***
    logger.debug('Open Session'); // TODO: Remove line
    retryCounter = retryCounter + 1;
    if (retryCounter > 6)***REMOVED***
        logger.debug('Exceed number of retries'); // TODO: Remove line
        closeSession();
***REMOVED***
    else***REMOVED***
        port.write(token.ENQ);
        lastSendData = token.ENQ;
        isTransferState = true;
        isSender = true;
***REMOVED***
***REMOVED***

function closeSession()***REMOVED***
    logger.debug('Close Session'); // TODO: Remove line
    port.write(token.EOT);
    isTransferState = false;
    isSender = false;
    retryCounter = 0;
***REMOVED***

var recordDataToSend = [ [ 'H',
    [ [null], [null,'&'] ],
    null,
    null,
    [ 'H7600', '1' ],
    null,
    null,
    null,
    null,
    'host',
    [ 'RSUPL', 'BATCH' ],
    'P',
    '1' ],
  [ 'P', '1' ],
  [ 'O',
    '1',
    [ '0', '                   806', '1', null, '001' ],
    'R1',
    [ null, null, null, '458/' ],
    'R',
    null,
    null,
    null,
    null,
    null,
    'N',
    null,
    [ null, null, null ],
    null,
    'SC',
    null,
    null,
    '      ',
    [ '                              ',
      '                         ',
      '                    ',
      '               ',
      '          ' ],
    null,
    null,
    '20161111095305',
    null,
    null,
    'F' ],
  [ 'R',
    '1',
    [ null, null, null, '458/' ],
    '55',
    'mg/dl',
    null,
    'N',
    null,
    'F',
    null,
    null,
    null,
    null,
    'P1' ],
  [ 'C', '1', 'I', '0', 'I' ],
  [ 'L', '1', 'N' ] ];
  
  // 0231487C5C5E267C7C7C48373630305E317C7C7C7C7C686F73747C525355504C5E42415443487C507C310D507C310D4F7C317C305E202020202020202020202020202020202020203830365E315E5E3030317C52317C5E5E5E3435382F7C527C7C7C7C7C7C4E7C7C5E5E7C7C53437C7C7C2020202020207C2020202020202020202020202020202020202020202020202020202020205E202020202020202020202020202020202020202020202020205E20202020202020202020202020202020202020205E2020202020202020202020202020205E202020202020202020207C7C7C32303136313131313039353330357C7C7C460D527C317C5E5E5E3435382F7C35357C6D672F646C7C7C4E7C7C467C7C7C7C7C50310D437C317C497C307C490D4C7C317C4E0D0342460D0A