# Book Payments & Lucky Draw API

This backend provides APIs for managing books, customers, payments, and running lucky draws.  
Authentication is required for all main operations.

---

## Authentication

- **POST `/api/auth/signup`**  
  Register a new user.  
  **Body:** `{ email, password }`  
  **Response:** `{ token, user }`

- **POST `/api/auth/login`**  
  Login and get JWT token.  
  **Body:** `{ email, password }`  
  **Response:** `{ token, user }`

- **POST `/api/auth/change-password`**  
  Change password for logged-in user.  
  **Body:** `{ oldPassword, newPassword }`  
  **Response:** `{ message }`

- **POST `/api/auth/logout`**  
  Logout user (clears cookies).

---

## Books

- **GET `/api/books`**  
  List all books owned by the authenticated user.

- **POST `/api/books`**  
  Create a new book.  
  **Body:** `{ name, maxCustomers, startMonthIso }`  
  **Response:** Book details

- **PATCH `/api/books/:bookId/toggle`**  
  Activate or deactivate a book.

---

## Customers

- **GET `/api/books/:bookId/customers`**  
  List all customers for a book.

- **POST `/api/books/:bookId/customers`**  
  Add a customer to a book.  
  **Body:** `{ name, phone, address }`  
  **Response:** Customer details  
  **Note:** Maximum customers per book is enforced.

---

## Payments

- **POST `/api/books/:bookId/customers/:customerId/payments`**  
  Create a payment for a customer for a specific month.  
  **Body:** `{ amount, monthIso }`  
  **Response:** Payment details  
  **Note:** Only one payment per customer per monthIso per book is allowed.  
  Customers who won the lucky draw for a book cannot make further payments for that book.

- **GET `/api/books/:bookId/customers/:customerId/payments`**  
  List all payments for a customer in a book.

---

## Lucky Draw

- **POST `/api/lucky-draw`**  
  Run lucky draw for all eligible books of the authenticated user.  
  **Response:** `{ winners: [{ bookId, customerId }] }`  
  **Eligibility:**  
    - Book must be at least 2 months old.  
    - Customers must have paid for all or missed only 1 payment for eligible months.  
    - Winners are frozen for that book and marked in payments.

---

## Health & DB Check

- **GET `/api/health`**  
  Check if server is running.

- **GET `/api/db-check`**  
  Check database connectivity.

---

## Notes

- All endpoints (except `/api/auth/signup`, `/api/auth/login`, `/api/health`, `/api/db-check`) require JWT authentication.
- Dates are returned in `DD-MM-YYYY` format.
- Database: Oracle

---



### for n8n to run the backup to google drive
docker run -it -d \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  --name n8n \
  n8nio/n8n

docker run -it -d `
  --name n8n `
  -p 5678:5678 `
  -v n8n_data:/home/node/.n8n `
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true `
  -e N8N_RUNNERS_ENABLED=true `
  -e GENERIC_TIMEZONE="Asia/Kolkata" `
  -e TZ="Asia/Kolkata" `
  docker.n8n.io/n8nio/n8n
