<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Core\Address;
use App\Models\Sales\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Shipment
 * 
 * @property uuid $id
 * @property uuid|null $sale_id
 * @property uuid|null $address_id
 * @property string|null $status
 * @property string|null $tracking_code
 * @property Carbon|null $shipped_at
 * @property Carbon|null $delivered_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Sale|null $sale
 * @property Address|null $address
 *
 * @package App\Models\Base
 */
class Shipment extends Model
{
	use SoftDeletes;
	protected $table = 'shipments';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'shipped_at' => 'datetime',
		'delivered_at' => 'datetime'
	];

	public function sale()
	{
		return $this->belongsTo(Sale::class);
	}

	public function address()
	{
		return $this->belongsTo(Address::class);
	}
}
