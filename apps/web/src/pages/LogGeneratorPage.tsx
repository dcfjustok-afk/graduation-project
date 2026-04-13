import {
  ApartmentOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  FireOutlined,
  RocketOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLog, generateLogs } from '../api/dataService';
import { mapLogGeneratorToBatchPayload, mapLogGeneratorToSubmitPayload, type LogGeneratorFormValues } from '../api/mappers';
import { SectionHeader } from '../components/SectionHeader';
import type { LogGenerateFailure } from '../types';

const presets: Array<{ key: string; label: string; tagColor: string; values: LogGeneratorFormValues }> = [
  {
    key: 'info-daily',
    label: '日报任务 / INFO',
    tagColor: 'blue',
    values: {
      taskName: '日报生成任务',
      sourceType: 'scheduler',
      sourcePath: '/var/log/daily-report.log',
      logLevel: 'INFO',
      logContent: '日报任务执行完成，开始归档结果。',
      batchCount: 5,
      intervalMs: 1000,
    },
  },
  {
    key: 'warn-backup',
    label: '备份延迟 / WARN',
    tagColor: 'gold',
    values: {
      taskName: '定时备份任务',
      sourceType: 'backup-service',
      sourcePath: '/var/log/backup.log',
      logLevel: 'WARN',
      logContent: '检测到备份延迟，等待重试队列处理。',
      batchCount: 3,
      intervalMs: 1500,
    },
  },
  {
    key: 'error-auth',
    label: '权限异常 / ERROR',
    tagColor: 'red',
    values: {
      taskName: '权限变更任务',
      sourceType: 'auth-service',
      sourcePath: '/var/log/auth-change.log',
      logLevel: 'ERROR',
      logContent: '权限变更失败，检测到异常访问来源。',
      batchCount: 2,
      intervalMs: 2000,
    },
  },
];

const failureColumns: ColumnsType<LogGenerateFailure> = [
  { title: '序号', dataIndex: 'index', key: 'index', render: (value: number) => value + 1 },
  { title: '失败原因', dataIndex: 'error', key: 'error' },
];

const initialValues: LogGeneratorFormValues = {
  taskName: '数据同步任务',
  sourceType: 'web-generator',
  sourcePath: '/virtual/web-generator.log',
  logLevel: 'INFO',
  logContent: '开始执行日志生成演示任务。',
  batchCount: 5,
  intervalMs: 1000,
};

