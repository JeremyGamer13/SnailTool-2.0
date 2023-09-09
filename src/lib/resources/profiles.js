import JSONStorage from "./jsonstorage";
import { v4 as uuidv4 } from 'uuid';
const ProfileDatabase = new JSONStorage('./profiles_snailtool.json');

class Profiles {
    static async get(key) {
        if (!key) return (await ProfileDatabase.all()).values();
        return await ProfileDatabase.get(key);
    }
    static generateKey() {
        return uuidv4();
    }
    static set(name, data) {
        return ProfileDatabase.set(name, data);
    }
}

export default Profiles;