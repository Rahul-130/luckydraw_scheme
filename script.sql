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


-- amount_cash NUMBER DEFAULT 0,
--       amount_online NUMBER DEFAULT 0,
--       amount_instore NUMBER DEFAULT 0,


-- alter table payments add (amount_cash NUMBER DEFAULT 0);
-- alter table payments add (amount_online NUMBER DEFAULT 0);
-- alter table payments add (amount_instore NUMBER DEFAULT 0
-- );
ALTER TABLE payments ADD (amount_cash NUMBER DEFAULT 0);
ALTER TABLE payments ADD (amount_online NUMBER DEFAULT 0);
ALTER TABLE payments ADD (amount_instore NUMBER DEFAULT 0);
commit;

SELECT * FROM books;
ALTER TABLE books ADD total_amount NUMBER DEFAULT 0;
-- delete the existing data in books table to avoid any issue with the new column total_amount which is not null
DELETE FROM WINNER;
COMMIT;

-- Can you update the dashboard to show a chart of payments collected by each agent?
-- How can I filter the payments list by agent name?

-- add a new column agent_name to payments table to store the name of the agent who collected the payment
ALTER TABLE payments ADD (agent_name VARCHAR2(255));
COMMIT;

-- Add settled_date to customers to track when the account was closed/settled
ALTER TABLE customers ADD (settled_date TIMESTAMP);

ALTER TABLE customers ADD bonus_amount NUMBER DEFAULT 0;
COMMIT;

select * from customers;

ALTER TABLE customers ADD settlement_agent_name VARCHAR2(255);
COMMIT;

select username, account_status from dba_users where username = 'INFA_DOM';
ALTER user INFA_DOM IDENTIFIED BY INFA_DOM;
COMMIT;

select * from customers;
UPDATE users SET IS_2FA_ENABLED = 0 where username = 'test';
COMMIT;

-- update users set is_2fa_enabled = 1 where username = 'test';
UPDATE PAYMENTS SET AGENT_NAME = 'RAHUL' where AGENT_NAME = 'Rahul';
COMMIT;

SELECT dbtimezone, sessiontimezone FROM dual;