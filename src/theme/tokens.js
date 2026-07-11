/**
 * Design tokens shared across light and dark modes. Consumed by Ant Design's
 * ConfigProvider (see ThemeContext). The brand is a refined indigo with a warm
 * accent — deliberately distinct from stock admin-template blue.
 */
export const BRAND = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const shared = {
  colorPrimary: BRAND.primary,
  colorSuccess: BRAND.success,
  colorWarning: BRAND.warning,
  colorError: BRAND.error,
  colorInfo: BRAND.info,
  borderRadius: 10,
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontSize: 14,
  wireframe: false,
};

export const lightToken = {
  ...shared,
  colorBgLayout: '#f5f6fa',
  colorBgContainer: '#ffffff',
  colorTextBase: '#1f2430',
};

export const darkToken = {
  ...shared,
  colorBgLayout: '#0f1117',
  colorBgContainer: '#171a21',
  colorBgElevated: '#1e222b',
  colorBorder: '#2a2f3a',
  colorTextBase: '#e6e8ee',
};

export const componentTokens = {
  Layout: {
    headerBg: 'transparent',
    bodyBg: 'transparent',
    siderBg: 'transparent',
  },
  Menu: {
    itemBorderRadius: 8,
    itemMarginInline: 8,
    itemHeight: 42,
  },
  Card: { borderRadiusLG: 14 },
  Table: { borderRadiusLG: 12, headerBg: 'transparent' },
  Button: { controlHeight: 38, fontWeight: 500 },
};
