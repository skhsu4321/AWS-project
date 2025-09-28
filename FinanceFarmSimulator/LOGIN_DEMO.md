# Login Demo Instructions

## 🌱 Finance Farm Simulator - Login Screen

The login screen is now fully functional! Here's how to use it:

### Features Implemented ✅

1. **Login Form**
   - Email input field
   - Password input field  
   - Login button with loading state
   - Form validation

2. **Registration Form**
   - Display name, email, age, password fields
   - Age-based mode detection (child vs adult)
   - Form validation and confirmation

3. **Demo Mode**
   - Any email/password combination will work
   - No actual authentication required
   - Instant login for testing

### How to Test

1. **Scan the QR code** with Expo Go app
2. You'll see the login screen with "Welcome Back!" title
3. **Try these demo accounts:**

   **Adult Mode:**
   - Email: `adult@example.com`
   - Password: `anything`
   
   **Child Mode:**
   - Email: `child@example.com` 
   - Password: `anything`

4. **Or create a new account:**
   - Tap "Sign Up" in the header
   - Fill in the form (age < 18 = child mode)
   - Tap "Create Account"

### What Happens After Login

- **Adult Mode**: Professional green theme, smaller UI elements
- **Child Mode**: Bright colorful theme, larger touch targets
- **Main App**: Bottom tab navigation with Farm, Goals, Expenses, Analytics

### Theme Switching Demo

The app automatically switches between adult and child themes based on:
- **Login**: Email containing "child" or "kid" → Child mode
- **Registration**: Age < 18 → Child mode  
- **Default**: Adult mode

### Navigation

- **Login Screen**: Main entry point
- **Register Screen**: Accessible via "Sign Up" button
- **Main App**: Tabs for different features (placeholders for now)

The login system is fully integrated with Redux state management and the theme system!