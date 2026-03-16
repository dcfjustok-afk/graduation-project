import { BellOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Empty, Row, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getAlerts } from '../api/mockClient';
import { SectionHeader } from '../components/SectionHeader';
import type { AlertRecord } from '../types';

const colorMap: Record<AlertRecord['level'], string> = {
  高危: 'red',
  中危: 'gold',
  提示: 'blue',
};

const badgeMap: Record<AlertRecord['status'], 'error' | 'processing' | 'default'> = {
  待处理: 'error',
  处理中: 'processing',
  已忽略: 'default',
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    void getAlerts().then(setAlerts);
  }, []);

  return (
    <div className="section-space">
      <SectionHeader title="异常告警" subtitle="告警卡片和状态样式已经预留完成，后面只需要接真实告警数据。" />

      {alerts.length === 0 ? (
        <Card className="panel-card" bordered={false}>
          <Empty description="暂无告警" />
        </Card>
      ) : (
        <Row gutter={[18, 18]}>
          {alerts.map((item) => (
            <Col xs={24} md={12} xl={8} key={item.id}>
              <Card className="alert-card" bordered={false}>
                <div className="alert-card__top">
                  <div className="alert-card__icon">
                    <BellOutlined />
                  </div>
                  <div>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {item.title}
                    </Typography.Title>
                    <Typography.Text type="secondary">{item.time}</Typography.Text>
                  </div>
                </div>

                <Typography.Paragraph className="alert-card__desc">{item.description}</Typography.Paragraph>

                <div className="alert-card__footer">
                  <Tag color={colorMap[item.level]}>{item.level}</Tag>
                  <Badge status={badgeMap[item.status]} text={item.status} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
