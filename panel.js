async function pluginDetails(url = "", token) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "X-Shopware-Token": token,
        },
    });
    return response.json();
}

let shopwareVersion = '';

function getCompatibleVer(pluginBinaries) {
    let compatibleBinary = '';
    pluginBinaries.forEach((binary) => {
        let foundCompatibleVersion = binary.compatibleSoftwareVersions.find(version => version.name === shopwareVersion);
        if (foundCompatibleVersion) {
            compatibleBinary = binary.version;
        }
    });
    return compatibleBinary;
}

chrome.devtools.network.onRequestFinished.addListener(request => {
    request.getContent((body) => {
        if (request.request && request.request.url && request._resourceType === 'xhr') {
            let url = request.request.url;
            let urlArray = url.split('/');


            // Shopware Version
            if (urlArray[urlArray.length - 2] === 'onPremiseShops') {
                shopwareVersion = JSON.parse(body).shopwareVersion.name;
                // reset list here
                document.querySelector('#response-body-container').innerHTML = '';
            }

            // List Table for newest Version and compatible version
            if (urlArray[urlArray.length - 1].split('?')[0] === 'pluginlicenses') {
                let shopwareTokenObject = request.request.headers.find(header => header.name === 'X-Shopware-Token')
                let pluginList = JSON.parse(body);

                const table = document.createElement("TABLE");  //makes a table element for the page
                const header = table.createTHead();
                const headerRow = header.insertRow(0);
                headerRow.insertCell(0).innerHTML = "Name";
                headerRow.insertCell(1).innerHTML = "Latest Version";
                headerRow.insertCell(2).innerHTML = "Compatible Version";

                pluginList = pluginList.sort((a, b) => {
                    if (a.plugin.name < b.plugin.name) {
                        return -1;
                    }
                    if (a.plugin.name > b.plugin.name) {
                        return 1;
                    }
                    return 0;
                })

                pluginList.forEach(async (plugin) => {
                    const pluginDetailResponse = await pluginDetails(url.split('?')[0] + '/' + plugin.id, shopwareTokenObject.value);
                    let binaries = pluginDetailResponse.plugin.binaries;
                    let latestBinary = binaries.slice(-1)[0];
                    let compatibleVer = getCompatibleVer(binaries);

                    let row = table.insertRow();
                    row.insertCell(0).innerHTML = pluginDetailResponse.description;
                    row.insertCell(1).innerHTML = latestBinary.version;
                    row.insertCell(2).innerHTML = compatibleVer;

                    document.querySelector('#response-body-container').appendChild(table);
                });
            }

            // List Table installed Plugins incl. Versions
            if (urlArray[urlArray.length - 1] === 'installed') {
                let pluginList = JSON.parse(body);

                const table = document.createElement("TABLE");  //makes a table element for the page
                table.innerHTML = '';
                const header = table.createTHead();
                const headerRow = header.insertRow(0);
                headerRow.insertCell(0).innerHTML = "Name";
                headerRow.insertCell(1).innerHTML = "Installed Version";

                pluginList = pluginList.sort((a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                })

                pluginList.forEach((plugin) => {
                    let row = table.insertRow();
                    row.insertCell(0).innerHTML = plugin.label;
                    row.insertCell(1).innerHTML = plugin.version;

                    document.querySelector('#response-body-container').appendChild(table);
                });
            }

        }
    });
});
