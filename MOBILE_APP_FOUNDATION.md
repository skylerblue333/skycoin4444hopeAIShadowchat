# Skycoin4444 Mobile App Foundation

**Version:** 1.0  
**Platform:** React Native (iOS & Android)  
**Status:** 🚀 IN DEVELOPMENT  

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Setup & Installation](#setup--installation)
4. [Shared Component Library](#shared-component-library)
5. [Native Module Integration](#native-module-integration)
6. [Authentication System](#authentication-system)
7. [Wallet Integration](#wallet-integration)
8. [Push Notifications](#push-notifications)
9. [Offline Sync Engine](#offline-sync-engine)
10. [Build & Deployment](#build--deployment)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React Native 0.73+ | Cross-platform UI |
| **Navigation** | React Navigation 6 | Screen navigation |
| **State Management** | Redux Toolkit | Global state |
| **Local Storage** | SQLite | Offline data |
| **Backend Sync** | tRPC Client | API communication |
| **Push Notifications** | Firebase Cloud Messaging | Real-time alerts |
| **Authentication** | React Native Keychain | Secure credentials |
| **Biometrics** | React Native Biometrics | Fingerprint/Face ID |
| **Payments** | Stripe React Native | Payment processing |
| **Analytics** | Firebase Analytics | User tracking |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UI Layer (Shared Components)            │  │
│  │  - Screens (Auth, Wallet, Transactions, etc.)       │  │
│  │  - Components (Buttons, Cards, Modals, etc.)        │  │
│  │  - Themes (Dark/Light)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Navigation Layer (React Navigation)         │  │
│  │  - Stack Navigator (Auth, App)                       │  │
│  │  - Tab Navigator (Wallet, Transactions, Profile)     │  │
│  │  - Deep Linking                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      State Management (Redux + Redux Toolkit)        │  │
│  │  - User State (Auth, Profile)                        │  │
│  │  - Wallet State (Balance, Transactions)              │  │
│  │  - UI State (Loading, Errors)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Data Layer (SQLite + tRPC Client)               │  │
│  │  - Local Cache (SQLite)                              │  │
│  │  - API Client (tRPC)                                 │  │
│  │  - Sync Engine (Offline-first)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Native Modules (iOS & Android)                  │  │
│  │  - Biometrics (Fingerprint, Face ID)                 │  │
│  │  - Keychain (Secure Storage)                         │  │
│  │  - Camera (QR Code Scanner)                          │  │
│  │  - Notifications (Push)                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Skycoin4444)                      │
│  - tRPC API Endpoints                                        │
│  - Database (MySQL)                                          │
│  - Firebase (Push Notifications)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
skycoin4444-mobile/
├── ios/                              # iOS native code
│   ├── Skycoin4444/
│   │   ├── Skycoin4444.xcodeproj/
│   │   ├── Podfile
│   │   └── Info.plist
│   └── Skycoin4444Tests/
├── android/                          # Android native code
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   ├── res/
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── test/
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
├── src/
│   ├── screens/                      # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── BiometricScreen.tsx
│   │   ├── wallet/
│   │   │   ├── WalletScreen.tsx
│   │   │   ├── SendScreen.tsx
│   │   │   └── ReceiveScreen.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionsScreen.tsx
│   │   │   └── TransactionDetailScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── home/
│   │       └── HomeScreen.tsx
│   ├── components/                   # Reusable components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loader.tsx
│   │   ├── wallet/
│   │   │   ├── WalletCard.tsx
│   │   │   ├── BalanceDisplay.tsx
│   │   │   └── TransactionItem.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── TabBar.tsx
│   │       └── ErrorBoundary.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── AppNavigator.tsx
│   │   └── LinkingConfiguration.ts
│   ├── redux/
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── walletSlice.ts
│   │   │   ├── transactionSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── middleware/
│   │       └── syncMiddleware.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── trpcClient.ts
│   │   │   └── endpoints.ts
│   │   ├── storage/
│   │   │   ├── sqlite.ts
│   │   │   └── keychain.ts
│   │   ├── auth/
│   │   │   ├── biometrics.ts
│   │   │   └── jwt.ts
│   │   ├── notifications/
│   │   │   └── firebase.ts
│   │   └── sync/
│   │       ├── offlineSync.ts
│   │       └── queueManager.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useTransactions.ts
│   │   ├── useOfflineSync.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── crypto.ts
│   │   └── constants.ts
│   ├── themes/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── wallet.ts
│   │   └── transaction.ts
│   └── App.tsx
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── README.md
```

---

## Setup & Installation

### Prerequisites

```bash
# Node.js 18+
node -v

# npm or yarn
npm -v

# Xcode (for iOS development)
xcode-select --install

# Android Studio (for Android development)
# Download from: https://developer.android.com/studio

# Watchman (for file watching)
brew install watchman
```

### Installation Steps

```bash
# 1. Create React Native project
npx react-native@latest init Skycoin4444Mobile --template typescript

# 2. Navigate to project
cd Skycoin4444Mobile

# 3. Install dependencies
npm install

# 4. Install required packages
npm install \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/stack \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  @reduxjs/toolkit \
  react-redux \
  @react-native-firebase/app \
  @react-native-firebase/messaging \
  react-native-keychain \
  react-native-biometrics \
  react-native-sqlite-storage \
  @trpc/react-query \
  @trpc/client \
  superjson \
  zod

# 5. Install dev dependencies
npm install --save-dev \
  @types/react-native \
  typescript \
  @react-native-community/eslint-config \
  eslint \
  prettier

# 6. Setup iOS
cd ios && pod install && cd ..

# 7. Setup Android
# Open Android Studio and configure SDK

# 8. Start development server
npm start
```

---

## Shared Component Library

### Core Components

#### Button Component

```typescript
// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing } from '../../themes';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const variantStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.dangerButton,
  };

  const sizeStyles = {
    small: styles.smallButton,
    medium: styles.mediumButton,
    large: styles.largeButton,
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={[styles.text, variantStyles[variant]]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  smallButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  mediumButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  largeButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

#### Card Component

```typescript
// src/components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../themes';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

#### Input Component

```typescript
// src/components/ui/Input.tsx
import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
} from 'react-native';
import { colors, spacing } from '../../themes';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={colors.gray}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.black,
  },
  inputWithIcon: {
    marginLeft: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
```

---

## Native Module Integration

### iOS Native Module (Biometrics)

```swift
// ios/Skycoin4444/BiometricsModule.swift
import Foundation
import LocalAuthentication
import React

@objc(BiometricsModule)
class BiometricsModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func authenticate(_ resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                                     error: &error) else {
      reject("BIOMETRICS_NOT_AVAILABLE", "Biometrics not available", error)
      return
    }
    
    context.evaluatePolicy(
      .deviceOwnerAuthenticationWithBiometrics,
      localizedReason: "Authenticate to access your wallet"
    ) { success, error in
      if success {
        resolve(true)
      } else {
        reject("BIOMETRICS_FAILED", "Authentication failed", error)
      }
    }
  }
}
```

### Android Native Module (Biometrics)

```kotlin
// android/app/src/main/java/com/skycoin4444/BiometricsModule.kt
package com.skycoin4444

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.*
import java.util.concurrent.Executor

class BiometricsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  
  override fun getName() = "BiometricsModule"
  
  @ReactMethod
  fun authenticate(promise: Promise) {
    val activity = currentActivity as? FragmentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Activity not found")
      return
    }
    
    val biometricManager = BiometricManager.from(activity)
    when (biometricManager.canAuthenticate(
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    )) {
      BiometricManager.BIOMETRIC_SUCCESS -> {
        val executor = Executor { it.run() }
        val biometricPrompt = BiometricPrompt(
          activity,
          executor,
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(
              result: BiometricPrompt.AuthenticationResult
            ) {
              super.onAuthenticationSucceeded(result)
              promise.resolve(true)
            }
            
            override fun onAuthenticationError(
              errorCode: Int,
              errString: CharSequence
            ) {
              super.onAuthenticationError(errorCode, errString)
              promise.reject("AUTH_ERROR", errString.toString())
            }
          }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
          .setTitle("Authenticate")
          .setSubtitle("Authenticate to access your wallet")
          .setNegativeButtonText("Cancel")
          .build()
        
        biometricPrompt.authenticate(promptInfo)
      }
      else -> promise.reject("BIOMETRICS_NOT_AVAILABLE", "Biometrics not available")
    }
  }
}
```

---

## Authentication System

### Biometric Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { setUser, setLoading, setError } from '../redux/slices/authSlice';
import { trpcClient } from '../services/api/trpcClient';

const { BiometricsModule } = NativeModules;

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state: any) => state.auth);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  const loginWithBiometrics = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      // Authenticate with biometrics
      await BiometricsModule.authenticate();

      // Retrieve stored credentials
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        throw new Error('No stored credentials');
      }

      // Login via API
      const response = await trpcClient.auth.login.mutate({
        email: credentials.username,
        password: credentials.password,
      });

      // Store token
      await Keychain.setGenericPassword(
        'token',
        response.token
      );

      dispatch(setUser(response.user));
    } catch (err) {
      dispatch(setError((err as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      dispatch(setLoading(true));
      try {
        const response = await trpcClient.auth.login.mutate({
          email,
          password,
        });

        // Store credentials
        await Keychain.setGenericPassword(email, password);

        // Store token
        await Keychain.setGenericPassword('token', response.token);

        dispatch(setUser(response.user));
      } catch (err) {
        dispatch(setError((err as Error).message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await Keychain.resetGenericPassword();
      dispatch(setUser(null));
    } catch (err) {
      dispatch(setError((err as Error).message));
    }
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    loginWithBiometrics,
    loginWithPassword,
    logout,
    biometricsAvailable,
  };
};
```

---

## Wallet Integration

### Wallet Hook

```typescript
// src/hooks/useWallet.ts
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setBalance,
  setTransactions,
  setLoading,
  setError,
} from '../redux/slices/walletSlice';
import { trpcClient } from '../services/api/trpcClient';

export const useWallet = () => {
  const dispatch = useDispatch();
  const { balance, transactions, loading, error } = useSelector(
    (state: any) => state.wallet
  );

  const fetchWallet = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const wallet = await trpcClient.wallet.getWallet.query();
      dispatch(setBalance(wallet.balance));
    } catch (err) {
      dispatch(setError((err as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchTransactions = useCallback(async () => {
    try {
      const txs = await trpcClient.wallet.getTransactions.query();
      dispatch(setTransactions(txs));
    } catch (err) {
      dispatch(setError((err as Error).message));
    }
  }, [dispatch]);

  const sendTransaction = useCallback(
    async (to: string, amount: number) => {
      dispatch(setLoading(true));
      try {
        const tx = await trpcClient.wallet.sendTransaction.mutate({
          to,
          amount,
        });
        await fetchWallet();
        await fetchTransactions();
        return tx;
      } catch (err) {
        dispatch(setError((err as Error).message));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchWallet, fetchTransactions]
  );

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return {
    balance,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    sendTransaction,
  };
};
```

---

## Push Notifications

### Firebase Push Notifications Setup

```typescript
// src/services/notifications/firebase.ts
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../redux/slices/uiSlice';

export const setupPushNotifications = async () => {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted');
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    return token;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

export const usePushNotifications = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      dispatch(
        addNotification({
          title: remoteMessage.notification?.title || 'Notification',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        })
      );
    });

    // Handle background messages
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });

    return unsubscribeForeground;
  }, [dispatch]);
};
```

---

## Offline Sync Engine

### Sync Middleware

```typescript
// src/redux/middleware/syncMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { offlineSync } from '../../services/sync/offlineSync';

export const syncMiddleware: Middleware = (store) => (next) => async (action) => {
  const result = next(action);

  // Queue actions that need to be synced
  if (action.type.startsWith('wallet/') || action.type.startsWith('transaction/')) {
    try {
      await offlineSync.queueAction(action);
    } catch (error) {
      console.error('Error queuing action:', error);
    }
  }

  return result;
};
```

### Offline Sync Service

```typescript
// src/services/sync/offlineSync.ts
import NetInfo from '@react-native-community/netinfo';
import { db } from './sqlite';

class OfflineSync {
  private queue: any[] = [];
  private isOnline = true;

  async initialize() {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.syncQueue();
      }
    });

    // Load persisted queue
    this.queue = await db.getQueue();
  }

  async queueAction(action: any) {
    this.queue.push(action);
    await db.saveQueue(this.queue);

    if (this.isOnline) {
      await this.syncQueue();
    }
  }

  private async syncQueue() {
    for (const action of this.queue) {
      try {
        // Execute action on backend
        await this.executeAction(action);
        this.queue.shift();
        await db.saveQueue(this.queue);
      } catch (error) {
        console.error('Error syncing action:', error);
        break;
      }
    }
  }

  private async executeAction(action: any) {
    // Implementation depends on action type
    switch (action.type) {
      case 'wallet/sendTransaction':
        // Send transaction to backend
        break;
      default:
        break;
    }
  }
}

export const offlineSync = new OfflineSync();
```

---

## Build & Deployment

### iOS Build

```bash
# 1. Build for development
npx react-native run-ios

# 2. Build for release
cd ios
xcodebuild -workspace Skycoin4444.xcworkspace \
  -scheme Skycoin4444 \
  -configuration Release \
  -derivedDataPath build

# 3. Archive for App Store
xcodebuild -workspace Skycoin4444.xcworkspace \
  -scheme Skycoin4444 \
  -configuration Release \
  -archivePath build/Skycoin4444.xcarchive \
  archive

# 4. Export for App Store
xcodebuild -exportArchive \
  -archivePath build/Skycoin4444.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa
```

### Android Build

```bash
# 1. Build for development
npx react-native run-android

# 2. Build release APK
cd android
./gradlew assembleRelease

# 3. Build release AAB (for Play Store)
./gradlew bundleRelease

# 4. Sign APK/AAB
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  alias_name
```

### App Store Submission

**iOS:**
1. Create App ID in Apple Developer
2. Create provisioning profiles
3. Archive and export
4. Upload to App Store Connect
5. Submit for review

**Android:**
1. Create Play Console account
2. Create app entry
3. Upload signed AAB
4. Fill in store listing
5. Submit for review

---

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Performance Testing

```bash
npm run test:performance
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Crash reporting configured
- [ ] Analytics configured
- [ ] Push notifications tested
- [ ] Offline sync tested
- [ ] Biometric authentication tested
- [ ] App Store submission prepared
- [ ] Play Store submission prepared
- [ ] Release notes prepared
- [ ] Marketing materials prepared

---

**Status:** 🚀 Ready for Development

*For questions or issues, contact: mobile@skycoin4444.com*
