
/**
 * Utility to parse Tally XML responses
 */
export const TallyResponseParser = {

    /**
     * Parse the STATUS and potential errors from Tally Response
     */
    parseResponseStatus: (xmlString: string) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            const statusNode = xmlDoc.getElementsByTagName("STATUS")[0];
            const status = statusNode ? parseInt(statusNode.textContent || "0") : 0;

            const createdNode = xmlDoc.getElementsByTagName("CREATED")[0];
            const alteredNode = xmlDoc.getElementsByTagName("ALTERED")[0];
            const errorsNode = xmlDoc.getElementsByTagName("LINEERROR");

            const createdCount = createdNode ? parseInt(createdNode.textContent || "0") : 0;
            const alteredCount = alteredNode ? parseInt(alteredNode.textContent || "0") : 0;

            const errors: string[] = [];
            for (let i = 0; i < errorsNode.length; i++) {
                if (errorsNode[i].textContent) errors.push(errorsNode[i].textContent!);
            }

            // Tally sometimes returns STATUS 1 even if there are partial errors, so check created/altered
            const success = (status === 1) || (createdCount > 0) || (alteredCount > 0);

            return {
                success: success && errors.length === 0,
                created: createdCount,
                altered: alteredCount,
                errors: errors
            };
        } catch (e) {
            return { success: false, errors: ["XML Parsing Failed"] };
        }
    },

    /**
     * Parses list of Ledgers from Export Report
     */
    parseLedgerList: (xmlString: string) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const ledgers = xmlDoc.getElementsByTagName("LEDGER");

            const result = [];
            for (let i = 0; i < ledgers.length; i++) {
                const name = ledgers[i].getAttribute("NAME");
                const parent = ledgers[i].getElementsByTagName("PARENT")[0]?.textContent;
                const openingBalance = ledgers[i].getElementsByTagName("OPENINGBALANCE")[0]?.textContent;

                if (name) {
                    result.push({
                        name,
                        parent,
                        openingBalance
                    });
                }
            }
            return result;
        } catch (e) {
            console.error("Failed to parse ledger list", e);
            return [];
        }
    }
};
