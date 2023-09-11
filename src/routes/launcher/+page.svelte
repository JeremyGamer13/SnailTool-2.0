<script>
    import * as fs from "@tauri-apps/api/fs";
    import * as path from "@tauri-apps/api/path";
    import * as os from "@tauri-apps/api/os";
    import * as shell from "@tauri-apps/api/shell";
    import * as http from "@tauri-apps/api/http";
    import * as dialog from "@tauri-apps/api/dialog";
    // http does not use CORS

    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
    import SaveSlot from "$lib/components/SaveSlot/Button.svelte";
    import Modal from "$lib/components/Modal/Base.svelte";

    import Profiles from "$lib/resources/profiles.js";
    import JSONStorage from "$lib/resources/jsonstorage.js";
    import Cast from "$lib/resources/cast.js";

    const ConfigData = new JSONStorage("./config_snailtool.json");
    const FilePaths = {
        game: "",
        save: "",
    };
    // we install SDK for now, maybe we wont in the future
    const NetInstallations = {
        x64: "https://download.visualstudio.microsoft.com/download/pr/8d1443fd-a5e1-438d-8cb8-6ccb9849a54a/4f89f2b74a9c272789dfac8658a87673/dotnet-sdk-6.0.413-win-x64.exe",
        x86: "https://download.visualstudio.microsoft.com/download/pr/fbf3c93d-757e-46fe-ad9c-90105d48a3e8/0fd732e33dd3f18e2c5c269bfd94e505/dotnet-sdk-6.0.413-win-x86.exe",
        arm: "https://download.visualstudio.microsoft.com/download/pr/65921ee8-7be8-42f7-8902-900c98acd5e0/818423a2eb96f680225390e706e9994e/dotnet-sdk-6.0.413-win-arm64.exe",
    };
    // this should probably be maintained somehow
    const GS2MLRelease =
        "https://github.com/OmegaMetor/GS2ML/releases/download/9de51eb/gm2ml-win64.zip";

    // ICONS
    import IconGS2ML from "$lib/components/SaveSlot/gs2ml.png";
    import IconProfile from "$lib/components/SaveSlot/snail.png";

    // file paths
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

    // profiles
    let profileUpdate = 0;
    let profilesLoaded = false;
    let profiles = [];

    Profiles.get().then((profiless) => {
        profiles = profiless;
        profilesLoaded = true;
        profileUpdate++;
    });

    const createProfile = async () => {
        profiles = await Profiles.get();
        profileUpdate++;
    };

    // modals (should be below all functionality)
    const modalStates = {
        gs2ml: {
            open: false,
            available: false,
            searching: true,
            searchable: true,
            disabled: true,
            mods: [],
        },
        new: false,
        edit: false,
    };

    // GS2ML
    const lookForGs2ml = async () => {
        modalStates.gs2ml.available = false;
        modalStates.gs2ml.searching = true;
        modalStates.gs2ml.searchable = true;
        modalStates.gs2ml.disabled = true;
        modalStates.gs2ml.mods = [];
        // look for GS2ML
        if (!FilePaths.game) {
            // no file path
            modalStates.gs2ml.available = false;
            modalStates.gs2ml.searching = false;
            modalStates.gs2ml.searchable = false;
            return;
        }
        // first check if the game is even in this directory
        const executableName = "Will You Snail.exe";
        const executablePath = await path.join(FilePaths.game, executableName);
        const executableExists = await fs.exists(executablePath);
        if (!executableExists) {
            // invalid folder
            modalStates.gs2ml.available = false;
            modalStates.gs2ml.searching = false;
            modalStates.gs2ml.searchable = false;
            return;
        }
        // now search for GS2ML
        const gs2mlPath = await path.join(FilePaths.game, "gs2ml");
        const gs2mlExists = await fs.exists(gs2mlPath);
        if (!gs2mlExists) {
            // not available but we were able to search for it
            modalStates.gs2ml.available = false;
            modalStates.gs2ml.searching = false;
            modalStates.gs2ml.searchable = true;
            return;
        }
        // gs2ml is there
        modalStates.gs2ml.available = true;
        modalStates.gs2ml.searching = false;
        modalStates.gs2ml.searchable = true;
        // GS2ML exists but version.dll might not
        modalStates.gs2ml.disabled = true;
        const dllPath = await path.join(FilePaths.game, "version.dll");
        const dllExists = await fs.exists(dllPath);
        if (dllExists) {
            modalStates.gs2ml.disabled = false;
        }
    };
    const getGs2mlModMetadata = async (mdpath) => {
        const metadataPath = await path.join(mdpath, "snailtool_metadata.json");
        const metadataExists = await fs.exists(metadataPath);
        if (!metadataExists) return {};
        const meta = JSON.parse(await fs.readTextFile(metadataPath));
        if (typeof meta.icon === "string") {
            try {
                const iconPath = await path.join(mdpath, meta.icon);
                const buffer = await fs.readBinaryFile(iconPath);
                const dataUrl = await Cast.arrayBufferToDataURL(buffer);
                meta.icon = dataUrl;
            } catch (err) {
                console.warn("failed to load icon in", mdpath, err);
            }
        }
        return meta;
    };
    const lookForGs2mlMods = async () => {
        modalStates.gs2ml.mods = [];
        const gs2mlPath = await path.join(FilePaths.game, "gs2ml");
        const gs2mlExists = await fs.exists(gs2mlPath);
        if (!gs2mlExists) return;
        const gs2mlModsPath = await path.join(FilePaths.game, "gs2ml/mods");
        const gs2mlModsExists = await fs.exists(gs2mlModsPath);
        if (!gs2mlModsExists) return;
        const folders = await fs.readDir(gs2mlModsPath);
        let idx = 0;
        for (const folder of folders) {
            modalStates.gs2ml.mods[idx] = {
                id: folder.name,
            };
            let data = {};
            try {
                data = await getGs2mlModMetadata(folder.path);
            } catch {
                data = {};
            }
            modalStates.gs2ml.mods[idx] = {
                ...data,
                id: folder.name,
            };
            modalStates.gs2ml.mods = modalStates.gs2ml.mods;
            idx++;
        }
    };
    const openGs2mlMenu = async () => {
        modalStates.gs2ml.open = true;
        await lookForGs2ml();
        await lookForGs2mlMods();
    };
    const fetchAndInsertGs2ml = async () => {
        console.log("fetching GS2ML archive");
        const res = await http.fetch(GS2MLRelease, {
            method: "GET",
            responseType: http.ResponseType.Binary,
        });
        if (!res.ok) {
            throw new Error(
                `Fetching GS2ML Archive URL returned ${res.status} (NOT OK)`
            );
        }
        console.log("writing file");
        const archivePath = await path.resolve("./gs2ml_archive_snailtool.zip");
        const archiveTarget = await path.resolve(FilePaths.game);
        console.log("writing file to", archivePath);
        await fs.writeBinaryFile(archivePath, res.data);
        const ps1Path = await path.resolve(
            "./gs2ml_archive_unzip_snailtool.ps1"
        );
        console.log("creating powershell script at", archivePath);
        await fs.writeTextFile(
            ps1Path,
            `Expand-Archive '${archivePath}' '${archiveTarget}' -Force`
        );
        const cmdCommand = ["powershell.exe", `${ps1Path}`];
        console.log("running", cmdCommand);
        const commandResult = await new shell.Command(
            "extract-gs2ml",
            cmdCommand
        ).execute();
        console.log(commandResult.stdout);
        if (commandResult.code !== 0) {
            // epic fail
            throw new Error(
                `Unzip command failed with code ${commandResult.code}; ${commandResult}`
            );
        }
        console.log("install completed");
        // we successed, reload
        modalStates.gs2ml.open = false;
        openGs2mlMenu();
    };
    const installGs2ml = async () => {
        // IMPORTANT: confirm & other functions are Promises in Tauri Svelte!

        const message =
            "Do you want to install GS2ML in the current game directory? This will disable GMML if that is installed.";
        if (!(await confirm(message))) return;
        // check for DOTNET 6.0
        const dotnetSdkPaths = [
            "C:/Program Files/dotnet/sdk/6.0.413",
            "C:/Program Files/dotnet/sdk/6.0.316",
            "C:/Program Files/dotnet/sdk/6.0.121",
        ];
        let exists = false;
        for (const path of dotnetSdkPaths) {
            const netExists = await fs.exists(path);
            if (netExists) {
                exists = true;
                break;
            }
        }
        // if dotnet is not installed
        if (!exists) {
            // open installer
            const message =
                "DOTNET 6.0 does not seem to be installed. Download the installer now? You'll need to open it yourself and at least 1 GB of space is recommended.";
            if (await confirm(message)) {
                console.log("checking system arch...");
                const arch = await os.arch();
                console.log("arch", arch);
                let usingArch = "x64";
                let installation = NetInstallations.x64;
                switch (arch) {
                    // literally everything else installs x64 for now
                    case "x86":
                        // install x86
                        installation = NetInstallations.x86;
                        break;
                    case "arm":
                        // install arm
                        installation = NetInstallations.arm;
                        break;
                }
                if (installation !== NetInstallations.x64) {
                    usingArch = arch;
                }
                // download the installer
                console.log("downloading installer for", usingArch);
                shell.open(installation); // open the webpage
            }
        }

        // either while thats happening or just after nothing happened before,
        // lets install GS2ML
        try {
            await fetchAndInsertGs2ml();
        } catch (err) {
            console.error(
                "couldnt install GS2ML;",
                err.stack ? err.stack : err
            );
            dialog.message(
                `GS2ML could not be installed.\n\n${
                    err.stack ? err.stack : err
                }`,
                { title: "Error", type: "error" }
            );
            return;
        }
    };

    // more GS2ML but less core
    const canToggleGs2ml = async () => {
        const enabledDllPath = await path.join(FilePaths.game, "version.dll");
        const enabledDllExists = await fs.exists(enabledDllPath);
        const disabledDllPath = await path.join(
            FilePaths.game,
            "version_disabled_snailtool.dll"
        );
        const disabledDllExists = await fs.exists(disabledDllPath);
        if (!enabledDllExists && !disabledDllExists) {
            return false;
        }
        return true; // one of the paths exist
    };
    const toggleGs2ml = async () => {
        // first check if GS2ML can be toggled
        if (!(await canToggleGs2ml())) {
            if (
                await dialog.confirm(
                    "GS2ML is missing it's version.dll file.\n\nOpen the installer for GS2ML?"
                )
            ) {
                installGs2ml();
            }
            return;
        }
        const disabledDllPath = await path.join(
            FilePaths.game,
            "version_disabled_snailtool.dll"
        );
        const enabledDllPath = await path.join(FilePaths.game, "version.dll");
        const disabledDllExists = await fs.exists(disabledDllPath);
        let operation = async () => {};
        if (disabledDllExists) {
            // enable gs2ml
            operation = async () =>
                await fs.renameFile(disabledDllPath, enabledDllPath);
        } else {
            // disable gs2ml
            operation = async () =>
                await fs.renameFile(enabledDllPath, disabledDllPath);
        }
        try {
            await operation();
        } catch (err) {
            console.error("couldnt toggle GS2ML;", err.stack ? err.stack : err);
            dialog.message(
                `An unexpected error occurred trying to change this state.\n\n${
                    err.stack ? err.stack : err
                }`,
                { title: "Error", type: "error" }
            );
            return;
        }
        // resets the disabled state
        lookForGs2ml();
    };
    const deleteGs2mlMod = async (id) => {
        const message = `Are you sure you want to delete ${id}?\nThe mod will be removed permanently and you'll have to register it again.`;
        if (!(await dialog.ask(message, { type: "warning" }))) return;
        console.log("deleting", id, "...");
        const modPath = await path.join(FilePaths.game, `gs2ml/mods/${id}`);
        const modExists = await fs.exists(modPath);
        if (modExists) {
            fs.removeDir(modPath, {
                recursive: true,
            })
                .catch((err) => {
                    console.error("failed to delete mod", id, err);
                    dialog.message(
                        `An unexpected error occurred trying to delete ${id}.\n\n${
                            err.stack ? err.stack : err
                        }`,
                        { title: "Error", type: "error" }
                    );
                    return;
                })
                .finally(() => {
                    lookForGs2mlMods();
                });
        }
    };
    const handleGs2mlRegistryOfDirectory = async (dirpath) => {
        console.log("registering", dirpath);
        const files = await fs.readDir(dirpath);
        // make sure we either have at least a DLL or .gml file
        // obviously this isnt a requirement but just let the user know if neither are present
        console.log("checking files in", dirpath, "(are they mod files?)");
        const hasModFiles = files.some(
            (file) => file.name.endsWith(".dll") || file.name.endsWith(".gml")
        );
        if (!hasModFiles) {
            console.warn("no mod files found for", dirpath, "?");
            const message = `No mod files were found inside of ${dirpath}\n\nDid you select the correct directory?\n\nPress "Cancel" to cancel registering this mod, and press "Ok" to continue.`;
            if (!(await dialog.confirm(message, { type: "warning" }))) {
                return console.log("cancelled loading", dirpath);
            }
        }
        // copy directory using cmd because tauri fs doesnt have copy path
        const modId = await path.basename(dirpath);
        console.log("registering", modId);
        // get mod path & command
        const modPath = await path.join(FilePaths.game, `gs2ml/mods/${modId}`);
        const cmdCommand = `xcopy "${dirpath}" "${modPath}" /s /e /y /i`;
        // create cmd script
        const cmdScriptPath = await path.resolve(
            "./copy_mod_folder_snailtool.cmd"
        );
        console.log("creating cmd script at", cmdScriptPath);
        await fs.writeTextFile(cmdScriptPath, `${cmdCommand}\nexit`);
        // run the register command
        await shell.open(cmdScriptPath);
    };
    const registerGs2mlMods = async () => {
        const dialogResult = await dialog.open({
            multiple: true,
            directory: true,
            title: "Select a folder containing the mod's DLL and or files",
        });
        if (!dialogResult) return;
        const directories = Cast.toArray(dialogResult);
        for (const directory of directories) {
            try {
                await handleGs2mlRegistryOfDirectory(directory);
            } catch (err) {
                console.error(err, err.stack);
                dialog.message(
                    `An error occurred reading ${directory}\n\n${
                        err.stack ? err.stack : err
                    }`,
                    {
                        type: "error",
                        title: "Error registering mod",
                    }
                );
            }
            await lookForGs2mlMods();
        }
        // some functions need more time
        setTimeout(async () => {
            await lookForGs2mlMods();
        }, 1000);
    };
