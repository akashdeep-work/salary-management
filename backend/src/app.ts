import express from 'express';
import cors from 'cors';
import { employeesRouter } from './routes/employees.js';
import { analyticsRouter } from './routes/analytics.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/employees', employeesRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}