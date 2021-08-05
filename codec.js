var logger = require('winston');
// Internal Dependencies
var token = require('./constants');

    
function isDigit(num)***REMOVED***
    return !isNaN(num)
***REMOVED***

/**
* Common ASTM decoding function that tries to guess which kind of data it
* handles.
* If `data` starts with STX character (``0x02``) then probably it is
* full ASTM message with checksum and other system characters.
* If `data` starts with digit character (``0-9``) then probably it is
* fraime of records leading by his sequence number. No checksum is expected
* in this case.
* Otherwise it counts `data` as regular record structure.
* @param data: ASTM data object.
* @return: Array of ASTM records.
**/
function decode(data)***REMOVED***
    if (data.startsWith(token.STX))***REMOVED*** // # may be decode message \x02...\x03CS\r\n
        var records = decode_message(data);
        return records;
***REMOVED***
    var bait =  data.slice(0,1).toString(token.ENCODING);
    if  (isDigit(bait))***REMOVED***
        var records = decodeFrame(data);
        return records;
***REMOVED***
    // Maybe is a record
    var salida = [];
    return decodeRecord(data);

    
***REMOVED***


/**
* Decodes complete ASTM message that is sent or received due
* communication routines. It should contains checksum that would be
* additionally verified.
*
* @param ***REMOVED***string***REMOVED*** message: ASTM message.
* @returns: Array of records

* @throws Error:
* * If ASTM message is malformed.
* * If checksum verification fails. TODO
**/
function decodeMessage(message)***REMOVED***
    if (!(message.startsWith(token.STX) && message.endsWith(token.CRLF)))***REMOVED***
        throw new Error('Malformed ASTM message. Expected that it will started with STX and followed by CRLF characters. Got:' + message);
***REMOVED***
    
    var STXIndex = -1;
    var fraimeMerge = [];
    var fraime = "";
    var msg = message.slice(1); // Remove first STX
    while (msg.indexOf(token.STX) > -1 )***REMOVED***
        STXIndex = msg.indexOf(token.STX);
        fraime = message.slice(0,STXIndex + 1);
        fraime = decodeFrame(fraime);
        fraimeMerge.push(fraime);
        
        msg = msg.slice(STXIndex + 1);
        message = message.slice(STXIndex + 1);
***REMOVED***

    fraime = decodeFrame(message); // Last frame(should contains ETX)
    fraimeMerge.push(fraime);
    
    var records = fraimeMerge.join("");
    
    var recordsArray = records.split(token.RECORD_SEP);
    
    var records = [];
    for (var i = 0; i < recordsArray.length; i++) ***REMOVED***
        records.push(decodeRecord(recordsArray[i]));
***REMOVED***
    return records
***REMOVED***

function decodeFrame(fraime)***REMOVED***
    // Decodes ASTM frame 
    fraime = fraime.slice(1);
    var fraime_cs = fraime.slice(0,-2);
    fraime = fraime_cs.slice(0,-2);
    var cs = fraime_cs.slice(-2);
    var css = makeChecksum(fraime);
    
    // TODO Validate checksum
    // if (cs !== css)***REMOVED***
        // throw new Error('Checksum failure: expected ' + cs + ', calculated '+ css); 
    // ***REMOVED***
    
    if (fraime.endsWith(token.CR + token.ETX))***REMOVED***
        fraime = fraime.slice(0,-2);
***REMOVED***
    else if (fraime.endsWith(token.ETB))***REMOVED***
        fraime = fraime.slice(0,-1);
***REMOVED***
    else***REMOVED***
        throw new Error('Incomplete frame data ' + fraime + '. Expected trailing <CR><ETX> or <ETB> chars');
***REMOVED***
    var seq = fraime.slice(0,1);
    if (!isDigit(seq))***REMOVED***
        throw new Error('Malformed ASTM frame. Expected leading seq number '+ fraime);
***REMOVED***
    return fraime.slice(1);
***REMOVED***


function decodeRecord(record)***REMOVED***
    // Decodes ASTM record message
    var fields = [];
    var fieldsArray = record.split(token.FIELD_SEP);
    for (var i = 0; i < fieldsArray.length; i++) ***REMOVED***
        var item = fieldsArray[i];
        if (item.indexOf(token.REPEAT_SEP)> -1)***REMOVED***
            item = decodeRepeatedComponent(item);
    ***REMOVED***
        else if (item.indexOf(token.COMPONENT_SEP)> -1)***REMOVED***
            item = decodeComponent(item);
    ***REMOVED***
        else***REMOVED***
            item = item;
    ***REMOVED***
        
        if (item)***REMOVED***
            fields.push(item);
    ***REMOVED***
        else***REMOVED***
            fields.push(null);
    ***REMOVED***
