<?php

namespace App\Models\Auth;

use App\Models\Base\ModelHasRole as BaseModelHasRole;

class ModelHasRole extends BaseModelHasRole
{
    use \App\Traits\Auditable;
}
