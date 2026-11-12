<?php

namespace App\Models;

use CodeIgniter\Model;

class EditionModel extends Model
{
    protected $table         = 'editions';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['slug', 'name', 'price', 'is_active', 'sort'];
}
