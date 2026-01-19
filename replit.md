# Squad Party

A mobile party game app that brings the fun of Mario Party-style mini-games to your phone. Challenge your friends in fast-paced word games and compete for first place!

## Overview

Squad Party is a multiplayer mobile game where users can:
- **Host Sessions**: Create game sessions and invite friends to join
- **Create Playlists**: Build custom collections of mini-games from the platform's default games
- **Play Mini-Games**: Compete in 60-second word games with up to 4 players
- **Track Stats**: View game history, wins, and rankings on your profile

## Architecture

### Frontend (Expo React Native)
- **Navigation**: Tab-based navigation (Play, Playlists, Profile) with a floating action button for hosting
- **State Management**: React Context for auth and game state, AsyncStorage for persistence
- **Design**: Dark theme with vibrant coral (#FF6B6B) and electric yellow (#FFD93D) accents

### Key Screens
1. **Login** - Username-based authentication
2. **Play Tab** - Browse and join active game sessions
3. **Playlists Tab** - Manage and create game playlists
4. **Profile Tab** - View stats and settings
5. **Host Session** - Create new game sessions
6. **Session Lobby** - Wait for players before starting
7. **Game Play** - Active word scramble mini-game
8. **Round Results** - Display rankings after each round

### Data Storage
- User data stored in AsyncStorage (`@squad_party_user`)
- Playlists stored in AsyncStorage (`@squad_party_playlists`)
- Sessions stored in AsyncStorage (`@squad_party_sessions`)

## Project Structure

```
client/
├── App.tsx                    # Main app entry with providers
├── contexts/
│   ├── AuthContext.tsx        # User authentication state
│   └── GameContext.tsx        # Game, playlist, session state
├── navigation/
│   ├── RootStackNavigator.tsx # Main stack navigation
│   ├── MainTabNavigator.tsx   # Bottom tab navigation
│   ├── PlayStackNavigator.tsx
│   ├── PlaylistsStackNavigator.tsx
│   └── ProfileStackNavigator.tsx
├── screens/
│   ├── LoginScreen.tsx
│   ├── PlayScreen.tsx
│   ├── PlaylistsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── HostSessionScreen.tsx
│   ├── SessionLobbyScreen.tsx
│   ├── GamePlayScreen.tsx
│   ├── RoundResultsScreen.tsx
│   ├── CreatePlaylistScreen.tsx
│   ├── PlaylistDetailScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── HeaderTitle.tsx
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   └── ErrorBoundary.tsx
├── constants/
│   └── theme.ts              # Colors, spacing, typography
└── hooks/
    ├── useTheme.ts
    └── useScreenOptions.ts
```

## Mini-Games Included

1. **Word Scramble** - Unscramble letters to form words
2. **Speed Typing** - Type words before time runs out
3. **Word Chain** - Create words starting with the last letter
4. **Trivia Blast** - Answer trivia questions fast
5. **Memory Match** - Match pairs of cards
6. **Anagram Hunt** - Find anagrams in scrambled letters

## Running the App

The app runs on Expo Go:
- Scan the QR code with Expo Go (Android) or Camera app (iOS)
- Or access the web version at port 8081

## Design System

- **Primary**: Coral #FF6B6B
- **Secondary**: Electric Yellow #FFD93D
- **Background**: Deep Navy #1A1A2E
- **Surface**: Charcoal #16213E
- **Font**: Poppins (Google Font)

## Future Enhancements

- Real-time multiplayer with WebSockets
- More mini-game types
- Bitmoji/avatar integration
- Community playlist sharing
- Leaderboards and achievements
