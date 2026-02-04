
/**
 * Utility to construct Tally XMLs
 */

export const TallyXMLBuilder = {

    /**
     * Wraps body in standard Tally Envelope
     */
    wrapEnvelope: (bodyContent: string) => {
        return `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Import Data</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <IMPORTDATA>
                        <REQUESTDESC>
                            <REPORTNAME>Vouchers</REPORTNAME>
                            <STATICVARIABLES>
                                <SVCURRENTCOMPANY>##TARGET_COMPANY##</SVCURRENTCOMPANY>
                            </STATICVARIABLES>
                        </REQUESTDESC>
                        <REQUESTDATA>
                            <TALLYMESSAGE xmlns:UDF="TallyUDF">
                                ${bodyContent}
                            </TALLYMESSAGE>
                        </REQUESTDATA>
                    </IMPORTDATA>
                </BODY>
            </ENVELOPE>
        `;
    },

    /**
     * Builds XML for creating a new Customer Ledger
     */
    buildLedgerCreation: (name: string, group: string = 'Sundry Debtors', address?: string, state?: string, pincode?: string, gstin?: string) => {
        const addressBlock = address ? `
            <LEDGERMAILINGDETAILS.LIST>
                <ADDRESS.LIST>
                    <ADDRESS>${address}</ADDRESS>
                </ADDRESS.LIST>
                <PINCODE>${pincode || ''}</PINCODE>
                <STATE>${state || ''}</STATE>
            </LEDGERMAILINGDETAILS.LIST>
        ` : '';

        const gstBlock = gstin ? `<PARTYGSTIN>${gstin}</PARTYGSTIN>` : '';

        return `
            <LEDGER NAME="${name}" ACTION="Create">
                <NAME>${name}</NAME>
                <PARENT>${group}</PARENT>
                <OPENINGBALANCE>0</OPENINGBALANCE>
                <ISBILLWISEON>Yes</ISBILLWISEON>
                ${addressBlock}
                ${gstBlock}
            </LEDGER>
        `;
    },

    /**
     * Builds XML for a Sales Voucher
     * @param invoice The POS Invoice object
     * @param ledgerMap Mapping of POS tax heads to Tally Ledger Names
     */
    buildSalesVoucher: (invoice: any, ledgerMap: any = {}) => {
        // Default Mapping Fallbacks
        const salesLedger = ledgerMap.sales || 'Sales Account';
        const cashLedger = ledgerMap.cash || 'Cash';

        let inventoryEntries = '';

        invoice.items.forEach((item: any) => {
            const amount = -(item.quantity * item.price); // Credit amount is negative in Tally XML for Sales Items
            inventoryEntries += `
                <ALLINVENTORYENTRIES.LIST>
                    <STOCKITEMNAME>${item.name}</STOCKITEMNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <RATE>${item.price}/No</RATE>
                    <AMOUNT>${amount}</AMOUNT>
                    <ACTUALQTY>${item.quantity} No</ACTUALQTY>
                    <BILLEDQTY>${item.quantity} No</BILLEDQTY>
                    <ACCOUNTINGALLOCATIONS.LIST>
                        <LEDGERNAME>${salesLedger}</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <AMOUNT>${amount}</AMOUNT>
                    </ACCOUNTINGALLOCATIONS.LIST>
                </ALLINVENTORYENTRIES.LIST>
            `;
        });

        // Calculate Taxes (Simplified for Demo)
        // In real app, iterate over tax lines
        let ledgerEntries = '';
        if (invoice.tax > 0) {
            // Assuming CGST/SGST split for demo
            const taxHalf = invoice.tax / 2;
            const cgstLedger = ledgerMap.cgst || 'Output CGST';
            const sgstLedger = ledgerMap.sgst || 'Output SGST';

            ledgerEntries += `
                <LEDGERENTRIES.LIST>
                    <LEDGERNAME>${cgstLedger}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${taxHalf}</AMOUNT>
                </LEDGERENTRIES.LIST>
                <LEDGERENTRIES.LIST>
                    <LEDGERNAME>${sgstLedger}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${taxHalf}</AMOUNT>
                </LEDGERENTRIES.LIST>
             `;
        }

        return `
            <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
                <DATE>${invoice.date.replace(/-/g, '')}</DATE>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${invoice.id}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${invoice.customerName || cashLedger}</PARTYLEDGERNAME>
                <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
                <BASICBUYERNAME>${invoice.customerName || 'Walk-in'}</BASICBUYERNAME>
                <EFFECTIVEDATE>${invoice.date.replace(/-/g, '')}</EFFECTIVEDATE>
                
                ${inventoryEntries}
                ${ledgerEntries}
            </VOUCHER>
        `;
    }
};
