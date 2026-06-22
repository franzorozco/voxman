<?php
try { 
    $ctrl = new \App\Http\Controllers\Api\Admin\ExpenseController(); 
    $req = new \Illuminate\Http\Request(); 
    $req->merge(['name' => 'Alquiler', 'amount' => 1550, 'expense_date' => '2026-06-30', 'category' => 'Alquiler', 'status' => 'pending', 'split_type' => 'equal']); 
    print_r($ctrl->store($req)->getContent()); 
} catch(\Exception $e) { 
    echo $e->getMessage(); 
}
