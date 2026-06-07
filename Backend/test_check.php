<?php
$checks = DB::select("SELECT conname, pg_get_expr(conbin, conrelid) AS definition FROM pg_constraint WHERE conrelid = 'inventory_movements'::regclass");
echo json_encode($checks);
