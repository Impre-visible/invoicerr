import { SigningPluginConfig, getProviderConfig } from "@/utils/plugins";

import { ISigningProvider } from "../types";
import { markInvoiceAsPaid } from "@/utils/plugins/signing";

export const DocusealProvider: ISigningProvider = {
    id: "docuseal",
    name: "DocuSeal",

    requestSignature: async (doc) => {
        const { baseUrl, apiKey } = await getProviderConfig<SigningPluginConfig>("docuseal");

        const templateRes = await fetch(`${baseUrl}/templates`, {
            method: "POST",
            headers: {
                "X-Auth-Token": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: doc.title,
                files: [{ url: doc.fileUrl }],
            }),
        });

        if (!templateRes.ok) {
            const err = await templateRes.text();
            throw new Error(`DocuSeal template creation failed: ${err}`);
        }

        const templateData = await templateRes.json();
        const templateId = templateData.id;

        const envelopeRes = await fetch(`${baseUrl}/submissions`, {
            method: "POST",
            headers: {
                "X-Auth-Token": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                template_id: templateId,
                submitters: doc.signers.map((email) => ({
                    email,
                    role: "Signer",
                })),
            }),
        });

        if (!envelopeRes.ok) {
            const err = await envelopeRes.text();
            throw new Error(`DocuSeal envelope creation failed: ${err}`);
        }

        const envelopeData = await envelopeRes.json();

        const signingUrl = envelopeData.url;

        return {
            providerId: envelopeData.id,
            url: signingUrl,
        };
    },

    verifyWebhook: async (req) => {
        //TODO: Implement signature verification
        return true;
    },

    handleWebhook: async (req) => {
        const payload = req.body;

        if (payload.event_type === "form.completed" && payload.data?.id) {
            await markInvoiceAsPaid(payload.data.id);
        }
    },
};
