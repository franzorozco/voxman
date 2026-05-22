<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AttributeValueImage extends Model
{
    use HasUuids;

    protected $table = 'attribute_value_images';

    protected $fillable = [
        'attribute_value_id',
        'product_id',
        'url',
        'is_main',
        'sort_order'
    ];

    public $timestamps = false; // We only have created_at according to the SQL script, let's configure properly

    // Eloquent expects created_at and updated_at. If only created_at exists:
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;
    
    protected $casts = [
        'is_main' => 'boolean',
        'sort_order' => 'integer'
    ];

    public function attributeValue()
    {
        return $this->belongsTo(AttributeValue::class, 'attribute_value_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
