var SerialPort = require('serialport');
SerialPort.list(function (err, ports) ***REMOVED***
  ports.forEach(function(port) ***REMOVED***
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  ***REMOVED***);
***REMOVED***);