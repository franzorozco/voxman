<?php
$columns = Schema::getColumnListing('carts');
echo "COLUMNS: " . json_encode($columns) . "\n";
