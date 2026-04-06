"use client";

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import axios from "axios";

/**
 * Old URLs: /config/:id — resolve node and redirect to /projects/:projectId/nodes/:id
 */
export default function ConfigLegacyRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) {
        navigate("/projects", { replace: true });
        return;
      }
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const base = import.meta.env.VITE_BACKEND_URL;
      try {
        const res = await axios.get(`${base}node/${encodeURIComponent(id)}`, {
          headers,
          validateStatus: (s) => s === 200 || s === 404,
        });
        if (
          !cancelled &&
          res.status === 200 &&
          res.data?.project_id != null
        ) {
          navigate(`/projects/${res.data.project_id}/nodes/${id}`, {
            replace: true,
          });
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) navigate("/projects", { replace: true });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="flex justify-center p-12">
      <Spin size="large" tip="Redirecting…" />
    </div>
  );
}
