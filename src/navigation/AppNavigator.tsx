import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AppStackParamList, AppTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HoldingsScreen } from '../screens/HoldingsScreen';
import { PortfoliosScreen } from '../screens/PortfoliosScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { AddHoldingScreen } from '../screens/AddHoldingScreen';
import { SellHoldingScreen } from '../screens/SellHoldingScreen';
import { CreatePortfolioScreen } from '../screens/CreatePortfolioScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, fontSize } from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createStackNavigator<AppStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'grid-outline',
            Holdings: 'trending-up-outline',
            Portfolios: 'briefcase-outline',
            Account: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Holdings" component={HoldingsScreen} options={{ title: 'Holdings' }} />
      <Tab.Screen name="Portfolios" component={PortfoliosScreen} options={{ title: 'Portfolios' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600', fontSize: fontSize.base },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AddHolding" component={AddHoldingScreen} options={{ title: 'Buy stock' }} />
      <Stack.Screen name="SellHolding" component={SellHoldingScreen} options={{ title: 'Sell position' }} />
      <Stack.Screen name="CreatePortfolio" component={CreatePortfolioScreen} options={{ title: 'New portfolio' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
