import { TallyResponseParser } from './TallyResponseParser';
import { TallyXMLBuilder } from './TallyXMLBuilder';
import axios from 'axios';

export interface TallyConfig {
    tallyUrl: string;
    targetCompany: string;
    autoSync: boolean;
}

export interface TallyResponse {
    status: 'SUCCESS' | 'FAILURE';
    message?: string;
    rawResponse?: string;
}

const DEFAULT_CONFIG: TallyConfig = {
    tallyUrl: 'http://localhost:9000',
    targetCompany: '',
    autoSync: false
};

class TallyService {
    private config: TallyConfig = DEFAULT_CONFIG;
    private isConnected: boolean = false;

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        const stored = localStorage.getItem('pos_tally_config');
        if (stored) {
            this.config = JSON.parse(stored);
        }
    }

    public saveConfig(newConfig: TallyConfig) {
        this.config = newConfig;
        localStorage.setItem('pos_tally_config', JSON.stringify(this.config));
    }

    public getConfig() {
        return this.config;
    }

    /**
     * Checks if Tally is reachable and creates a handshake
     */
    public async checkConnection(): Promise<{ connected: boolean; company?: string; version?: string; error?: string }> {
        try {
            console.log(`[TallyService] Checking connection to ${this.config.tallyUrl}`);

            // Simple export request to check connection
            const xml = `
                <ENVELOPE>
                    <HEADER>
                        <TALLYREQUEST>Export Data</TALLYREQUEST>
                    </HEADER>
                    <BODY>
                        <EXPORTDATA>
                            <REQUESTDESC>
                                <REPORTNAME>List of Companies</REPORTNAME>
                            </REQUESTDESC>
                        </EXPORTDATA>
                    </BODY>
                </ENVELOPE>
            `;

            const res = await this.sendRequest(xml);
            if (res.status === 'SUCCESS') {
                this.isConnected = true;
                return { connected: true, company: 'Connected Company', version: 'Prime' };
            }
            return { connected: false, error: res.message || 'Unknown Error from Tally' };
        } catch (error: any) {
            return { connected: false, error: error.message };
        }
    }

    /**
     * Sync Masters from Tally (Import Ledgers)
     */
    public async syncMasters(): Promise<{ status: string, message: string, count?: number }> {
        // TDL XML to fetch all Ledgers
        const xml = `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Export Data</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <EXPORTDATA>
                        <REQUESTDESC>
                            <REPORTNAME>List of Accounts</REPORTNAME>
                            <STATICVARIABLES>
                                <SVCURRENTCOMPANY>${this.config.targetCompany || ''}</SVCURRENTCOMPANY>
                                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                            </STATICVARIABLES>
                        </REQUESTDESC>
                    </EXPORTDATA>
                </BODY>
            </ENVELOPE>
        `;

        const response = await this.sendRequest(xml);

        if (response.status === 'SUCCESS' && response.rawResponse) {
            const ledgers = TallyResponseParser.parseLedgerList(response.rawResponse);
            console.log("Fetched Ledgers from Tally:", ledgers.length);
            return { status: 'SUCCESS', message: 'Masters Synced Successfully', count: ledgers.length };
        }

        return { status: 'FAILURE', message: 'Failed to fetch masters from Tally' };
    }

    /**
     * Push a Sales Voucher to Tally
     */
    public async pushSalesVoucher(invoice: any): Promise<TallyResponse> {
        // 1. Build the Voucher XML
        const voucherXml = TallyXMLBuilder.buildSalesVoucher(invoice);

        // 2. Wrap in Envelope with Company Name
        const fullXml = TallyXMLBuilder.wrapEnvelope(voucherXml).replace('##TARGET_COMPANY##', this.config.targetCompany);

        // 3. Send
        const response = await this.sendRequest(fullXml);

        // 4. Parse specific errors if needed
        if (response.status === 'SUCCESS' && response.rawResponse) {
            const parsed = TallyResponseParser.parseResponseStatus(response.rawResponse);
            if (!parsed.success) {
                return {
                    status: 'FAILURE',
                    message: `Tally Logic Error: ${parsed.errors.join(', ')}`,
                    rawResponse: response.rawResponse
                };
            }
        }

        return response;
    }

    /**
     * Send arbitrary XML to Tally with Proxy Fallback
     */
    public async sendRequest(xml: string): Promise<TallyResponse> {
        try {
            console.log(`[TallyService] Sending request to ${this.config.tallyUrl}`);
            // Try 1: Direct Connection
            const response = await axios.post(this.config.tallyUrl, xml, {
                headers: { 'Content-Type': 'text/xml' }
            });
            return this.processResponse(response.data);
        } catch (error: any) {
            console.warn("[TallyService] Direct connection failed:", error.message);

            // Try 2: Proxy (Fallback for Browser/Dev mode)
            // Force try proxy if on localhost/127.0.0.1
            if (this.config.tallyUrl.includes('localhost') || this.config.tallyUrl.includes('127.0.0.1')) {
                try {
                    console.log("[TallyService] Attempting Proxy /tally-api...");
                    const proxyResponse = await axios.post('/tally-api', xml, {
                        headers: { 'Content-Type': 'text/xml' }
                    });
                    console.log("[TallyService] Proxy Success!");
                    return this.processResponse(proxyResponse.data);
                } catch (proxyError: any) {
                    console.error("[TallyService] Proxy Failed:", proxyError.message);
                    return { status: 'FAILURE', message: `Connection Failed: ${error.message}. Proxy also failed: ${proxyError.message}` };
                }
            }
            return { status: 'FAILURE', message: error.message };
        }
    }

    private processResponse(responseData: any): TallyResponse {
        // Basic parsing of Tally Response
        if (typeof responseData === 'string' && (responseData.includes('<STATUS>1</STATUS>') || responseData.includes('<CREATED>1</CREATED>') || responseData.includes('<ALTERED>1</ALTERED>'))) {
            return { status: 'SUCCESS', rawResponse: responseData };
        } else if (typeof responseData === 'string' && (responseData.includes('<STATUS>0</STATUS>') || responseData.includes('<ERRORS>'))) {
            return { status: 'FAILURE', message: 'Tally Rejected Data', rawResponse: responseData };
        }
        // If it returns XML list data (like List of Accounts), it's also a success
        if (typeof responseData === 'string' && responseData.includes('<ENVELOPE>')) {
            return { status: 'SUCCESS', rawResponse: responseData };
        }

        return { status: 'SUCCESS', rawResponse: responseData }; // Loose success
    }
}

export const tallyService = new TallyService();
