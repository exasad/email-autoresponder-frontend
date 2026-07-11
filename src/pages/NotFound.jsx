import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="The page you're looking for doesn't exist."
        extra={<Button type="primary" onClick={() => navigate('/')}>Back home</Button>}
      />
    </div>
  );
}
