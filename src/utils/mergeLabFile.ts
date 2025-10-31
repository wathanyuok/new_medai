import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import font from '@/font/font.json'
import fontBold from '@/font/fontBold.json'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fetchS3Image } from '@/utils/getS3file';

// Types
interface PrintData {
    checks: Array<{
        id: number;
        chk_code: string;
        specimen_name_en: string;
        chk_name: string;
        chk_value?: string;
        fetchedImageValue?: string;
        chk_direction_detail?: string;
        chk_flag?: string;
        chk_old?: string;
        chk_unit?: string;
        chk_type_id?: number;
        chk_method?: string;
    }>;
    customer: {
        ctm_birthdate: string;
        ctm_prefix: string;
        ctm_fname: string;
        ctm_lname: string;
        ctm_gender: string;
        ctm_id: string;
    };
    shop: {
        shop_name: string;
        shop_address: string;
        shop_district: string;
        shop_amphoe: string;
        shop_province: string;
        shop_zipcode: string;
        shop_phone: string;
        shop_image: string;
    };
    que_code: string;
    que_datetime: string;
    que_lab_analyst: string;
    que_lab_analyst_license: string;
    que_lab_inspector: string;
    que_lab_inspector_license: string;
}

interface MergeOptions {
    includeLabReport?: boolean;
    printData?: PrintData;
    shopImage?: string;
    fontData?: string;
    fontBoldData?: string;
    uploadToS3?: boolean;
    s3Config?: {
        bucketName: string;
        region: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        key?: string; // S3 object key/path
    };
    progressCallback?: (progress: number, status: string, step?: string) => void;
}

interface MergeResult {
    success: boolean;
    blob?: Blob;
    url?: string;
    s3Url?: string; // Add S3 URL to result
    s3Key?: string; // Add S3 key to result
    totalPages?: number;
    processedFiles?: number;
    error?: string;
}

export class PDFMerger {
    private static readonly A4_WIDTH = 595.276;
    private static readonly A4_HEIGHT = 841.89;
    private static readonly MARGIN = 40;

    /**
     * Determines file type from URL extension
     */
    private static getFileType(url: string): 'pdf' | 'image' | 'unknown' {
        const extension = url.split('.').pop()?.toLowerCase();

        if (extension === 'pdf') {
            return 'pdf';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
            return 'image';
        } else {
            return 'unknown';
        }
    }
    /**
     * Upload to S3 Bucket
     */
    private static async UploadFile(files: File) {
        const s3Client = new S3Client({});
        const bucketName = ""
        const key = ""
        const params = {
            Body: files,
            Bucket: bucketName,
            Key: key,
        };
        try {
            // Upload file to S3
            const command = new PutObjectCommand(params);
            const response = await s3Client.send(command);
            console.log("File uploaded successfully", response);
            return response;
        } catch (error) {
            console.error("Error uploading file", error);
        }

    }

