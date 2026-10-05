/** The test database, created by docker/init-test-db.sql. Never the development database. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://proposal:proposal@localhost:5442/proposal_builder_test';
