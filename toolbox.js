// ===================================================================
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain javascript up on your site for download or
// include it in your javascript libraries for download. 
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// ===================================================================

// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but 
//                 backwards-compatability was required.

// ------------------------------------------------------------------
// These functions use the same 'format' strings as the 
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
// 
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | KK (2 digits)      | K (1 or 2 digits)
// Hour (1-24)  | kk (2 digits)      | k (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// AM/PM        | a                  |
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:ssa" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------

var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
var DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');
function LZ(x) ***REMOVED***return(x<0||x>9?"":"0")+x***REMOVED***

// ------------------------------------------------------------------
// isDate ( date_string, format_string )
// Returns true if date string matches format of format string and
// is a valid date. Else returns false.
// It is recommended that you trim whitespace around the value before
// passing it to this function, as whitespace is NOT ignored!
// ------------------------------------------------------------------
function isDate(val,format) ***REMOVED***
	var date=getDateFromFormat(val,format);
	if (date==0) ***REMOVED*** return false; ***REMOVED***
	return true;
	***REMOVED***

// -------------------------------------------------------------------
// compareDates(date1,date1format,date2,date2format)
//   Compare two date strings to see which is greater.
//   Returns:
//   1 if date1 is greater than date2
//   0 if date2 is greater than date1 of if they are the same
//  -1 if either of the dates is in an invalid format
// -------------------------------------------------------------------
function compareDates(date1,dateformat1,date2,dateformat2) ***REMOVED***
	var d1=getDateFromFormat(date1,dateformat1);
	var d2=getDateFromFormat(date2,dateformat2);
	if (d1==0 || d2==0) ***REMOVED***
		return -1;
		***REMOVED***
	else if (d1 > d2) ***REMOVED***
		return 1;
		***REMOVED***
	return 0;
	***REMOVED***

// ------------------------------------------------------------------
// formatDate (date_object, format)
// Returns a date in the output format specified.
// The format string uses the same abbreviations as in getDateFromFormat()
// ------------------------------------------------------------------
function formatDate(date,format) ***REMOVED***
	format=format+"";
	var result="";
	var i_format=0;
	var c="";
	var token="";
	var y=date.getYear()+"";
	var M=date.getMonth()+1;
	var d=date.getDate();
	var E=date.getDay();
	var H=date.getHours();
	var m=date.getMinutes();
	var s=date.getSeconds();
	var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
	// Convert real date parts into formatted versions
	var value=new Object();
	if (y.length < 4) ***REMOVED***y=""+(y-0+1900);***REMOVED***
	value["y"]=""+y;
	value["yyyy"]=y;
	value["yy"]=y.substring(2,4);
	value["M"]=M;
	value["MM"]=LZ(M);
	value["MMM"]=MONTH_NAMES[M-1];
	value["NNN"]=MONTH_NAMES[M+11];
	value["d"]=d;
	value["dd"]=LZ(d);
	value["E"]=DAY_NAMES[E+7];
	value["EE"]=DAY_NAMES[E];
	value["H"]=H;
	value["HH"]=LZ(H);
	if (H==0)***REMOVED***value["h"]=12;***REMOVED***
	else if (H>12)***REMOVED***value["h"]=H-12;***REMOVED***
	else ***REMOVED***value["h"]=H;***REMOVED***
	value["hh"]=LZ(value["h"]);
	if (H>11)***REMOVED***value["K"]=H-12;***REMOVED*** else ***REMOVED***value["K"]=H;***REMOVED***
	value["k"]=H+1;
	value["KK"]=LZ(value["K"]);
	value["kk"]=LZ(value["k"]);
	if (H > 11) ***REMOVED*** value["a"]="PM"; ***REMOVED***
	else ***REMOVED*** value["a"]="AM"; ***REMOVED***
	value["m"]=m;
	value["mm"]=LZ(m);
	value["s"]=s;
	value["ss"]=LZ(s);
	while (i_format < format.length) ***REMOVED***
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) ***REMOVED***
			token += format.charAt(i_format++);
			***REMOVED***
		if (value[token] != null) ***REMOVED*** result=result + value[token]; ***REMOVED***
		else ***REMOVED*** result=result + token; ***REMOVED***
		***REMOVED***
	return result;
	***REMOVED***
	
// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val) ***REMOVED***
	var digits="1234567890";
	for (var i=0; i < val.length; i++) ***REMOVED***
		if (digits.indexOf(val.charAt(i))==-1) ***REMOVED*** return false; ***REMOVED***
		***REMOVED***
	return true;
	***REMOVED***
function _getInt(str,i,minlength,maxlength) ***REMOVED***
	for (var x=maxlength; x>=minlength; x--) ***REMOVED***
		var token=str.substring(i,i+x);
		if (token.length < minlength) ***REMOVED*** return null; ***REMOVED***
		if (_isInteger(token)) ***REMOVED*** return token; ***REMOVED***
		***REMOVED***
	return null;
	***REMOVED***
	
// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the 
// getTime() of the date. If it does not match, it returns 0.
// ------------------------------------------------------------------
function getDateFromFormat(val,format) ***REMOVED***
	val=val+"";
	format=format+"";
	var i_val=0;
	var i_format=0;
	var c="";
	var token="";
	var token2="";
	var x,y;
	var now=new Date();
	var year=now.getYear();
	var month=now.getMonth()+1;
	var date=1;
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();
	var ampm="";
	
	while (i_format < format.length) ***REMOVED***
		// Get next token from format string
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) ***REMOVED***
			token += format.charAt(i_format++);
			***REMOVED***
		// Extract contents of value based on format token
		if (token=="yyyy" || token=="yy" || token=="y") ***REMOVED***
			if (token=="yyyy") ***REMOVED*** x=4;y=4; ***REMOVED***
			if (token=="yy")   ***REMOVED*** x=2;y=2; ***REMOVED***
			if (token=="y")    ***REMOVED*** x=2;y=4; ***REMOVED***
			year=_getInt(val,i_val,x,y);
			if (year==null) ***REMOVED*** return 0; ***REMOVED***
			i_val += year.length;
			if (year.length==2) ***REMOVED***
				if (year > 70) ***REMOVED*** year=1900+(year-0); ***REMOVED***
				else ***REMOVED*** year=2000+(year-0); ***REMOVED***
				***REMOVED***
			***REMOVED***
		else if (token=="MMM"||token=="NNN")***REMOVED***
			month=0;
			for (var i=0; i<MONTH_NAMES.length; i++) ***REMOVED***
				var month_name=MONTH_NAMES[i];
				if (val.substring(i_val,i_val+month_name.length).toLowerCase()==month_name.toLowerCase()) ***REMOVED***
					if (token=="MMM"||(token=="NNN"&&i>11)) ***REMOVED***
						month=i+1;
						if (month>12) ***REMOVED*** month -= 12; ***REMOVED***
						i_val += month_name.length;
						break;
						***REMOVED***
					***REMOVED***
				***REMOVED***
			if ((month < 1)||(month>12))***REMOVED***return 0;***REMOVED***
			***REMOVED***
		else if (token=="EE"||token=="E")***REMOVED***
			for (var i=0; i<DAY_NAMES.length; i++) ***REMOVED***
				var day_name=DAY_NAMES[i];
				if (val.substring(i_val,i_val+day_name.length).toLowerCase()==day_name.toLowerCase()) ***REMOVED***
					i_val += day_name.length;
					break;
					***REMOVED***
				***REMOVED***
			***REMOVED***
		else if (token=="MM"||token=="M") ***REMOVED***
			month=_getInt(val,i_val,token.length,2);
			if(month==null||(month<1)||(month>12))***REMOVED***return 0;***REMOVED***
			i_val+=month.length;***REMOVED***
		else if (token=="dd"||token=="d") ***REMOVED***
			date=_getInt(val,i_val,token.length,2);
			if(date==null||(date<1)||(date>31))***REMOVED***return 0;***REMOVED***
			i_val+=date.length;***REMOVED***
		else if (token=="hh"||token=="h") ***REMOVED***
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<1)||(hh>12))***REMOVED***return 0;***REMOVED***
			i_val+=hh.length;***REMOVED***
		else if (token=="HH"||token=="H") ***REMOVED***
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<0)||(hh>23))***REMOVED***return 0;***REMOVED***
			i_val+=hh.length;***REMOVED***
		else if (token=="KK"||token=="K") ***REMOVED***
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<0)||(hh>11))***REMOVED***return 0;***REMOVED***
			i_val+=hh.length;***REMOVED***
		else if (token=="kk"||token=="k") ***REMOVED***
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<1)||(hh>24))***REMOVED***return 0;***REMOVED***
			i_val+=hh.length;hh--;***REMOVED***
		else if (token=="mm"||token=="m") ***REMOVED***
			mm=_getInt(val,i_val,token.length,2);
			if(mm==null||(mm<0)||(mm>59))***REMOVED***return 0;***REMOVED***
			i_val+=mm.length;***REMOVED***
		else if (token=="ss"||token=="s") ***REMOVED***
			ss=_getInt(val,i_val,token.length,2);
			if(ss==null||(ss<0)||(ss>59))***REMOVED***return 0;***REMOVED***
			i_val+=ss.length;***REMOVED***
		else if (token=="a") ***REMOVED***
			if (val.substring(i_val,i_val+2).toLowerCase()=="am") ***REMOVED***ampm="AM";***REMOVED***
			else if (val.substring(i_val,i_val+2).toLowerCase()=="pm") ***REMOVED***ampm="PM";***REMOVED***
			else ***REMOVED***return 0;***REMOVED***
			i_val+=2;***REMOVED***
		else ***REMOVED***
			if (val.substring(i_val,i_val+token.length)!=token) ***REMOVED***return 0;***REMOVED***
			else ***REMOVED***i_val+=token.length;***REMOVED***
			***REMOVED***
		***REMOVED***
	// If there are any trailing characters left in the value, it doesn't match
	if (i_val != val.length) ***REMOVED*** return 0; ***REMOVED***
	// Is date valid for month?
	if (month==2) ***REMOVED***
		// Check for leap year
		if ( ( (year%4==0)&&(year%100 != 0) ) || (year%400==0) ) ***REMOVED*** // leap year
			if (date > 29)***REMOVED*** return 0; ***REMOVED***
			***REMOVED***
		else ***REMOVED*** if (date > 28) ***REMOVED*** return 0; ***REMOVED*** ***REMOVED***
		***REMOVED***
	if ((month==4)||(month==6)||(month==9)||(month==11)) ***REMOVED***
		if (date > 30) ***REMOVED*** return 0; ***REMOVED***
		***REMOVED***
	// Correct hours value
	if (hh<12 && ampm=="PM") ***REMOVED*** hh=hh-0+12; ***REMOVED***
	else if (hh>11 && ampm=="AM") ***REMOVED*** hh-=12; ***REMOVED***
	var newdate=new Date(year,month-1,date,hh,mm,ss);
	return newdate; //.getTime();
	***REMOVED***

// ------------------------------------------------------------------
// parseDate( date_string [, prefer_euro_format] )
//
// This function takes a date string and tries to match it to a
// number of possible date formats to get the value. It will try to
// match against the following international formats, in this order:
// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
// M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
// d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
// A second argument may be passed to instruct the method to search
// for formats like d/M/y (european format) before M/d/y (American).
// Returns a Date object or null if no patterns match.
// ------------------------------------------------------------------
function parseDate(val) ***REMOVED***
	var preferEuro=(arguments.length==2)?arguments[1]:false;
	generalFormats=new Array('y-M-d','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d');
	monthFirst=new Array('M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d');
	dateFirst =new Array('d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M');
	var checkList=new Array('generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst');
	var d=null;
	for (var i=0; i<checkList.length; i++) ***REMOVED***
		var l=window[checkList[i]];
		for (var j=0; j<l.length; j++) ***REMOVED***
			d=getDateFromFormat(val,l[j]);
			if (d!=0) ***REMOVED*** return new Date(d); ***REMOVED***
			***REMOVED***
		***REMOVED***
	return null;
	***REMOVED***

module.exports = ***REMOVED***
    getDateFromFormat : getDateFromFormat,
    formatDate: formatDate,
***REMOVED***
    
