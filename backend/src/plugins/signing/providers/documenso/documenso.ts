import { DocumentCreateDocumentTemporaryRecipientRequest, DocumentCreateDocumentTemporaryResponse } from "@documenso/sdk-typescript/models/operations/documentcreatedocumenttemporary";
import { DocumentGetResponse, DocumentGetStatus } from "@documenso/sdk-typescript/models/operations/documentget";
import { ISigningProvider, RequestSignatureProps } from "../../types";
import { Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { SigningPluginConfig, getProviderConfig } from "@/utils/plugins";
import { countPdfPages, uploadQuoteFileToUrl } from "../../utils";

import { Documenso } from "@documenso/sdk-typescript";
import { QuoteStatus } from "@prisma/client";
import { QuotesService } from "@/modules/quotes/quotes.service";
import { Request } from 'express';
import { markQuoteAs } from "@/utils/plugins/signing";
import prisma from "@/prisma/prisma.service";
import { verifyWebhookSecret } from "@/utils/webhook-security";

const logger = new Logger('DocumensoProvider');

interface DocumensoRecipient {
    email: string;
    name: string;
    role: "SIGNER" | "APPROVER" | "CC";
    readStatus: "NOT_OPENED" | "OPENED";
    signingStatus: "NOT_SIGNED" | "SIGNED" | "REJECTED";
    sendStatus: "NOT_SENT" | "SENT";
}
interface DocumensoWebhookPayload {
    id: number;
    externalId: string;
    status: DocumentGetStatus;
    completedAt: string | null;
    recipients: DocumensoRecipient[];
}

interface DocumensoWebhookBody {
    event: "DOCUMENT_SENT" | "DOCUMENT_SIGNED" | "DOCUMENT_COMPLETED" | "DOCUMENT_REJECTED" | "DOCUMENT_PENDING";
    payload: DocumensoWebhookPayload;
}

export const DocumensoProvider: ISigningProvider = {
    id: "documenso",
    name: "Documenso",

    formatServerUrl: (url: string) => {
        if (url.endsWith("/")) {
            url = url.slice(0, -1);
        }

        if (!url.includes("/api")) {
            url += "/api/v2-beta";
        }

        return url;
    },

    requestSignature: async (props: RequestSignatureProps) => {
        const quotesService = new QuotesService()
        let { baseUrl, apiKey } = await getProviderConfig<SigningPluginConfig>("documenso");

        baseUrl = DocumensoProvider.formatServerUrl(baseUrl);

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


    handleWebhook: async (req: Request, body: DocumensoWebhookBody) => {

        let { baseUrl, apiKey } = await getProviderConfig<SigningPluginConfig>("documenso");

        baseUrl = DocumensoProvider.formatServerUrl(baseUrl);

        const client = new Documenso({
            apiKey,
            serverURL: baseUrl,
        });

        const plugin = await prisma.plugin.findFirst({
            where: {
                id: "documenso",
                isActive: true,
                webhookUrl: {
                    not: null
                }
            }
        });

        if (!plugin) {
            throw new NotFoundException(`Plugin not found`);
        }

        if (req.headers['x-documenso-secret']) {
            const providedSecret = req.headers['x-documenso-secret'] as string;

            if (!providedSecret) {
                throw new UnauthorizedException('Webhook secret is required but not provided');
            }

            if (!verifyWebhookSecret(providedSecret, plugin.webhookSecretHash || '')) {
                logger.warn(`Invalid webhook secret for plugin ${plugin.name}`);
                throw new UnauthorizedException('Invalid webhook secret');
            }

            logger.log(`Webhook secret verified for plugin ${plugin.name}`);
        } else {
            logger.warn(`No webhook secret provided for plugin ${plugin.name}`);
            throw new UnauthorizedException('Webhook secret is required');
        }

        logger.log('Received Documenso webhook:', body);


        const documentId = body.payload.id;

        logger.log(`Received webhook for document: ${documentId}`);

        let document: DocumentGetResponse;

        try {
            document = await client.documents.get({ documentId });
        } catch (error) {
            logger.error(`Error fetching document ${documentId}:`, error);
            throw new NotFoundException(`Document with ID ${documentId} not found`);
        }

        const quote = await prisma.quote.findFirst({
            where: {
                id: document.externalId || '',
            }
        });




        switch (body.payload.status) {
            case DocumentGetStatus.Draft:
                logger.log(`Document draft: ${document.externalId}`);
                await markQuoteAs(quote?.id || '', QuoteStatus.DRAFT);
                break;
            case DocumentGetStatus.Pending:
                logger.log(`Document pending: ${document.externalId}`);
                await markQuoteAs(quote?.id || '', QuoteStatus.SENT);
                break;
            case DocumentGetStatus.Completed:
                logger.log(`Document completed: ${document.externalId}`);
                await markQuoteAs(quote?.id || '', QuoteStatus.SIGNED);
                break;
            case DocumentGetStatus.Rejected:
                logger.log(`Document rejected: ${document.externalId}`);
                await markQuoteAs(quote?.id || '', QuoteStatus.REJECTED);
                break;
        }

        return { message: 'Webhook processed successfully' };
    }
};
