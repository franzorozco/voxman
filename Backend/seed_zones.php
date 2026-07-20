
use App\Models\Logistics\DeliveryZone;
$zones = [
    ["name" => "Plaza Principal 14 de Septiembre", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Plaza Colón", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Plaza de las Banderas", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Cine Center", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Terminal de Buses", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Estadio Félix Capriles", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
    ["name" => "Hupermall", "city" => "Cochabamba", "base_cost" => 0, "extra_cost_per_km" => 0],
];
foreach($zones as $z) {
    DeliveryZone::firstOrCreate(["name" => $z["name"]], $z);
}
echo "Seeded zones.\n";

