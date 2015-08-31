<?php

$cdns = explode(".", $_SERVER["HTTP_HOST"]);
$cdns_ct = count($cdns);
if ($cdns_ct > 2)
{
	file_put_contents("/var/www/html/testup/".$_SERVER["HTTP_HOST"]."out.html", $_SERVER["REMOTE_ADDR"].'<br>'.file_get_contents("php://input"));
}
else
{
	file_put_contents("/var/www/html/testup/".$_SERVER["REMOTE_ADDR"]."out.html", $_SERVER["REMOTE_ADDR"].'<br>'.file_get_contents("php://input"));
}

?>


