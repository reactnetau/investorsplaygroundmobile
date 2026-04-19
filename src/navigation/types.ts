import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  ConfirmSignup: { email: string };
  ForgotPassword: undefined;
  ConfirmReset: { email: string };
};

export type AppTabParamList = {
  Dashboard: undefined;
  Holdings: { portfolioId?: string };
  Portfolios: undefined;
  Account: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList> | undefined;
  AddHolding: { portfolioId: string };
  SellHolding: { holdingId: string; code: string; quantity: number; buyPrice: number; currentPrice?: number; priceCurrency: string };
  CreatePortfolio: undefined;
  Settings: undefined;
};
