import JSONStorage from "easy-json-database";
import { v4 as uuidv4 } from 'uuid';
const ProfileDatabase = new JSONStorage('./profiles.json');

class Profiles {
    static async get(key) {
        if (!key) return ProfileDatabase.all().values();
        return ProfileDatabase.get(key);
    }
    static generateKey() {
        return uuidv4();
    }
    static set(name, data) {
        ProfileDatabase.set(name, data);
    }
}

export default Profiles;