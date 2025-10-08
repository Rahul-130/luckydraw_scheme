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

describe books

-- alter user table add columns name phoneno email
ALTER TABLE users ADD (name VARCHAR2(255), phone VARCHAR2(20));

--

-- delete records from customers where name is 'cust4'
DELETE FROM customers WHERE name = 'cust4';

-- commit the transaction
COMMIT;

UPDATE customers set customers.IS_FROZEN = 0 where customers.IS_FROZEN = 1;

SELECT s.sid, s.serial# FROM v$session s WHERE s.lockwait IS NOT NULL;

-- alter table payments add column receipt_no VARCHAR2(255);
ALTER TABLE payments ADD (receipt_no VARCHAR2(255));
-- alter table payments delete column receipt_no VARCHAR2(255);
ALTER TABLE customers DROP COLUMN IS_WINNER;

--Add the is_winner column
ALTER TABLE customers ADD (is_winner NUMBER(1) DEFAULT 0 NOT NULL);

-- Add created_at column to customers table
ALTER TABLE customers ADD (created_at DATE);


SELECT 
  ID, 
  START_MONTH_ISO, 
  TO_DATE(START_MONTH_ISO, 'YYYY-MM') AS START_DATE,
  TRUNC(SYSDATE, 'MM') AS CURRENT_MONTH,
  MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TO_DATE(START_MONTH_ISO, 'YYYY-MM')) AS MONTH_DIFF
FROM books
WHERE ID = 5;

