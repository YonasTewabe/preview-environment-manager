import {
  Form,
  Input,
  Button,
  Card,
  message,
} from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useChangePassword } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';

const SecuritySettings = () => {
  const [passwordForm] = Form.useForm();
  
  // Get current user and change password mutation
  const { user } = useAuth();
  const changePasswordMutation = useChangePassword();


  const handlePasswordChange = async (values) => {
    if (!user?.id) {
      message.error('User not found');
      return;
    }

    const { currentPassword, newPassword } = values;
    
    changePasswordMutation.mutate(
      { 
        userId: user.id, 
        passwordData: { currentPassword, newPassword } 
      },
      {
        onSuccess: () => {
          // Reset form after successful change
          passwordForm.resetFields();
        },
        onError: (error) => {
          console.error('Password change error:', error);
        }
      }
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4 sm:px-6">
      {/* Password Change Section */}
      <Card
        title="Change Password"
        className="border-zinc-200/80 shadow-sm dark:border-zinc-800 dark:!bg-zinc-950 [&_.ant-card-head]:border-zinc-200/80 dark:[&_.ant-card-head]:border-zinc-800 dark:[&_.ant-card-head]:!bg-zinc-900 [&_.ant-card-head-title]:text-zinc-900 dark:[&_.ant-card-head-title]:text-zinc-100"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="space-y-4"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: 'Please enter your current password' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your current password"
              size="large"
              className="rounded-lg"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters long' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your new password"
              size="large"
              className="rounded-lg"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm your new password"
              size="large"
              className="rounded-lg"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <div className="text-center pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isPending}
              size="large"
              className="min-w-[160px] border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
            >
              Change Password
            </Button>
          </div>
        </Form>
      </Card>

      {/* Two-Factor Authentication */}
      {/* <Card title="Two-Factor Authentication" className="shadow-sm">
        <div className="space-y-4">
          <Alert
            message="Secure Your Account"
            description="Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your phone in addition to your password."
            type="info"
            showIcon
            className="mb-4"
          />

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={18}>
              <div className="flex items-center space-x-3">
                <SafetyCertificateOutlined className="text-2xl text-purple-600" />
                <div>
                  <Title level={5} className="!mb-1">
                    Two-Factor Authentication
                  </Title>
                  <Text type="secondary">
                    {twoFactorEnabled 
                      ? 'Your account is protected with 2FA' 
                      : 'Secure your account with 2FA'
                    }
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={6} className="text-right">
              <Switch
                checked={twoFactorEnabled}
                onChange={handleTwoFactorToggle}
                size="default"
                checkedChildren={<CheckCircleOutlined />}
                unCheckedChildren={<CloseCircleOutlined />}
              />
            </Col>
          </Row>

          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircleOutlined />
                <Text strong>2FA is enabled for your account</Text>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <MobileOutlined className="text-green-600" />
                  <Text className="text-green-600">SMS: +1 (555) ***-4567</Text>
                </div>
                <Button type="link" className="!p-0 text-green-600">
                  Change phone number
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card> */}

      {/* Security Notifications */}
      {/* <Card title="Security Notifications" className="shadow-sm">
        <div className="space-y-4">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={18}>
              <div className="flex items-center space-x-3">
                <MailOutlined className="text-2xl text-blue-600" />
                <div>
                  <Title level={5} className="!mb-1">
                    Email Notifications
                  </Title>
                  <Text type="secondary">
                    Get notified about suspicious login attempts and security changes
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={6} className="text-right">
              <Switch
                checked={emailNotifications}
                onChange={setEmailNotifications}
                size="default"
              />
            </Col>
          </Row>

          <Divider />

          <div className="space-y-3">
            <Title level={5}>Recent Security Activity</Title>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <Text strong>Password changed</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    From IP: 192.168.1.100
                  </Text>
                </div>
                <Text type="secondary" className="text-sm">
                  2 days ago
                </Text>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <Text strong>Login from new device</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    Chrome on Windows
                  </Text>
                </div>
                <Text type="secondary" className="text-sm">
                  1 week ago
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Card> */}

      {/* Session Management */}
      {/* <Card title="Active Sessions" className="shadow-sm">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 border border-green-200 bg-green-50 rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircleOutlined className="text-green-600" />
                <Text strong>Current Session</Text>
              </div>
              <Text type="secondary" className="text-sm">
                Chrome on Windows • IP: 192.168.1.100
              </Text>
            </div>
            <Text type="secondary" className="text-sm">
              Active now
            </Text>
          </div>
          
          <div className="text-center pt-2">
            <Button type="default" danger>
              Sign out all other sessions
            </Button>
          </div>
        </div>
      </Card> */}
    </div>
  );
};

export default SecuritySettings;