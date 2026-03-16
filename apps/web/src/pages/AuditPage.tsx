import { CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Card, Col, List, Result, Row, Space, Statistic, Table, Tag, Timeline } from 'antd';
import type { TableProps } from 'antd';
import { SectionHeader } from '../components/SectionHeader';
import { auditSummary, auditTimeline, logs } from '../mock';
import type { LogRecord } from '../types';

const columns: TableProps<LogRecord>['columns'] = [
  { title: '日志编号', dataIndex: 'id', key: 'id' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  {
    title: '当前状态',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => <Tag color={value === '发现异常' ? 'red' : value === '待审计' ? 'gold' : 'green'}>{value}</Tag>,
  },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
];

export function AuditPage() {
  return (
    <div className="section-space">
      <SectionHeader
        title="审计中心"
        subtitle="先把审计流程页面和交互按钮做好，后续只需要把按钮动作绑定到真实接口。"
        extra={
          <Button type="primary" icon={<ThunderboltOutlined />} size="large">
            一键批量审计
          </Button>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="待处理" value={auditSummary.pending} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="审计通过" value={auditSummary.passed} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="预警数量" value={auditSummary.warning} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="异常数量" value={auditSummary.abnormal} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={15}>
          <Card className="panel-card" title="审计执行面板" bordered={false}>
            <Result
              status="info"
              title="当前为 mock 演示流程"
              subTitle="后续后端接入后，这里可以直接显示链上校验进度、交易信息、异常原因和回溯详情。"
            />
            <Timeline items={auditTimeline} />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="panel-card" title="后续扩展位" bordered={false}>
            <List
              dataSource={[
                '支持单条审计、批量审计、定时审计。',
                '接入区块高度、交易哈希、钱包地址等链上字段。',
                '接入真实异常原因与差异对比内容。',
                '增加实时状态轮询与审计过程动画。',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>

      <Card className="panel-card" title="最近审计对象" bordered={false}>
        <Table<LogRecord> rowKey="id" columns={columns} dataSource={logs} pagination={{ pageSize: 5, showSizeChanger: false }} />
      </Card>
    </div>
  );
}
