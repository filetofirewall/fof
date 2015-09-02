# Filet-O-Firewall Vulnerability PoC

This is the Proof of Concept code to exploit the Filet-O-Firewall vulnerability. 

CERT VU#361684 http://www.kb.cert.org/vuls/id/361684

The code is currently being cleaned up to be more easily digestable, but it is working at the moment.

The best browser to use for the PoC is Firefox, it works 99% of the time.

Google Chrome recently changed some of its behavior in regards to how it handles XMLHTTPRequest timing.  Will have to do research to see how to fix this.

## Infrastructure Setup
* We need a domain that we can become the authoritative name server for.
* Ideally two separate static IP addresses.
* An Apache Server with the correct code.
* The PHP DNS server code (or a DNS server that reads from Memcache).
* A Memcache server.
* We need to make sure our web server responds on all the UPnP ports (since the port needs to also be the same to bypass CORS).
* When we do the DNS Multiple A Record switch (switching from our web server to the client’s gateway ip), the browser will simply switch the IP.  It does not change the path or the port.  
* It is key to have the page that we send them to (open.html) load all of its resources quickly and not depend on any resources from the randomly generated subdomain.  Access to the webserver on that port will be cut off in order to force the browser to switch to the second A record we have in our DNS response.

## DNS Server
* The default DNS records need to be setup in dns_record.json.  
* Test.firefox needs to be specified with the public IP of the web server and the default gateway IP you would like to use in case the Memcache server is broken or too slow to respond (for some unknown reason).
* Test.sub needs to be changed to the secondary IP of the web server.  This ensures connectivity can still happen during the DNS rebind attack.
* Run the DNS server by starting a screen session and running “php example.php”.

## Apps to Install
* Apache
* PHP
* Memcache

## Files Guide
1. php_inline.conf
   * Should go in Apache conf.d directory.
2. apache_ports.conf
   * Should be used for Apache's ports.conf.
3. php_dns_ubuntu_service
   * Can be used to register a service for the php dns server.
4. apache_site.conf
   * Should be used as the Apache config file.
5. server_settings.readme
   * Contains text that should be added to /etc/sudoers so php can modify iptables rules.
6. /etc/phpdns
   * For the PHP DNS server files.
7. /var/www/html
   * For the web server files.
8. Config.php
   * The future home of most configurable directives
9. Wmain.html
   * Displays a loading gif and scans IP addresses of the user’s gateway for possible UPnP ports that are open. If none are found 80 is assumed as the UPnP port.
   * Sets whether debug mode is on or off.
   * Generates random subdomain.
   * Determines user’s private IP address.
   * Redirects user to random subdomain and UPnP port.
   * Determines the user’s browser (may be needed for extra functionality later).
10. U0.php
   * Accepts the base64 encoded internal ip address of the gateway and calculates the subnet.  
   * Puts the information into memcache with the subdomain as the key.
   * Can be set to exploit Weak End System Model by adding the public IP of the gateway instead of the internal IP of the gateway.
11. Wopen.html
   * Displays some content (usually a video).
   * Loads worker.js.
12. C1.html
   * Accepts port in POST parameters and adds iptables rule blocking the port on the webserver to the IP address who made the request.
13. C0.html
   * Accepts port in POST parameters and removes iptables rule blocking the port on the webserver to the IP address who made the request.
14. I0.php
   * Returns the gateway and subnet for the requested subdomain.
15. R0.php
   * -Accepts POSTed information and stores it in a file in the testup directory.
16. Worker.js
   * POSTs the port being actively used to C1.HTML (which will add the iptables rules to cut off access).
   * Starts requesting possible XML files from the gateway (the browser automatically starts using the other IP address in the multiple A record when the original cannot be accessed).
   * Asks for Gateway IP from i0.php.
   * Once XML is found, parses the controlURL property.
   * POSTs XML to the controlURL to open all ports specified in the script (e.g. 80, 443, 445, 22, etc.) for the gateway ip address and client’s ip address starting with external port 5800.
   * POSTs opened port internal to external mapping to r0.php.
   * Loades open.js (web worker code) and spawns configured number of web workers.
   * Breaks up subnet based on number of web workers.
      * Assigns work to web workers.
      * Web workers contact gateway and open rest of internal network hosts on all configured ports.
   * Once finished POSTs full list of hosts and internal to external port mapping to r0.php
   * POSTs port to c0.html to remove iptables rule.
   * Finishes
17. Open.js
   * Web worker code for opening UPnP ports

PHP DNS Server Code from: https://github.com/yswery/PHP-DNS-SERVER
