export interface ISigningProvider {
  id: string;
  name: string;
  requestSignature: (doc: { id: string; title: string; fileUrl: string; signers: string[] }) => Promise<{ providerId: string, url: string }>;
  verifyWebhook: (req: any) => Promise<boolean>;
  handleWebhook: (req: any) => Promise<void>;
}

export interface IPluginForm {
  form: IPluginFormConfig;
}

export interface IPluginFormConfig {
  fields: IPluginFormField[];
}

export interface IPluginFormField {
  type: 'text' | 'number' | 'switch' | 'select';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  default?: boolean;
  multiple?: boolean;
  options?: { label: string; value: string }[];
}