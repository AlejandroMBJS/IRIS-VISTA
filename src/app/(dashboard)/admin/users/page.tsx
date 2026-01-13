'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Upload,
  Download,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usersApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { User, PendingUser, UserRole, ApproveUserPayload } from '@/types';

type TabId = 'all' | 'pending';

export default function UsersPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    department: '',
    cost_center: '',
    company_code: '',
  });
  const [approvalData, setApprovalData] = useState<ApproveUserPayload>({
    role: 'employee',
    company_code: '',
    cost_center: '',
    department: '',
  });

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ employee_number: string; email: string; success: boolean; error?: string }>;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const text = {
    en: {
      title: 'User Management',
      subtitle: 'Manage user accounts and registrations',
      allUsers: 'All Users',
      pendingApproval: 'Pending Approval',
      addUser: 'Add User',
      search: 'Search users...',
      employeeNumber: 'Employee Number',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      department: 'Department',
      status: 'Status',
      actions: 'Actions',
      registeredAt: 'Registered',
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      disabled: 'Disabled',
      edit: 'Edit',
      delete: 'Delete',
      approve: 'Approve',
      reject: 'Reject',
      noUsers: 'No users found',
      noPendingUsers: 'No pending registrations',
      createUser: 'Create User',
      editUser: 'Edit User',
      approveUser: 'Approve User',
      rejectUser: 'Reject User',
      password: 'Password',
      passwordPlaceholder: 'Leave blank to keep current',
      costCenter: 'Cost Center',
      companyCode: 'Company Code',
      save: 'Save',
      cancel: 'Cancel',
      confirmApprove: 'Approve Registration',
      confirmReject: 'Reject Registration',
      rejectionReason: 'Reason for Rejection',
      rejectionPlaceholder: 'Explain why this registration is being rejected...',
      approveDescription: 'Assign a role and department to this user. They will be able to log in after approval.',
      roles: {
        admin: 'Admin',
        purchase_admin: 'Purchase Admin',
        supply_chain_manager: 'Supply Chain Manager',
        general_manager: 'General Manager',
        employee: 'Employee',
      },
      importUsers: 'Import Users',
      downloadTemplate: 'Download Template',
      importFromCSV: 'Import from CSV',
      csvPlaceholder: 'Paste CSV data here or upload a file...\n\nFormat: employee_number,email,password,name,role,company_code,cost_center,department',
      uploadFile: 'Upload CSV File',
      import: 'Import',
      importSuccess: 'Import completed',
      imported: 'imported',
      failed: 'failed',
      close: 'Close',
    },
    zh: {
      title: '用户管理',
      subtitle: '管理用户账户和注册',
      allUsers: '所有用户',
      pendingApproval: '待审批',
      addUser: '添加用户',
      search: '搜索用户...',
      employeeNumber: '员工编号',
      name: '姓名',
      email: '邮箱',
      role: '角色',
      department: '部门',
      status: '状态',
      actions: '操作',
      registeredAt: '注册时间',
      approved: '已批准',
      pending: '待审批',
      rejected: '已拒绝',
      disabled: '已禁用',
      edit: '编辑',
      delete: '删除',
      approve: '批准',
      reject: '拒绝',
      noUsers: '没有找到用户',
      noPendingUsers: '没有待审批的注册',
      createUser: '创建用户',
      editUser: '编辑用户',
      approveUser: '批准用户',
      rejectUser: '拒绝用户',
      password: '密码',
      passwordPlaceholder: '留空保持当前密码',
      costCenter: '成本中心',
      companyCode: '公司代码',
      save: '保存',
      cancel: '取消',
      confirmApprove: '确认批准',
      confirmReject: '确认拒绝',
      rejectionReason: '拒绝原因',
      rejectionPlaceholder: '说明拒绝此注册的原因...',
      approveDescription: '为此用户分配角色和部门。批准后用户即可登录。',
      roles: {
        admin: '管理员',
        purchase_admin: '采购管理员',
        supply_chain_manager: '供应链经理',
        general_manager: '总经理',
        employee: '员工',
      },
      importUsers: '导入用户',
      downloadTemplate: '下载模板',
      importFromCSV: '从CSV导入',
      csvPlaceholder: '在此粘贴CSV数据或上传文件...\n\n格式: employee_number,email,password,name,role,company_code,cost_center,department',
      uploadFile: '上传CSV文件',
      import: '导入',
      importSuccess: '导入完成',
      imported: '已导入',
      failed: '失败',
      close: '关闭',
    },
    es: {
      title: 'Gestion de Usuarios',
      subtitle: 'Gestionar cuentas de usuario y registros',
      allUsers: 'Todos los Usuarios',
      pendingApproval: 'Pendiente de Aprobacion',
      addUser: 'Agregar Usuario',
      search: 'Buscar usuarios...',
      employeeNumber: 'Numero de Empleado',
      name: 'Nombre',
      email: 'Correo',
      role: 'Rol',
      department: 'Departamento',
      status: 'Estado',
      actions: 'Acciones',
      registeredAt: 'Registrado',
      approved: 'Aprobado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
      disabled: 'Deshabilitado',
      edit: 'Editar',
      delete: 'Eliminar',
      approve: 'Aprobar',
      reject: 'Rechazar',
      noUsers: 'No se encontraron usuarios',
      noPendingUsers: 'No hay registros pendientes',
      createUser: 'Crear Usuario',
      editUser: 'Editar Usuario',
      approveUser: 'Aprobar Usuario',
      rejectUser: 'Rechazar Usuario',
      password: 'Contrasena',
      passwordPlaceholder: 'Dejar en blanco para mantener actual',
      costCenter: 'Centro de Costos',
      companyCode: 'Codigo de Empresa',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirmApprove: 'Confirmar Aprobacion',
      confirmReject: 'Confirmar Rechazo',
      rejectionReason: 'Razon del Rechazo',
      rejectionPlaceholder: 'Explique por que se rechaza este registro...',
      approveDescription: 'Asigne un rol y departamento a este usuario. Podra iniciar sesion despues de la aprobacion.',
      roles: {
        admin: 'Admin',
        purchase_admin: 'Admin de Compras',
        supply_chain_manager: 'Gerente de Cadena de Suministro',
        general_manager: 'Gerente General',
        employee: 'Empleado',
      },
      importUsers: 'Importar Usuarios',
      downloadTemplate: 'Descargar Plantilla',
      importFromCSV: 'Importar desde CSV',
      csvPlaceholder: 'Pegue datos CSV aqui o suba un archivo...\n\nFormato: employee_number,email,password,name,role,company_code,cost_center,department',
      uploadFile: 'Subir Archivo CSV',
      import: 'Importar',
      importSuccess: 'Importacion completada',
      imported: 'importados',
      failed: 'fallidos',
      close: 'Cerrar',
    },
  };

  const t = text[language];

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersApi.list({ per_page: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const data = await usersApi.listPending();
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchPendingUsers()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchUsers, fetchPendingUsers]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        employee_number: user.employee_number,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department,
        cost_center: user.cost_center,
        company_code: user.company_code,
      });
    } else {
      setEditingUser(null);
      setFormData({
        employee_number: '',
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        cost_center: '',
        company_code: '',
      });
    }
    setShowModal(true);
  };

  const handleOpenApprovalModal = (user: PendingUser) => {
    setSelectedPendingUser(user);
    setApprovalData({
      role: 'employee',
      company_code: '',
      cost_center: '',
      department: '',
    });
    setShowApprovalModal(true);
  };

  const handleOpenRejectModal = (user: PendingUser) => {
    setSelectedPendingUser(user);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: Partial<User> = {
          employee_number: formData.employee_number,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          cost_center: formData.cost_center,
          company_code: formData.company_code,
        };
        await usersApi.update(editingUser.id, updateData);
      } else {
        await usersApi.create({
          ...formData,
          password: formData.password,
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPendingUser) return;
    setIsSubmitting(true);
    try {
      await usersApi.approve(selectedPendingUser.id, approvalData);
      setShowApprovalModal(false);
      setSelectedPendingUser(null);
      await Promise.all([fetchUsers(), fetchPendingUsers()]);
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPendingUser || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      await usersApi.reject(selectedPendingUser.id, { reason: rejectionReason });
      setShowRejectModal(false);
      setSelectedPendingUser(null);
      await fetchPendingUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.toggleStatus(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    try {
      await usersApi.delete(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = 'employee_number,email,password,name,role,company_code,cost_center,department';
    const example1 = 'EMP001,john.doe@company.com,Password123,John Doe,employee,COMP01,CC001,Engineering';
    const example2 = 'EMP002,jane.smith@company.com,Password123,Jane Smith,purchase_admin,COMP01,CC002,Purchasing';
    const csvContent = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Parse CSV and import users
  const handleImport = async () => {
    if (!csvText.trim()) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      const users = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const user: Record<string, string> = {};
        headers.forEach((header, index) => {
          user[header] = values[index] || '';
        });
        return {
          employee_number: user.employee_number || '',
          email: user.email || '',
          password: user.password || '',
          name: user.name || '',
          role: user.role || 'employee',
          company_code: user.company_code || '',
          cost_center: user.cost_center || '',
          department: user.department || '',
        };
      });

      const results = await usersApi.bulkImport(users);
      setImportResults(results);
      fetchUsers();
    } catch (error) {
      console.error('Failed to import users:', error);
      alert('Failed to import users');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employee_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#4BAF7E]/10 text-[#4BAF7E] border-0">{t.approved}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0">{t.pending}</Badge>;
      case 'rejected':
        return <Badge className="bg-[#D1625B]/10 text-[#D1625B] border-0">{t.rejected}</Badge>;
      case 'disabled':
        return <Badge className="bg-[#6E6B67]/10 text-[#6E6B67] border-0">{t.disabled}</Badge>;
      default:
        return <Badge className="bg-[#6E6B67]/10 text-[#6E6B67] border-0">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="mb-2 text-4xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
              {t.title}
            </h1>
            <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowImportModal(true);
                setCsvText('');
                setImportResults(null);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#75534B] px-5 py-3 text-[#75534B] font-medium transition-all hover:bg-[#75534B]/5 active:scale-95"
            >
              <Upload className="h-5 w-5" />
              {t.importUsers}
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5" />
              {t.addUser}
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 md:px-8 py-4 bg-white border-b border-[#E4E1DD]">
        <div className="mx-auto max-w-7xl flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#75534B] text-white'
                : 'text-[#6E6B67] hover:bg-[#E4E1DD]/50'
            }`}
          >
            <Users className="h-4 w-4" />
            {t.allUsers}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-[#75534B] text-white'
                : 'text-[#6E6B67] hover:bg-[#E4E1DD]/50'
            }`}
          >
            <Clock className="h-4 w-4" />
            {t.pendingApproval}
            {pendingUsers.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Search */}
      {activeTab === 'all' && (
        <section className="px-4 md:px-8 py-6 bg-white border-b border-[#E4E1DD]">
          <div className="mx-auto max-w-7xl">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white py-2.5 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === 'all' ? (
            /* All Users Table */
            filteredUsers.length === 0 ? (
              <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
                <Users className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
                <p className="text-[#6E6B67]">{t.noUsers}</p>
              </div>
            ) : (
              <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.employeeNumber}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.name}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.email}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.role}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.status}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#E4E1DD] last:border-0 hover:bg-[#F9F8F6] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-[#75534B]">
                          {user.employee_number}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2C2C2C]">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6E6B67]">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge className="bg-[#75534B]/10 text-[#75534B] hover:bg-[#75534B]/10 border-0">
                            {t.roles[user.role as keyof typeof t.roles] || user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {user.status === 'approved' || user.status === 'disabled' ? (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="flex items-center gap-2"
                            >
                              {user.status === 'approved' ? (
                                <>
                                  <ToggleRight className="h-6 w-6 text-[#4BAF7E]" />
                                  <span className="text-sm text-[#4BAF7E]">{t.approved}</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-6 w-6 text-[#6E6B67]" />
                                  <span className="text-sm text-[#6E6B67]">{t.disabled}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            getStatusBadge(user.status)
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 text-[#75534B] hover:bg-[#75534B]/10 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-[#D1625B] hover:bg-[#D1625B]/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )
          ) : (
            /* Pending Users */
            pendingUsers.length === 0 ? (
              <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
                <CheckCircle className="h-12 w-12 text-[#4BAF7E] mx-auto mb-4" />
                <p className="text-[#6E6B67]">{t.noPendingUsers}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#2C2C2C]">{user.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-[#6E6B67]">
                            <span className="font-mono text-[#75534B]">{user.employee_number}</span>
                            <span>{user.email}</span>
                          </div>
                          <p className="text-xs text-[#6E6B67] mt-1">
                            {t.registeredAt}: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenApprovalModal(user)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4BAF7E] text-white font-medium hover:bg-[#3D9066] transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                          {t.approve}
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(user)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#D1625B] text-[#D1625B] font-medium hover:bg-[#D1625B]/5 transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                          {t.reject}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between sticky top-0">
              <h2 className="text-xl text-white font-semibold">
                {editingUser ? t.editUser : t.createUser}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.employeeNumber} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.name} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.email} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.password} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.role} <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as UserRole })
                  }
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                >
                  {Object.entries(t.roles).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.department}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.costCenter}
                  </label>
                  <input
                    type="text"
                    value={formData.cost_center}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_center: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E1DD] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#4BAF7E] to-[#3D9066] p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-white" />
                <h2 className="text-xl text-white font-semibold">{t.approveUser}</h2>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD]">
                <p className="font-semibold text-[#2C2C2C]">{selectedPendingUser.name}</p>
                <p className="text-sm text-[#6E6B67] mt-1">
                  <span className="font-mono text-[#75534B]">{selectedPendingUser.employee_number}</span>
                  {' - '}{selectedPendingUser.email}
                </p>
              </div>

              <p className="text-sm text-[#6E6B67] mb-4">{t.approveDescription}</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.role} <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={approvalData.role}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, role: e.target.value as UserRole })
                    }
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#4BAF7E] focus:outline-none focus:ring-2 focus:ring-[#4BAF7E]/20"
                  >
                    {Object.entries(t.roles).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                      {t.department}
                    </label>
                    <input
                      type="text"
                      value={approvalData.department || ''}
                      onChange={(e) =>
                        setApprovalData({ ...approvalData, department: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#4BAF7E] focus:outline-none focus:ring-2 focus:ring-[#4BAF7E]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                      {t.costCenter}
                    </label>
                    <input
                      type="text"
                      value={approvalData.cost_center || ''}
                      onChange={(e) =>
                        setApprovalData({ ...approvalData, cost_center: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#4BAF7E] focus:outline-none focus:ring-2 focus:ring-[#4BAF7E]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E1DD] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-[#4BAF7E] text-white font-medium shadow-sm transition-all hover:bg-[#3D9066] active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" />
                {t.confirmApprove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#D1625B] to-[#B94D47] p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-6 w-6 text-white" />
                <h2 className="text-xl text-white font-semibold">{t.rejectUser}</h2>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD]">
                <p className="font-semibold text-[#2C2C2C]">{selectedPendingUser.name}</p>
                <p className="text-sm text-[#6E6B67] mt-1">
                  <span className="font-mono text-[#75534B]">{selectedPendingUser.employee_number}</span>
                  {' - '}{selectedPendingUser.email}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.rejectionReason} <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t.rejectionPlaceholder}
                  rows={4}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#D1625B] focus:outline-none focus:ring-2 focus:ring-[#D1625B]/20 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-[#E4E1DD] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="px-6 py-3 rounded-lg bg-[#D1625B] text-white font-medium shadow-sm transition-all hover:bg-[#B94D47] active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <XCircle className="h-4 w-4" />
                {t.confirmReject}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E4E1DD] flex items-center justify-between">
              <div>
                <h2 className="text-xl text-[#2C2C2C] font-semibold">{t.importFromCSV}</h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-[#6E6B67] hover:text-[#2C2C2C] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Download Template Button */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-[#75534B] font-medium hover:underline"
              >
                <Download className="h-4 w-4" />
                {t.downloadTemplate}
              </button>

              {/* File Upload */}
              <div>
                <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-[#E4E1DD] rounded-lg cursor-pointer hover:border-[#75534B] transition-colors">
                  <FileText className="h-5 w-5 text-[#6E6B67]" />
                  <span className="text-[#6E6B67]">{t.uploadFile}</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* CSV Textarea */}
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={t.csvPlaceholder}
                rows={10}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] font-mono transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />

              {/* Import Results */}
              {importResults && (
                <div className="rounded-lg border border-[#E4E1DD] bg-[#F9F8F6] p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">{importResults.success} {t.imported}</span>
                    </div>
                    {importResults.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-500">{importResults.failed} {t.failed}</span>
                      </div>
                    )}
                  </div>
                  {importResults.results.some(r => r.error) && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResults.results.filter(r => r.error).map((r, i) => (
                        <div key={i} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <span className="font-medium">{r.employee_number || r.email}:</span> {r.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#E4E1DD] flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.close}
              </button>
              {!importResults && (
                <button
                  onClick={handleImport}
                  disabled={isImporting || !csvText.trim()}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Upload className="h-4 w-4" />
                  {t.import}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