***REMOVED***
    return fields;
***REMOVED***


function decodeComponent(field)***REMOVED***
    // Decodes ASTM field component
    var outComponents = [];
    var itemsArray = field.split(token.COMPONENT_SEP);
     
    for (var i = 0; i < itemsArray.length; i++) ***REMOVED***
        var item = itemsArray[i];
        if (item)***REMOVED***
            outComponents.push(item);
    ***REMOVED***
        else***REMOVED***
            outComponents.push(null);
    ***REMOVED***
***REMOVED***
    return outComponents;
***REMOVED***

function decodeRepeatedComponent(component)***REMOVED***
    // Decodes ASTM field repeated component
    var outRepeatedComponent = [];
    var itemsArray = component.split(token.REPEAT_SEP);
    for (var i = 0; i < itemsArray.length; i++) ***REMOVED***
        var item = itemsArray[i];
        outRepeatedComponent.push(decodeComponent(item));
***REMOVED***
    outRepeatedComponent;
    return outRepeatedComponent
***REMOVED***




/**
* Encodes list of records into single ASTM message, also called as "packed"
* message.
* 
* If the result message is too large (greater than specified `size` if it's
* not null), then it will be split by chunks.
*
* @param records: Array of ASTM records.
* @param ***REMOVED***int***REMOVED*** size: Chunk size in bytes.
* @param ***REMOVED***int***REMOVED*** seq: Frame start sequence number.
* @return: List of ASTM message chunks.
**/
function encode(records, encoding, size, seq)***REMOVED***
    encoding = typeof encoding !== 'undefined' ? encoding : token.ENCODING;
    seq = typeof seq !== 'undefined' ? seq : 1;
    size = typeof size !== 'undefined' ? size : 247;
    var msg = encodeMessage(seq, records, encoding);

    if (size && msg.length > size)***REMOVED***
        return split(msg, size);
***REMOVED***
    return [msg];
***REMOVED***


            
/**
* Encodes ASTM message.
* @param ***REMOVED***int***REMOVED*** seq: Frame sequence number.
* @param records: List of ASTM records.
* @param ***REMOVED***string***REMOVED*** encoding: Data encoding.
* @return ***REMOVED***string***REMOVED***: ASTM complete message with checksum and other control characters.
**/
function encodeMessage(seq, records, encoding)***REMOVED***
    var data = [];
    for (var i = 0; i < records.length; i++) ***REMOVED***
        var record = records[i];
        // logger.info(record);
        data.push(encodeRecord(record,encoding));
***REMOVED***
    // logger.info(data);
    data = data.join(token.RECORD_SEP);
    data = [(seq % 8) , data, token.CR, token.ETX].join('');
    return [token.STX, data, makeChecksum(data), token.CR, token.LF].join('');
***REMOVED***

/**
* Encodes single ASTM record.
* @param record: ASTM record. Each`string`-typed item counted as field
               * value, one level nested `array` counted as components
               * and second leveled - as repeated components.
* @param ***REMOVED***string***REMOVED*** encoding: Data encoding.
* @returns ***REMOVED***string***REMOVED***: Encoded ASTM record.
**/
function encodeRecord(record, encoding)***REMOVED***
    var fields = [];
    
    for (var i = 0; i < record.length; i++) ***REMOVED***
        var field = record[i];
        if (typeof field === 'bytes')***REMOVED***
            fields.push(field);
    ***REMOVED***
        else if (typeof field === 'string')***REMOVED***
            fields.push(field);
    ***REMOVED***
        else if (Object.prototype.toString.call(field) === '[object Array]')***REMOVED***
            fields.push(encodeComponent(field, encoding));
    ***REMOVED***
        else if(typeof field === 'undefined' || field === null)***REMOVED***
            fields.push('');
    ***REMOVED***
        else***REMOVED***
            fields.push(field);
    ***REMOVED***
***REMOVED***
    return fields.join(token.FIELD_SEP); 
***REMOVED***

function encodeComponent(component, encoding)***REMOVED***
    // Encodes ASTM record field components
    var items = [];
    for (var i = 0; i < component.length; i++) ***REMOVED***
        var item = component[i];
        if (typeof item === 'bytes')***REMOVED***
            items.push(item);
    ***REMOVED***
        else if (typeof item === 'string')***REMOVED***
            items.push(item);
    ***REMOVED***
        else if (Object.prototype.toString.call(item) === '[object Array]')***REMOVED***
            items.push(encodeRepeatedComponent(component, encoding));
            break;
    ***REMOVED***
        else if(typeof item === 'undefined' || item === null)***REMOVED***
            items.push('');
    ***REMOVED***
        else***REMOVED***
            items.push(item);
    ***REMOVED***
