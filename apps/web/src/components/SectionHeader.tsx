import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  extra?: ReactNode;
}

export function SectionHeader({ title, subtitle, extra }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header__left">
        <div className="section-header__title-row">
          <div className="section-header__accent-bar" />
          <Typography.Title level={2} className="page-title">
            {title}
          </Typography.Title>
        </div>
        <Typography.Paragraph className="page-subtitle">{subtitle}</Typography.Paragraph>
      </div>
      {extra ? <div className="section-header__actions">{extra}</div> : null}
    </div>
  );
}
