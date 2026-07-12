<?php

namespace App\Models\Catalog;

use App\Models\Base\Category as BaseCategory;

class Category extends BaseCategory
{
    use \App\Traits\Auditable;
    
	protected $fillable = [
		'name',
		'parent_id'
	];
}
 