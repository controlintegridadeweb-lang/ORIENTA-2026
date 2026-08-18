"use client";

import type { ReactNode } from "react";
import { formSurface } from "@/shared/layout/form-surface";

type TableFrameProps = {
  minWidthClassName: string;
  children: ReactNode;
};

export function AdminMonitoringTableFrame({ minWidthClassName, children }: TableFrameProps) {
  return (
    <div className={formSurface.brandTable.wrapper}>
      <table className={`${formSurface.brandTable.table} ${minWidthClassName}`}>{children}</table>
    </div>
  );
}
