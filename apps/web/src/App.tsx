import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#8b5cf6',
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgLayout: '#f7fafc',
          colorBorder: '#dbe3ee',
          colorBorderSecondary: '#e8edf5',
          colorText: '#111827',
          colorTextSecondary: '#64748b',
          boxShadowSecondary: '0 18px 48px rgba(15, 23, 42, 0.10)',
          fontSize: 14,
        },
        components: {
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f7ff',
            borderColor: '#e8edf5',
          },
          Card: {
            colorBgContainer: '#ffffff',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#475569',
            itemHoverBg: '#f1f7ff',
            itemHoverColor: '#2563eb',
            itemSelectedBg: '#eaf3ff',
            itemSelectedColor: '#2563eb',
          },
          Input: {
            colorBgContainer: '#ffffff',
            activeBorderColor: '#2563eb',
          },
          Select: {
            colorBgContainer: '#ffffff',
          },
          Tag: {
            defaultBg: '#f1f5f9',
            defaultColor: '#475569',
          },
          Timeline: {
            dotBg: '#ffffff',
          },
          Steps: {
            colorPrimary: '#2563eb',
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
