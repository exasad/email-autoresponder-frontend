import React from 'react';
import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <Tooltip title={isDark ? 'Switch to light' : 'Switch to dark'}>
      <Button type="text" shape="circle" onClick={toggle} icon={isDark ? <SunOutlined /> : <MoonOutlined />} />
    </Tooltip>
  );
}
