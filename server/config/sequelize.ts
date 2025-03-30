import { Dialect } from 'sequelize';

interface SequelizeConfig {
  use_env_variable: string;
  dialect: Dialect;
  seederStorage: string;
  dialectOptions: {
    ssl: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
  migrationStorageTableName?: string;
  migrationStorage?: string;
}

interface Config {
  development: SequelizeConfig;
  production: SequelizeConfig;
}

const config: Config = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

export default config;
export const development = config.development;
export const production = config.production;