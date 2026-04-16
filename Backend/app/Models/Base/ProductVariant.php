<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\SaleDetail;
use App\Models\StockReservation;
use App\Models\VariantAttributeValue;
use App\Models\VariantImage;
use App\Models\VariantMeasurement;
use App\Models\VariantSize;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class ProductVariant
 * 
 * @property uuid $id
 * @property uuid|null $product_id
 * @property string $sku
 * @property string|null $barcode
 * @property float|null $weight
 * @property float|null $price
 * @property float|null $cost
 * @property bool|null $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Product|null $product
 * @property Collection|CartItem[] $cart_items
 * @property Collection|ProductPriceHistory[] $product_price_histories
 * @property Collection|VariantAttributeValue[] $variant_attribute_values
 * @property Collection|VariantSize[] $variant_sizes
 * @property Collection|VariantMeasurement[] $variant_measurements
 * @property Collection|VariantImage[] $variant_images
 * @property Collection|Inventory[] $inventories
 * @property Collection|InventoryMovement[] $inventory_movements
 * @property Collection|SaleDetail[] $sale_details
 * @property Collection|StockReservation[] $stock_reservations
 *
 * @package App\Models\Base
 */
class ProductVariant extends Model
{
	use SoftDeletes;
	protected $table = 'product_variants';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid',
		'product_id' => 'uuid',
		'weight' => 'float',
		'price' => 'float',
		'cost' => 'float',
		'is_active' => 'bool'
	];

	public function product()
	{
		return $this->belongsTo(Product::class);
	}

	public function cart_items()
	{
		return $this->hasMany(CartItem::class, 'variant_id');
	}

	public function product_price_histories()
	{
		return $this->hasMany(ProductPriceHistory::class, 'variant_id');
	}

	public function variant_attribute_values()
	{
		return $this->hasMany(VariantAttributeValue::class, 'variant_id');
	}

	public function variant_sizes()
	{
		return $this->hasMany(VariantSize::class, 'variant_id');
	}

	public function variant_measurements()
	{
		return $this->hasMany(VariantMeasurement::class, 'variant_id');
	}

	public function variant_images()
	{
		return $this->hasMany(VariantImage::class, 'variant_id');
	}

	public function inventories()
	{
		return $this->hasMany(Inventory::class, 'variant_id');
	}

	public function inventory_movements()
	{
		return $this->hasMany(InventoryMovement::class, 'variant_id');
	}

	public function sale_details()
	{
		return $this->hasMany(SaleDetail::class, 'variant_id');
	}

	public function stock_reservations()
	{
		return $this->hasMany(StockReservation::class, 'variant_id');
	}
}
