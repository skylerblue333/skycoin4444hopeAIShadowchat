# Skycoin4444 Mobile Beta Program - TestFlight & Google Play

**Version:** 1.0  
**Platforms:** iOS (TestFlight) + Android (Google Play)  
**Status:** 🚀 BETA LAUNCH  

---

## Overview

The Mobile Beta Program enables:
- Early access for selected users
- Real-time feedback collection
- Crash reporting and analytics
- Performance monitoring
- Feature validation before production
- Community engagement
- Rapid iteration cycles

---

## iOS Beta - TestFlight Setup

### Step 1: Prepare iOS App

```bash
# Install dependencies
cd mobile
npm install

# Build for iOS
npm run build:ios

# Open Xcode project
open ios/Skycoin4444.xcworkspace
```

### Step 2: Configure App Signing

```bash
# In Xcode:
# 1. Select project > Signing & Capabilities
# 2. Set Team ID
# 3. Enable "Automatically manage signing"
# 4. Select provisioning profile
```

### Step 3: Create TestFlight Build

```bash
# In Xcode:
# 1. Product > Scheme > Skycoin4444
# 2. Product > Destination > Generic iOS Device
# 3. Product > Archive
# 4. Distribute App
# 5. Select "TestFlight & App Store"
# 6. Upload to TestFlight
```

### Step 4: Configure TestFlight

```bash
# In App Store Connect:
# 1. Go to TestFlight tab
# 2. Add internal testers (your team)
# 3. Add external testers (beta users)
# 4. Set feedback email
# 5. Configure beta app review information
```

### Step 5: Invite Testers

```bash
# Email template for testers:
---
Subject: Join Skycoin4444 iOS Beta

Hi [Tester Name],

You're invited to test the Skycoin4444 iOS app!

Download TestFlight: https://apps.apple.com/app/testflight/id899247664

Join link: [TestFlight link]

Please report any issues or feedback to: beta@skycoin4444.com

Thanks for helping us build the future!
---
```

---

## Android Beta - Google Play Setup

### Step 1: Prepare Android App

```bash
# Build for Android
npm run build:android

# Generate release key
keytool -genkey -v -keystore skycoin4444-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias skycoin4444-key

# Build signed APK
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=skycoin4444-release.jks \
  -Pandroid.injected.signing.store.password=<password> \
  -Pandroid.injected.signing.key.alias=skycoin4444-key \
  -Pandroid.injected.signing.key.password=<password>
```

### Step 2: Create Google Play Console App

```bash
# 1. Go to Google Play Console
# 2. Create new app
# 3. Fill in app details:
#    - App name: Skycoin4444
#    - Category: Finance
#    - Content rating: Fill questionnaire
# 4. Complete store listing
```

### Step 3: Upload to Internal Testing

```bash
# 1. Go to Testing > Internal testing
# 2. Create new release
# 3. Upload APK/AAB
# 4. Add release notes
# 5. Review and publish
```

### Step 4: Add Beta Testers

```bash
# 1. Go to Testing > Internal testing
# 2. Manage testers
# 3. Add email addresses of beta testers
# 4. Send invitations
```

### Step 5: Move to Closed Testing

```bash
# After internal testing (1-2 weeks):
# 1. Go to Testing > Closed testing
# 2. Create new release
# 3. Upload updated APK/AAB
# 4. Add testers (100-1000 users)
# 5. Set testing duration (2-4 weeks)
```

---

## Feedback Collection System

### In-App Feedback Widget

```typescript
// mobile/src/components/BetaFeedback.tsx
import React, { useState } from "react";
import { View, Text, Button, TextInput, Modal, Alert } from "react-native";
import { trpcClient } from "../services/api/trpcClient";

export const BetaFeedback: React.FC = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);

  const handleSubmit = async () => {
    try {
      await trpcClient.feedback.submitBetaFeedback.mutate({
        type: feedbackType,
        message,
        rating,
        appVersion: "1.0.0-beta.1",
        platform: "ios", // or "android"
        timestamp: new Date(),
      });

      Alert.alert("Thank you!", "Your feedback has been submitted");
      setShowFeedback(false);
      setMessage("");
    } catch (error) {
      Alert.alert("Error", "Failed to submit feedback");
    }
  };

  return (
    <>
      <Button title="Send Feedback" onPress={() => setShowFeedback(true)} />

      <Modal visible={showFeedback} animationType="slide">
        <View className="flex-1 p-4">
          <Text className="text-xl font-bold mb-4">Beta Feedback</Text>

          {/* Feedback Type */}
          <View className="mb-4">
            <Text className="font-semibold mb-2">Type</Text>
            {(["bug", "feature", "general"] as const).map((type) => (
              <Button
                key={type}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
                onPress={() => setFeedbackType(type)}
                color={feedbackType === type ? "#007AFF" : "#999"}
              />
            ))}
          </View>

          {/* Rating */}
          <View className="mb-4">
            <Text className="font-semibold mb-2">Rating: {rating}/5</Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  title={star === rating ? "★" : "☆"}
                  onPress={() => setRating(star)}
                />
              ))}
            </View>
          </View>

          {/* Message */}
          <TextInput
            placeholder="Describe your feedback..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            className="border border-gray-300 rounded p-2 mb-4"
          />

          {/* Submit */}
          <View className="flex-row gap-2">
            <Button title="Submit" onPress={handleSubmit} color="#007AFF" />
            <Button title="Cancel" onPress={() => setShowFeedback(false)} color="#999" />
          </View>
        </View>
      </Modal>
    </>
  );
};
```

