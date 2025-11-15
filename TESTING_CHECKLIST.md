# Quick Testing Checklist

## Before Testing
1. Clear browser cookies and cache
2. Open browser Developer Tools (F12)
3. Go to Console tab to see logs

## Test 1: Signup New Account ✅

**Steps**:
1. Navigate to `http://localhost:3000` (or your dev server)
2. Click "Criar conta"
3. Fill form:
   - Nome de usuário: `testuser123`
   - Email: `testuser123@example.com`
   - Senha: `password123`
   - Check "Você deve ter mais de 18 anos"
   - Check "Você deve aceitar os termos de uso"
4. Click "Criar conta"

**Expected Behavior**:
- Page shows loading spinner while submitting
- Browser console shows logs:
  ```
  [v0] Firebase Auth user created: [UID]
  [v0] Firestore user document created
  [v0] Welcome notification created
  [v0] Account creation successful for user: [UID]
  ```
- After ~1-2 seconds, redirects to `/feed`
- Feed page loads with authenticated user
- Top navigation shows profile menu/username

**If It Fails**:
- Check console for error messages
- Check Firebase Console for Auth/Firestore errors
- Verify internet connection

---

## Test 2: Like a Post ✅

**Prerequisites**: Must have completed Test 1

**Steps**:
1. In feed, find any post
2. Click the heart icon to like it

**Expected Behavior**:
- Heart icon fills with color
- Like count increments
- No error toast appears
- Can unlike and like again

**If It Fails**:
- Error message appears: "vc precisa estar autenticado para curtir"
- Check that `user?.uid` is passed to `usePostLikes` hook
- Verify Firestore `likes` document was created

---

## Test 3: Comment on Post ✅

**Prerequisites**: Must have completed Test 1

**Steps**:
1. In feed, find any post
2. Click the comment icon (speech bubble)
3. Type a comment
4. Click "Comentar"

**Expected Behavior**:
- Comment appears in feed
- Comment modal closes
- Comment count increments
- User sees their comment

**If It Fails**:
- Error about authentication appears
- Check that `user?.uid` is available
- Verify Firestore permissions allow comments

---

## Test 4: Login with Username ✅

**Prerequisites**: Must have completed Test 1 first (to create account)

**Steps**:
1. Sign out (if still logged in)
2. Navigate to `http://localhost:3000`
3. Click "Entrar"
4. Fill form:
   - Nome de usuário ou email: `testuser123`
   - Senha: `password123`
5. Click "Entrar"

**Expected Behavior**:
- Page shows loading spinner while submitting
- Browser console shows logs:
  ```
  [v0] Sign in attempt with identifier: testuser123
  [v0] Found user by username, email: testuser123@example.com
  [v0] Attempting Firebase Auth sign in with email: testuser123@example.com
  [v0] Firebase Auth sign in successful, user UID: [UID]
  [v0] User document ensured in Firestore
  [v0] Sign in successful for user: [UID]
  ```
- After ~1-2 seconds, redirects to `/feed`
- Feed page loads with authenticated user

**If It Fails**:
- Error "Usuário ou senha incorretos" appears
- Check console logs to see which step failed
- Verify username/email/password are correct

---

## Test 5: Login with Email ✅

**Prerequisites**: Must have completed Test 1 first

**Steps**:
1. Sign out (if still logged in)
2. Navigate to `http://localhost:3000`
3. Click "Entrar"
4. Fill form:
   - Nome de usuário ou email: `testuser123@example.com`
   - Senha: `password123`
5. Click "Entrar"

**Expected Behavior**:
- Same as Test 4
- Console log shows:
  ```
  [v0] Sign in attempt with identifier: testuser123@example.com
  [v0] Found user by email, username: testuser123
  [v0] Attempting Firebase Auth sign in with email: testuser123@example.com
  ```

**If It Fails**:
- Same troubleshooting as Test 4

---

## Test 6: Refresh Page While Logged In ✅

**Prerequisites**: Must be logged in (completed Test 1, 4, or 5)

**Steps**:
1. Navigate to `/feed`
2. Press F5 to refresh page
3. Observe

**Expected Behavior**:
- Page briefly shows "Verificando autenticação..." (checking authentication)
- Firebase Auth persistence kicks in
- Page reloads with user still authenticated
- Can like/comment without issues

**If It Fails**:
- Redirects to login page instead
- Check Firebase Console for persistence issues
- Verify cookies are enabled in browser

---

## Test 7: Logout and Verify ✅

**Prerequisites**: Must be logged in

**Steps**:
1. Click profile menu (top right)
2. Click "Sair" (Logout)
3. Observe

**Expected Behavior**:
- Redirected to home page `/`
- Profile menu gone
- `auth-token` cookie removed
- Cannot access protected routes

**If It Fails**:
- Still sees profile menu after logout
- Check `removeAuthToken()` is being called
- Verify cookies are properly removed

---

## Test 8: Unauthorized Route Access ✅

**Prerequisites**: Must be logged out

**Steps**:
1. Copy URL from logged-in user (e.g., `/feed` or `/my-subscriptions`)
2. While logged out, paste URL in browser
3. Observe

**Expected Behavior**:
- Redirected to `/?redirect=/feed` or `/?redirect=/my-subscriptions`
- Login form shows with redirect parameter
- After logging in, redirects to original URL

**If It Fails**:
- Protected page loads while logged out
- Check `AuthProvider` for route protection logic
- Verify public routes list is correct

---

## Browser Console Debug Tips

1. **Filter logs**: Type `[v0]` in console filter to see only app logs
2. **Check cookies**: Open DevTools → Application → Cookies → Look for `auth-token`
3. **Check localStorage**: Look for Firebase keys like `firebase:...`
4. **Check Firestore**: Firebase Console → Firestore Database → `users` collection
5. **Check Auth**: Firebase Console → Authentication → Users list

---

## Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---|---|
| "vc precisa estar autenticado" | `user` is null in feed | Increase delay timeout from 500ms to 1000ms |
| Login says "Usuário ou senha incorretos" | Wrong credentials or user not found | Check username/email in Firestore `users` collection |
| Signup succeeds but Firestore doc missing | `ensureUserDocument` failed silently | Check Firebase Console Firestore Rules |
| Logout doesn't work | `removeAuthToken` not called | Check `AuthProvider` useEffect |
| Redirect loop on login | `isPublicRoute` check broken | Verify route list in `AuthProvider` |
| Can't upload profile pic | Storage Rules issue | Check `lib/firebase/storage-rules.txt` |

---

## Success Indicators

✅ **All tests pass if:**
- Signup creates functional account (can like posts immediately after)
- Login works with both username and email
- Can like/comment/retweet without auth errors
- Page refresh maintains authentication
- Logout clears authentication properly
- Protected routes redirect unauthenticated users

If all tests pass, the authentication issue is FIXED! 🎉
