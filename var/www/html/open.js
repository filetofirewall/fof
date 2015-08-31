<?php include 'config.php'; 

echo 'var opnports = ' . $opnports . ";\n";

?>
var logs = "";
function opnip(iparray, corrurl, schematype, startportnum)
{
  	postMessage(['Beginning openip at startportnum: ' + startportnum, logs]);
	if (typeof iparray === 'undefined')
	{
		iparray = intips;
	}
	for (i=0; i < iparray.length; i++)
	{
		for (j=0; j < opnports.length; j++)
		{
			var portarr = opnports[j].split(":");
			var proto = portarr[1];
			var intportnum = portarr[0];
			logs = logs + startportnum + "---" + iparray[i] + ":" + intportnum + "_" + proto + '<br>';
  			//console.log('Starting open with Control URL : ' + corrurl );
			loadXMLDoc(corrurl, schematype, startportnum, intportnum, proto, iparray[i]);
			startportnum++;
		}
	}
}
function processReqChange() {
    // only if req shows "loaded"
    if (req.readyState == 4) {
        // only if "OK"
        if (req.status == 200) {
            // ...processing statements go here...
		//alert(req.responseText);
        } else {
           logs = logs + "There was a problem retrieving the XML data:\n" + req.statusText + '<br>';
        }
    }
}

function loadXMLDoc(url, schema, extport, intport, proto, intip) {
		//document.write("startxml");
	req = false;
    // branch for native XMLHttpRequest object
			req = new XMLHttpRequest();
	if(req) {
		//document.write("postxml");
		req.onreadystatechange = processReqChange;
		req.open("POST", url, true);
		req.setRequestHeader('SOAPAction', '"' + schema + '#AddPortMapping"');

		req.send('<?php echo '<?'?>xml version="1.0"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><m:AddPortMapping xmlns:m="urn:schemas-upnp-org:service:WANPPPConnection:1"><NewRemoteHost xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="string"></NewRemoteHost><NewExternalPort xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="ui2">'+ extport + '</NewExternalPort><NewProtocol xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="string">' + proto + '</NewProtocol><NewInternalPort xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="ui2">' + intport + '</NewInternalPort><NewInternalClient xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="string">' + intip + '</NewInternalClient><NewEnabled xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="boolean">1</NewEnabled><NewPortMappingDescription xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="string">XBOX</NewPortMappingDescription><NewLeaseDuration xmlns:dt="urn:schemas-microsoft-com:datatypes" dt:dt="ui4">0</NewLeaseDuration></m:AddPortMapping></SOAP-ENV:Body></SOAP-ENV:Envelope>');
	}
}

onmessage = function(e) {
  postMessage(['Beginning worker', logs]);
  console.log('Message received from main script with URL: ' + e.data[1] );
  //console.log('edata[0]: ' + e.data[0] );
  //console.log('edata[1]: ' + e.data[1] );
  //console.log('edata[2]: ' + e.data[2] );
  //Here we invoke open function using data passed from main
  opnip(e.data[0], e.data[1], e.data[2], e.data[3]);
  console.log('Posting message back to main script');
  postMessage(['Logs', logs]);
}
