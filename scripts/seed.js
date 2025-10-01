const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const seedData = {
  users: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Анна Иванова',
      username: 'anna_iv',
      avatar: '/2.jpg',
      role: 'director',
      position: 'Директор',
      email: 'anna@company.com',
      phone: '+7 (999) 123-45-67'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Алексей Петров',
      username: 'alex_petr',
      avatar: '/7.jpg',
      role: 'employee',
      position: 'Специалист по закупкам',
      email: 'alex.petrov@company.com',
      phone: '+7 (999) 123-45-68'
    }
  ],
  businessProcesses: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Стратегическое управление',
      description: 'Процессы принятия ключевых решений и управления компанией',
      creator_id: '550e8400-e29b-41d4-a716-446655440001'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Закупки и снабжение',
      description: 'Полный цикл закупок: планирование, заказ, контроль поставок',
      creator_id: '550e8400-e29b-41d4-a716-446655440001'
    }
  ],
  tasks: [
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      title: 'Утвердить бюджет на 2025 год',
      description: 'Рассмотреть предложения департаментов, внести корректировки, принять окончательное решение по бюджету компании на следующий год.',
      priority: 1,
      status: 'in_progress',
      type: 'one_time',
      creator_id: '550e8400-e29b-41d4-a716-446655440001',
      responsible_id: '550e8400-e29b-41d4-a716-446655440001',
      process_id: '550e8400-e29b-41d4-a716-446655440010',
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      tags: ['бюджет', 'стратегия'],
      estimated_hours: 2.0
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      title: 'Провести приемку нового оборудования',
      description: 'Необходимо провести полную приемку закупленного оборудования для производственной линии.',
      priority: 2,
      status: 'new',
      type: 'one_time',
      creator_id: '550e8400-e29b-41d4-a716-446655440001',
      responsible_id: '550e8400-e29b-41d4-a716-446655440002',
      process_id: '550e8400-e29b-41d4-a716-446655440011',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      tags: ['приемка', 'оборудование'],
      estimated_hours: 3.0
    }
  ]
};

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    await client.query('BEGIN');
    
    // Clear existing data
    console.log('Clearing existing data...');
    const tablesToClear = [
      'checklist_items',
      'history_entries',
      'comments',
      'task_observers',
      'task_assignees',
      'tasks',
      'business_processes',
      'users'
    ];
    
    for (const table of tablesToClear) {
      await client.query(`DELETE FROM ${table}`);
    }
    
    // Insert users
    console.log('Inserting users...');
    for (const user of seedData.users) {
      await client.query(`
        INSERT INTO users (id, name, username, avatar, role, position, email, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [user.id, user.name, user.username, user.avatar, user.role, user.position, user.email, user.phone, true]);
    }
    
    // Insert business processes
    console.log('Inserting business processes...');
    for (const process of seedData.businessProcesses) {
      await client.query(`
        INSERT INTO business_processes (id, name, description, creator_id, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [process.id, process.name, process.description, process.creator_id, true]);
    }
    
    // Insert tasks
    console.log('Inserting tasks...');
    for (const task of seedData.tasks) {
      await client.query(`
        INSERT INTO tasks (id, title, description, priority, status, type, creator_id, responsible_id, process_id, due_date, tags, estimated_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        task.id, task.title, task.description, task.priority, task.status, task.type,
        task.creator_id, task.responsible_id, task.process_id, task.due_date, task.tags, task.estimated_hours
      ]);
      
      // Add task assignees
      await client.query(`
        INSERT INTO task_assignees (task_id, user_id)
        VALUES ($1, $2)
      `, [task.id, task.responsible_id]);
      
      // Add history entry
      await client.query(`
        INSERT INTO history_entries (task_id, action_type, user_id, description)
        VALUES ($1, $2, $3, $4)
      `, [task.id, 'created', task.creator_id, 'Задача создана']);
    }
    
    // Add some checklist items for the second task
    console.log('Adding checklist items...');
    const checklistItems = [
      'Проверить комплектность поставки по накладным',
      'Провести визуальный осмотр на наличие повреждений',
      'Сверить технические характеристики с заявленными в договоре',
      'Оформить акт приема-передачи оборудования'
    ];
    
    for (let i = 0; i < checklistItems.length; i++) {
      await client.query(`
        INSERT INTO checklist_items (task_id, text, completed, created_by, item_order)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        '550e8400-e29b-41d4-a716-446655440021',
        checklistItems[i],
        false,
        '550e8400-e29b-41d4-a716-446655440001',
        i + 1
      ]);
    }
    
    await client.query('COMMIT');
    console.log('Database seeding completed successfully!');
    
    // Show summary
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const taskCount = await client.query('SELECT COUNT(*) FROM tasks');
    const processCount = await client.query('SELECT COUNT(*) FROM business_processes');
    
    console.log('\nSeeded data summary:');
    console.log(`- Users: ${userCount.rows[0].count}`);
    console.log(`- Tasks: ${taskCount.rows[0].count}`);
    console.log(`- Business Processes: ${processCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();