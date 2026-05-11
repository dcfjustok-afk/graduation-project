import { VIEW_LOG_STATUSES } from '@graduation-project/shared';
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, ReloadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Space, Statistic, Table, Tag, message } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLogs } from '../api/dataService';
import { SectionHeader } from '../components/SectionHeader';
import type { LogRecord } from '../types';

const statusColorMap: Record<LogRecord['status'], string> = {
  [VIEW_LOG_STATUSES.CHAINED]: 'green',
  [VIEW_LOG_STATUSES.AUDIT_PASSED]: 'green',
  [VIEW_LOG_STATUSES.PENDING_AUDIT]: 'gold',
  [VIEW_LOG_STATUSES.ABNORMAL]: 'red',
};

const columns: TableProps<LogRecord>['columns'] = [
  { title: '日志编号', dataIndex: 'id', key: 'id', width: 100 },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', ellipsis: true },
  { title: '来源文件', dataIndex: 'source', key: 'source', ellipsis: true },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    width: 80,
    render: (value: LogRecord['level']) => <Tag color={value === 'ERROR' ? 'red' : value === 'WARN' ? 'gold' : 'blue'}>{value}</Tag>,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (value: LogRecord['status']) => <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>,
  },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 170 },
  { title: '哈希摘要', dataIndex: 'hash', key: 'hash', ellipsis: true },
  { title: '审计说明', dataIndex: 'auditMessage', key: 'auditMessage', ellipsis: true },
];

export function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState<string>('');
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async (notify = false) => {
    setLoading(true);

    try {
      const nextLogs = await getLogs();
      setLogs(nextLogs);

      if (notify) {
        message.success(`日志已刷新，当前共${nextLogs.length} 条`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs(searchParams.get('refresh') === '1');

    if (searchParams.get('refresh') === '1') {
      searchParams.delete('refresh');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const filteredLogs = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    if (!lowerKeyword) {
      return logs;
    }

    return logs.filter((item) =>
      [item.id, item.taskName, item.source, item.level, item.status, item.hash].some((field) =>
        field.toLowerCase().includes(lowerKeyword),
      ),
    );
  }, [keyword, logs]);

  const stats = useMemo(() => {
    const chained = logs.filter((l) => l.status === VIEW_LOG_STATUSES.CHAINED || l.status === VIEW_LOG_STATUSES.AUDIT_PASSED).length;
    const pending = logs.filter((l) => l.status === VIEW_LOG_STATUSES.PENDING_AUDIT).length;
    const abnormal = logs.filter((l) => l.status === VIEW_LOG_STATUSES.ABNORMAL).length;
    return { total: logs.length, chained, pending, abnormal };
  }, [logs]);

  return (
    <div className="section-space">
      <SectionHeader
        title="日志中心"
        subtitle="展示系统采集的所有日志记录，支持按关键字搜索和状态筛选。"
        extra={
          <Button size="large" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadLogs(true)}>
            刷新日志
          </Button>
        }
      />

      {/* ── Summary Stats ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="日志总条数" value={stats.total} prefix={<FileTextOutlined />} valueStyle={{ color: '#2563eb' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="已上链/审计通过" value={stats.chained} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="待审计" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="异常记录" value={stats.abnormal} prefix={<WarningOutlined />} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Search + Table ── */}
      <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SearchOutlined /> 日志检索</span>} variant="borderless">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder="搜索日志编号、任务名、来源文件、哈希摘要"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <Table<LogRecord>
            rowKey="id"
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }}
            scroll={{ x: 1100 }}
          />
        </Space>
      </Card>
    </div>
  );
}
