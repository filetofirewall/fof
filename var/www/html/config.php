<?php
    //This is the main settings configuration file.  Please note that these variables are written in Javascript syntax and are imported into the Javascript delivered to the client.  Do not put ending semi-colons for javascript.  Those are added later
    $ports = '[1780,1900,2189,2600,2869,2555,5555,37215,47128,49000,49152,49153,56688]';
    $portfinalresort = '[80]';

    $opnports = '["22:TCP", "161:UDP", "80:TCP", "443:TCP", "445:TCP", "3389:TCP", "5900:TCP", "5901:TCP", location.port + ":TCP"]';
    $opnports1 = '["22:TCP", "161:UDP", "80:TCP", "443:TCP", "445:TCP", "8080:TCP", "3389:TCP", "3306:TCP", "1433:TCP", "79:TCP", "3283:TCP", "3283:UDP", "5900:TCP", "5901:TCP", "5988:TCP", location.port + ":TCP"]';

    $startportnum = '5800';
?>
