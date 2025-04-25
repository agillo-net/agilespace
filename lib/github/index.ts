/**
 * Re-export all GitHub client and server modules
 * This allows for easier imports like:
 * import { client } from '@/lib/github' 
 */

import * as clientModule from './client';
import * as serverModule from './server';
import * as helpersModule from './helpers';
import * as typesModule from './types';

export const client = clientModule;
export const server = serverModule;
export const helpers = helpersModule;
export const types = typesModule;

// Export all types directly for easier imports
export * from './types';
