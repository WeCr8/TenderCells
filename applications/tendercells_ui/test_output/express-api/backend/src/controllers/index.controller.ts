// index.controller.ts
import { Request, Response } from 'express';

export async function index(req: Request, res: Response) {
  res.json({ message: 'TenderCells API' });
}
