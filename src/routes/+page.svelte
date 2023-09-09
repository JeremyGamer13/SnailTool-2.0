<script>
    import * as path from "@tauri-apps/api/path";
    import * as fs from "@tauri-apps/api/fs";

    import JSONStorage from "../lib/resources/jsonstorage.js";
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";

    const ConfigData = new JSONStorage("./config_snailtool.json");
    const FilePaths = {
        game: "",
        save: "",
    };

    ConfigData.get("gamePath").then((path) => {
        if (typeof path === "string") {
            FilePaths.game = path;
        }
    });
    ConfigData.get("savePath").then((path) => {
        if (typeof path === "string") {
            FilePaths.save = path;
        }
    });

    const autoDetectDir = async (gameDir) => {
        let lookForDirectories = [];
        if (gameDir) {
            lookForDirectories = [
                "C:/Program Files (x86)/Steam/steamapps/common/Will You Snail/",
                "C:/Program Files/Steam/steamapps/common/Will You Snail/",
            ];
        } else {
            // saveDir
            const userDir = await path.homeDir();
            lookForDirectories = [
                await path.join(userDir, "/AppData/Local/Will_You_Snail"),
            ];
        }

        let usablePath = "";
        for (const path of lookForDirectories) {
            let exists = false;
            try {
                console.log("searching for", path);
                exists = await fs.exists(path);
            } catch (err) {
                if (err) console.warn("error checking for", path, err);
                exists = false;
            }
            if (exists) {
                usablePath = path;
                break;
            }
        }

        if (!usablePath) {
            return alert(
                "Couldn't find directory. Your game files may be on a seperate drive that SnailTool can't find automatically."
            );
        }

        if (gameDir) {
            FilePaths.game = usablePath;
            ConfigData.set("gamePath", usablePath);
        } else {
            FilePaths.save = usablePath;
            ConfigData.set("savePath", usablePath);
        }
    };
</script>

<NavigationBar />

<div class="content">
    <img src="/logo.png" alt="SnailTool" class="title" />

    <p>Game Directory: {FilePaths.game ? FilePaths.game : "None"}</p>
    <div>
        <button on:click={() => autoDetectDir(true)}>Auto-Detect</button>
        <button>Browse...</button>
    </div>
    <br />
    <p>Save Directory: {FilePaths.save ? FilePaths.save : "None"}</p>
    <div>
        <button on:click={() => autoDetectDir(false)}>Auto-Detect</button>
        <button>Browse...</button>
    </div>
</div>

<p class="footer">st-v2.0; svelte - tauri</p>

<style>
    .title {
        margin-top: 8px;
        height: 128px;
    }
    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .footer {
        position: absolute;
        left: 2px;
        bottom: 2px;
        opacity: 0.5;
        margin-block: 0;
        font-size: x-small;
        user-select: none;
        font-style: italic;
        text-transform: uppercase;
        pointer-events: none;
    }
</style>
