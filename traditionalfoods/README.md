# Backend setup

The Django API uses the local SQLite database by default. From the repository
root, run these commands in PowerShell:

```powershell
Set-Location traditionalfoods
..\env\Scripts\python.exe manage.py migrate
..\env\Scripts\python.exe manage.py createsuperuser
..\env\Scripts\python.exe manage.py runserver
```

The admin account is created interactively; no administrator password is
hard-coded. Use the Django admin at `http://127.0.0.1:8000/admin/`.

For Razorpay, configure **test-mode** credentials in the same PowerShell
session before starting Django. Never commit or share the secret:

```powershell
$env:RAZORPAY_KEY_ID = "your_test_key_id"
$env:RAZORPAY_KEY_SECRET = "your_test_key_secret"
$env:RAZORPAY_WEBHOOK_SECRET = "your_test_webhook_secret"
```

For a deployed environment, also set `DJANGO_SECRET_KEY`,
`DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` to
that environment's real values. The checked-in defaults are for local
development only. Configure the Razorpay webhook endpoint at
`/payments/razorpay/webhook/` for the `payment.captured` and `order.paid`
events. Test payment success, failure, and refund handling before accepting
live payments; refunds are not automated by this application.

The frontend API origin is configured with `VITE_API_BASE_URL`; see
`frontend/.env.example`.