</script>

{#if modalStates.gs2ml.open}
    <Modal
        title="Manage GS2ML"
        width="80"
        on:close={() => (modalStates.gs2ml.open = false)}
    >
        <div style="padding: 8px;">
            <p>
                GS2ML is a mod loader for games like Will you Snail.
                <br />
                Disable or manage configuration here.
            </p>
            <p
                class="gs2ml-searching"
                style={modalStates.gs2ml.available ? "" : "opacity: 1;"}
            >
                {#if modalStates.gs2ml.searching}
                    Searching for GS2ML...
                {:else if modalStates.gs2ml.available}
                    GS2ML is installed.
                {:else if !modalStates.gs2ml.searchable}
                    The current game directory is invalid.
                    <br />
                    Please ensure the game directory contains the game executable.
                {:else if !modalStates.gs2ml.available}
                    GS2ML is not installed.
                {/if}
                {#if !modalStates.gs2ml.available && modalStates.gs2ml.searchable && !modalStates.gs2ml.searching}
                    <!-- gs2ml not installed -->
                    <button on:click={() => installGs2ml()}>
                        Install GS2ML
                    </button>
                {/if}
            </p>
            {#if modalStates.gs2ml.available}
                <!-- gs2ml available? -->
                <p>
                    GS2ML is currently {modalStates.gs2ml.disabled
                        ? "disabled"
                        : "enabled"}.
                </p>
                <button on:click={() => toggleGs2ml()}>
                    {modalStates.gs2ml.disabled ? "Enable" : "Disable"} GS2ML
                </button>
                <div style="height: 24px;" />
                <button on:click={registerGs2mlMods}>Register Mods</button>
                <div style="height: 8px;" />
                {#each modalStates.gs2ml.mods as mod}
                    <div class="mod-entry">
                        <img
                            src={mod.icon ? mod.icon : "/favicon.png"}
                            alt={mod.id}
                            class="mod-entry-icon"
                        />
                        <div class="mod-entry-details">
                            <p class="mod-entry-name">
                                {mod.name ? mod.name : mod.id}
                            </p>
                            <p class="mod-entry-description">
                                {mod.description
                                    ? mod.description
                                    : "No description"}
                                -
                                {mod.version ? mod.version : "v1.0.0"}
                            </p>
                        </div>
                        <button
                            class="mod-entry-delete"
                            on:click={() => deleteGs2mlMod(mod.id)}
                        />
                    </div>
                {/each}
            {/if}
        </div>
    </Modal>
{/if}

<NavigationBar />

{#if profilesLoaded}
    {#key profileUpdate}
        {#each profiles as profile}
            <SaveSlot header={profile.name} icon={IconProfile} />
        {/each}
    {/key}
    <SaveSlot
        header={"GS2ML"}
        footer="Manage"
        icon={IconGS2ML}
        on:click={() => openGs2mlMenu()}
    />
    <SaveSlot header={"New Profile"} plus={true} on:click={createProfile} />
{/if}

<style>
    .gs2ml-searching {
        margin-block: 2em;
        opacity: 0.6;
    }

    .mod-entry {
        position: relative;
        border: 1px solid #f0c0e377;
        border-left: 0;
        border-right: 0;
        width: calc(100% - 4px);
        padding: 4px;
        display: flex;
        flex-direction: row;
    }
    .mod-entry * {
        margin-block: 0;
    }
    .mod-entry-icon {
        height: 44px;
        margin-right: 4px;
    }
    .mod-entry-details {
        display: flex;
        flex-direction: column;
    }
    .mod-entry-name {
        font-size: 16px;
    }
    .mod-entry-description {
        font-size: 16px;
        opacity: 0.6;
    }
    .mod-entry-delete {
        background: transparent;
        background-image: url("/icons/trash_outline.png");
        transition-duration: 0s;
        position: absolute;
        top: calc(42px - 32px);
        right: 4px;
        width: 32px;
        height: 32px;
        border: 0;
        margin: 0;
        padding: 0;
    }
    .mod-entry-delete:hover {
        background-image: url("/icons/trash_hover.png");
        transition-duration: 0s;
    }
    .mod-entry-delete:active {
        opacity: 0.7;
        transition-duration: 0s;
    }
</style>
