# App Store Assets

This directory contains all the assets needed for app store submissions.

## Directory Structure

```
store-assets/
├── ios/
│   ├── screenshots/
│   │   ├── iphone-6.5/          # iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max
│   │   ├── iphone-5.5/          # iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
│   │   ├── ipad-pro-12.9/       # iPad Pro (6th, 5th, 4th, 3rd gen)
│   │   └── ipad-pro-11/         # iPad Pro (4th, 3rd, 2nd, 1st gen), iPad Air (5th, 4th gen)
│   ├── app-preview/             # App preview videos
│   └── metadata/
│       ├── description.txt
│       ├── keywords.txt
│       ├── release-notes.txt
│       └── privacy-policy.txt
├── android/
│   ├── screenshots/
│   │   ├── phone/               # Phone screenshots
│   │   ├── tablet-7/            # 7-inch tablet screenshots
│   │   └── tablet-10/           # 10-inch tablet screenshots
│   ├── feature-graphic/         # Feature graphic (1024x500)
│   └── metadata/
│       ├── description.txt
│       ├── short-description.txt
│       └── release-notes.txt
└── common/
    ├── icon/                    # App icons in various sizes
    ├── promotional/             # Promotional materials
    └── press-kit/               # Press kit materials
```

## Screenshot Requirements

### iOS App Store
- **iPhone 6.7"**: 1290 x 2796 pixels (iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max)
- **iPhone 5.5"**: 1242 x 2208 pixels (iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus)
- **iPad Pro (6th gen) 12.9"**: 2048 x 2732 pixels
- **iPad Pro (4th gen) 11"**: 1668 x 2388 pixels

### Google Play Store
- **Phone**: 1080 x 1920 pixels minimum
- **7-inch tablet**: 1200 x 1920 pixels minimum
- **10-inch tablet**: 1600 x 2560 pixels minimum

## App Store Descriptions

### iOS App Store Description (4000 characters max)
Transform your financial journey into an engaging farm adventure! Finance Farm Simulator gamifies money management, making savings goals feel like growing crops and expense tracking as satisfying as pulling weeds.

**Key Features:**
🌱 **Visual Savings Goals**: Plant your financial goals as seeds and watch them grow into beautiful crops as you save
💰 **Gamified Income Tracking**: Log income as "fertilizer" to boost your crop growth with streak multipliers
🧹 **Interactive Expense Management**: Pull weeds (expenses) with satisfying drag-and-drop interactions
📊 **Smart Analytics**: Get insights into your spending patterns with beautiful, easy-to-understand charts
👨‍👩‍👧‍👦 **Family-Friendly**: Special child mode with parental controls for teaching kids financial responsibility
🎯 **Achievement System**: Unlock rewards, decorations, and farm upgrades as you hit your financial milestones

**Perfect for:**
- Adults wanting to make budgeting more engaging
- Parents teaching children about money management
- Anyone struggling to maintain financial habits
- Users who love gamification and visual progress tracking

**Child Mode Features:**
- Simplified interface with cartoon graphics
- Age-appropriate math operations
- Chore completion system with parental approval
- Educational tooltips explaining financial concepts
- Safe environment with no real money transactions

**Advanced Features:**
- Receipt scanning with automatic categorization
- Offline functionality with cloud sync
- Customizable budget alerts and notifications
- Detailed financial reports and trend analysis
- Voice commands for quick expense logging
- High contrast mode and accessibility features

Start your financial farm today and watch your money grow! 🌾💚

### Google Play Store Description (4000 characters max)
[Same content as iOS, formatted for Google Play]

### Short Description (80 characters max)
Gamify your finances! Grow savings as crops, pull expense weeds. 🌱💰

## Keywords

### iOS App Store Keywords (100 characters max)
finance,budget,savings,money,farm,game,kids,family,expenses,goals,tracker,financial,education,gamification

### Google Play Store Keywords
- Personal Finance
- Budget Tracker
- Savings Goals
- Money Management
- Financial Education
- Family Finance
- Kids Money App
- Gamification
- Expense Tracker
- Financial Planning

