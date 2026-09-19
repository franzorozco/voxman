<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Discount\Discount;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Class SaleAppliedDiscount
 * 
 * @property string $id
 * @property string $sale_id
 * @property string $sale_detail_id
 * @property string $discount_id
 * @property float $discount_amount
 * @property Carbon|null $created_at
 * 
 * @property Sale $sale
 * @property SaleDetail $sale_detail
 * @property Discount $discount
 *
 * @package App\Models\Base
 */
class SaleAppliedDiscount extends Model
{
	protected $table = 'sale_applied_discounts';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'discount_amount' => 'float',
	];

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($model) {
			if (!$model->id) {
				$model->id = (string) Str::uuid();
			}
		});
	}

	public function sale()
	{
		return $this->belongsTo(Sale::class);
	}

	public function sale_detail()
	{
		return $this->belongsTo(SaleDetail::class);
	}

	public function discount()
	{
		return $this->belongsTo(Discount::class);
	}
}
