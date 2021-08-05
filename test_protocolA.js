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

initPort();

function initPort()***REMOVED***
    var portNumber = 'COM1';
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
    logger.info('REQUEST A'); 
    logger.info(data);
    port.write(data);
***REMOVED***

function handlePortData(data)***REMOVED***
    logger.info('RESPONSE B'); 
    logger.info(data); // Raw Buffer Data
***REMOVED***

function write()***REMOVED***
    handlePortWrite('Hola');
***REMOVED***

function runIntervalCheck() ***REMOVED***
  setInterval(write, 10000);
***REMOVED***;


runIntervalCheck();