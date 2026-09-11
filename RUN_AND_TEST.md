# How to Run and Test - Complete Instructions

## 🚀 Quick Start (5 minutes)

### Step 1: Start Backend
```bash
cd backend
python manage.py runserver
```
✅ Backend running at: http://localhost:8000

### Step 2: Start Frontend
```bash
cd app
npm run dev
```
✅ Frontend running at: http://localhost:5173

### Step 3: Login
- Email: `traveler@example.com`
- Password: `password123`
- Click "Entrar"

### Step 4: Explore Features
- Click "Home" to see posts feed
- Click "Perfil" to see your profile
- Click "Add" to create a post
- Like, comment, save posts
- Use search and filters

## 📋 Detailed Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Create Migrations
```bash
python manage.py makemigrations
```

#### 3. Apply Migrations
```bash
python manage.py migrate
```

#### 4. Create Test Data
```bash
python manage.py create_test_data.py
```

#### 5. Run Server
```bash
python manage.py runserver
```

**Expected Output**:
```
Starting development server at http://127.0.0.1:8000/
```

### Frontend Setup

#### 1. Install Dependencies
```bash
cd app
npm install
```

#### 2. Run Development Server
```bash
npm run dev
```

**Expected Output**:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

## 🧪 Testing Checklist

### Test 1: Login
- [ ] Open http://localhost:5173
- [ ] Enter email: traveler@example.com
- [ ] Enter password: password123
- [ ] Click "Entrar"
- [ ] Verify splash screen shows
- [ ] Verify home page loads

### Test 2: Home Feed
- [ ] Verify posts load
- [ ] Verify search bar works
- [ ] Verify filter buttons work
- [ ] Verify posts display correctly
- [ ] Verify author info shows

### Test 3: Like Posts
- [ ] Click heart icon on post
- [ ] Verify heart fills red
- [ ] Verify likes count increases
- [ ] Click again to unlike
- [ ] Verify heart empties
- [ ] Verify likes count decreases

### Test 4: Save Posts
- [ ] Click bookmark icon
- [ ] Verify bookmark fills blue
- [ ] Verify saves count increases
- [ ] Click again to unsave
- [ ] Verify bookmark empties
- [ ] Verify saves count decreases

### Test 5: Share Posts
- [ ] Click share icon
- [ ] Verify shares count increases
- [ ] Verify success message

### Test 6: Profile Page
- [ ] Click "Perfil" tab
- [ ] Verify profile info displays
- [ ] Verify stats show correctly
- [ ] Verify posts tab shows your posts
- [ ] Verify saved tab shows saved posts
- [ ] Verify menu button works

### Test 7: Search
- [ ] Type in search bar
- [ ] Verify posts filter
- [ ] Clear search
- [ ] Verify all posts return

### Test 8: Filters
- [ ] Click "Todos" - all posts show
- [ ] Click "Tendências" - sorted by likes
- [ ] Click "Recentes" - sorted by date
- [ ] Click "Siguiendo" - posts from followed users

### Test 9: Real-time Updates
- [ ] Like a post
- [ ] Refresh page
- [ ] Verify like persists
- [ ] Save a post
- [ ] Refresh page
- [ ] Verify save persists

### Test 10: Error Handling
- [ ] Stop backend
- [ ] Try to like post
- [ ] Verify error message
- [ ] Restart backend
- [ ] Verify functionality works

## 🔍 Debugging

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for:
# - [29/Mar/2026 10:51:58] "POST /api/posts/create/ HTTP/1.1" 201
# - [29/Mar/2026 10:51:59] "POST /api/posts/1/like/ HTTP/1.1" 200
```

### Check Frontend Logs
```bash
# Browser Console (F12)
# Look for:
# - [API] POST /api/posts/create/
# - [API] POST /api/posts/1/like/
# - No red errors
```

### Check Network Requests
```bash
# Browser DevTools > Network tab
# Look for:
# - API requests with 200/201 status
# - Correct request/response payloads
# - No 404 or 500 errors
```

## 📊 API Testing with cURL

### Get All Posts
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/posts/
```

### Create a Post
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test post","location":"Inhambane"}' \
  http://localhost:8000/api/posts/create/
```

### Like a Post
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/posts/{post_id}/like/
```

### Get Your Token
```bash
# Login first
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"traveler@example.com","password":"password123"}' \
  http://localhost:8000/api/users/login/

# Response includes "access" token
# Use that token in Authorization header
```

## 🎯 Test Scenarios

### Scenario 1: Create and Share Post
```
1. Click "Add" button
2. Type: "Beautiful beach in Inhambane!"
3. Upload image
4. Click "Publicar"
5. Verify post appears in feed
6. Click share icon
7. Verify shares count increases
```

### Scenario 2: Discover and Save
```
1. Go to Home
2. Search for "beach"
3. Click filter "Tendências"
4. Click bookmark on post
5. Go to Profile
6. Click "Salvos" tab
7. Verify post appears
```

### Scenario 3: Engage with Content
```
1. Find a post
2. Click heart to like
3. Click comment icon
4. Type comment
5. Submit
6. Verify comment appears
7. Verify counts update
```

## 🚨 Common Issues & Solutions

### Issue: Backend won't start
```
Error: Address already in use
Solution: Kill process on port 8000
  Windows: netstat -ano | findstr :8000
  Mac/Linux: lsof -i :8000
  Kill: taskkill /PID {PID} /F
```

### Issue: Frontend won't start
```
Error: Port 5173 already in use
Solution: Use different port
  npm run dev -- --port 3000
```

### Issue: Posts not loading
```
Error: 404 Not Found
Solution: 
  1. Check backend is running
  2. Check API URL in api.ts
  3. Check CORS settings
  4. Check database migrations
```

### Issue: Like/Save not working
```
Error: 401 Unauthorized
Solution:
  1. Verify token is valid
  2. Check localStorage for token
  3. Login again
  4. Check token expiration
```

### Issue: Images not displaying
```
Error: Image 404
Solution:
  1. Check image URL
  2. Check MEDIA_ROOT setting
  3. Verify image exists
  4. Check file permissions
```

## 📈 Performance Testing

### Measure Page Load
```javascript
// In browser console
performance.measure('pageLoad', 'navigationStart', 'loadEventEnd');
console.log(performance.getEntriesByName('pageLoad')[0].duration);
// Should be < 2000ms
```

### Measure API Response
```javascript
// In browser console
// Look at Network tab
// API requests should be < 500ms
```

### Check Memory Usage
```javascript
// In browser console
console.memory
// Should not grow continuously
```

## ✅ Success Criteria

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login successfully
- [ ] Posts load in feed
- [ ] Can like posts
- [ ] Can save posts
- [ ] Can share posts
- [ ] Can search posts
- [ ] Can filter posts
- [ ] Profile page works
- [ ] Real-time updates work
- [ ] No console errors
- [ ] No network errors
- [ ] Smooth animations
- [ ] Fast performance

## 🎉 You're Ready!

Once all tests pass, you have a fully functional social media platform!

### Next Steps
1. Create more test posts
2. Test with multiple users
3. Test on different devices
4. Test on different browsers
5. Load test with many posts

### Deployment
When ready to deploy:
1. Set DEBUG=False in settings.py
2. Configure allowed hosts
3. Set up production database
4. Configure static files
5. Set up SSL/HTTPS
6. Deploy to server

---

**Happy Testing! 🚀**
