import { faker } from '@faker-js/faker';
import { db } from './index.js';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Customer Support', 'Legal', 'IT'];
const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'];
const COUNTRIES: { country: string; currency: string; base: [number, number] }[] = [
  { country: 'US', currency: 'USD', base: [55000, 220000] },
  { country: 'UK', currency: 'GBP', base: [30000, 130000] },
  { country: 'India', currency: 'INR', base: [500000, 4500000] },
  { country: 'Germany', currency: 'EUR', base: [40000, 150000] },
  { country: 'Canada', currency: 'CAD', base: [50000, 190000] },
  { country: 'Australia', currency: 'AUD', base: [55000, 200000] },
  { country: 'Singapore', currency: 'SGD', base: [45000, 180000] },
  { country: 'Brazil', currency: 'BRL', base: [60000, 350000] },
];
const LEVEL_MULTIPLIER: Record<string, number> = {
  Junior: 0.6, Mid: 0.8, Senior: 1.0, Lead: 1.2, Manager: 1.4, Director: 1.8,
};

const EMPLOYEE_COUNT = Number(process.env.SEED_COUNT || 10000);

function randomBaseSalary(range: [number, number], level: string) {
  const [min, max] = range;
  const mid = min + (max - min) * 0.35;
  const value = faker.number.int({ min, max: Math.round(mid) }) * LEVEL_MULTIPLIER[level];
  return Math.round(value / 100) * 100;
}

function run() {
  db.exec('DELETE FROM salary_records; DELETE FROM employees;');

  const insertEmployee = db.prepare(`
    INSERT INTO employees (employee_code, first_name, last_name, email, gender, department, job_title, level, country, currency, employment_type, manager_id, date_of_joining, status)
    VALUES (@employee_code, @first_name, @last_name, @email, @gender, @department, @job_title, @level, @country, @currency, @employment_type, @manager_id, @date_of_joining, @status)
  `);
  const insertSalary = db.prepare(`
    INSERT INTO salary_records (employee_id, base_salary, bonus, currency, effective_date, reason)
    VALUES (@employee_id, @base_salary, @bonus, @currency, @effective_date, @reason)
  `);

  const seedAll = db.transaction(() => {
    const managerPool: number[] = [];

    for (let i = 1; i <= EMPLOYEE_COUNT; i++) {
      const countryInfo = faker.helpers.arrayElement(COUNTRIES);
      const department = faker.helpers.arrayElement(DEPARTMENTS);
      const level = i <= 50 ? faker.helpers.arrayElement(['Manager', 'Director']) : faker.helpers.arrayElement(LEVELS);
      const gender = faker.helpers.arrayElement(['male', 'female', 'non_binary']);
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const joinDate = faker.date.between({ from: '2015-01-01', to: '2026-01-01' });
      const managerId = managerPool.length && i > 50 ? faker.helpers.arrayElement(managerPool) : null;

      const result = insertEmployee.run({
        employee_code: `EMP${String(i).padStart(5, '0')}`,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName}.${lastName}.${i}@acme-corp.com`.toLowerCase(),
        gender,
        department,
        job_title: `${level} ${department} Specialist`,
        level,
        country: countryInfo.country,
        currency: countryInfo.currency,
        employment_type: faker.helpers.weightedArrayElement([
          { value: 'full_time', weight: 9 },
          { value: 'contract', weight: 1 },
        ]),
        manager_id: managerId,
        date_of_joining: joinDate.toISOString().slice(0, 10),
        status: faker.helpers.weightedArrayElement([
          { value: 'active', weight: 95 },
          { value: 'inactive', weight: 5 },
        ]),
      });

      const employeeId = result.lastInsertRowid as number;
      if (['Manager', 'Director'].includes(level)) managerPool.push(employeeId);

      const startSalary = randomBaseSalary(countryInfo.base, level);
      insertSalary.run({
        employee_id: employeeId,
        base_salary: startSalary,
        bonus: Math.round(startSalary * 0.05),
        currency: countryInfo.currency,
        effective_date: joinDate.toISOString().slice(0, 10),
        reason: 'Initial salary',
      });

      if (faker.datatype.boolean({ probability: 0.4 })) {
        const raiseDate = faker.date.between({ from: joinDate, to: '2026-01-01' });
        const raisedSalary = Math.round((startSalary * faker.number.float({ min: 1.05, max: 1.25 })) / 100) * 100;
        insertSalary.run({
          employee_id: employeeId,
          base_salary: raisedSalary,
          bonus: Math.round(raisedSalary * 0.07),
          currency: countryInfo.currency,
          effective_date: raiseDate.toISOString().slice(0, 10),
          reason: 'Annual raise',
        });
      }

      if (i % 1000 === 0) console.log(`Seeded ${i}/${EMPLOYEE_COUNT} employees`);
    }
  });

  seedAll();
  console.log(`Done. Seeded ${EMPLOYEE_COUNT} employees.`);
}

run();