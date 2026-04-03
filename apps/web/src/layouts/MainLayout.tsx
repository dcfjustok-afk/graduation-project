import {
  AlertOutlined,
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
  { key: '/log-generator', icon: <EditOutlined />, label: '日志生成台' },
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
          <div className="brand-logo">TA</div>
          <div>
            <Typography.Text className="brand-title">可信任务日志审计</Typography.Text>
            <Typography.Text className="brand-subtitle">区块链 · 全栈系统</Typography.Text>
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
          <div className="sider-footer__label">当前模式</div>
          <Space wrap>
            <Tag color="success" bordered={false}>
              真实数据
            </Tag>
            <Tag color="purple" bordered={false}>
              链上存证
            </Tag>
          </Space>
        </div>
      </Sider>

      <Layout>
        <Header className="app-header">
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              区块链可信日志审计平台
            </Typography.Title>
            <Typography.Text type="secondary">日志采集 → 链下存储 → 链上存证 → 审计核验 → 异常告警</Typography.Text>
          </div>
          <Space wrap>
            <Tag color="success" className="header-tag" bordered={false}>
              系统运行中
            </Tag>
            <Tag color="blue" className="header-tag" bordered={false}>
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
