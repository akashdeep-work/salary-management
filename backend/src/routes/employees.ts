import { Router } from 'express';
import { z } from 'zod';
import {
  listEmployees, getEmployeeById, createEmployee, updateEmployee,
  addSalaryRecord, getSalaryHistory, employeeExists,
} from '../services/employeeService.js';

export const employeesRouter = Router();

employeesRouter.get('/', (req, res) => {
  const { search, department, country, status, page, pageSize } = req.query;
  const result = listEmployees({
    search: search as string | undefined,
    department: department as string | undefined,
    country: country as string | undefined,
    status: status as string | undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });
  res.json(result);
});

employeesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const employee = getEmployeeById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

const createSchema = z.object({
  employee_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  gender: z.string().optional(),
  department: z.string().min(1),
  job_title: z.string().min(1),
  level: z.string().optional(),
  country: z.string().min(1),
  currency: z.string().min(1),
  employment_type: z.string().optional(),
  manager_id: z.number().nullable().optional(),
  date_of_joining: z.string().min(1),
  starting_salary: z.number().positive(),
  starting_bonus: z.number().nonnegative().optional(),
});

employeesRouter.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const employee = createEmployee(parsed.data);
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

const updateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  job_title: z.string().optional(),
  level: z.string().optional(),
  country: z.string().optional(),
  employment_type: z.string().optional(),
  manager_id: z.number().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

employeesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!employeeExists(id)) return res.status(404).json({ error: 'Employee not found' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(updateEmployee(id, parsed.data));
});

const salarySchema = z.object({
  base_salary: z.number().positive(),
  bonus: z.number().nonnegative().optional(),
  currency: z.string().min(1),
  effective_date: z.string().min(1),
  pay_frequency: z.string().optional(),
  reason: z.string().optional(),
});

employeesRouter.post('/:id/salary', (req, res) => {
  const id = Number(req.params.id);
  if (!employeeExists(id)) return res.status(404).json({ error: 'Employee not found' });
  const parsed = salarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(201).json(addSalaryRecord(id, parsed.data));
});

employeesRouter.get('/:id/salary-history', (req, res) => {
  const id = Number(req.params.id);
  if (!employeeExists(id)) return res.status(404).json({ error: 'Employee not found' });
  res.json(getSalaryHistory(id));
});