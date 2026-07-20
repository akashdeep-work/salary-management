import { Router } from 'express';
import { getSummary, getByDepartment, getByCountry, getByGender, getSalaryBands } from '../services/analyticsService.js';

export const analyticsRouter = Router();

analyticsRouter.get('/summary', (req, res) => res.json(getSummary()));
analyticsRouter.get('/by-department', (req, res) => res.json(getByDepartment()));
analyticsRouter.get('/by-country', (req, res) => res.json(getByCountry()));
analyticsRouter.get('/by-gender', (req, res) => res.json(getByGender()));
analyticsRouter.get('/salary-bands', (req, res) => res.json(getSalaryBands()));