var assert = require('assert');


var token = require('../constants');
var codec = require('../codec');
var record = require('../record_epicenter');

describe('Test suite for record module', function() ***REMOVED***
    describe('BuildTestCase', function() ***REMOVED***
         it('result_record_build', function() ***REMOVED***
            var msg = 'R|1| ^ ^ ^GND_MGIT^430100001234|INST_POSITIVE ^87| | | | |P| | |19981019153400|19981020145000| MGIT960^^42^3^B/A12 ';
            rec =  codec.decode(msg,token.ENCODING);
            console.log(rec);
            var o = new record.ResultRecord();
            o.buildFromRecord(rec);
            console.log(o);
            // rec =  codec.encodeRecord(o.toASTM(),token.ENCODING);
            
            // if (msg === rec)***REMOVED***
                // console.log('####TODO BIEN');
            // ***REMOVED***
            // else***REMOVED***
                // console.log('####TODO MAL');
            // ***REMOVED***
            // console.log(msg);
            // console.log(rec);
    ***REMOVED***);
        
       
        it('result_record_build_1', function() ***REMOVED***
            // BACTEC MGIT 960 AST test level result example
            var msg = 'R|1| ^ ^ ^AST_MGIT^439400005678^P^0.5^ug/ml| INST_COMPLETE^105^^S| | | | |P| | |19981019153400| 19981020145000|MGIT960^^42^3^ B/A12 ';
            rec =  codec.decode(msg,token.ENCODING);
            console.log(rec);
            var o = new record.ResultRecord();
            o.buildFromRecord(rec);
            console.log(o);
    ***REMOVED***);
        
        
        it('result_record_build_2', function() ***REMOVED***
            // Phoenix AST MIC test level result example
            var msg = 'R|1| ^ ^ ^AST_MIC^429530000002^P| INST_COMPLETE^0.5^^S| | | | | F| | |19981019153400| 19981020145000';
            rec =  codec.decode(msg,token.ENCODING);
            console.log(rec);
            var o = new record.ResultRecord();
            o.buildFromRecord(rec);
            console.log(o);
    ***REMOVED***);
        
***REMOVED***);
***REMOVED***);


