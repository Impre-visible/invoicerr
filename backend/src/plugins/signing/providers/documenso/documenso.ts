import { SigningPluginConfig, getProviderConfig } from "@/utils/plugins";
import { Documenso } from "@documenso/sdk-typescript";
import { ISigningProvider, RequestSignatureProps } from "../../types";
import { markInvoiceAsPaid } from "@/utils/plugins/signing";
import prisma from "@/prisma/prisma.service";

export const DocumensoProvider: ISigningProvider = {
    id: "documenso",
    name: "Documenso",

    requestSignature: async (props: RequestSignatureProps) => {
        const { baseUrl, apiKey } = await getProviderConfig<SigningPluginConfig>("documenso");
        const client = new Documenso({ 
            apiKey,
            serverURL: baseUrl 
        });

        const quote = await prisma.quote.findUnique({
            where: { id: props.id },
            include: {
                client: true,
            }
        });

        if (!quote || !quote.client) {
            throw new Error("Quote or client not found");
        }

        const response = await client.documents.createV0({
            title: props.title,
        });

        if (!response.uploadUrl) {
            throw new Error("Failed to create document");
        }

        const uploadUrl = response.uploadUrl;

        return { providerId: "docuseal", url: response.uploadUrl };
    },


    handleWebhook: async (req) => {
        const payload = req.body;

        if (payload.event_type === "form.completed" && payload.data?.id) {
            await markInvoiceAsPaid(payload.data.id);
        }
    },
};
