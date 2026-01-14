import { Badge } from './ui/badge';

interface RecentActivityProps {
  language: 'en' | 'zh';
}

export function RecentActivity({ language }: RecentActivityProps) {
  const text = {
    en: {
      title: 'Recent Activity',
      viewAll: 'View All',
      headers: ['Request', 'Status', 'Date'],
      requests: [
        {
          title: 'Amazon Purchase - Office Desk Lamp',
          status: 'approved',
          statusLabel: 'Approved',
          date: '2 hours ago',
        },
        {
          title: 'PPE Request - Safety Gloves (100 pairs)',
          status: 'pending',
          statusLabel: 'Pending',
          date: '5 hours ago',
        },
        {
          title: 'IT Equipment - Laptop Replacement',
          status: 'received',
          statusLabel: 'Received',
          date: 'Yesterday',
        },
        {
          title: 'Regular Purchase - Printer Toner Cartridges',
          status: 'approved',
          statusLabel: 'Approved',
          date: '2 days ago',
        },
        {
          title: 'Maintenance Request - HVAC Repair',
          status: 'rejected',
          statusLabel: 'Rejected',
          date: '3 days ago',
        },
      ],
    },
    zh: {
      title: '最近活动',
      viewAll: '查看全部',
      headers: ['请求', '状态', '日期'],
      requests: [
        {
          title: '亚马逊采购 - 办公台灯',
          status: 'approved',
          statusLabel: '已批准',
          date: '2 小时前',
        },
        {
          title: 'PPE 请求 - 安全手套 (100 双)',
          status: 'pending',
          statusLabel: '待处理',
          date: '5 小时前',
        },
        {
          title: 'IT 设备 - 笔记本电脑更换',
          status: 'received',
          statusLabel: '已收到',
          date: '昨天',
        },
        {
          title: '常规采购 - 打印机墨盒',
          status: 'approved',
          statusLabel: '已批准',
          date: '2 天前',
        },
        {
          title: '维护请求 - HVAC 维修',
          status: 'rejected',
          statusLabel: '已拒绝',
          date: '3 天前',
        },
      ],
    },
  };

  const t = text[language];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#ABC0B9]/30 text-[#5C2F0E] hover:bg-[#ABC0B9]/30';
      case 'pending':
        return 'bg-[#F38756]/30 text-[#E95F20] hover:bg-[#F38756]/30';
      case 'received':
        return 'bg-[#ABC0B9]/30 text-[#4E616F] hover:bg-[#ABC0B9]/30';
      case 'rejected':
        return 'bg-[#AA2F0D]/20 text-[#AA2F0D] hover:bg-[#AA2F0D]/20';
      default:
        return 'bg-[#ABC0B9]/20 text-[#2D363F] hover:bg-[#ABC0B9]/20';
    }
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[#2D363F]">{t.title}</h2>
        <button className="text-sm text-[#5C2F0E] hover:underline">
          {t.viewAll}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#ABC0B9]/30 bg-[#FAFBFA]">
                {t.headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-4 text-left text-sm text-[#4E616F]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.requests.map((request, index) => (
                <tr
                  key={index}
                  className="border-b border-[#ABC0B9]/30 transition-colors hover:bg-[#FAFBFA]"
                >
                  <td className="px-6 py-4">
                    <button className="text-left text-sm text-[#2D363F] hover:text-[#5C2F0E]">
                      {request.title}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusVariant(request.status)}>
                      {request.statusLabel}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#4E616F]">
                    {request.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
