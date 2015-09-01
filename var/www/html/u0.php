<?php
    // Connection constants
    define('MEMCACHED_HOST', '127.0.0.1');
    define('MEMCACHED_PORT', '11211');

    // Connection creation
    $memcache = new Memcache;
    $cacheAvailable = $memcache->connect(MEMCACHED_HOST, MEMCACHED_PORT);

    $cdns = explode(".", $_SERVER["HTTP_HOST"]);
    $cdns_ct = count($cdns);
    $connip = $_SERVER["REMOTE_ADDR"];
    //HERE WE SET WHETHER TO USE PUB IP FOR REBIND OR PRIVATE GW IP
    $weakendsystem = "off";

    /*$key = "test";
    $product = array("123", "456");

    $memcache->set($key, $product);

    $text = $memcache->get($key);

    foreach ($text as $data) {
        echo $data;
    }*/

    $iparray = "";
    //Remove initial colon from ip array
    $ipstr = substr(base64_decode(file_get_contents("php://input")),1);

    if ($ipstr != false) {
        $iparray = explode(":", $ipstr);
        $key = $cdns[$cdns_ct-3];
        $gip = array(); //Gateway IP Array

        foreach ($iparray as $data) {
            $newiparray = explode(";", $data);

            if (filter_var($newiparray[0], FILTER_VALIDATE_IP) && filter_var($newiparray[1], FILTER_VALIDATE_IP)) {

                //We are using last IP returned (usually primary in webrtc)
                $cip = explode(".", $newiparray[0]);
                $sub = $cip[0].".".$cip[1].".".$cip[2];
                $gip[$gip.length] = $newiparray[1];
                //$gip[$gip.length] = $cip[0].".".$cip[1].".".$cip[2].".254";
                //$gip[$gip.length] = $cip[0].".".$cip[1].".".$cip[2].".2";
                //$gip[$gip.length] = $cip[0].".".$cip[1].".".$cip[2].".3";
                /* This is old code from php determining gateway.  Javascript now posts the correct gateway ip
                echo $cip[0].".".$cip[1].".".$cip[2].".1\n";
                */
                $memcache->set($key."ip", $newiparray[1].";".$newiparray[0].";".$sub);

                if ($weakendsystem == "on") {
                    $memcache->set($key, $connip);
                } else {
                    $memcache->set($key, $gip);
                }
            }
        }
    }
?>
