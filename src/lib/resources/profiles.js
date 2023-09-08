import localforage from "localforage";

class Profiles {
    static async get() {
        const profiles = await localforage.getItem("st:profiles");
        if (!Array.isArray(profiles)) return [];
        return profiles;
    }
    static set(data) {
        return localforage.setItem("st:profiles", data);
    }
}

export default Profiles;