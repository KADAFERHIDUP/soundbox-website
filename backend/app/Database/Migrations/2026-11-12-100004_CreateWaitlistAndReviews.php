<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateWaitlistAndReviews extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name'       => ['type' => 'VARCHAR', 'constraint' => 80],
            'contact'    => ['type' => 'VARCHAR', 'constraint' => 120],
            'variant'    => ['type' => 'VARCHAR', 'constraint' => 40, 'null' => true],
            'notified'   => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'ip'         => ['type' => 'VARCHAR', 'constraint' => 45, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('contact');
        $this->forge->createTable('waitlist');

        $this->forge->addField([
            'id'          => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'preorder_id' => ['type' => 'INT', 'unsigned' => true],
            'name'        => ['type' => 'VARCHAR', 'constraint' => 80],
            'variant'     => ['type' => 'VARCHAR', 'constraint' => 40],
            'rating'      => ['type' => 'TINYINT', 'unsigned' => true],
            'body'        => ['type' => 'TEXT'],
            'status'      => ['type' => 'VARCHAR', 'constraint' => 10, 'default' => 'baru'],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
            'updated_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('preorder_id');
        $this->forge->createTable('reviews');
    }

    public function down()
    {
        $this->forge->dropTable('reviews');
        $this->forge->dropTable('waitlist');
    }
}
