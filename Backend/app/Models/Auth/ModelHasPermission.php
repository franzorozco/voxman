<?php

namespace App\Models\Auth;

use App\Models\Base\ModelHasPermission as BaseModelHasPermission;

    
class ModelHasPermission extends BaseModelHasPermission
{
    use \App\Traits\Auditable;
}
