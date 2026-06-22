<?php

use App\Models\Finance\OwnerPayment;
use App\Models\Actors\Owner;

try {
    $owner = Owner::first();
    if (!$owner) {
        die("No owners found.\n");
    }

    $payment = OwnerPayment::create([
        'owner_id' => $owner->id,
        'total_amount' => 500,
        'status' => 'paid',
        'payment_date' => now(),
        'type' => 'deposit'
    ]);

    echo "Success!\n";
    echo $payment->toJson();

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
