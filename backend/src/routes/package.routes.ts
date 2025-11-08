import { Hono } from 'hono';
import { getPackages, getPackageById } from '../controllers/package.controller';

const packageRoutes = new Hono();

// Get all packages
packageRoutes.get('/', getPackages);

// Get package by ID
packageRoutes.get('/:id', getPackageById);

export default packageRoutes;
