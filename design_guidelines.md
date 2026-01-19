# Squad Party - Design Guidelines

## Brand Identity

**Purpose**: Squad Party brings the high-energy chaos of Mario Party mini-games to mobile, letting friend groups compete in quick word games and mobile-friendly challenges.

**Aesthetic Direction**: **Bold/Playful Competition**
- Vibrant, high-energy party atmosphere
- Celebrates friendly rivalry with bold colors and motion
- Polished but not overly serious - this is about fun with friends
- Think game show meets street festival: loud, colorful, unapologetically energetic

**Memorable Element**: Dynamic color-shifting backgrounds and bold typographic treatments that make every screen feel like the party is already happening. Ranking displays use dramatic stacking and scale to celebrate competition.

## Authentication
**Required** - Multiplayer sessions, playlists, community content

- Apple Sign-In (iOS) + Google Sign-In
- Bitmoji integration during onboarding (link Bitmoji account after auth)
- Mock auth flow with local state persistence
- Privacy policy & terms links on login screen
- Account deletion nested: Profile > Settings > Account > Delete Account (double confirmation)

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs) + Floating Action Button

**Tabs**:
1. **Play** - Browse and join active sessions
2. **Playlists** - View and manage playlists
3. **Profile** - User profile, stats, settings

**Floating Action Button**: "Host" - Create new session (positioned center-right, above tab bar)

## Screen-by-Screen Specifications

### 1. Login/Signup Screen (Stack-only)
**Purpose**: Authenticate and link Bitmoji
**Layout**:
- No header
- Centered content (logo, tagline, auth buttons)
- Top inset: insets.top + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: Logo, "Sign in with Apple" button, "Sign in with Google" button, privacy/terms links
**Empty State**: N/A

### 2. Bitmoji Linking Screen (Modal after first login)
**Purpose**: Connect user's Bitmoji account
**Layout**:
- Custom header: "Connect Your Bitmoji"
- Instructions, "Link Bitmoji" button, "Skip for now" text button
- Top inset: insets.top + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: Illustration placeholder, primary CTA, skip option

### 3. Play Tab (Browse Sessions)
**Purpose**: Discover and join active sessions
**Layout**:
- Transparent header with title "Play"
- Scrollable list of session cards
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
**Components**: Search bar in header, session cards (show host Bitmoji, player count "3/4", playlist name, "Join" button)
**Empty State**: empty-play.png - "No Active Sessions" with subtitle "Host a session to get started!"

### 4. Session Lobby Screen (Modal from Play tab)
**Purpose**: Wait for players before game starts
**Layout**:
- Default navigation header with "Leave" left button
- Player grid (4 slots with Bitmojis), host controls at bottom
- Top inset: Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: 4 player slots (empty slots show "Waiting..."), "Start Game" button (host only), playlist info banner

### 5. Host Session Screen (Modal from FAB)
**Purpose**: Create new session
**Layout**:
- Default header: "Host Session", Cancel left button, Create right button
- Scrollable form
- Top inset: Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: "Select Playlist" picker, session visibility toggle (Public/Private), Create button in header

### 6. Game Playing Screen (Modal from lobby)
**Purpose**: Active mini-game interface
**Layout**:
- Custom overlay header: Timer (60s countdown), player positions bar
- Game-specific content area (varies by mini-game)
- Top inset: headerHeight + Spacing.md
**Components**: Timer, live ranking bar (shows 1st-4th with Bitmojis), game UI (varies)

### 7. Round Results Screen (Modal after game)
**Purpose**: Display round rankings
**Layout**:
- No header
- Vertically stacked ranking (1st largest at top, 4th smallest at bottom)
- "Next Round" button at bottom
- Top inset: insets.top + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: Podium-style ranking cards with Bitmojis, scores, "Next Round" CTA

### 8. Playlists Tab
**Purpose**: Browse and manage playlists
**Layout**:
- Transparent header with title "Playlists", "+" right button
- Scrollable list of playlist cards
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
**Components**: Segmented control ("My Playlists" / "Community"), playlist cards (thumbnail, title, game count)
**Empty State**: empty-playlists.png - "No Playlists Yet"

### 9. Playlist Detail Screen (Stack from Playlists tab)
**Purpose**: View and edit playlist
**Layout**:
- Default header with playlist name, "Edit" right button
- Scrollable list of mini-games
- Top inset: Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
**Components**: Mini-game cards (name, duration, difficulty), reorder handles, "Add Game" button at bottom

### 10. Create/Edit Playlist Screen (Modal from Playlists)
**Purpose**: Build custom playlist
**Layout**:
- Default header: "New Playlist", Cancel left, Save right
- Scrollable form with mini-game browser
- Top inset: Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
**Components**: Name input, game search, game library (tabs: Platform/Community/Custom), selected games list

### 11. Profile Tab
**Purpose**: User stats and settings
**Layout**:
- Transparent header with title "Profile", Settings icon right
- Scrollable content: Bitmoji avatar, stats cards, recent activity
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
**Components**: Large Bitmoji display, stats grid (Games Played, Wins, Top Rank), activity feed

### 12. Settings Screen (Stack from Profile)
**Purpose**: App preferences and account
**Layout**:
- Default header: "Settings"
- Scrollable list
- Top inset: Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
**Components**: Sections (Account, Preferences, About), logout button

## Design System

### Color Palette
- **Primary**: Vibrant Coral `#FF6B6B` (energy, competition, party vibes)
- **Secondary**: Electric Yellow `#FFD93D` (highlights, accents)
- **Background**: Deep Navy `#1A1A2E` (contrast, sophistication)
- **Surface**: Charcoal `#16213E` (cards, elevated content)
- **Text Primary**: White `#FFFFFF`
- **Text Secondary**: Light Gray `#B4B4B8`
- **Success/1st Place**: Gold `#FFD700`
- **2nd Place**: Silver `#C0C0C0`
- **3rd Place**: Bronze `#CD7F32`
- **Error**: Crimson `#DC143C`

### Typography
**Font**: Poppins (Google Font) - bold, modern, energetic
- **Display**: Poppins Bold, 32px (screen titles, rankings)
- **Heading**: Poppins SemiBold, 24px (section headers)
- **Subheading**: Poppins Medium, 18px (card titles)
- **Body**: Poppins Regular, 16px (descriptions, lists)
- **Caption**: Poppins Regular, 14px (metadata, labels)

### Visual Design
- Use Feather icons from @expo/vector-icons
- Floating Action Button: Coral background, white icon, subtle shadow (offset: {width: 0, height: 2}, opacity: 0.10, radius: 2)
- Cards: Charcoal background, 16px border radius, no shadow (flat design)
- Interactive feedback: Scale down 0.95 on press, opacity 0.7
- Rankings use dramatic scale differences (1st = 1.5x size of 4th)

## Assets to Generate

1. **icon.png** - App icon featuring "SP" monogram in vibrant coral on navy background - USED: Device home screen
2. **splash-icon.png** - Same as icon.png but optimized for splash - USED: App launch screen
3. **empty-play.png** - Illustration of empty podium with confetti - USED: Play tab when no sessions
4. **empty-playlists.png** - Illustration of musical note with game controller - USED: Playlists tab when empty
5. **bitmoji-placeholder.png** - Generic avatar silhouette - USED: Empty player slots in lobbies
6. **onboarding-hero.png** - Four Bitmoji-style characters celebrating on podium - USED: First launch welcome screen
7. **timer-alert.png** - Animated clock icon - USED: Game countdown UI