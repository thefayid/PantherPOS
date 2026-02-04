const axios = require('axios');

const TALLY_URL = 'http://127.0.0.1:9000';

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

console.log(`Testing Connection to ${TALLY_URL}...`);

axios.post(TALLY_URL, xml, { headers: { 'Content-Type': 'text/xml' }, timeout: 5000 })
    .then(res => {
        console.log("SUCCESS_TALLY_IS_REACHABLE");
        console.log("Status:", res.status);
    })
    .catch(err => {
        console.error("FAILED_TALLY_UNREACHABLE");
        console.error("Error:", err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error("REASON: Tally Prime is likely CLOSED or listening on a different port.");
        }
    });
