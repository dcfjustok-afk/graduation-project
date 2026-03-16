import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  extra?: ReactNode;
}

export function SectionHeader({ title, subtitle, extra }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <Space direction="vertical" size={4}>
        <Typography.Title level={2} className="page-title">
          {title}
        </Typography.Title>
        <Typography.Paragraph className="page-subtitle">{subtitle}</Typography.Paragraph>
      </Space>
      {extra ? <div>{extra}</div> : null}
    </div>
  );
}
