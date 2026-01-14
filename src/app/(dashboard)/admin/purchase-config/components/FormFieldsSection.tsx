'use client';

import { FormInput, Plus, Trash2 } from 'lucide-react';
import type { PurchaseConfig, CustomField } from '@/types';

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  language: 'en' | 'zh' | 'es';
}

export function FormFieldsSection({ config, onChange, language }: Props) {
  const text = {
    en: {
      title: 'Form Fields',
      subtitle: 'Configure which fields are required in the request form',
      requiredFields: 'Required fields',
      urlAlways: 'Product URL (always required)',
      quantity: 'Quantity',
      justification: 'Justification',
      costCenter: 'Cost center',
      project: 'Associated project',
      budgetCode: 'Budget code',
      customFields: 'Custom fields',
      fieldName: 'Field name',
      fieldType: 'Type',
      required: 'Required',
      addField: 'Add custom field',
      fieldTypes: {
        text: 'Text',
        number: 'Number',
        select: 'Select',
        textarea: 'Text area',
      },
    },
    zh: {
      title: '表单字段',
      subtitle: '配置请求表单中的必填字段',
      requiredFields: '必填字段',
      urlAlways: '产品 URL（始终必填）',
      quantity: '数量',
      justification: '说明理由',
      costCenter: '成本中心',
      project: '关联项目',
      budgetCode: '预算代码',
      customFields: '自定义字段',
      fieldName: '字段名称',
      fieldType: '类型',
      required: '必填',
      addField: '添加自定义字段',
      fieldTypes: {
        text: '文本',
        number: '数字',
        select: '下拉选择',
        textarea: '文本区域',
      },
    },
    es: {
      title: 'Campos del Formulario',
      subtitle: 'Configura que campos son requeridos en el formulario de solicitud',
      requiredFields: 'Campos requeridos',
      urlAlways: 'URL del producto (siempre requerido)',
      quantity: 'Cantidad',
      justification: 'Justificacion',
      costCenter: 'Centro de costo',
      project: 'Proyecto asociado',
      budgetCode: 'Codigo de presupuesto',
      customFields: 'Campos personalizados',
      fieldName: 'Nombre del campo',
      fieldType: 'Tipo',
      required: 'Requerido',
      addField: 'Agregar campo personalizado',
      fieldTypes: {
        text: 'Texto',
        number: 'Numero',
        select: 'Seleccion',
        textarea: 'Area de texto',
      },
    },
  };

  const t = text[language];

  const handleAddField = () => {
    const newFields: CustomField[] = [...(config.custom_fields || [])];
    newFields.push({
      name: `field_${newFields.length + 1}`,
      label: '',
      type: 'text',
      required: false,
    });
    onChange({ custom_fields: newFields });
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...(config.custom_fields || [])];
    newFields.splice(index, 1);
    onChange({ custom_fields: newFields });
  };

  const handleFieldChange = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...(config.custom_fields || [])];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ custom_fields: newFields });
  };

  const CheckboxItem = ({
    checked,
    onChange: onItemChange,
    label,
    disabled,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
  }) => (
    <label className={`flex items-center gap-3 py-2 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onItemChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="h-5 w-5 rounded border-2 border-[#ABC0B9] bg-white peer-checked:border-[#5C2F0E] peer-checked:bg-[#5C2F0E] peer-disabled:bg-[#FAFBFA] transition-colors flex items-center justify-center">
        </div>
        <svg
          className={`absolute inset-0 h-5 w-5 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-[#2D363F]">{label}</span>
    </label>
  );

  return (
    <div className="rounded-xl border border-[#ABC0B9] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#ABC0B9] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C2F0E]/10">
            <FormInput className="h-5 w-5 text-[#5C2F0E]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D363F]">{t.title}</h2>
            <p className="text-sm text-[#4E616F]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Required Fields */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#2D363F]">{t.requiredFields}</h3>
          <div className="ml-2 space-y-1">
            <CheckboxItem
              checked={true}
              onChange={() => {}}
              label={t.urlAlways}
              disabled
            />
            <CheckboxItem
              checked={true}
              onChange={() => {}}
              label={t.quantity}
              disabled
            />
            <CheckboxItem
              checked={config.require_justification}
              onChange={(checked) => onChange({ require_justification: checked })}
              label={t.justification}
            />
            <CheckboxItem
              checked={config.require_cost_center}
              onChange={(checked) => onChange({ require_cost_center: checked })}
              label={t.costCenter}
            />
            <CheckboxItem
              checked={config.require_project}
              onChange={(checked) => onChange({ require_project: checked })}
              label={t.project}
            />
            <CheckboxItem
              checked={config.require_budget_code}
              onChange={(checked) => onChange({ require_budget_code: checked })}
              label={t.budgetCode}
            />
          </div>
        </div>

        {/* Custom Fields */}
        <div className="border-t border-[#ABC0B9] pt-6">
          <h3 className="mb-4 text-sm font-semibold text-[#2D363F]">{t.customFields}</h3>

          {(config.custom_fields || []).length > 0 && (
            <div className="mb-4 overflow-hidden rounded-lg border border-[#ABC0B9]">
              <table className="w-full">
                <thead className="bg-[#FAFBFA]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#4E616F] uppercase">
                      {t.fieldName}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#4E616F] uppercase">
                      {t.fieldType}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#4E616F] uppercase">
                      {t.required}
                    </th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ABC0B9]">
                  {(config.custom_fields || []).map((field, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(index, {
                            label: e.target.value,
                            name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                          })}
                          placeholder={t.fieldName}
                          className="w-full rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, { type: e.target.value as CustomField['type'] })}
                          className="w-full rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                        >
                          <option value="text">{t.fieldTypes.text}</option>
                          <option value="number">{t.fieldTypes.number}</option>
                          <option value="select">{t.fieldTypes.select}</option>
                          <option value="textarea">{t.fieldTypes.textarea}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-[#ABC0B9] text-[#5C2F0E] focus:ring-[#5C2F0E]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveField(index)}
                          className="rounded-lg p-2 text-[#AA2F0D] hover:bg-[#AA2F0D]/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleAddField}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#ABC0B9] px-4 py-3 text-sm font-medium text-[#4E616F] transition-all hover:border-[#5C2F0E] hover:text-[#5C2F0E]"
          >
            <Plus className="h-4 w-4" />
            {t.addField}
          </button>
        </div>
      </div>
    </div>
  );
}
