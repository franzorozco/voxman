<?php
$ch = curl_init('http://127.0.0.1:8000/api/v1/admin/supplier-returns');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer 1|something' // We might get 401, but at least we see if it's a 500 before auth or after auth.
]);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP $httpcode\n";
echo $response;
