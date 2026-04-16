"use client";
import { Modal, Form, Input, Select, Button } from "antd";

const { Option } = Select;

/**
 * Shared add/edit modal for service nodes.
 * Parent owns the Form instance and submit logic (validate + API).
 */
export default function ServiceNodeModal({
  open,
  onCancel,
  onSubmit,
  form,
  editingItem,
  githubBranches = [],
  loadingGithubBranches = false,
  submitLoading = false,
}) {
  const isEdit = !!editingItem;

  const footer = (
    <div className="flex justify-end gap-2">
      <Button type="default" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="primary"
        onClick={onSubmit}
        loading={submitLoading}
        disabled={!isEdit && loadingGithubBranches}
      >
        {isEdit ? "Update" : "Add"} node
      </Button>
    </div>
  );

  return (
    <Modal
      title={isEdit ? "Edit Node" : "Add Node"}
      open={open}
      footer={footer}
      width={800}
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="service_name"
          label="Name"
          rules={[
            { required: true, message: "Please enter a name" },
            {
              whitespace: true,
              message: "Name cannot be only spaces",
            },
          ]}
        >
          <Input
            size="large"
            autoComplete="off"
            placeholder="Enter node name"
          />
        </Form.Item>

        <Form.Item
          name="branch_name"
          label="Branch"
          rules={
            isEdit
              ? []
              : [
                  {
                    required: true,
                    message: "Please select a branch",
                  },
                ]
          }
        >
          <Select
            size="large"
            placeholder={
              loadingGithubBranches
                ? "Loading branches…"
                : "Select a branch"
            }
            loading={loadingGithubBranches}
            disabled={isEdit || loadingGithubBranches}
            showSearch
            filterOption={(input, option) => {
              const branchName = String(option?.value ?? "");
              return branchName
                .toLowerCase()
                .includes(String(input ?? "").toLowerCase());
            }}
          >
            {githubBranches.map((branch, index) => (
              <Option key={branch} value={branch}>
                {index + 1}. {branch}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
