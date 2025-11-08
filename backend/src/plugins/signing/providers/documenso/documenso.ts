import { DocumentCreateDocumentTemporaryRecipientRequest, DocumentCreateDocumentTemporaryResponse } from "@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary";
import { ISigningProvider, RequestSignatureProps } from "../../types";
import { SigningPluginConfig, getProviderConfig } from "@/utils/plugins";
import { countPdfPages, uploadQuoteFileToUrl } from "../../utils";

import { Documenso } from "@documenso/sdk-typescript";
import { Logger } from "@nestjs/common";
import { QuotesService } from "@/modules/quotes/quotes.service";
import { markInvoiceAsPaid } from "@/utils/plugins/signing";
import prisma from "@/prisma/prisma.service";

const logger = new Logger('DocumensoProvider');

export const DocumensoProvider: ISigningProvider = {
    id: "documenso",
    name: "Documenso",

    requestSignature: async (props: RequestSignatureProps) => {
        const quotesService = new QuotesService()
        let { baseUrl, apiKey } = await getProviderConfig<SigningPluginConfig>("documenso");

        if (baseUrl.endsWith("/")) {
            baseUrl.slice(0, -1);
        }

        if (!baseUrl.includes("/api")) {
            baseUrl += "/api/v2-beta";
        }

        const client = new Documenso({
            apiKey,
            serverURL: baseUrl,
        });

        const quote = await prisma.quote.findUnique({
            where: { id: props.id },
            include: {
                client: true,
                company: true,
            }
        });

        if (!quote || !quote.client || !quote.client.contactEmail) {
            throw new Error("Quote or client not found");
        }

        const pdfFileUint8Array: Uint8Array = await quotesService.getQuotePdf(props.id);

        const pageCount = await countPdfPages(pdfFileUint8Array);

        const recipients: DocumentCreateDocumentTemporaryRecipientRequest[] = [
            {
                email: quote.client.contactEmail,
                name: quote.client.type === "INDIVIDUAL" ? `${quote.client.contactFirstname} ${quote.client.contactLastname}` : quote.client.name || "Client",
                role: "SIGNER",
                fields: [
                    {
                        type: "DATE",
                        pageNumber: pageCount,
                        pageX: 5,
                        pageY: 85,
                        width: 20,
                        height: 5,
                    },
                    {
                        type: "SIGNATURE",
                        pageNumber: pageCount,
                        pageX: 5,
                        pageY: 93,
                        width: 20,
                        height: 5,
                    }
                ],
            },
            {
                email: quote.company.email,
                name: quote.company.name,
                role: "APPROVER",
                fields: [
                    {
                        type: "DATE",
                        pageNumber: pageCount,
                        pageX: 100 - 20 - 5,
                        pageY: 85,
                        width: 20,
                        height: 5,
                    },
                    {
                        type: "SIGNATURE",
                        pageNumber: pageCount,
                        pageX: 100 - 20 - 5,
                        pageY: 93,
                        width: 20,
                        height: 5,
                    }
                ],
            }
        ];

        console.log(JSON.stringify(recipients, null, 2));

        let response: DocumentCreateDocumentTemporaryResponse;

        try {
            response = await client.documents.createV0({
                title: quote.title || `Quote #${quote.id}`,
                externalId: quote.id,
                recipients: recipients,
            });
        } catch (error) {
            logger.error("Error creating document:", error);
            return Promise.reject(error);
        }

        if (!response.uploadUrl) {
            throw new Error("Failed to create document");
        }

        const document = response.document;
        const uploadUrl = response.uploadUrl;

        logger.log(`Upload URL for document "${props.title}": ${uploadUrl}`);

        await uploadQuoteFileToUrl(pdfFileUint8Array, uploadUrl);

        await client.documents.distribute({
            documentId: document.id,
        });

        return { providerId: "documenso", document: document, url: response.uploadUrl };
    },


    handleWebhook: async (req) => {
        const payload = req.body;

        logger.log("Documenso Webhook Payload:", JSON.stringify(payload, null, 2));

        if (payload.event_type === "form.completed" && payload.data?.id) {
            await markInvoiceAsPaid(payload.data.id);
        }
    },
};
