<?php
    // Connection constants
    define('MEMCACHED_HOST', '127.0.0.1');
    define('MEMCACHED_PORT', '11211');

    // Connection creation
    $memcache = new Memcache;
    $cacheAvailable = $memcache->connect(MEMCACHED_HOST, MEMCACHED_PORT);

    $cdns = explode(".", $_SERVER["HTTP_HOST"]);
    $cdns_ct = count($cdns);

    /*$key = "test";
    $product = array("123", "456");

    $memcache->set($key, $product);

    $text = $memcache->get($key);

    foreach ($text as $data) {
        echo $data;
    }*/

    $iparray = "";
    $key = $cdns[$cdns_ct-3];
    //Remove initial colon from ip array
    $iparray = $memcache->get($key."ip");
    echo $iparray;
?>