export function LogGeneratorPage() {
  const [form] = Form.useForm<LogGeneratorFormValues>();
  const navigate = useNavigate();
  const [singleLoading, setSingleLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [createdLogId, setCreatedLogId] = useState<number | null>(null);
  const [batchSummary, setBatchSummary] = useState<{ successCount: number; failures: LogGenerateFailure[] } | null>(null);

  const values = Form.useWatch([], form) as LogGeneratorFormValues | undefined;
  const preview = useMemo(() => ({
    logLevel: values?.logLevel || initialValues.logLevel,
    taskName: values?.taskName || initialValues.taskName,
    sourceType: values?.sourceType || initialValues.sourceType,
    batchCount: values?.batchCount || initialValues.batchCount,
  }), [values]);

  const applyPreset = (presetKey: string) => {
    const preset = presets.find((item) => item.key === presetKey);
    if (!preset) {
      return;
    }

    form.setFieldsValue(preset.values);
    message.success(`已填充模板：${preset.label}`);
  };

  const handleSingleSubmit = async () => {
    const formValues = await form.validateFields();
    setSingleLoading(true);

    try {
      const result = await createLog(mapLogGeneratorToSubmitPayload(formValues));
      setCreatedLogId(result.log.id);
      setBatchSummary(null);
      message.success(`日志创建成功，ID: ${result.log.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '日志创建失败');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    const formValues = await form.validateFields();
    setBatchLoading(true);

    try {
      const result = await generateLogs(mapLogGeneratorToBatchPayload(formValues));
      setCreatedLogId(null);
      setBatchSummary({ successCount: result.successCount, failures: result.failures });
      message.success(`批量生成完成：成功 ${result.successCount} 条，失败 ${result.failures.length} 条`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量生成失败');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="section-space">
      <SectionHeader
        title="日志生成器"
        subtitle="通过表单生成日志数据，支持单条提交和批量生成，日志将直接写入后端并上链存证。"
        extra={
          <Button size="large" onClick={() => navigate('/logs?refresh=1&source=generator')}>
            查看日志中心
          </Button>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="panel-card cyber-card" variant="borderless">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="generator-hero">
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>可视化日志造数平台</Typography.Title>
                  <Typography.Paragraph style={{ margin: '8px 0 0' }} type="secondary">
                    按场景生成 INFO / WARN / ERROR 日志，提交后直接去日志列表或审计中心继续验证整条链路。
                  </Typography.Paragraph>
                </div>
                <div className="generator-hero__stats">
                  <div className="generator-hero__pill"><RocketOutlined /> 一键造数</div>
                  <div className="generator-hero__pill"><FieldTimeOutlined /> 批量节奏控制</div>
                </div>
              </div>

              <div className="preset-grid">
                {presets.map((preset) => (
                  <button key={preset.key} type="button" className="preset-card" onClick={() => applyPreset(preset.key)}>
                    <Tag color={preset.tagColor}>{preset.values.logLevel}</Tag>
                    <strong>{preset.label}</strong>
                    <span>{preset.values.logContent}</span>
                  </button>
                ))}
              </div>

              <Form form={form} layout="vertical" initialValues={initialValues}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="taskName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
                      <Input size="large" prefix={<ApartmentOutlined />} placeholder="如：日报生成任务" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="sourceType" label="来源类型" rules={[{ required: true, message: '请输入来源类型' }]}>
                      <Select
                        size="large"
                        options={[
                          { value: 'web-generator', label: 'web-generator' },
                          { value: 'scheduler', label: 'scheduler' },
                          { value: 'backup-service', label: 'backup-service' },
                          { value: 'auth-service', label: 'auth-service' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="sourcePath" label="来源路径" rules={[{ required: true, message: '请输入来源路径' }]}>
                      <Input size="large" prefix={<FileTextOutlined />} placeholder="如：/var/log/daily-report.log" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="logLevel" label="日志级别" rules={[{ required: true, message: '请选择日志级别' }]}>
                      <Select
                        size="large"
                        options={[
                          { value: 'INFO', label: 'INFO' },
                          { value: 'WARN', label: 'WARN' },
                          { value: 'ERROR', label: 'ERROR' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item name="collectedAt" label="采集时间">
                      <Input size="large" prefix={<ClockCircleOutlined />} placeholder="留空则使用当前时间，如 2026-03-20T11:30:00Z" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="logContent" label="日志内容" rules={[{ required: true, message: '请输入日志内容' }]}>
                      <Input.TextArea rows={5} placeholder="输入日志正文，提交后将以 logContent 字段发送至后端。" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">批量生成参数</Divider>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="batchCount" label="生成数量" rules={[{ required: true, message: '请输入生成数量' }]}>
                      <InputNumber size="large" min={1} max={200} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="intervalMs" label="间隔毫秒">
                      <InputNumber size="large" min={0} max={10000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Space wrap>
                  <Button type="primary" size="large" icon={<FireOutlined />} loading={singleLoading} onClick={() => void handleSingleSubmit()}>
                    生成单条日志
                  </Button>
                  <Button size="large" icon={<CopyOutlined />} loading={batchLoading} onClick={() => void handleBatchSubmit()}>
                    批量生成日志
                  </Button>
                  <Button size="large" onClick={() => form.resetFields()}>
                    重置表单
                  </Button>
                </Space>
              </Form>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card className="panel-card cyber-card" title={<span className="card-title-icon"><DashboardOutlined /> 参数预览</span>} variant="borderless">
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Statistic title="当前级别" value={preview.logLevel} prefix={<FireOutlined />} />
                </Col>
                <Col span={12}>
                  <Statistic title="批量数量" value={preview.batchCount || 0} prefix={<CopyOutlined />} />
                </Col>
              </Row>
              <Divider />
              <Space direction="vertical" size="small">
                <Typography.Text strong>任务预览</Typography.Text>
                <Typography.Text type="secondary">{preview.taskName}</Typography.Text>
                <Typography.Text type="secondary">来源：{preview.sourceType}</Typography.Text>
              </Space>
            </Card>

            <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SendOutlined /> 提交结果</span>} variant="borderless">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className="soft-note">
                  单条提交会返回新建日志ID；批量生成会统计成功条数和失败详情。
                </div>
                {createdLogId ? <Tag color="success">最近创建日志ID：{createdLogId}</Tag> : null}
                {batchSummary ? (
                  <div className="generator-result-block">
                    <div className="generator-result-block__summary">
                      <span>成功 {batchSummary.successCount} 条</span>
                      <span>失败 {batchSummary.failures.length} 条</span>
                    </div>
                    <Table<LogGenerateFailure>
                      rowKey={(item) => `${item.index}-${item.error}`}
                      columns={failureColumns}
                      dataSource={batchSummary.failures}
                      pagination={false}
                      locale={{ emptyText: '当前没有失败项' }}
                      size="small"
                    />
                  </div>
                ) : null}
                {!createdLogId && !batchSummary ? <Typography.Text type="secondary">还没有提交结果，先选一个模板或填写表单开始生成日志。</Typography.Text> : null}
                <Button type="link" onClick={() => navigate('/logs?refresh=1&source=generator')}>
                  去日志中心查看最新记录
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
