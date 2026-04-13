import {
  AlertOutlined,
  BlockOutlined,
  EditOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Space, Tag, Typography } from 'antd';
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
          <div className="brand-logo"><BlockOutlined /></div>
          <div>
            <Typography.Text className="brand-title">可信任务日志审计</Typography.Text>
            <Typography.Text className="brand-subtitle">Blockchain · Audit</Typography.Text>
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
          <div className="sider-footer__label">SYSTEM STATUS</div>
          <Space wrap>
            <Tag color="success">
              运行中
            </Tag>
            <Tag color="purple">
              链上存证
            </Tag>
          </Space>
        </div>
      </Sider>

      <Layout>
        <Header className="app-header">
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: '#e2e8f0' }}>
              区块链可信日志审计平台
            </Typography.Title>
            <Typography.Text style={{ color: '#4a6fa5', fontSize: 12 }}>
              日志采集 → 链下存储 → 链上存证 → 审计核验 → 异常告警
            </Typography.Text>
          </div>
          <Space wrap>
            <Tag color="success" className="header-tag">
              系统运行中
            </Tag>
            <Tag color="blue" className="header-tag">
              Hardhat 本地链
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