### Crash Reporting

```typescript
// mobile/src/services/crashReporting.ts
import * as Sentry from "@sentry/react-native";

export const initializeCrashReporting = () => {
  Sentry.init({
    dsn: "https://your-sentry-dsn@sentry.io/project-id",
    environment: "beta",
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 100,
  });
};

export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  });
};

export const setUserContext = (userId: string, email: string) => {
  Sentry.setUser({
    id: userId,
    email,
  });
};
```

### Analytics Tracking

```typescript
// mobile/src/services/analytics.ts
import { Analytics } from "@react-native-firebase/analytics";

export const trackBetaEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  try {
    await Analytics().logEvent(eventName, {
      ...params,
      beta_version: "1.0.0-beta.1",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
};

export const trackScreenView = async (screenName: string) => {
  try {
    await Analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error("Failed to track screen:", error);
  }
};
```

---

## Backend Feedback API

### Database Schema

```typescript
// drizzle/schema.ts
export const betaFeedback = mysqlTable("beta_feedback", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  type: varchar("type", { length: 255 }).notNull(), // bug, feature, general
  message: varchar("message", { length: 2000 }).notNull(),
  rating: int("rating").default(5),
  appVersion: varchar("app_version", { length: 255 }),
  platform: varchar("platform", { length: 255 }), // ios, android
  deviceInfo: varchar("device_info", { length: 500 }),
  status: varchar("status", { length: 255 }).default("new"), // new, acknowledged, in_progress, resolved
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const betaFeedbackComments = mysqlTable("beta_feedback_comments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  feedbackId: varchar("feedback_id", { length: 255 }).references(() => betaFeedback.id),
  authorId: varchar("author_id", { length: 255 }).references(() => users.id),
  comment: varchar("comment", { length: 1000 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### tRPC Router

```typescript
// server/routers/feedback.ts
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const feedbackRouter = router({
  submitBetaFeedback: protectedProcedure
    .input(
      z.object({
        type: z.enum(["bug", "feature", "general"]),
        message: z.string(),
        rating: z.number().min(1).max(5),
        appVersion: z.string(),
        platform: z.enum(["ios", "android"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const feedbackId = crypto.randomUUID();
      await db.insert(schema.betaFeedback).values({
        id: feedbackId,
        userId: ctx.user.id,
        type: input.type,
        message: input.message,
        rating: input.rating,
        appVersion: input.appVersion,
        platform: input.platform,
      });

      // Send notification to team
      await notifyTeam(`New ${input.type} feedback from ${ctx.user.id}`);

      return { feedbackId, success: true };
    }),

  getBetaFeedback: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(schema.betaFeedback)
        .orderBy(desc(schema.betaFeedback.createdAt))
        .limit(input.limit || 50);
    }),
});
```

---

## Beta Testing Timeline

**Week 1-2: Internal Testing**
- [ ] Test core features
- [ ] Verify API connectivity
- [ ] Check crash reporting
- [ ] Validate analytics

**Week 3-4: Closed Beta (100-1000 testers)**
- [ ] Collect user feedback
- [ ] Monitor crash reports
- [ ] Track performance metrics
- [ ] Fix critical bugs

**Week 5-6: Open Beta (5000+ testers)**
- [ ] Broader user testing
- [ ] Stress test infrastructure
- [ ] Gather feature requests
- [ ] Final polish

**Week 7: Release Candidate**
- [ ] Final bug fixes
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## Success Metrics

- ✅ Crash rate < 0.5%
- ✅ Average rating > 4.0/5.0
- ✅ 80%+ feature completion
- ✅ <500ms average response time
- ✅ 90%+ API success rate
- ✅ <100MB app size
- ✅ <5 minute onboarding time

---

**Status:** 🚀 Ready for Beta Launch

*For questions, contact: mobile@skycoin4444.com*
