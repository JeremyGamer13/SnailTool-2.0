class Cast {
    static arrayBufferToDataURL(buffer) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([buffer], {
                type: "application/octet-binary",
            });
            const reader = new FileReader();
            reader.onload = function (evt) {
                const dataurl = evt.target.result;
                resolve(dataurl);
            };
            reader.onerror = reject;
            reader.onabort = reject;
            reader.readAsDataURL(blob);
        });
    }
    static async arrayBufferToBase64(buffer) {
        const dataurl = await Cast.arrayBufferToDataURL(buffer);
        return dataurl.substr(dataurl.indexOf(",") + 1);
    }
    static toArray(data) {
        if (Array.isArray(data)) return data;
        return [data];
    }
    static toString(content) {
        return String(content);
    }
}

export default Cast;