## App Preview Videos

### iOS App Preview Requirements
- Duration: 15-30 seconds
- Format: .mov, .mp4, or .m4v
- Resolution: Same as screenshot requirements
- File size: 500 MB maximum

### Google Play Store Video Requirements
- Duration: 30 seconds to 2 minutes
- Format: .mp4, .mov, .avi, .wmv, .flv, .webm
- Resolution: 1080p minimum recommended
- File size: 100 MB maximum

## Privacy Policy

Our app collects minimal personal information necessary for functionality:

**Information We Collect:**
- Account information (email, age for mode selection)
- Financial data (goals, expenses, income) - stored locally with optional cloud sync
- Usage analytics (anonymized) - only in production builds

**How We Use Information:**
- Provide core app functionality
- Sync data across devices (optional)
- Improve app performance and features
- Generate personalized insights and recommendations

**Data Security:**
- All financial data is encrypted locally
- Optional cloud sync uses end-to-end encryption
- No financial data is shared with third parties
- Parental controls ensure child data protection

**Your Rights:**
- Access your data
- Delete your account and all associated data
- Opt out of analytics
- Control data sharing preferences

For full privacy policy, visit: https://financefarm.app/privacy

## Release Notes Template

### Version 1.0.0
🎉 Welcome to Finance Farm Simulator!

**New Features:**
- Interactive farm dashboard with crop growth visualization
- Savings goals as plantable crops with real-time progress
- Drag-and-drop expense tracking (weed pulling)
- Income logging with fertilizer boost animations
- Child mode with parental controls and simplified interface
- Receipt scanning with automatic categorization
- Comprehensive analytics and reporting
- Offline functionality with cloud sync

**What's Special:**
- First-of-its-kind gamified financial management
- Family-friendly design suitable for all ages
- Beautiful animations and satisfying interactions
- Educational tooltips for financial literacy
- Accessibility features including voice commands

Start growing your financial future today! 🌱

## Promotional Materials

### Feature Graphic (Google Play)
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Content: Showcase main app features with engaging visuals

### App Icon
- iOS: 1024 x 1024 pixels (PNG, no transparency)
- Android: 512 x 512 pixels (PNG with transparency support)

### Marketing Screenshots
Create compelling screenshots that showcase:
1. Farm dashboard with growing crops
2. Goal creation and progress tracking
3. Expense tracking with weed-pulling interface
4. Analytics and insights screen
5. Child mode interface
6. Receipt scanning feature

## Localization

Currently supporting:
- English (Primary)
- Simplified Chinese (Hong Kong market)
- Traditional Chinese (Hong Kong market)

All store metadata should be translated for target markets.

## Submission Checklist

### iOS App Store
- [ ] App binary uploaded via Xcode or EAS
- [ ] Screenshots for all required device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] App preview videos (optional but recommended)
- [ ] Age rating completed
- [ ] Pricing and availability set
- [ ] App review information provided

### Google Play Store
- [ ] APK/AAB uploaded
- [ ] Screenshots for phone and tablet
- [ ] Feature graphic
- [ ] App description (short and full)
- [ ] Privacy policy URL
- [ ] Content rating completed
- [ ] Pricing and distribution settings
- [ ] Store listing experiments (optional)

## Testing Before Submission

1. **Functionality Testing**
   - All core features work as expected
   - No crashes or major bugs
   - Proper error handling and user feedback

2. **Performance Testing**
   - App launches quickly
   - Smooth animations and interactions
   - Reasonable memory and battery usage

3. **Accessibility Testing**
   - Screen reader compatibility
   - High contrast mode works
   - Voice commands function properly
   - Keyboard navigation available

4. **Device Testing**
   - Test on various screen sizes
   - Test on different OS versions
   - Test with different system settings

5. **Store Guidelines Compliance**
   - Review iOS App Store Review Guidelines
   - Review Google Play Developer Policy
   - Ensure content is appropriate for target age rating