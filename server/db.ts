// Database connection is now managed in server/models/index.ts
// This file is a convenience wrapper for importing the database

import db from './models/index';

// Export the db object for use in the rest of the application
export { db };
