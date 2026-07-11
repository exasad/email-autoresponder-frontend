import React, { useState } from 'react';
import { Layout, Menu, Grid, Drawer, Avatar, Dropdown, Typography, Button, theme as antdTheme } from 'antd';
import {
  MenuOutlined, LogoutOutlined, UserOutlined, DownOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

/**
 * Reusable authenticated shell (sidebar + topbar) used by both the admin and
 * user portals. `nav` describes the menu; `accent` colors the logo mark.
 */
export default function AppShell({ portal, brand, nav, api, profile, onLogout }) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = antdTheme.useToken();

  const selectedKey = nav
    .map((n) => n.key)
    .filter((k) => location.pathname === k || location.pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0] || location.pathname;

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      style={{ border: 'none', background: 'transparent', paddingTop: 8 }}
      onClick={() => isMobile && setDrawer(false)}
      items={nav.map((n) => ({
        key: n.key,
        icon: n.icon,
        label: <Link to={n.key}>{n.label}</Link>,
      }))}
    />
  );

  const logo = (
    <div className="b2b-logo" style={{ padding: '18px 16px' }}>
      <img src="/logo-mark.svg" alt={brand} width={34} height={34} style={{ borderRadius: 9, display: 'block' }} />
      {!collapsed && <span>{brand}</span>}
    </div>
  );

  const sidebarBg = token.colorBgContainer;

  const profileMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'My profile' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') navigate(`/${portal}/profile`);
      if (key === 'logout') onLogout();
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          width={248}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          theme="light"
          style={{ background: sidebarBg, borderRight: `1px solid ${token.colorBorderSecondary}`, position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
        >
          {logo}
          {menu}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          placement="left"
          width={260}
          styles={{ body: { padding: 0 } }}
          title={<div className="b2b-logo"><img src="/logo-mark.svg" alt={brand} width={30} height={30} style={{ borderRadius: 8 }} />{brand}</div>}
        >
          {menu}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky', top: 0, zIndex: 10, height: 60,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {isMobile ? (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawer(true)} />
            ) : (
              <Button
                type="text"
                aria-label="Toggle sidebar"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((c) => !c)}
              />
            )}
            <Typography.Text type="secondary" style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {portal} panel
            </Typography.Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <ThemeToggle />
            <NotificationBell api={api} />
            <Dropdown menu={profileMenu} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, minWidth: 0 }}>
                <Avatar size={32} src={profile?.avatar_url} style={{ background: '#4f46e5', flex: '0 0 auto' }}>
                  {(profile?.name || '?').slice(0, 1).toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <span style={{ lineHeight: 1.1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
                  </span>
                )}
                <DownOutlined style={{ fontSize: 10, opacity: 0.5 }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: isMobile ? 16 : 24 }}>
          <div className="page-fade" style={{ maxWidth: 1360, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
