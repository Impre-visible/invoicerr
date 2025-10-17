export interface ISigningProvider {
  id: string;
  name: string;
  requestSignature: (doc: { id: string; title: string; fileUrl: string; signers: string[] }) => Promise<{ providerId: string, url: string }>;
  verifyWebhook: (req: any) => Promise<boolean>;
  handleWebhook: (req: any) => Promise<void>;
}