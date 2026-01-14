'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  DollarSign,
  Tag,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { FilterRule } from '@/types';

export default function FilterRulesPage() {
  const { language } = useLanguage();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FilterRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'price_max' as FilterRule['rule_type'],
    value: '',
    priority: 0,
    is_active: true,
  });

  const text = {
    en: {
      title: 'Filter Rules',
      subtitle: 'Manage product filtering rules for Amazon Business',
      addRule: 'Add Rule',
      name: 'Rule Name',
      description: 'Description',
      type: 'Rule Type',
      value: 'Value',
      priority: 'Priority',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      noRules: 'No filter rules configured',
      createFirst: 'Create your first rule to filter Amazon products',
      createRule: 'Create Rule',
      editRule: 'Edit Rule',
      save: 'Save',
      cancel: 'Cancel',
      ruleTypes: {
        price_max: 'Maximum Price',
        price_min: 'Minimum Price',
        category_allow: 'Allow Category',
        category_block: 'Block Category',
        supplier_block: 'Block Supplier',
        keyword_block: 'Block Keyword',
      },
      typeDescriptions: {
        price_max: 'Products above this price will be hidden',
        price_min: 'Products below this price will be hidden',
        category_allow: 'Only show products from this category',
        category_block: 'Hide products from this category',
        supplier_block: 'Hide products from this supplier',
        keyword_block: 'Hide products containing this keyword',
      },
    },
    zh: {
      title: '筛选规则',
      subtitle: '管理 Amazon Business 产品筛选规则',
      addRule: '添加规则',
      name: '规则名称',
      description: '描述',
      type: '规则类型',
      value: '值',
      priority: '优先级',
      status: '状态',
      actions: '操作',
      active: '已启用',
      inactive: '已禁用',
      edit: '编辑',
      delete: '删除',
      noRules: '未配置筛选规则',
      createFirst: '创建您的第一个规则来筛选亚马逊产品',
      createRule: '创建规则',
      editRule: '编辑规则',
      save: '保存',
      cancel: '取消',
      ruleTypes: {
        price_max: '最高价格',
        price_min: '最低价格',
        category_allow: '允许类别',
        category_block: '禁止类别',
        supplier_block: '禁止供应商',
        keyword_block: '禁止关键词',
      },
      typeDescriptions: {
        price_max: '高于此价格的产品将被隐藏',
        price_min: '低于此价格的产品将被隐藏',
        category_allow: '仅显示此类别的产品',
        category_block: '隐藏此类别的产品',
        supplier_block: '隐藏此供应商的产品',
        keyword_block: '隐藏包含此关键词的产品',
      },
    },
    es: {
      title: 'Reglas de Filtro',
      subtitle: 'Gestionar reglas de filtrado de productos para Amazon Business',
      addRule: 'Agregar Regla',
      name: 'Nombre de Regla',
      description: 'Descripción',
      type: 'Tipo de Regla',
      value: 'Valor',
      priority: 'Prioridad',
      status: 'Estado',
      actions: 'Acciones',
      active: 'Activo',
      inactive: 'Inactivo',
      edit: 'Editar',
      delete: 'Eliminar',
      noRules: 'No hay reglas de filtro configuradas',
      createFirst: 'Cree su primera regla para filtrar productos de Amazon',
      createRule: 'Crear Regla',
      editRule: 'Editar Regla',
      save: 'Guardar',
      cancel: 'Cancelar',
      ruleTypes: {
        price_max: 'Precio Máximo',
        price_min: 'Precio Mínimo',
        category_allow: 'Permitir Categoría',
        category_block: 'Bloquear Categoría',
        supplier_block: 'Bloquear Proveedor',
        keyword_block: 'Bloquear Palabra Clave',
      },
      typeDescriptions: {
        price_max: 'Los productos por encima de este precio serán ocultados',
        price_min: 'Los productos por debajo de este precio serán ocultados',
        category_allow: 'Solo mostrar productos de esta categoría',
        category_block: 'Ocultar productos de esta categoría',
        supplier_block: 'Ocultar productos de este proveedor',
        keyword_block: 'Ocultar productos que contengan esta palabra clave',
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await adminApi.listFilterRules();
      setRules(data || []);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (rule?: FilterRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        value: rule.value,
        priority: rule.priority,
        is_active: rule.is_active,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        rule_type: 'price_max',
        value: '',
        priority: 0,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingRule) {
        await adminApi.updateFilterRule(editingRule.id, formData);
      } else {
        await adminApi.createFilterRule(formData);
      }
      setShowModal(false);
      fetchRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('Failed to save rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (rule: FilterRule) => {
    try {
      await adminApi.toggleFilterRule(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async (rule: FilterRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await adminApi.deleteFilterRule(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const getRuleTypeIcon = (type: string) => {
    const icons: { [key: string]: typeof DollarSign } = {
      price_max: DollarSign,
      price_min: DollarSign,
      category_allow: CheckCircle,
      category_block: Ban,
      supplier_block: Ban,
      keyword_block: Ban,
    };
    const Icon = icons[type] || Tag;
    return Icon;
  };

  const getRuleTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      price_max: '#E95F20',
      price_min: '#5C2F0E',
      category_allow: '#5C2F0E',
      category_block: '#AA2F0D',
      supplier_block: '#AA2F0D',
      keyword_block: '#AA2F0D',
    };
    return colors[type] || '#5C2F0E';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA]">
      {/* Header */}
      <section className="border-b border-[#ABC0B9] bg-white px-8 py-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#5C2F0E] flex items-center justify-center">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-[#2D363F]" style={{ fontWeight: 600 }}>
                {t.title}
              </h1>
              <p className="text-base text-[#4E616F]">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            {t.addRule}
          </button>
        </div>
      </section>

      {/* Rules List */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {rules.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#ABC0B9] p-12 text-center">
              <Filter className="h-12 w-12 text-[#ABC0B9] mx-auto mb-4" />
              <p className="text-[#4E616F] mb-2">{t.noRules}</p>
              <p className="text-sm text-[#4E616F] mb-6">{t.createFirst}</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                <Plus className="h-5 w-5" />
                {t.addRule}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const Icon = getRuleTypeIcon(rule.rule_type);
                const color = getRuleTypeColor(rule.rule_type);
                return (
                  <div
                    key={rule.id}
                    className="rounded-xl bg-white border border-[#ABC0B9] p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-6 w-6" style={{ color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-[#2D363F]">{rule.name}</h3>
                            <Badge
                              style={{
                                backgroundColor: `${color}15`,
                                color,
                                borderColor: `${color}40`,
                              }}
                            >
                              {t.ruleTypes[rule.rule_type as keyof typeof t.ruleTypes]}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-[#4E616F] mb-2">{rule.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#4E616F]">
                              {t.value}:{' '}
                              <span className="font-medium text-[#2D363F]">{rule.value}</span>
                            </span>
                            <span className="text-[#4E616F]">
                              {t.priority}:{' '}
                              <span className="font-medium text-[#2D363F]">{rule.priority}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(rule)}
                          className="flex items-center gap-2"
                        >
                          {rule.is_active ? (
                            <>
                              <ToggleRight className="h-6 w-6 text-[#5C2F0E]" />
                              <span className="text-sm text-[#5C2F0E]">{t.active}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-6 w-6 text-[#4E616F]" />
                              <span className="text-sm text-[#4E616F]">{t.inactive}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(rule)}
                          className="p-2 text-[#5C2F0E] hover:bg-[#5C2F0E]/10 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="p-2 text-[#AA2F0D] hover:bg-[#AA2F0D]/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] p-6 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl text-white font-semibold">
                {editingRule ? t.editRule : t.createRule}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-white/80">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2D363F]">
                  {t.name} <span className="text-[#AA2F0D]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2D363F]">
                  {t.description}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2D363F]">
                  {t.type} <span className="text-[#AA2F0D]">*</span>
                </label>
                <select
                  value={formData.rule_type}
                  onChange={(e) =>
                    setFormData({ ...formData, rule_type: e.target.value as FilterRule['rule_type'] })
                  }
                  className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                >
                  {Object.entries(t.ruleTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#4E616F]">
                  {t.typeDescriptions[formData.rule_type as keyof typeof t.typeDescriptions]}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2D363F]">
                    {t.value} <span className="text-[#AA2F0D]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={
                      formData.rule_type.startsWith('price') ? '100.00' : 'Electronics'
                    }
                    className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2D363F]">
                    {t.priority}
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    formData.is_active ? 'bg-[#5C2F0E]' : 'bg-[#ABC0B9]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      formData.is_active ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-[#2D363F]">
                  {formData.is_active ? t.active : t.inactive}
                </span>
              </div>
            </div>

            <div className="border-t border-[#ABC0B9] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-[#4E616F] font-medium transition-colors hover:text-[#2D363F]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name || !formData.value}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