    /**
     * Converts image to PDF
     */
    private static async convertImageToPDF(imageUrl: string, fileName: string): Promise<any> {
        const { PDFDocument, rgb } = await import('pdf-lib');

        try {
            console.log(`Converting image: ${fileName}`);
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }

            const imageBytes = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.create();

            let embeddedImage;
            const extension = imageUrl.toLowerCase().split('.').pop();

            try {
                if (extension === 'png') {
                    embeddedImage = await pdfDoc.embedPng(imageBytes);
                } else if (['jpg', 'jpeg'].includes(extension || '')) {
                    embeddedImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                    embeddedImage = await pdfDoc.embedJpg(imageBytes);
                }
            } catch (embedError) {
                console.warn(`Failed to embed as ${extension}, trying alternative format:`, embedError);
                if (extension === 'png') {
                    embeddedImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                    embeddedImage = await pdfDoc.embedPng(imageBytes);
                }
            }

            if (!embeddedImage) {
                throw new Error('Failed to embed image in both PNG and JPEG formats');
            }

            const imgDims = embeddedImage.scale(1);
            const availableWidth = this.A4_WIDTH - (this.MARGIN * 2);
            const availableHeight = this.A4_HEIGHT - (this.MARGIN * 2) - 30;

            const scaleX = availableWidth / imgDims.width;
            const scaleY = availableHeight / imgDims.height;
            const scale = Math.min(scaleX, scaleY, 1);

            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;

            const x = (this.A4_WIDTH - scaledWidth) / 2;
            const y = (this.A4_HEIGHT - scaledHeight) / 2;

            const page = pdfDoc.addPage([this.A4_WIDTH, this.A4_HEIGHT]);

            page.drawRectangle({
                x: 0,
                y: 0,
                width: this.A4_WIDTH,
                height: this.A4_HEIGHT,
                color: rgb(1, 1, 1),
            });

            page.drawImage(embeddedImage, {
                x,
                y,
                width: scaledWidth,
                height: scaledHeight,
            });

            page.drawText(`${fileName} (Image converted to PDF)`, {
                x: 10,
                y: this.A4_HEIGHT - 15,
                size: 8,
                color: rgb(0.5, 0.5, 0.5),
            });

            page.drawText(`Original: ${Math.round(imgDims.width)} x ${Math.round(imgDims.height)} | Scale: ${Math.round(scale * 100)}%`, {
                x: 10,
                y: 15,
                size: 8,
                color: rgb(0.5, 0.5, 0.5),
            });

            return pdfDoc;

        } catch (error) {
            console.error(`Error converting image ${fileName}:`, error);
            return this.createErrorPage(fileName, imageUrl, error);
        }
    }

    /**
     * Creates an error page for failed conversions
     */
    private static async createErrorPage(fileName: string, url: string, error: any): Promise<any> {
        const { PDFDocument, rgb } = await import('pdf-lib');
        const errorDoc = await PDFDocument.create();
        const page = errorDoc.addPage([this.A4_WIDTH, this.A4_HEIGHT]);

        page.drawRectangle({
            x: 0,
            y: 0,
            width: this.A4_WIDTH,
            height: this.A4_HEIGHT,
            color: rgb(1, 1, 1),
        });

        page.drawText(`Error converting file: ${fileName}`, {
            x: 50,
            y: 400,
            size: 16,
            color: rgb(0.8, 0, 0),
        });

        page.drawText(`URL: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`, {
            x: 50,
            y: 370,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
        });

        page.drawText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
            x: 50,
            y: 340,
            size: 10,
            color: rgb(0.8, 0, 0),
        });

        return errorDoc;
    }

    /**
     * Creates a lab report PDF using jsPDF
     */
    private static async createLabReportPDF(printData: PrintData, shopImage: string, fontData?: string, fontBoldData?: string): Promise<jsPDF> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add fonts if provided
        if (fontData && fontBoldData) {
            doc.addFileToVFS('TH-Niramit-AS-normal.ttf', fontData);
            doc.addFileToVFS('TH-Niramit-AS-Bold-bold.ttf', fontBoldData);
            doc.addFont('TH-Niramit-AS-normal.ttf', 'TH-Niramit', 'normal');
            doc.addFont('TH-Niramit-AS-Bold-bold.ttf', 'TH-Niramit', 'bold');
            doc.setFont('TH-Niramit', 'bold');
        }

        // Prepare table data
        const mappedArray = printData.checks.map((check) => ({
            id: check.id,
            checking_code: check.chk_code,
            specimen_name_en: check.specimen_name_en,
            checking_name: check.chk_name,
            chk_value: check.chk_type_id == 3 ? check.fetchedImageValue || '-' : check.chk_value || '-',
            chk_direction_detail: check.chk_direction_detail || '-',
            chk_flag: check.chk_flag || '-',
            chk_old: check.chk_old || '-',
            chk_unit: check.chk_unit || '-',
            chk_type_id: check.chk_type_id || null,
            chk_method: check.chk_method || null,
        }));

        const rows = mappedArray.map((item, index) => [
            [`${index + 1}.) ${item.checking_name}`],
            [(item.specimen_name_en || '-')],
            [(item.chk_method || '-')],
            [(item.chk_value || '-')],
            [item.chk_flag],
            [item.chk_unit],
            [item.chk_direction_detail],
            [item.chk_old]
        ]);

        // Header
        this.printHeader(doc, printData, shopImage);

        // Table
        this.printTable(doc, rows);

        // Footer
        this.printFooter(doc, printData);

        return doc;
    }

    /**
     * Prints header section
     */
    private static printHeader(doc: jsPDF, printData: PrintData, shopImage: string): void {
        const birthDate = new Date(printData.customer.ctm_birthdate);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();
        doc.addFileToVFS('TH-Niramit-AS-normal.ttf', font.data)
        doc.addFileToVFS('TH-Niramit-AS-Bold-bold.ttf', fontBold.data)
        doc.addFont('TH-Niramit-AS-normal.ttf', 'TH-Niramit', 'normal')
        doc.addFont('TH-Niramit-AS-Bold-bold.ttf', 'TH-Niramit', 'bold')
        doc.setFont('TH-Niramit', 'bold')

        if (days < 0) {
            months--;
            const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days = previousMonth + days;
        }

        if (months < 0) {
            years--;
            months = 12 + months;
        }

        const age = `${years} ปี ${months} เดือน ${days} วัน`;

        let currentY = 13;
        const spacer = 6;

        doc.setFontSize(16);
        // if (shopImage) {
        //     doc.addImage(shopImage, 'JPEG', 10, 5, 23, 23);
        // }

        doc.text(printData.shop.shop_name, 40, currentY);
        doc.setFontSize(25);
        doc.text('LABORATORY REPORT', 205, currentY, { align: 'right' });

        currentY += spacer;
        doc.setFontSize(10);
        doc.text(`${printData.shop.shop_address} แขวง${printData.shop.shop_district} เขต${printData.shop.shop_amphoe} ${printData.shop.shop_province} ${printData.shop.shop_zipcode}`, 40, currentY);

        currentY += spacer;
        doc.text(`${printData.shop.shop_phone}`, 40, currentY);

        currentY += spacer;
        doc.setFontSize(14);
        doc.text(`Name : ${printData.customer.ctm_prefix == 'ไม่ระบุ' ? '' : printData.customer.ctm_prefix} ${printData.customer.ctm_fname} ${printData.customer.ctm_lname}`, 25, currentY);
        doc.text(`Sex : ${printData.customer.ctm_gender}`, 120, currentY);
        doc.text(`Age : ${age}`, 150, currentY);

        currentY += spacer;
        doc.text(`HN : ${printData.customer.ctm_id}`, 25, currentY);
        doc.text(`Lab No. : ${printData.que_code}`, 75, currentY);
        doc.text(`Request Date. : ${new Date(printData.que_datetime).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })}`, 120, currentY);
    }

    /**
     * Prints table section
     */
    private static printTable(doc: jsPDF, rows: any[]): void {
        autoTable(doc, {
            startY: 45,
            theme: 'striped',
            margin: { left: 5, right: 5, top: 72, bottom: 35 },
            styles: {
                font: "TH-Niramit",
                fontSize: 13,
                fontStyle: "bold",
                textColor: "black",
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: "black",
                fontStyle: "bold",
                halign: 'center',
                valign: 'middle',
                lineWidth: 0,
            },
            columnStyles: {
                0: { halign: 'left', cellWidth: 25, fontSize: 10, valign: 'middle' },
                1: { halign: 'center', cellWidth: 20, fontSize: 9, valign: 'middle' },
                2: { halign: 'center', cellWidth: 20, fontSize: 10, valign: 'middle' },
                3: { halign: 'center', cellWidth: 15, fontSize: 10, valign: 'middle' },
                4: { halign: 'center', cellWidth: 25, fontSize: 10 },
                5: { halign: 'center', cellWidth: 20, fontSize: 10, valign: 'middle' },
                6: { halign: 'center', cellWidth: 35, fontSize: 10, valign: 'middle' },
                7: { halign: 'center', cellWidth: 40, fontSize: 10, valign: 'middle' },
            },
            head: [['TEST NAME', 'SPECIMEN', 'METHOD', 'RESULT', 'FLAG', 'UNIT', 'REFERENCE RANGE', 'PREVIOUS RESULT']],
            body: rows,
        });
    }

    /**
     * Prints footer section
     */
    private static printFooter(doc: jsPDF, printData: PrintData): void {
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor("#DDDAD0");
        doc.setTextColor("#7A7A73");
        doc.setLineWidth(0.5);
        doc.line(5, pageHeight - 21, doc.internal.pageSize.getWidth() - 5, pageHeight - 21);
        doc.line(5, pageHeight - 9, doc.internal.pageSize.getWidth() - 5, pageHeight - 9);
        doc.setFontSize(10);
        doc.text(`Reported by: ${printData.que_lab_analyst},${printData.que_lab_analyst_license}`, 10, pageHeight - 17);
        doc.text(`Authorized by: ${printData.que_lab_inspector},${printData.que_lab_inspector_license}`, 10, pageHeight - 14);
        doc.text(`This report has been approved electronically. Information contained in this document is CONFIDENTIAL. Copyright: Issued by Bangkok Be Health`, 10, pageHeight - 11);
        doc.text(`Print Date and Time: ${new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })}`, 120, pageHeight - 14);
    }

    /**
     * Converts a page to A4 format
     */
    private static async convertPageToA4(sourcePage: any, mergedPdf: any, title: string, pageNumber: number): Promise<void> {
        const { rgb } = await import('pdf-lib');
        const newPage = mergedPdf.addPage([this.A4_WIDTH, this.A4_HEIGHT]);

        newPage.drawRectangle({
            x: 0,
            y: 0,
            width: this.A4_WIDTH,
            height: this.A4_HEIGHT,
            color: rgb(1, 1, 1),
        });

        try {
            const embeddedPage = await mergedPdf.embedPage(sourcePage);
            const { width: origWidth, height: origHeight } = embeddedPage;

            const availableWidth = this.A4_WIDTH;
            const availableHeight = this.A4_HEIGHT;

            const scaleX = availableWidth / origWidth;
            const scaleY = availableHeight / origHeight;
            const scale = Math.min(scaleX, scaleY);

            const scaledWidth = origWidth * scale;
            const scaledHeight = origHeight * scale;

            const x = (this.A4_WIDTH - scaledWidth) / 2;
            const y = (this.A4_HEIGHT - scaledHeight) / 2;

            newPage.drawPage(embeddedPage, {
                x,
                y,
                width: scaledWidth,
                height: scaledHeight,
            });

        } catch (embedError) {
            console.warn(`Cannot embed page ${pageNumber} from ${title}:`, embedError);

            newPage.drawText(`${title} - Page ${pageNumber}`, {
                x: this.A4_WIDTH / 2 - 60,
                y: this.A4_HEIGHT / 2 + 10,
                size: 14,
                color: rgb(0, 0, 0),
            });

            newPage.drawText('(Unable to convert to A4)', {
                x: this.A4_WIDTH / 2 - 70,
                y: this.A4_HEIGHT / 2 - 10,
                size: 10,
                color: rgb(0.8, 0, 0),
            });
        }
    }

    /**
     * Main function to merge PDFs and images
     */
    public static async mergePDFsAndImages(
        fileUrls: string[],
        options: MergeOptions = {}
    ): Promise<MergeResult> {
        const {
            includeLabReport = false,
            printData,
            shopImage = '',
            fontData,
            fontBoldData,
            progressCallback,
            uploadToS3 = false,
            s3Config
        } = options;

        try {
            const { PDFDocument } = await import('pdf-lib');

            // Analyze file types
            const fileTypes = fileUrls.map(url => ({ url, type: this.getFileType(url) }));
            const pdfCount = fileTypes.filter(f => f.type === 'pdf').length;
            const imageCount = fileTypes.filter(f => f.type === 'image').length;
            const unknownCount = fileTypes.filter(f => f.type === 'unknown').length;

            progressCallback?.(0, `Found ${fileUrls.length} files (PDF: ${pdfCount}, Images: ${imageCount}${unknownCount > 0 ? `, Unknown: ${unknownCount}` : ''}) - Starting process...`);

            const mergedPdf = await PDFDocument.create();
            let totalPagesProcessed = 0;

            // Add lab report if requested
            if (includeLabReport && printData) {
                progressCallback?.(5, 'Creating lab report PDF...', 'Generating lab report with jsPDF...');
                const jsPdfDoc =  await this.createLabReportPDF(printData, shopImage, fontData, fontBoldData);
                const jsPdfBytes = jsPdfDoc.output('arraybuffer');
                const jsPdfDocument = await PDFDocument.load(jsPdfBytes);
                const jsPdfPageCount = jsPdfDocument.getPageCount();

                progressCallback?.(10, 'Adding lab report pages...', 'Converting lab report pages to A4...');
                for (let i = 0; i < jsPdfPageCount; i++) {
                    const sourcePage = jsPdfDocument.getPage(i);
                    await this.convertPageToA4(sourcePage, mergedPdf, 'Lab Report', i + 1);
                }
                totalPagesProcessed += jsPdfPageCount;
            }

            // Process each file (adjust progress range to leave room for S3 upload)
            const progressPerFile = (uploadToS3 ? 70 : 80) / Math.max(fileUrls.length, 1);

            for (let urlIndex = 0; urlIndex < fileUrls.length; urlIndex++) {
                const url = fileUrls[urlIndex];
                const fileNumber = urlIndex + 1;
                const fileType = this.getFileType(url);
                const fileName = url.split('/').pop() || `File${fileNumber}`;

                progressCallback?.(
                    15 + (urlIndex * progressPerFile),
                    `Processing file ${fileNumber}/${fileUrls.length} (${fileType.toUpperCase()})...`,
                    `Processing ${fileName}...`
                );

                try {
                    if (fileType === 'pdf') {
                        // Handle PDF files
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status} for PDF file ${fileNumber}`);
                        }

                        const s3PdfBytes = await response.arrayBuffer();
                        const s3PdfDocument = await PDFDocument.load(s3PdfBytes);
                        const s3PageCount = s3PdfDocument.getPageCount();

                        for (let i = 0; i < s3PageCount; i++) {
                            const sourcePage = s3PdfDocument.getPage(i);
                            await this.convertPageToA4(sourcePage, mergedPdf, `PDF File ${fileNumber}`, i + 1);
                            totalPagesProcessed++;
                        }

                    } else if (fileType === 'image') {
                        // Handle Image files
                        const imagePdf = await this.convertImageToPDF(url, fileName);
                        const imagePageCount = imagePdf.getPageCount();

                        for (let i = 0; i < imagePageCount; i++) {
                            const sourcePage = imagePdf.getPage(i);
                            await this.convertPageToA4(sourcePage, mergedPdf, `Image File ${fileNumber}`, i + 1);
                            totalPagesProcessed++;
                        }

                    } else {
                        // Handle unknown file types - create error page
                        throw new Error(`Unsupported file type for file ${fileNumber}`);
                    }

                } catch (error) {
                    console.error(`Error processing file ${fileNumber} (${fileType}):`, error);

                    // Add error page to merged PDF
                    const errorPdf = await this.createErrorPage(fileName, url, error);
                    const errorPage = errorPdf.getPage(0);
                    await this.convertPageToA4(errorPage, mergedPdf, `Error File ${fileNumber}`, 1);
                    totalPagesProcessed++;
                }
            }

            progressCallback?.(uploadToS3 ? 85 : 95, 'Finalizing merged PDF...', 'Creating final A4 document...');

            // Set PDF metadata
            mergedPdf.setTitle(`Merged PDF - ${fileUrls.length} Files (${pdfCount} PDFs + ${imageCount} Images) Converted to A4`);
            mergedPdf.setCreator('PDF Merger Utility');
            mergedPdf.setProducer('jsPDF + PDF-lib A4 Converter');
            mergedPdf.setCreationDate(new Date());

            // Generate final PDF
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            let s3Url: string | undefined;
            let s3Key: string | undefined;

            // Upload to S3 if requested
            if (uploadToS3 && s3Config) {
                try {
                    progressCallback?.(90, 'Uploading to S3...', 'Connecting to AWS S3...');

                    const uploadResult = await this.uploadToS3(mergedPdfBytes, s3Config, progressCallback);
                    s3Url = uploadResult.s3Url;
                    s3Key = uploadResult.s3Key;

                    progressCallback?.(100, `Success! Merged ${fileUrls.length} files and uploaded to S3`, `S3 URL: ${s3Url}`);
                } catch (s3Error) {
                    console.error('S3 upload failed:', s3Error);
                    // Continue with local result even if S3 upload fails
                    progressCallback?.(100, `Success! Merged ${fileUrls.length} files (S3 upload failed)`, `Local file created, S3 upload error: ${s3Error}`);
                }
            } else {
                progressCallback?.(100, `Success! Merged ${fileUrls.length} files into A4 format (${totalPagesProcessed} total pages)`);
            }

            return {
                success: true,
                blob,
                url,
                s3Url,
                s3Key,
                totalPages: totalPagesProcessed,
                processedFiles: fileUrls.length
            };

        } catch (error) {
            console.error('Error merging files:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    private static async uploadToS3(
        pdfBytes: Uint8Array,
        s3Config: NonNullable<MergeOptions['s3Config']>,
        progressCallback?: (progress: number, message: string, detail?: string) => void
    ): Promise<{ s3Url: string; s3Key: string }> {
        const { bucketName, region, accessKeyId, secretAccessKey } = s3Config;

        // Generate S3 key if not provided
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const s3Key = s3Config.key || `exa-med/merged-pdf-${timestamp}.pdf`;

        // Configure S3 client
        const s3ClientConfig: any = {
            region: region
        };

        // Add credentials if provided (otherwise use default AWS credential chain)
        if (accessKeyId && secretAccessKey) {
            s3ClientConfig.credentials = {
                accessKeyId,
                secretAccessKey
            };
        }

        const s3Client = new S3Client(s3ClientConfig);

        progressCallback?.(92, 'Uploading to S3...', `Uploading to s3://${bucketName}/${s3Key}`);

        try {
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: pdfBytes,
                ContentType: 'application/pdf',
                ContentDisposition: 'inline',
                Metadata: {
                    'upload-timestamp': new Date().toISOString(),
                    'file-type': 'merged-pdf'
                }
            });

            await s3Client.send(command);

            // Construct S3 URL
            const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

            progressCallback?.(95, 'Upload complete!', `File uploaded to ${s3Url}`);

            return { s3Url, s3Key };

        } catch (error) {
            throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Utility function to download the merged PDF
     */
    public static downloadPDF(blob: Blob, filename: string = 'merged-document.pdf'): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Parse URLs from text input
     */
    public static parseUrlsFromText(urlsText: string): string[] {
        return urlsText
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0 && url.startsWith('http'));
    }
}

// Export types for external use
export type { PrintData, MergeOptions, MergeResult };