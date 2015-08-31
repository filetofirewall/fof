<?php

namespace StorageProvider;


use StorageProvider\AbstractStorageProvider;

class JsonStorageProvider extends AbstractStorageProvider {
	private $dns_records;
	private $DS_TYPES = array(1 => 'A', 2 => 'NS', 5 => 'CNAME', 6 => 'SOA', 12 => 'PTR', 15 => 'MX', 16 => 'TXT', 28 => 'AAAA', 41 => 'OPT', 252 => 'AXFR', 255 => 'ANY'); 
	private $DS_TTL = 0;


	public function __construct($record_file, $default_ttl = 300) {
		$handle = fopen($record_file, "r");
		if(!$handle) {
			throw new Exception('Unable to open dns record file.');
		}

		$dns_json = fread($handle, filesize($record_file));
		fclose($handle);

		$dns_records = json_decode($dns_json, true);
		if(!$dns_records) {
			throw new Exception('Unable to parse dns record file.');
		}

		$this->dns_records = $dns_records;
		// Connection creation
		//$memcache = new Memcache;
		//$cacheAvailable = $memcache->connect(MEMCACHED_HOST, MEMCACHED_PORT);
	}

	public function get_answer($question) {
		
		// Connection constants
		//define('MEMCACHED_HOST', '127.0.0.1');
		//define('MEMCACHED_PORT', '11211');
		 
		// Connection creation
		//$memcache = new Memcache;
		//$cacheAvailable = $memcache->connect(MEMCACHED_HOST, MEMCACHED_PORT);
		global $memcache;

		$answer = array();
		$domain = trim($question[0]['qname'], '.');
		$defdomain = "test.chrome";
		$defchgdomain = "test.change";
		$defmultidomain = "test.firefox";
		$defsubdomain = "test.sub";
		//$mcdomain = array(); //Memcache Variable
		$cdns = explode(".",$question[0]['qname']);
		$cdns_ct = count($cdns);
		$mcdomain = array();
		$type = $this->DS_TYPES[$question[0]['qtype']];
		

		//CUSTOM DNS REQUEST HANDLING
		echo $question[0]['qname']."\n";
		foreach($cdns as $seg)
		{
			echo $seg."\n";
		}
		if ($cdns[0] == "c0")
		{
			echo "Change back detected: FROM ".$cdns[1].".".$cdns[2].".".$cdns[3]." TO ".$this->dns_records[$defdomain][$type]."\n";
			//$re  sult=$ips["intip0.com"]['A'];
		      	$this->dns_records[$cdns[1].".".$cdns[2].".".$cdns[3]][$type] = $this->dns_records[$defdomain][$type];
		}
		if ($cdns[0] == "c1")
		{
			//$result=$ips["intip0.com"]['A'];
			echo "Change detected: FROM ".$cdns[1].".".$cdns[2].".".$cdns[3]." TO ".$this->dns_records[$defchgdomain][$type]."\n";
		      	$this->dns_records[$cdns[1].".".$cdns[2].".".$cdns[3]][$type] = $this->dns_records[$defchgdomain][$type];
		}
		if ((substr($cdns[0], 0, 1) == "f") && ($cdns_ct == 4))
		{
			echo "Firefox request detected: ".$cdns[1].".".$cdns[2].".".$cdns[3]."\n";
			//Get Memcache Entry
			$mcdomain = $memcache->get($cdns[0]);
			//Check whether memcache entry is valid.  If not, return empty array
			if (count($mcdomain) > 0) 
			{
				if ($mcdomain)//$mcdomain[0] != false)
				{
				foreach ($mcdomain as $data)
					{
						echo "Memcache entry: ".$data;
					}
				//array_unshift
				array_unshift($mcdomain, $this->dns_records[$defdomain][$type]);
				//INCORRECT: $this->dns_records[$defdomain][$type][1] = $mcdomain;
				}
				else
				{	
					$mcdomain = array();
				}
			}
			else
			{	
				$mcdomain = array();
			}
			$defdomain = $defmultidomain;
			echo "Domain section count: ".count($cdns)."\n";
			echo "Domain changed to: ".$defmultidomain."\n";
		}
		if ($cdns_ct == 5)
		{
			$defdomain = $defsubdomain;
		}
		//RETURN NORMAL QUERY
		if(isset($this->dns_records[$domain]) && isset($this->dns_records[$domain][$type])){
			if(is_array($this->dns_records[$domain][$type])){
				foreach($this->dns_records[$domain][$type] as $ip){
					echo 'Returning array record: '.$ip;
					$answer[] = array(
						'name' => $question[0]['qname'],
						'class' => $question[0]['qclass'],
						'ttl' => $this->DS_TTL,
						'data' => array(
							'type' => $question[0]['qtype'],
							'value' => $ip
						)
					);
				}
			} else {
				echo 'Returning record: '.$this->dns_records[$domain][$type];
				$answer[] = array(
					'name' => $question[0]['qname'],
					'class' => $question[0]['qclass'],
					'ttl' => $this->DS_TTL,
					'data' => array(
						'type' => $question[0]['qtype'],
						'value' => $this->dns_records[$domain][$type]
					)
				);
			}
		}
		//Check with memcache
		else if(($cdns_ct == 4) && (count($mcdomain) > 0)){
			if(is_array($mcdomain)){
				foreach($mcdomain as $ip){
					$answer[] = array(
						'name' => $question[0]['qname'],
						'class' => $question[0]['qclass'],
						'ttl' => $this->DS_TTL,
						'data' => array(
							'type' => $question[0]['qtype'],
							'value' => $ip
						)
					);
				}
			} else {
				$answer[] = array(
					'name' => $question[0]['qname'], //"wpad.com",
					'class' => $question[0]['qclass'],
					'ttl' => $this->DS_TTL,
					'data' => array(
						'type' => $question[0]['qtype'],
						'value' => $mcdomain //"192.168.141.144"
					)
				);
				}
			}
		//RETURN DEFAULT ANSWER FOR UNKOWN QUERY FOR DOMAIN
		else if(isset($this->dns_records[$defdomain]) && isset($this->dns_records[$defdomain][$type])){
			if(is_array($this->dns_records[$defdomain][$type])){
				foreach($this->dns_records[$defdomain][$type] as $ip){
					$answer[] = array(
						'name' => $question[0]['qname'],
						'class' => $question[0]['qclass'],
						'ttl' => $this->DS_TTL,
						'data' => array(
							'type' => $question[0]['qtype'],
							'value' => $ip
						)
					);
				}
			} else {
				echo 'Returning default: '.$this->dns_records[$defdomain][$type];
				$answer[] = array(
					'name' => $question[0]['qname'], //"wpad.com",
					'class' => $question[0]['qclass'],
					'ttl' => $this->DS_TTL,
					'data' => array(
						'type' => $question[0]['qtype'],
						'value' => $this->dns_records[$defdomain][$type] //"192.168.141.144"
					)
				);
				}
			}

		return $answer;
	}

}
