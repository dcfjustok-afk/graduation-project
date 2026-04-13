import {
  AlertOutlined,
  ApiOutlined,
  BlockOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  NumberOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Space, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '系统总览' },
  { key: '/log-generator', icon: <EditOutlined />, label: '日志生成器' },
  { key: '/logs', icon: <FileTextOutlined />, label: '日志中心' },
  { key: '/audit', icon: <SafetyCertificateOutlined />, label: '审计中心' },
  { key: '/alerts', icon: <AlertOutlined />, label: '异常告警' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth={88} width={272} className="app-sider">
        <div className="brand-block">
          <div className="brand-logo">
            <BlockOutlined />
            <span className="brand-logo__ring" />
          </div>
          <div>
            <div className="brand-title">可信日志审计</div>
            <div className="brand-subtitle">BLOCKCHAIN AUDIT</div>
          </div>
        </div>

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="side-menu"
          onClick={({ key }) => navigate(key)}
        />

        <div className="sider-footer">
          <div className="sider-footer__label">CHAIN STATUS</div>
          <div className="sider-footer__chain">
            <div className="chain-node-mini">
              <span className="chain-node-mini__dot chain-node-mini__dot--active" />
              <span>Hardhat</span>
            </div>
            <div className="chain-node-mini">
              <span className="chain-node-mini__dot chain-node-mini__dot--active" />
              <span>Agent</span>
            </div>
            <div className="chain-node-mini">
              <span className="chain-node-mini__dot chain-node-mini__dot--active" />
              <span>Audit</span>
            </div>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="app-header">
          <div className="header-chain-bar">
            <div className="header-chain-stat">
              <NumberOutlined className="header-chain-stat__icon" />
              <div>
                <span className="header-chain-stat__label">区块高度</span>
                <span className="header-chain-stat__value">#127</span>
              </div>
            </div>
            <div className="header-chain-divider" />
            <div className="header-chain-stat">
              <CloudServerOutlined className="header-chain-stat__icon" />
              <div>
                <span className="header-chain-stat__label">网络节点</span>
                <span className="header-chain-stat__value">Hardhat Local</span>
              </div>
            </div>
            <div className="header-chain-divider" />
            <div className="header-chain-stat">
              <ApiOutlined className="header-chain-stat__icon" />
              <div>
                <span className="header-chain-stat__label">功能模块</span>
                <span className="header-chain-stat__value">5 Active</span>
              </div>
            </div>
            <div className="header-chain-divider" />
            <div className="header-chain-stat">
              <LinkOutlined className="header-chain-stat__icon" />
              <div>
                <span className="header-chain-stat__label">最新哈希</span>
                <span className="header-chain-stat__value hash-mono">0x4f3a...8e2b</span>
              </div>
            </div>
          </div>
          <Space>
            <Tag className="header-beacon">
              <span className="beacon-dot" />
              已连接
            </Tag>
          </Space>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
