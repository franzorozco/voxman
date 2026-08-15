<?php
require 'e:/Trabajo/Sistema de VOXman/Sistema/Backend/vendor/autoload.php';
$app = require_once 'e:/Trabajo/Sistema de VOXman/Sistema/Backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = App\Models\Logistics\DeliverySchedule::with([
    'shipment.sale.sale_details.product_variant.product.attribute_value_images',
    'shipment.sale.sale_details.product_variant.variant_images',
    'shipment.sale.sale_details.product_variant.variant_attribute_values'
])->find('01a00474-48dd-722a-9808-bbc269bdb6e0');

if ($s && $s->shipment && $s->shipment->sale && $s->shipment->sale->sale_details->count() > 0) {
    echo json_encode($s->shipment->sale->sale_details->first()->product_variant->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "Not found";
}
