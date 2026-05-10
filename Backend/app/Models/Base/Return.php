<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\SaleDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Return
 *  
 * @property uuid $id
 * @property uuid|null $sale_detail_id
 * @property int|null $quantity
 * @property string|null $reason
 * @property Carbon|null $created_at
 * 
 * @property SaleDetail|null $sale_detail
 *
 * @package App\Models\Base
 */
class Returns extends Model
{
	protected $table = 'returns';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'quantity' => 'int'
	];

	public function sale_detail()
	{
		return $this->belongsTo(SaleDetail::class);
	}
}
