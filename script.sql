DROP TABLE payments CASCADE CONSTRAINTS;
DROP TABLE customers CASCADE CONSTRAINTS;
DROP TABLE books CASCADE CONSTRAINTS;
DROP TABLE users CASCADE CONSTRAINTS;
DROP TABLE winner CASCADE CONSTRAINTS;

SELECT * FROM users;
SELECT * FROM books;
SELECT * FROM customers;
SELECT * FROM payments;
SELECT * FROM winner;
SELECT * From AUDIT_LOGS;

describe users;
describe books;
describe customers;
describe payments;
describe winner;

SELECT dbtimezone, sessiontimezone FROM dual;

-- edit the payment_date column to minus 1 month for testing purpose to get some data for yesterday for a better dashboard view where id  = 14 '2025-10-17T02:46:46.673603+05:30' - 1 day
UPDATE payments SET payment_date = payment_date - INTERVAL '1' month where id = 20;

UPDATE payments SET payment_date = payment_date - INTERVAL '32' DAY where id = 20;

DELETE FROM payments WHERE id = 14;
COMMIT;

-- create a user for project luckydraw with necessary privileges as similar to user hr
CREATE USER luckydraw IDENTIFIED BY Luckydraw123;
GRANT CONNECT, RESOURCE, DBA TO luckydraw;
GRANT CREATE SESSION TO luckydraw;
GRANT CREATE TABLE TO luckydraw;
GRANT CREATE VIEW, CREATE PROCEDURE, CREATE SEQUENCE TO luckydraw;
GRANT UNLIMITED TABLESPACE TO luckydraw;
GRANT CREATE MATERIALIZED VIEW TO luckydraw;
GRANT CREATE TRIGGER, CREATE SYNONYM TO luckydraw;
GRANT CREATE DATABASE LINK TO luckydraw;
GRANT GLOBAL QUERY REWRITE TO luckydraw;
GRANT SELECT ANY TABLE TO luckydraw;