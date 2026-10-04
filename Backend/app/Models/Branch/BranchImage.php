<?php

namespace App\Models\Branch;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BranchImage extends Model
{
    use HasUuids;

    protected $table = 'branch_images';
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'branch_id',
        'image_url',
        'is_primary',
        'display_order'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'display_order' => 'integer'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
