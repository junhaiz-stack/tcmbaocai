import React from 'react';
import { X, Package, Users, CheckCircle, TrendingUp, Shield } from 'lucide-react';

interface SystemIntroModalProps {
  open: boolean;
  onClose: () => void;
}

export const SystemIntroModal: React.FC<SystemIntroModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">系统功能介绍</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 space-y-6">
            {/* 系统简介 */}
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">金方包材管理系统</h3>
              <p className="text-sm text-slate-600">
                为中药饮片行业打造的包材采购与供应链全流程数字化追溯系统
              </p>
            </div>

            {/* 核心功能点 */}
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">三方协同管理</h4>
                  <p className="text-sm text-slate-600">
                    中药饮片厂、包材供应商、平台管理方三方角色，实现供需对接与监管协同
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">订单全流程追溯</h4>
                  <p className="text-sm text-slate-600">
                    从下单、审核、发货到收货，每个环节可追溯，物流信息实时更新
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">智能库存管理</h4>
                  <p className="text-sm text-slate-600">
                    实时库存监控，自动扣减未发货订单占用，避免超卖风险
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">平台监管审核</h4>
                  <p className="text-sm text-slate-600">
                    平台方对订单及包材进行审核把关，确保包材供应链质量及流向准确
                  </p>
                </div>
              </div>
            </div>

            {/* 角色说明 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">系统角色</h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center">
                  <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold mb-1">
                    中药饮片厂
                  </div>
                  <p className="text-slate-600">浏览包材、下单采购</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold mb-1">
                    包材供应商
                  </div>
                  <p className="text-slate-600">发布包材、处理订单</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold mb-1">
                    平台管理方
                  </div>
                  <p className="text-slate-600">审核订单、监管质量</p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg shadow-emerald-500/30"
            >
              开始使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

