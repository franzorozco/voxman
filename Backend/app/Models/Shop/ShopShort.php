<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Catalog\Product;
use App\Models\Catalog\Category;

class ShopShort extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'shop_shorts';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'video_url',
        'product_id',
        'category_id',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get the product associated with the short.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the category associated with the short.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