***REMOVED***
     
    return items.join(token.COMPONENT_SEP);
***REMOVED***


function encodeRepeatedComponent(components, encoding)***REMOVED***
    // Encodes repeated components
    var items = []
    for (var i = 0; i < components.length; i++) ***REMOVED***
        var item = components[i];
        items.push(encodeComponent(item,encoding));
***REMOVED***
    return items.join(token.REPEAT_SEP);

***REMOVED***

/**
* Merges ASTM message `chunks` into single message.
* @param chunks: List of chunks as `bytes`.
**/
function joinChunks(chunks)***REMOVED***
    var msg = '1';
    var chunksMsg = [];
    for (var i = 0; i < chunks.length; i++) ***REMOVED***
        var dataChunk = chunks[i].slice(2,-5);
        chunksMsg.push(dataChunk);
***REMOVED***
    msg = msg + chunksMsg.join('') + token.ETX;
    var completeMsg = [token.STX, msg, makeChecksum(msg), token.CRLF]
    return completeMsg.join('');
***REMOVED***

/**
* Split `msg` into chunks with specified `size`.
*
* Chunk `size` value couldn't be less then 7 since each chunk goes with at
* least 7 special characters: STX, frame number, ETX or ETB, checksum and
* message terminator.
*
* @param msg: ASTM message.
* @param ***REMOVED***int ***REMOVED***size: Chunk size in bytes.
* :yield: `bytes`
**/
function split(msg, size)***REMOVED***
    var outputChunks = [];
    var frame = parseInt(msg.slice(1,2));
    var msg = msg.slice(2,-6);
    if (size === null || size < 7)***REMOVED***
        throw new Error('Chunk size value could not be less then 7 or null');
***REMOVED***
    var chunks = make_chunks(msg, size - 7);
    var firstChunks = chunks.slice(0,-1);
    var last = chunks.slice(-1);
    var idx = 0
    for(var i = 0; i < firstChunks.length; i++)***REMOVED***
        idx = i;
        var chunk = firstChunks[idx];
        var item = ([((idx + frame) % 8),chunk,token.ETB]).join('');
        outputChunks.push(([token.STX,item,makeChecksum(item),token.CRLF]).join(''));
***REMOVED***
    item = ([((idx + frame + 1) % 8),last,token.CR,token.ETX]).join('');
    outputChunks.push(([token.STX,item,makeChecksum(item),token.CRLF]).join(''));
    return outputChunks;
***REMOVED***

function make_chunks(msg, size)***REMOVED***
    chunks = [];
    iterElems = [];
    for(var i = 0; i < msg.length; i++)***REMOVED***
        iterElems.push(msg.slice(i,i+1));
***REMOVED***
    while(iterElems.length) ***REMOVED***
        chunks.push(iterElems.splice(0,size).join(''));
***REMOVED***
    return chunks;
***REMOVED***


function isChunkedMessage(message)***REMOVED***
    //  Checks plain message for chunked byte.
    if (message.length < 5)***REMOVED***
        return false;
***REMOVED***
    var ETBIndex = message.indexOf(token.ETB);
    
    if (ETBIndex > -1)***REMOVED***
        if (ETBIndex === message.length -5 )***REMOVED***
            return true;
    ***REMOVED***
        else***REMOVED***
            return false;
    ***REMOVED***
***REMOVED***
    else***REMOVED***
        return false;
***REMOVED***
***REMOVED***

/**
* Calculates checksum for specified message.
* @param message: ASTM message.
* @returns: Checksum value in hex base
**/
function makeChecksum(message)***REMOVED***
    var sumData = []
    for(var i = 0; i < message.length; i++)***REMOVED***
        sumData.push(message.charCodeAt(i));
***REMOVED***
    var suma = sumData.reduce((a, b) => a + b, 0) & 0xFF;
    return zfill(suma.toString(16).toUpperCase());
***REMOVED***

function zfill(value)***REMOVED***
    var str = "" + value;
    var pad = "00";
    return ans = pad.substring(0, pad.length - str.length) + str;
***REMOVED***

module.exports = ***REMOVED***
    decode: decode,
    decodeMessage : decodeMessage,
    decodeFrame : decodeFrame,
    decodeRecord : decodeRecord,
    decodeComponent : decodeComponent,
    decodeRepeatedComponent : decodeRepeatedComponent,
    encode: encode,
    encodeMessage: encodeMessage,
    encodeRecord: encodeRecord,
    isChunkedMessage: isChunkedMessage,
    joinChunks: joinChunks,
    makeChecksum : makeChecksum,
    zfill: zfill,
***REMOVED***;