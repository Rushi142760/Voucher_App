const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    fetch: async (url, options) => {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Failed to fetch: ' + response.statusText);
        return response.json();
    },
});

