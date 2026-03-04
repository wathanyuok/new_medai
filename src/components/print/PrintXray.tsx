'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'
import axios from 'axios'
import font from '@/font/font.json'
import fontBold from '@/font/fontBold.json'
import { fetchS3Image } from '@/utils/getS3file';

type XrayPrintProps = {
    queue_id: any;
    check_id: any;
};

export default function XrayPrint({ queue_id, check_id }: XrayPrintProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [printData, setPrintData] = useState<any>({});
    const [image, setImage] = useState("");
    const [dataLoaded, setDataLoaded] = useState(false);
    const [autoProcessed, setAutoProcessed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Cleanup function when component unmounts
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, []);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    useEffect(() => {
        const queueId = parseInt(queue_id);
        console.log(queue_id)
        const fetchQueue = async () => {
            try {
                setStatus('กำลังโหลดข้อมูล...');
                setLoading(true);

                const lab = await GetQueue(queueId);

                setDataLoaded(true);
                // Use Promise.all with map instead of forEach
                await Promise.all(lab.checks.map(async (check: any, index: any) => {
                    if (check.chk_old != "") {
                        const presignOld = check.chk_old;
                        const partsOld = presignOld.split(".com/");
                        const fileOld = partsOld.pop();
                        const OldImg = await fetchS3Image(fileOld);

                        // Add the processed old image to the check object
                        check.oldImage = OldImg;
                        console.log('Old Image:', OldImg);
                    }

                    if (check.chk_upload != "") {
                        const presignNew = check.chk_upload;
                        const partsNew = presignNew.split(".com/");
                        const fileNew = partsNew.pop();
                        const NewImg = await fetchS3Image(fileNew);

                        // Add the processed new image to the check object
                        check.newImage = NewImg;
                        console.log('New Image:', NewImg);
                    }
                }));

                // Now printData.checks will have oldImage and newImage fields
                console.log('Updated printData.checks:', lab.checks);
                setPrintData(lab)


                console.log('Lab data loaded:', lab);
                setStatus('โหลดข้อมูลเสร็จสิ้น');
            } catch (error) {
                console.error('Error fetching queue:', error);
                setStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            } finally {
                setLoading(false);
            }
        };

        fetchQueue();
    }, []);

    // Auto process PDF when data is loaded
    useEffect(() => {
        const autoProcessPDF = async () => {
            if (dataLoaded && !autoProcessed && printData && Object.keys(printData).length > 0) {
                setAutoProcessed(true);
                setStatus('เริ่มสร้าง PDF อัตโนมัติ...');

                // Wait a moment for UI to update
                await new Promise(resolve => setTimeout(resolve, 500));

                // Auto generate PDF
                await generatePDF();
            }
        };

        autoProcessPDF();
    }, [dataLoaded, printData, autoProcessed]);

    const GetQueue = async (queue_id: number) => {
        const token = localStorage.getItem('token')
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/xray/${queue_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const presignImg = res.data.data.shop.shop_image
            const parts = presignImg.split(".com/");
            const filename = parts.pop();
            const shop_image = await fetchS3Image('shop/S9d95a914-8929-4738-9693-81e133b8f03b.jpg')
            setImage(shop_image!)



            return await res.data.data;
        } catch (error) {
            console.error("Error fetching lab result", error);
            return null;
        }
    }

    // Function to create PDF with jsPDF (A4 size)
    const createJsPDF = () => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        doc.addFileToVFS('TH-Niramit-AS-normal.ttf', font.data)
        doc.addFileToVFS('TH-Niramit-AS-Bold-bold.ttf', fontBold.data)
        doc.addFont('TH-Niramit-AS-normal.ttf', 'TH-Niramit', 'normal')
        doc.addFont('TH-Niramit-AS-Bold-bold.ttf', 'TH-Niramit', 'bold')
        doc.setFont('TH-Niramit', 'bold')


        const filterChecksById = printData.checks.filter((item: any) => {
            return item.id == check_id
        })
        printData.checks = filterChecksById
        let mappedArray = printData.checks.map((check: any) => ({
            id: check.id,
            checking_code: check.chk_code,
            specimen_name_en: check.specimen_name_en,
            checking_name: check.chk_name,
            chk_value: check.chk_direction_detail,
            chk_direction_detail: check.chk_direction_detail || '-',
            chk_flag: check.chk_flag || '-',
            chk_old: check.chk_old || '-',
            chk_unit: check.chk_unit || '-',
            chk_type_id: check.chk_type_id || null,
            chk_method: check.chk_method || null,
            subs: null
        }));

        // mappedArray = mappedArray.filter((item: any) => {
        //     // item.chk_code != "1935" 
        //     return item.id == check_id
        // });
        mappedArray = mappedArray.filter((item: any) => {
            // item.chk_code != "1935" 
            return item.checking_code !== "1935"
        });

        console.log(mappedArray)
        const rows: any[] = [];
        mappedArray.forEach((item: any, index: number) => {
            rows.push([
                [`${index + 1}.) ${item.checking_name}`],
                [(item.specimen_name_en || '-')],
                [(item.chk_method || '-')],
                [(item.chk_value || '-')],
                [item.chk_flag],
                [item.chk_unit],
                // [item.chk_direction_detail],
                // [item.chk_old]
            ],)
        })

        let totalPage = 5
        const spacer = 6
        const font_header = 16
        const font_body = 14

        const printHeader = (doc: jsPDF, currentY: number) => {
            const birthDate = new Date(printData.customer.ctm_birthdate)
            const today = new Date()
            let years = today.getFullYear() - birthDate.getFullYear();
            let months = today.getMonth() - birthDate.getMonth();
            let days = today.getDate() - birthDate.getDate();

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

            doc.setFontSize(font_header);
            doc.addImage(String(image), 'JPEG', 10, 5, 28, 28)
            currentY += 8
            doc.text(printData.shop.shop_name, 40, currentY)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);
            doc.text('LABORATORY REPORT', 205, currentY, { align: 'right' })
            doc.setFont('TH-Niramit', 'bold')
            currentY += spacer
            doc.setFontSize(10);
            doc.setFont('TH-Niramit', 'normal')
            doc.text(`${printData.shop.shop_address} แขวง${printData.shop.shop_district} เขต${printData.shop.shop_amphoe} ${printData.shop.shop_province} ${printData.shop.shop_zipcode}`, 40, currentY)
            currentY += spacer
            doc.text(`${printData.shop.shop_phone}`, 40, currentY)
            currentY += spacer
            doc.setFont('TH-Niramit', 'bold')
            doc.setFontSize(font_body);
            doc.text(`Name : ${printData.customer.ctm_prefix == 'ไม่ระบุ' ? '' : printData.customer.ctm_prefix} ${printData.customer.ctm_fname} ${printData.customer.ctm_lname}`, 25, currentY)
            doc.text(`Sex : ${printData.customer.ctm_gender}`, 120, currentY)
            doc.text(`Age : ${age}`, 150, currentY)
            currentY += spacer
            doc.text(`HN : ${printData.customer.ctm_id}`, 25, currentY)
            doc.text(`Lab No. : ${printData.que_code}`, 75, currentY)
            doc.text(`Request Date. : ${new Date(printData.que_datetime).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`, 120, currentY)
            currentY += spacer
            doc.setDrawColor("#DDDAD0");
            doc.setLineWidth(0.5)
            doc.line(5, currentY, 205, currentY)
            doc.setDrawColor("black");


            return currentY
        }
        const printTable = (doc: jsPDF, currentY: number) => {
            autoTable(doc, {
                startY: currentY,
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
                    0: { halign: 'left', cellWidth: 40, fontSize: 10, valign: 'middle' },
                    1: { halign: 'center', cellWidth: 20, fontSize: 9, valign: 'middle' },
                    2: { halign: 'center', cellWidth: 20, fontSize: 10, valign: 'middle' },
                    3: { halign: 'center', cellWidth: 55, fontSize: 10, valign: 'middle' },
                    4: { halign: 'center', cellWidth: 25, fontSize: 10 },
                    5: { halign: 'center', cellWidth: 40, fontSize: 10, valign: 'middle' },
                    // 6: { halign: 'center', cellWidth: 35, fontSize: 10, valign: 'middle' },
                    // 7: { halign: 'center', cellWidth: 40, fontSize: 10, valign: 'middle' },
                },
                head: [['TEST NAME', 'SPECIMEN', 'METHOD', 'RESULT', 'FLAG', 'UNIT']],
                body: rows,
            })
            return currentY
        }
        const printContentClinicBlock = (
            doc: jsPDF,
            currentY: number,
            label: string,
            content: string,
            labelIndent: number,
            textIndent: number,
            subjectWidth: any,
            fontSize: number
        ) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginBottom = 30;
            const spacer = 6;
            // doc.setFontSize(12)

            // Check if label needs a new page
            // const labelHeight = spacer * 2;
            // if (currentY > pageHeight - marginBottom) {
            //     doc.addPage();
            //     currentY = 10;
            //     currentY = printHeader(currentY); // Reset header
            // }

            doc.setFontSize(fontSize)

            // Print the label with underline
            doc.setFont('TH-Niramit', 'bold');
            doc.text(label, labelIndent, currentY);
            const textWidth = doc.getTextWidth(label);
            const lines = doc.splitTextToSize(content || '-', subjectWidth);
            // if (currentY > pageHeight - marginBottom) {
            //     // doc.setTextColor(0, 173, 152)
            //     doc.addPage();
            //     currentY = printHeader(currentY); // Reset header
            //     doc.setFont('TH-Niramit', 'bold');
            //     doc.text(label, labelIndent, currentY); // Reprint label
            //     // doc.line(labelIndent, currentY + 2, labelIndent + textWidth, currentY + 2);
            //     currentY += spacer;
            //     doc.setFont('TH-Niramit', 'normal');
            //     doc.setTextColor(0, 0, 0)
            // }

            // Print each line
            lines.forEach((line: any, index: any) => {
                doc.setFont('TH-Niramit', 'bold');
                const xPosition = index === 0 ? textIndent + textWidth : textIndent + textWidth;
                // doc.setTextColor(0, 173, 152)
                doc.text(line, xPosition, currentY);
                currentY += spacer;
                doc.setTextColor(0, 0, 0)
                doc.setFont('TH-Niramit', 'normal');
            });


            return currentY;
        };
        const printXrayBeforeAfter = (
            doc: jsPDF,
            currentY: number,
            beforeImageData: string,
            afterImageData: string,
            options?: {
                imageWidth?: number;
                imageHeight?: number;
                spacing?: number;
                showLabels?: boolean;
                labelFontSize?: number;
                title?: string;
                titleFontSize?: number;
            }
        ) => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Default options
            const opts = {
                imageWidth: 80,
                imageHeight: 100,
                spacing: 10,
                showLabels: true,
                labelFontSize: 12,
                title: "X-Ray Comparison",
                titleFontSize: 16,
                ...options
            };

            let yPosition = currentY;

            // Calculate positioning for side-by-side images
            const totalImagesWidth = (opts.imageWidth * 2) + opts.spacing;
            const startX = (pageWidth - totalImagesWidth) / 2;

            const beforeImageX = startX;
            const afterImageX = startX + opts.imageWidth + opts.spacing;

            // Add labels if enabled
            if (opts.showLabels) {
                doc.setFontSize(opts.labelFontSize);
                doc.setFont("helvetica", "bold");

                // "Before" label
                const beforeText = "PREVIOUS RESULT";
                const beforeTextWidth = doc.getTextWidth(beforeText);
                const beforeTextX = beforeImageX + (opts.imageWidth - beforeTextWidth) / 2;
                doc.text(beforeText, beforeTextX, yPosition);

                // "After" label
                const afterText = "RESULT";
                const afterTextWidth = doc.getTextWidth(afterText);
                const afterTextX = afterImageX + (opts.imageWidth - afterTextWidth) / 2;
                doc.text(afterText, afterTextX, yPosition);

                yPosition += opts.labelFontSize;
            }



            // Draw vertical line between images
            const lineX = beforeImageX + opts.imageWidth + (afterImageX - beforeImageX - opts.imageWidth) / 2;
            const lineStartY = yPosition; // Start after labels
            const lineEndY = yPosition + opts.imageHeight; // Assuming you have imageHeight option

            doc.setDrawColor("#DDDAD0");
            doc.setLineWidth(0.5); // Line thickness
            doc.line(lineX, lineStartY, lineX, lineEndY);

            try {
                // Add before image
                doc.addImage(
                    beforeImageData || '',
                    'JPEG', // or 'PNG' depending on your image format
                    beforeImageX,
                    yPosition,
                    opts.imageWidth,
                    opts.imageHeight
                );

                // doc.line(pageWidth / 2, beforeImageX, pageWidth / 2, opts.imageHeight)

                // Add after image
                doc.addImage(
                    afterImageData,
                    'JPEG', // or 'PNG' depending on your image format
                    afterImageX,
                    yPosition,
                    opts.imageWidth,
                    opts.imageHeight
                );

                // Update Y position to below the images
                yPosition += opts.imageHeight + 10;

                // Add separator lines (similar to your original function)
                // doc.setLineWidth(0.5);
                // doc.line(5, yPosition, pageWidth - 5, yPosition);
                // yPosition += 5;
                // doc.line(5, yPosition, pageWidth - 5, yPosition);
                yPosition += 10;

            } catch (error) {
                console.error('Error adding X-ray images:', error);
                // Add error message to PDF
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("Error loading X-ray images", 10, yPosition);
                yPosition += 20;
            }

            return yPosition;
        };

        const printFooter = (doc: jsPDF) => {
            const pageHeight = doc.internal.pageSize.getHeight()
            doc.setFont('TH-Niramit', 'bold')
            doc.setDrawColor("#DDDAD0");
            doc.setTextColor("#7A7A73")
            doc.setLineWidth(0.5)
            doc.line(5, pageHeight - 21, doc.internal.pageSize.getWidth() - 5, pageHeight - 21)
            doc.line(5, pageHeight - 9, doc.internal.pageSize.getWidth() - 5, pageHeight - 9)
            doc.setFontSize(10)
            doc.text(`Reported by: ${printData.que_xray_analyst},${printData.que_xray_analyst_license}`, 10, pageHeight - 17)
            doc.text(`Authorized by: ${printData.que_xray_inspector},${printData.que_xray_inspector_license}`, 10, pageHeight - 14)
            doc.text(`This report has been approved electronically. Information contained in this document is CONFIDENTIAL. Copyright: Issued by Bangkok Be Health`, 10, pageHeight - 11)

            doc.text(`Print Date and Time: ${new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`, 120, pageHeight - 14)

            doc.setDrawColor("black");
            doc.setTextColor("black")
        }
        // Log the checks data to see the structure
        console.log(printData.checks);

        if (printData.checks && Array.isArray(printData.checks)) {
            printData.checks.forEach((check: any, index: any) => {
                console.log(`Processing check ${index + 1}:`, check);

                if (check.chk_old != "") {
                    const presignOld = check.chk_old
                    const partsOld = presignOld.split(".com/");
                    const fileOld = partsOld.pop();
                    const OldImg = fetchS3Image(fileOld)
                    console.log(OldImg)

                }
                if (check.chk_upload != "") {
                    const presignew = check.chk_upload
                    const partsNew = presignew.split(".com/");
                    const fileNew = partsNew.pop();
                    const NewImg = fetchS3Image(fileNew)
                    console.log(NewImg)

                }

                // setImage(shop_image!)

                // Add new page for each check
                if (index > 0) {
                    doc.addPage();
                }

                // Reset position for new page
                totalPage = 5;

                // Print header for each check
                totalPage = printHeader(doc, totalPage);

                // Add some spacing after header
                totalPage += 10;



                // Print X-ray before/after for each check
                if (check.chk_code == "1924") {
                    totalPage = printTable(doc, totalPage)

                } else {
                    doc.text(`Test Name: ${check.chk_name}`, 10, totalPage)
                    // doc.text(`Description: ${check.chk_direction_detail}`, 60, totalPage)
                    totalPage += spacer;
                    totalPage = printContentClinicBlock(doc, totalPage, 'Result:', `${check.chk_flag}`, 10, 11, 160, font_body);
                    // totalPage += spacer;
                    totalPage = printContentClinicBlock(doc, totalPage, 'Description:', `${check.chk_direction_detail}`, 10, 11, 160, font_body);
                    totalPage += spacer;
                    totalPage = printXrayBeforeAfter(

                        doc,
                        totalPage,
                        check.oldImage || '',
                        check.newImage || '',
                        {
                            imageWidth: 90,
                            imageHeight: 100,
                            spacing: 15,
                            title: check.title || `Check ${index + 1} - Treatment Progress`,
                            showLabels: true
                        }
                    );

                }

                // Add some spacing after images
                totalPage += 10;

                // Optional: Add check details text
                if (check.description) {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.text(check.description, 10, totalPage);
                    totalPage += 15;
                }

                // Optional: Add check date
                if (check.date) {
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(9);
                    doc.text(`Date: ${check.date}`, 10, totalPage);
                    totalPage += 15;
                }

                // Print footer for each check at the end
                printFooter(doc);

                // Optional: Add check-specific information before footer
                if (check.checkNumber) {
                    const pageHeight = doc.internal.pageSize.getHeight();
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text(`Check ${index + 1} of ${printData.checks.length}`, 10, pageHeight - 25);
                }
            });
        } else {
            console.log("No checks found or checks is not an array");

            // Fallback: print single X-ray if no checks array
            totalPage = printHeader(doc, totalPage);
            totalPage += 10;

            totalPage = printXrayBeforeAfter(
                doc,
                totalPage,
                image,
                image,
                {
                    imageWidth: 90,
                    imageHeight: 100,
                    spacing: 15,
                    title: "Treatment Progress",
                    showLabels: true
                }
            );

            // Print footer for fallback case
            printFooter(doc);
        }

        doc.setFontSize(16);
        return doc;
    };

    // Generate PDF function
    const generatePDF = async () => {
        if (!printData || Object.keys(printData).length === 0) {
            setStatus('ไม่มีข้อมูลสำหรับสร้าง PDF');
            return;
        }

        setLoading(true);
        setStatus('กำลังสร้าง Lab Report PDF...');

        try {
            // Generate jsPDF
            const jsPdfDoc = createJsPDF();
            const pdfBlob = jsPdfDoc.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            // Clean up previous URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            setPreviewUrl(url);

            if (isMobile) {
                window.open(url, '_blank');
                window.close()
                return;
            }

            setShowPreview(true);
            setStatus('สร้าง Lab Report PDF เสร็จสมบูรณ์');

        } catch (error) {
            console.error('Error generating PDF:', error);
            setStatus(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };
    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setShowPreview(false);
        setStatus('');
    };

    const downloadPDF = () => {
        if (previewUrl) {
            const a = document.createElement('a');
            a.href = previewUrl;
            a.download = `Lab-Result-${printData?.customer?.ctm_fname || 'Unknown'}_${printData?.customer?.ctm_lname || 'User'}-${new Date(printData?.que_datetime || new Date()).toLocaleString('th-TH-u-ca-gregory', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })}.pdf`;
            a.click();
            setStatus('กำลังดาวน์โหลด PDF...');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-full">

            {/* Status Section */}


            {/* PDF Preview Section */}
            {showPreview && previewUrl && (
                <div className="bg-white shadow-lg rounded-lg p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                       
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={downloadPDF}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <span className="inline-block mr-1">📥</span>
                                <span className="hidden xs:inline">ดาวน์โหลด PDF</span>
                                <span className="xs:hidden">Download</span>
                            </button>
                            <a
                               
                               onClick={()=>{
                                 window.open(previewUrl, '_blank')
                               }}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center"
                            >
                                <span className="inline-block mr-1">🔗</span>
                                <span className="hidden xs:inline">เปิด PDF ใน Tab ใหม่</span>
                                <span className="xs:hidden">Open PDF</span>
                            </a>

                            {/* Mobile: Open in New Tab Button */}
                            {isMobile && (
                                <button
                                    onClick={() => window.open(previewUrl, '_blank')}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white text-sm sm:text-base rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                >
                                    <span className="inline-block mr-1">🔗</span>
                                    <span className="hidden xs:inline">เปิดใน Tab ใหม่</span>
                                    <span className="xs:hidden">Open</span>
                                </button>
                            )}

                            <button
                                onClick={closePreview}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm sm:text-base rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                            >
                                <span className="inline-block mr-1">✕</span>
                                <span className="hidden xs:inline">ปิด Preview</span>
                                <span className="xs:hidden">Close</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Warning */}
                    {isMobile && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <span className="text-amber-500 text-lg">⚠️</span>
                                <div className="text-amber-800 text-sm">
                                    <strong>📱 Mobile Device Detected:</strong>
                                    <p className="mt-1">
                                        PDF viewer controls may be limited on mobile browsers.
                                        Try <strong>"เปิดใน Tab ใหม่"</strong> for full PDF functionality or
                                        <strong>"ดาวน์โหลด PDF"</strong> to view with your device's PDF app.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Viewer */}
                    <div className="border border-gray-200 sm:border-2 rounded-lg overflow-hidden">
                        {isMobile ? (
                            // Mobile: Show with fallback message
                            <div className="relative">
                                <iframe
                                    src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                    width="100%"
                                    height="400px"
                                    className="border-0"
                                    title="PDF Preview"
                                />
                                {/* Mobile overlay with additional options */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span>📱 Touch: Pinch to zoom, swipe to navigate</span>
                                        <button
                                            onClick={() => window.open(previewUrl, '_blank')}
                                            className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
                                        >
                                            Full View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Desktop: Standard iframe
                            <iframe
                                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
                                width="100%"
                                height="400px"
                                className="border-0 sm:h-[600px] md:h-[700px] lg:h-[800px]"
                                title="PDF Preview"
                            />
                        )}
                    </div>

                    {/* Instructions for PDF viewer */}
                    <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded text-xs sm:text-sm text-gray-600">
                        <strong className="block sm:inline">การใช้งาน PDF Viewer:</strong>
                        <span className="block sm:inline sm:ml-1">
                            {isMobile ? (
                                <>
                                    <span className="block mt-1 text-blue-600">
                                        📱 <strong>Mobile:</strong> ใช้นิ้วปัด (swipe) ซ้าย-ขวา เพื่อดูหน้าถัดไป, หยิก (pinch) เพื่อ zoom in/out
                                    </span>
                                    <span className="block mt-1 text-purple-600">
                                        🔗 <strong>เคล็ดลับ:</strong> กด "เปิดใน Tab ใหม่" เพื่อใช้งาน PDF ได้เต็มรูปแบบ
                                    </span>
                                </>
                            ) : (
                                'ใช้ควบคุมด้านบนของ viewer เพื่อ zoom, หน้าถัดไป/ก่อนหน้า, พิมพ์, หรือดาวน์โหลด'
                            )}
                        </span>
                    </div>

                </div>
            )}
        </div>
    );
}