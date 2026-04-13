import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorSuccess: '#00ff88',
          colorWarning: '#ffaa00',
          colorError: '#ff3366',
          colorInfo: '#7c3aed',
          borderRadius: 12,
          colorBgContainer: '#0d1525',
          colorBgElevated: '#111d33',
          colorBgLayout: '#070b14',
          colorBorder: 'rgba(0, 212, 255, 0.12)',
          colorBorderSecondary: 'rgba(0, 212, 255, 0.06)',
          colorText: '#e2e8f0',
          colorTextSecondary: '#7c8db5',
          boxShadowSecondary: '0 20px 60px rgba(0, 0, 0, 0.4)',
          fontSize: 14,
        },
        components: {
          Table: {
            headerBg: 'rgba(0, 212, 255, 0.04)',
            headerColor: '#7c8db5',
            rowHoverBg: 'rgba(0, 212, 255, 0.06)',
            borderColor: 'rgba(0, 212, 255, 0.08)',
          },
          Card: {
            colorBgContainer: 'rgba(13, 21, 37, 0.85)',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(0, 212, 255, 0.12)',
            darkItemSelectedColor: '#00d4ff',
            darkItemColor: '#7c8db5',
            darkItemHoverColor: '#00d4ff',
            darkItemHoverBg: 'rgba(0, 212, 255, 0.06)',
          },
          Input: {
            colorBgContainer: 'rgba(0, 212, 255, 0.04)',
            activeBorderColor: '#00d4ff',
          },
          Select: {
            colorBgContainer: 'rgba(0, 212, 255, 0.04)',
          },
          Tag: {
            defaultBg: 'rgba(0, 212, 255, 0.08)',
            defaultColor: '#7c8db5',
          },
          Timeline: {
            dotBg: 'transparent',
          },
          Steps: {
            colorPrimary: '#00d4ff',
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
