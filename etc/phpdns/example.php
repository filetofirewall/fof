<?php

// REGISTER AUTOLOADER
spl_autoload_register(function ($class) {
 $file = __DIR__ . DIRECTORY_SEPARATOR . str_replace('\\', '/', $class) . '.php';

 if (file_exists($file)) {
  require $file;
 }
});

use StorageProvider\JsonStorageProvider;

require "dns_server.class.php"; 

$record_file = 'dns_record.json';
$storage = new JsonStorageProvider($record_file);

// Creating a new instance of our class
$dns = new PHP_DNS_SERVER($storage);

// Connection constants
define('MEMCACHED_HOST', '127.0.0.1');
define('MEMCACHED_PORT', '11211');
 
// Connection creation
global $cacheAvailable;
global $memcache;
$memcache = new Memcache;
$cacheAvailable = $memcache->connect(MEMCACHED_HOST, MEMCACHED_PORT);


// Starting our DNS server
$dns->start();

?>
