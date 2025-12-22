import React from 'react';
import { OrderStatus } from '../types';
import { Clock, CheckCircle2, XCircle, Truck, PackageCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [OrderStatus.APPROVED]: "bg-blue-100 text-blue-800 border-blue-200",
    [OrderStatus.REJECTED]: "bg-red-100 text-red-800 border-red-200",
    [OrderStatus.SHIPPED]: "bg-purple-100 text-purple-800 border-purple-200",
    [OrderStatus.COMPLETED]: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const icons = {
    [OrderStatus.PENDING]: <Clock className="w-3 h-3 mr-1" />,
    [OrderStatus.APPROVED]: <CheckCircle2 className="w-3 h-3 mr-1" />,
    [OrderStatus.REJECTED]: <XCircle className="w-3 h-3 mr-1" />,
    [OrderStatus.SHIPPED]: <Truck className="w-3 h-3 mr-1" />,
    [OrderStatus.COMPLETED]: <PackageCheck className="w-3 h-3 mr-1" />,
  };

  const labels = {
    [OrderStatus.PENDING]: "待审核",
    [OrderStatus.APPROVED]: "已通过",
    [OrderStatus.REJECTED]: "已驳回",
    [OrderStatus.SHIPPED]: "已发货",
    [OrderStatus.COMPLETED]: "已完成",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {labels[status]}
    </span>
  );
};