// This is "easy-json-database" modified to work with tauri's filesystem module.
// This is because things like mkdirSync and existsSync aren't included in the API.

// The reason why JSONStorage is actually a database module is because it's basically exactly what we want,
// easily editable data by the user if necessary and easily editable by the application.

import * as fs from "@tauri-apps/api/fs";
import * as path from "@tauri-apps/api/path";

const setNestedProperty = (object, key, value) => {
    const properties = key.split('.');
    let index = 0;
    for (; index < properties.length - 1; ++index) {
        object = object[properties[index]];
    }
    object[properties[index]] = value;
};

const getNestedProperty = (object, key) => {
    const properties = key.split('.');
    let index = 0;
    for (; index < properties.length; ++index) {
        object = object && object[properties[index]];
    }
    return object;
};

const wait = (ms) => {
    const time = Date.now();
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Date.now() - time);
        }, ms);
    });
};

const waitFor = (conditionFunc) => {
    const time = Date.now();
    return new Promise(async (resolve) => {
        while (!conditionFunc()) {
            await wait(100);
        }
        resolve(Date.now() - time);
    });
};

export default class JSONStorage {
    /**
     * @param {string} filePath The path of the json file used for the database.
     * @param {DatabaseOptions} options
     */
    constructor(filePath, options) {
        /**
         * The options for the database
         * @type {DatabaseOptions}
         */
        this.options = options || {};

        /**
         * Whether or not the database is ready for actions.
         * This is only false while the database files are being created,
         * and all database functions manually wait for this to be true if it is false.
         * @type {boolean}
         */
        this.ready = false;

        /**
         * The path of the json file used as database.
         * @type {string}
         */
        this.jsonFilePath = filePath || "./db.json";

        /**
         * The data stored in the database.
         * @type {object}
         */
        this.data = {};

        // This should set this.ready to true when complete.
        this.initialize();
    }

    /**
     * Setup and mark the storage as ready.
     */
    async initialize() {
        // validate json path (we cant access ./ when built)
        const oldPath = this.jsonFilePath;
        const appDataFolder = await path.appDataDir();
        this.jsonFilePath = await path.join(appDataFolder, oldPath);
        console.log('accessing JSON Storage at', this.jsonFilePath);
        // does app data exist?
        const appDataExists = await fs.exists(appDataFolder);
        if (!appDataExists) {
            await fs.createDir(appDataFolder);
        }
        // create the file
        const exists = await fs.exists(this.jsonFilePath);
        if (!exists) {
            await fs.writeTextFile(this.jsonFilePath, "{}");
        } else {
            await this.fetchDataFromFile();
        }
        this.ready = true;
    }

    /**
     * Get data from the json file and store it in the data property.
     */
    async fetchDataFromFile() {
        const savedData = JSON.parse(await fs.readTextFile(this.jsonFilePath));
        if (typeof savedData === "object") {
            this.data = savedData;
        }
    }

    /**
     * Write data to the json file.
     */
    saveDataToFile() {
        return fs.writeTextFile(this.jsonFilePath, JSON.stringify(this.data, null, 2));
    }

    /**
     * Get data for a key in the database
     * @param {string} key 
     */
    async get(key) {
        if (!this.ready) await waitFor(() => this.ready);
        return getNestedProperty(this.data, key);
    }

    /**
     * Check if a key data exists.
     * @param {string} key 
     */
    async has(key) {
        if (!this.ready) await waitFor(() => this.ready);
        return getNestedProperty(this.data, key) != undefined;
    }

    /**
     * Set new data for a key in the database.
     * @param {string} key
     * @param {*} value 
     */
    async set(key, value) {
        if (!this.ready) await waitFor(() => this.ready);
        setNestedProperty(this.data, key, value);
        return await this.saveDataToFile();
    }

    /**
     * Delete data for a key from the database.
     * @param {string} key 
     */
    async delete(key) {
        if (!this.ready) await waitFor(() => this.ready);
        delete this.data[key];
        return await this.saveDataToFile();
    }

    /**
     * Add a number to a key in the database.
     * @param {string} key 
     * @param {number} count 
     */
    async add(key, count) {
        if (!this.ready) await waitFor(() => this.ready);
        if (!this.data[key]) this.data[key] = 0;
        this.data[key] += count;
        return await this.saveDataToFile();
    }

    /**
     * Subtract a number to a key in the database.
     * @param {string} key 
     * @param {number} count 
     */
    async subtract(key, count) {
        if (!this.ready) await waitFor(() => this.ready);
        if (!this.data[key]) this.data[key] = 0;
        this.data[key] -= count;
        return await this.saveDataToFile();
    }

    /**
     * Push an element to a key in the database.
     * @param {string} key 
     * @param {*} element 
     */
    async push(key, element) {
        if (!this.ready) await waitFor(() => this.ready);
        if (!this.data[key]) this.data[key] = [];
        this.data[key].push(element);
        return await this.saveDataToFile();
    }

    /**
     * Clear the database.
     */
    async clear() {
        if (!this.ready) await waitFor(() => this.ready);
        this.data = {};
        return await this.saveDataToFile();
    }

    /**
     * Get all the data from the database.
     */
    async all() {
        if (!this.ready) await waitFor(() => this.ready);
        return Object.keys(this.data).map((key) => {
            return {
                key,
                data: this.data[key]
            }
        });
    }
};
