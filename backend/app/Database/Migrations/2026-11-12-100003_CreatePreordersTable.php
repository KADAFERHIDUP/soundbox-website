<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePreordersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'code'         => ['type' => 'VARCHAR', 'constraint' => 20],
            'variant_id'   => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'variant_name' => ['type' => 'VARCHAR', 'constraint' => 40],
            'edition_name' => ['type' => 'VARCHAR', 'constraint' => 40],
            'unit_price'   => ['type' => 'INT', 'unsigned' => true],
            'qty'          => ['type' => 'INT', 'unsigned' => true],
            'total'        => ['type' => 'INT', 'unsigned' => true],
            'name'         => ['type' => 'VARCHAR', 'constraint' => 80],
            'phone'        => ['type' => 'VARCHAR', 'constraint' => 20],
            'email'        => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
            'address'      => ['type' => 'TEXT'],
            'city'         => ['type' => 'VARCHAR', 'constraint' => 60],
            'pay'          => ['type' => 'VARCHAR', 'constraint' => 20],
            'note'         => ['type' => 'VARCHAR', 'constraint' => 300, 'null' => true],
            'status'       => ['type' => 'VARCHAR', 'constraint' => 12, 'default' => 'menunggu'],
            'tracking'     => ['type' => 'VARCHAR', 'constraint' => 60, 'null' => true],
            'ip'           => ['type' => 'VARCHAR', 'constraint' => 45, 'null' => true],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('code');
        $this->forge->addKey('status');
        $this->forge->createTable('preorders');
    }

    public function down()
    {
        $this->forge->dropTable('preorders');
    }
}
