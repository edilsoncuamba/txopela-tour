# Txopela Tour - Backend API

Backend Django REST API for Txopela Tour - A collaborative tourism platform for Inhambane, Mozambique.

## 🚀 Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: Custom user model with profile management
- **Locations**: CRUD operations for tourist locations with categories
- **Reviews**: Rating and review system with helpful votes
- **Notifications**: Real-time notification system
- **Social Features**: Follow/unfollow users, save/like locations

## 📁 Project Structure

```
backend/
├── txopela_api/          # Main Django project
│   ├── settings.py       # Django settings
│   ├── urls.py           # URL routing
│   ├── wsgi.py           # WSGI config
│   └── asgi.py           # ASGI config
├── users/                # User management app
│   ├── models.py         # Custom User model
│   ├── serializers.py    # API serializers
│   ├── views.py          # API views
│   └── urls.py           # URL patterns
├── locations/            # Location management app
├── reviews/              # Review system app
├── notifications/        # Notification system app
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Setup Database

For PostgreSQL:
```bash
# Create database
createdb txopela_db

# Create user
createuser -P txopela_user
```

For SQLite (development):
```bash
# Set in .env:
USE_SQLITE=True
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Server

```bash
python manage.py runserver
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login with email/password |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/verify/` | Verify token validity |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Register new user |
| GET | `/api/users/me/` | Get current user profile |
| PUT | `/api/users/me/update/` | Update user profile |
| POST | `/api/users/me/change-password/` | Change password |
| GET | `/api/users/` | List all users |
| GET | `/api/users/<id>/` | Get user details |
| POST | `/api/users/<id>/follow/` | Follow/unfollow user |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations/` | List all locations |
| POST | `/api/locations/create/` | Create new location |
| GET | `/api/locations/<id>/` | Get location details |
| PUT | `/api/locations/<id>/update/` | Update location |
| DELETE | `/api/locations/<id>/delete/` | Delete location |
| POST | `/api/locations/<id>/save/` | Save/unsave location |
| POST | `/api/locations/<id>/like/` | Like/unlike location |
| GET | `/api/locations/saved/` | Get saved locations |
| GET | `/api/locations/trending/` | Get trending locations |
| GET | `/api/locations/nearby/` | Get nearby locations |
| GET | `/api/locations/categories/` | List categories |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/location/<id>/` | Get location reviews |
| POST | `/api/reviews/create/` | Create review |
| PUT | `/api/reviews/<id>/update/` | Update review |
| DELETE | `/api/reviews/<id>/delete/` | Delete review |
| POST | `/api/reviews/<id>/helpful/` | Mark as helpful |
| POST | `/api/reviews/<id>/reply/` | Reply to review |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | List notifications |
| GET | `/api/notifications/unread/` | Get unread notifications |
| GET | `/api/notifications/count/` | Get notification count |
| POST | `/api/notifications/<id>/read/` | Mark as read |
| POST | `/api/notifications/mark-all-read/` | Mark all as read |
| GET | `/api/notifications/preferences/` | Get preferences |
| PUT | `/api/notifications/preferences/` | Update preferences |

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication.

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Using the Token

Include the access token in the Authorization header:

```bash
curl http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## 📝 Models

### User
- UUID primary key
- Email-based authentication
- Profile fields: avatar, bio, location
- User types: traveler, guide, business
- Social stats: followers, following, posts

### Location
- UUID primary key
- Name, description, category
- Address with coordinates (lat/lng)
- Multiple images (JSON array)
- Rating and review counts
- Author relationship
- Approval status

### Review
- UUID primary key
- Location and user relationships
- Rating (1-5 stars)
- Comment text
- Approval status
- Images support

### Notification
- UUID primary key
- Recipient and sender
- Type: like, comment, save, follow, approval, mention, reply
- Related objects (location, review)
- Read status with timestamp

## 🧪 Testing

```bash
# Run tests
python manage.py test

# Run with coverage
 coverage run manage.py test
 coverage report
```

## 🚀 Deployment

### Using Gunicorn

```bash
gunicorn txopela_api.wsgi:application --bind 0.0.0.0:8000
```

### Environment Variables for Production

```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
DB_HOST=your-db-host
DB_PASSWORD=your-db-password
ALLOWED_HOSTS=your-domain.com
```

## 📄 License

MIT License
