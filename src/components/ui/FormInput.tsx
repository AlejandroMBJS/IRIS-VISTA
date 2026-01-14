'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  variant?: 'default' | 'filled';
}

interface TextareaProps extends BaseInputProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  variant?: 'default' | 'filled';
}

const baseInputStyles = `
  w-full rounded-lg border px-4 py-3 text-sm text-[#2D363F]
  transition-all placeholder:text-[#4E616F]
  focus:outline-none focus:ring-2
  disabled:bg-[#FAFBFA] disabled:text-[#4E616F] disabled:cursor-not-allowed
`;

const variants = {
  default: `
    border-[#ABC0B9] bg-white
    focus:border-[#5C2F0E] focus:ring-[#5C2F0E]/20
  `,
  filled: `
    border-[#ABC0B9] bg-[#FAFBFA]
    focus:border-[#5C2F0E] focus:bg-white focus:ring-[#5C2F0E]/20
  `,
};

const errorStyles = `
  border-[#AA2F0D] focus:border-[#AA2F0D] focus:ring-[#AA2F0D]/20
`;

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, variant = 'default', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[#2D363F]">
            {label}
            {required && <span className="text-[#AA2F0D] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              ${baseInputStyles}
              ${error ? errorStyles : variants[variant]}
              ${isPassword ? 'pr-12' : ''}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#4E616F] hover:text-[#2D363F] transition-colors rounded-md hover:bg-[#FAFBFA]"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-[#AA2F0D]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#4E616F]">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, variant = 'default', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[#2D363F]">
            {label}
            {required && <span className="text-[#AA2F0D] ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            ${baseInputStyles}
            ${error ? errorStyles : variants[variant]}
            resize-none
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#AA2F0D]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#4E616F]">{hint}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

interface SelectProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: { value: string; label: string }[];
  variant?: 'default' | 'filled';
}

export const FormSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, variant = 'default', options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[#2D363F]">
            {label}
            {required && <span className="text-[#AA2F0D] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            ${baseInputStyles}
            ${error ? errorStyles : variants[variant]}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-[#AA2F0D]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#4E616F]">{hint}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
