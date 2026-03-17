import { SearchOutlined } from '@ant-design/icons';
import { Card, Input, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getLogs } from '../api/dataService';
import { SectionHeader } from '../components/SectionHeader';
import type { LogRecord } from '../types';

const statusColorMap: Record<string, string> = {
  已上链: 'green',
  待审计: 'gold',
  发现异常: 'red',
};

const columns: TableProps<LogRecord>['columns'] = [
  { title: '日志编号', dataIndex: 'id', key: 'id' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '来源文件', dataIndex: 'source', key: 'source', ellipsis: true },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    render: (value: LogRecord['level']) => <Tag color={value === 'ERROR' ? 'red' : value === 'WARN' ? 'gold' : 'blue'}>{value}</Tag>,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>,
  },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
  { title: '哈希摘要', dataIndex: 'hash', key: 'hash' },
];

export function LogsPage() {
  const [keyword, setKeyword] = useState<string>('');
  const [logs, setLogs] = useState<LogRecord[]>([]);

  useEffect(() => {
    void getLogs().then(setLogs);
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

  return (
    <div className="section-space">
      <SectionHeader
        title="日志中心"
        subtitle="字段先保持松耦合设计。后续后端接入时，只需要把表格映射到真实字段。"
      />

      <Card className="panel-card" bordered={false}>
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
            pagination={{ pageSize: 6, showSizeChanger: false }}
            scroll={{ x: 1100 }}
          />

          <div className="soft-note">
            当前先展示前端页面体验，不强绑定字段类型细节，方便你后面开发后端时自由扩展。
          </div>
        </Space>
      </Card>
    </div>
  );
}
