import { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Typography, 
  Row, 
  Col,
  Breadcrumb
} from 'antd';
import { 
  UserOutlined, 
  SecurityScanOutlined, 
  BellOutlined,
  HomeOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import ProfileInfo from '../components/Profile/ProfileInfo';
import SecuritySettings from '../components/Profile/SecuritySettings';
import NotificationSettings from '../components/Profile/NotificationSettings';
import ProfileProjects from '../components/Profile/ProfileProjects';

const { Title } = Typography;

const ProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span className="flex items-center">
          <UserOutlined className="mr-2" />
          Profile Info
        </span>
      ),
      children: <ProfileInfo />,
    },
   
    {
      key: 'security',
      label: (
        <span className="flex items-center">
          <SecurityScanOutlined className="mr-2" />
          Security
        </span>
      ),
      children: <SecuritySettings />,
    },
    // {
    //   key: 'notifications',
    //   label: (
    //     <span className="flex items-center">
    //       <BellOutlined className="mr-2" />
    //       Notifications
    //     </span>
    //   ),
    //   children: <NotificationSettings />,
    // },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6 text-zinc-900 dark:bg-neutral-950 dark:text-zinc-50">
      <div
        className={`mx-auto ${activeTab === 'projects' ? 'max-w-7xl' : 'max-w-4xl'}`}
      >
        <div className="mb-6">
          <Title level={2} className="!mb-2 !text-zinc-900 dark:!text-zinc-50">
            Profile Settings
          </Title>
          <p className="font-bold text-zinc-600 dark:text-zinc-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div
          className={
            activeTab === 'projects'
              ? ''
              : 'overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className={`profile-settings-tabs ${activeTab === 'projects' ? 'projects-tab' : ''} [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-nav]:pt-2 sm:[&_.ant-tabs-nav]:px-6 [&_.ant-tabs-tab]:text-zinc-600 dark:[&_.ant-tabs-tab]:text-zinc-400 [&_.ant-tabs-tab-active]:!text-blue-600 dark:[&_.ant-tabs-tab-active]:!text-blue-400 [&_.ant-tabs-ink-bar]:!bg-blue-600 dark:[&_.ant-tabs-ink-bar]:!bg-blue-400`}
            tabBarStyle={activeTab === 'projects' ? { 
              background: 'white', 
              margin: 0, 
              padding: '0 24px',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            } : { margin: 0, padding: '0 8px', background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;