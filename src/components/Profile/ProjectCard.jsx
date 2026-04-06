import React, { useState, useRef } from "react";
import { Tag, Button, Dropdown, Popover, Space } from "antd";
import { previewKindShortLabel } from "../../utils/projectServiceKind";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const moreWrapRef = useRef(null);
  const nodeCount =
    Number(project.nodes_count ?? project.node_count ?? 0) || 0;

  const menuItems = [
    ...(canEdit
      ? [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit Project",
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.();
              domEvent?.preventDefault?.();
              setMenuOpen(false);
              window.setTimeout(() => onEdit?.(project), 0);
            },
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete Project",
            danger: true,
            onClick: ({ domEvent }) => {
              domEvent?.stopPropagation?.();
              domEvent?.preventDefault?.();
              setMenuOpen(false);
              window.setTimeout(() => setDeleteOpen(true), 0);
            },
          },
        ]
      : []),
  ];

  const deleteContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Delete this project?
      </div>
      <p style={{ marginBottom: 12 }}>
        Are you sure you want to delete <strong>{project.name}</strong>?
      </p>
      <Space
        style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
      >
        <Button size="small" onClick={() => setDeleteOpen(false)}>
          Cancel
        </Button>
        <Button
          size="small"
          type="primary"
          danger
          onClick={async () => {
            setDeleteOpen(false);
            await onDelete?.(project);
          }}
        >
          Delete
        </Button>
      </Space>
    </div>
  );

  return (
    <div
      className="p-5 bg-transparent border-2 border-gray-200 h-full hover:shadow-md transition-shadow duration-300 border border-gray-200  rounded-lg cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="presentation"
    >
      <div className="space-y-3">
        {/* Title and Options Menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-xl mb-0">
              {project.name}
            </h3>
          </div>
          <span
            ref={moreWrapRef}
            className="inline-flex shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Popover
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              placement="bottomRight"
              trigger={[]}
              arrow={false}
              getPopupContainer={() => moreWrapRef.current ?? document.body}
              content={deleteContent}
            >
              <span className="inline-flex">
                <Dropdown
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  menu={{
                    items: menuItems.length > 0 ? menuItems : [],
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                  disabled={menuItems.length === 0}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="text-gray-500 hover:text-gray-700 -mt-1"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Project actions"
                  />
                </Dropdown>
              </span>
            </Popover>
          </span>
        </div>

        {/* Kind tag (left) + node count (far right), same row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Tag
            color={project.tag === "backend" ? "purple" : "blue"}
            className="m-0 text-xs"
          >
            {previewKindShortLabel(project.tag)}
          </Tag>
          <span className="shrink-0 text-right text-sm text-gray-900">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
          </span>
        </div>

        {/* Separator */}
        <hr className="border-gray-200 my-3" />

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed">
          {project.description || "No description available"}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;
