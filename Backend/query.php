
$result = DB::select("SELECT unnest(enum_range(NULL::delivery_type))::text as val");
dump($result);

