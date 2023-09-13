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
    const NetInstallationCommand = "winget install Microsoft.DotNet.SDK.6";

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

    // modals
    const modalStates = {
        gs2ml: {
            open: false,
            available: false,
            searching: true,
            searchable: true,
            disabled: true,
            hasdotnet: true,
            version: "",
            realLatestVersion: "",
            mods: [],
        },
        new: false,
        edit: false,
    };
    // progress bar on menu
    // highest is highest priority
    let progressStateUpdated = 0;
    const progressStates = {
        launchGame: { text: "", data: [0, 0] },
        installingGs2ml: { text: "", data: [0, 0] },
        registeringMods: { text: "", data: [0, 0] },
        creatingProfile: { text: "", data: [0, 0] },
    };
    const getCurrentProgressState = () => {
        const defaultState = { text: "No waiting actions", data: [0, 1] };
        for (const stateKey in progressStates) {
            const state = progressStates[stateKey];
            if (state.data[0] !== 0) {
                return state;
            }
        }
        return defaultState;
    };
    let currentProgressState = getCurrentProgressState();
    const updateProgressState = () => {
        currentProgressState = getCurrentProgressState();
        progressStateUpdated++;
    };

    // profiles
    let currentLaunchingProfileId = "";
    let modalCreateProfileData = {
        name: "New Profile",
        filesReplaced: false,
        files: { audiogroups: [] },
    };
    let modalEditProfileData = {
        id: "123",
        name: "New Profile",
        filesReplaced: false,
        files: { audiogroups: [] },
        loaded: false,
    };
    const createProfile = async () => {
        modalStates.new = false;
        // set progress
        progressStates.creatingProfile.text = "Creating profile";
        progressStates.creatingProfile.data = [1, 2];
        updateProgressState();
        // get ID & set
        const profileData = modalCreateProfileData;
        const profileId = Profiles.generateKey();
        await Profiles.set(profileId, {
            ...profileData,
            id: profileId,
        });
        // uptade
        progressStates.creatingProfile.data = [2, 2];
        profiles = await Profiles.get();
        profileUpdate++;
        progressStates.creatingProfile.text = "";
        progressStates.creatingProfile.data = [0, 0];
        updateProgressState();
    };
    const applyEditsOnProfile = async (id) => {
        const profileData = {
            ...modalEditProfileData,
        };
        delete profileData.loaded;
        await Profiles.set(id, profileData);
        profiles = await Profiles.get();
        profileUpdate++;
        modalStates.edit = false;
    };
    const deleteProfile = async (id) => {
        // confirm is a promise in tauri + svelte
        const profile = await Profiles.get(id);
        const message = `Are you sure you want to delete "${profile.name}"? This will remove all related files for this profile permanently.`;
        if (!(await confirm(message))) return;
        // delete
        await Profiles.delete(id);
        profiles = await Profiles.get();
        profileUpdate++;
        modalStates.edit = false;
    };
    const openCreateProfile = async () => {
        modalCreateProfileData.filesReplaced = false;
        modalCreateProfileData.files = {
            executable: await path.join(FilePaths.game, "Will You Snail.exe"),
            data: await path.join(FilePaths.game, "data.win"),
            audiogroups: [
                await path.join(FilePaths.game, "audiogroup1.dat"),
                await path.join(FilePaths.game, "audiogroup2.dat"),
            ],
        };
        modalStates.new = true;
    };
    const openEditProfile = async (id) => {
        modalStates.edit = true;
        modalEditProfileData.loaded = false;
        // get profile
        const profile = await Profiles.get(id);
        modalEditProfileData = {
            ...profile,
            loaded: true,
        };
    };
    const launchGame = async () => {
        let launchingProfile = await Profiles.get(currentLaunchingProfileId);
        if (!currentLaunchingProfileId) {
            // load default state
            launchingProfile = {};
        }
        const defaultLaunchInfo = {
            executable: await path.join(FilePaths.game, "Will You Snail.exe"),
            executableReplacement: await path.join(
                FilePaths.game,
                "WillYouSnail_snailtool.exe"
            ),
            data: await path.join(FilePaths.game, "data.win"),
            dataReplacement: await path.join(
                FilePaths.game,
                "data_snailtoolLaunching.win"
            ),
            audiogroups: [
                await path.join(FilePaths.game, "audiogroup1.dat"),
                await path.join(FilePaths.game, "audiogroup2.dat"),
            ],
        };
        const launchInfo = {
            modified: false,
            executable: await path.join(FilePaths.game, "Will You Snail.exe"),
            data: await path.join(FilePaths.game, "data.win"),
            audiogroups: [
                await path.join(FilePaths.game, "audiogroup1.dat"),
                await path.join(FilePaths.game, "audiogroup2.dat"),
            ],
        };
        if (currentLaunchingProfileId) {
            // replace stuff
            if (launchingProfile.filesReplaced && launchingProfile.files) {
                if (launchingProfile.files.executable) {
                    launchInfo.executable = await path.resolve(
                        Cast.toString(launchingProfile.files.executable)
                    );
                    launchInfo.modified = true;
                }
                if (launchingProfile.files.data) {
                    launchInfo.data = await path.resolve(
                        Cast.toString(launchingProfile.files.data)
                    );
                    launchInfo.modified = true;
                }
                if (Array.isArray(launchingProfile.files.audiogroups)) {
                    for (
                        let i = 0;
                        i < launchingProfile.files.audiogroups.length;
                        i++
                    ) {
                        const audioGroupPath =
                            launchingProfile.files.audiogroups[i];
                        launchInfo.audiogroups[i] = await path.resolve(
                            Cast.toString(audioGroupPath)
                        );
                        launchInfo.modified = true;
                    }
                }
            }
        }
        // replace if modified
        if (launchInfo.modified) {
            await fs.copyFile(
                launchInfo.executable,
                defaultLaunchInfo.executableReplacement
            );
            await fs.copyFile(
                launchInfo.data,
                defaultLaunchInfo.dataReplacement
            );
        }
        // we always replace audio groups, they are the only file we cant change the name of
        for (let i = 0; i < launchInfo.audiogroups.length; i++) {
            const audioGroupPath = launchInfo.audiogroups[i];
            const targetPath = await path.join(
                FilePaths.game,
                `audiogroup${i + 1}.dat`
            );
            await fs.copyFile(audioGroupPath, targetPath);
        }
        // modify GS2ML config if profiles do it
        // TODO: modify config if mods are present, this isnt possible until Omega releases that
        // launch the game
        // create cmd script (full paths are broken in new Command())
        const filePath = "./launch_game_snailtool.cmd";
        const cmdScriptPath = await path.resolve(filePath);
        const cmdScript = `"${
            launchInfo.modified
                ? defaultLaunchInfo.executableReplacement
                : defaultLaunchInfo.executable
        }" -game "${
            launchInfo.modified
                ? defaultLaunchInfo.dataReplacement
                : defaultLaunchInfo.data
        }"`;
        await fs.writeTextFile(cmdScriptPath, `${cmdScript}\nexit`);
        // run the command
        await shell.open(cmdScriptPath);
    };

    // latest gs2ml doo do
    http.fetch(
        "https://api.github.com/repos/OmegaMetor/GS2ML/releases/latest",
        {
            method: "GET",
            responseType: http.ResponseType.JSON,
            headers: {
                "User-Agent": "JeremyGamer13 : SnailTool-2.0",
            },
        }
    ).then((res) => {
        if (!res.ok) return;
        modalStates.gs2ml.realLatestVersion = res.data.tag_name;
    });

    // dotnet
    const checkForDotNetSdk = async () => {
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
        return exists;
    };
    const installDotNetSdk = async () => {
        const filePath = "./install_dotnet_snailtool.cmd";
        // create cmd script
        const cmdScriptPath = await path.resolve(filePath);
        console.log("creating cmd script at", cmdScriptPath);
        await fs.writeTextFile(
            cmdScriptPath,
            `${NetInstallationCommand}\nexit`
        );
        // run the register command
        await shell.open(cmdScriptPath);
    };
    const handleDotNetInstallButton = async () => {
        const hasDotNetSdk = await checkForDotNetSdk();
        if (hasDotNetSdk) {
            alert("DOTNET 6.0 is already installed.");
            return;
        }
        if (
            !(await confirm(
                "Install DOTNET 6.0? At least 1 GB of space is recommended."
            ))
        )
            return;
        await installDotNetSdk();
    };

    // GS2ML
    const lookForGs2ml = async () => {
        modalStates.gs2ml.available = false;
        modalStates.gs2ml.searching = true;
        modalStates.gs2ml.searchable = true;
        modalStates.gs2ml.disabled = true;
        modalStates.gs2ml.hasdotnet = true;
        modalStates.gs2ml.version = "";
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
        // get gs2ml version
        const snailToolLastDownloadPath = await path.join(
            FilePaths.game,
            "version_snailtool.txt"
        );
        const snailToolLastDownloadExists = await fs.exists(
            snailToolLastDownloadPath
        );
        if (snailToolLastDownloadExists) {
            const snailToolLastDownloadVersion = await fs.readTextFile(
                snailToolLastDownloadPath
            );
            modalStates.gs2ml.version = snailToolLastDownloadVersion;
        }
        // GS2ML exists but version.dll might not
        modalStates.gs2ml.disabled = true;
        const dllPath = await path.join(FilePaths.game, "version.dll");
        const dllExists = await fs.exists(dllPath);
        if (dllExists) {
            modalStates.gs2ml.disabled = false;
        }
        // check for dotnet
        const hasDotNetSdk = await checkForDotNetSdk();
        modalStates.gs2ml.hasdotnet = hasDotNetSdk;
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
        // get the latest release
        progressStates.installingGs2ml.text =
            "Fetching latest GS2ML release info";
        progressStates.installingGs2ml.data = [1, 4];
        updateProgressState();
        console.log("fetching latest GS2ML archive");
        const latestReleaseMeta = await http.fetch(
            "https://api.github.com/repos/OmegaMetor/GS2ML/releases/latest",
            {
                method: "GET",
                responseType: http.ResponseType.JSON,
                headers: {
                    "User-Agent": "JeremyGamer13 : SnailTool-2.0",
                },
            }
        );
        if (!latestReleaseMeta.ok) {
            throw new Error(
                `Fetching latest GS2ML release returned ${latestReleaseMeta.status} (NOT OK)\n${latestReleaseMeta.data}`
            );
        }
        const GS2MLRelease =
            latestReleaseMeta.data.assets[0].browser_download_url;
        // get the zip file
        progressStates.installingGs2ml.text = "Fetching GS2ML release";
        progressStates.installingGs2ml.data = [2, 4];
        updateProgressState();
        console.log("fetching GS2ML archive", GS2MLRelease);
        const res = await http.fetch(GS2MLRelease, {
            method: "GET",
            responseType: http.ResponseType.Binary,
        });
        if (!res.ok) {
            throw new Error(
                `Fetching GS2ML Archive URL returned ${res.status} (NOT OK)`
            );
        }
        // write zip file
        console.log("writing file");
        const archivePath = await path.resolve("./gs2ml_archive_snailtool.zip");
        const archiveTarget = await path.resolve(FilePaths.game);
        console.log("writing file to", archivePath);
        progressStates.installingGs2ml.text = "Downloading GS2ML release";
        progressStates.installingGs2ml.data = [3, 4];
        updateProgressState();
        await fs.writeBinaryFile(archivePath, res.data);
        // create powershell script to unzip file
        const ps1Path = await path.resolve(
            "./gs2ml_archive_unzip_snailtool.ps1"
        );
        console.log("creating powershell script at", archivePath);
        progressStates.installingGs2ml.text = "Unzipping GS2ML release";
        progressStates.installingGs2ml.data = [4, 4];
        updateProgressState();
        await fs.writeTextFile(
            ps1Path,
            `Expand-Archive '${archivePath}' '${archiveTarget}' -Force`
        );
        // run powershell
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
        // save the current version
        const snailToolLastDownloadPath = await path.join(
            FilePaths.game,
            "version_snailtool.txt"
        );
        const gs2mlVersion = latestReleaseMeta.data.tag_name;
        await fs.writeTextFile(
            snailToolLastDownloadPath,
            Cast.toString(gs2mlVersion)
        );
        // we successed, reload
        progressStates.installingGs2ml.text = "";
        progressStates.installingGs2ml.data = [0, 0];
        updateProgressState();
        modalStates.gs2ml.open = false;
        openGs2mlMenu();
    };
    const installGs2ml = async () => {
        // IMPORTANT: confirm & other functions are Promises in Tauri Svelte!

        const message =
            "Do you want to install GS2ML in the current game directory? This will disable GMML if that is installed.";
        if (!(await confirm(message))) return;
        // check for DOTNET 6.0
        let exists = await checkForDotNetSdk();
        // if dotnet is not installed
        if (!exists) {
            // open installer
            const message =
                "DOTNET 6.0 does not seem to be installed.\n\nDo you want to install DOTNET 6.0 now? You'll need it for GS2ML to run.\n\nAt least 1 GB of space is recommended.";
            if (await confirm(message)) {
                await installDotNetSdk();
            }
        }

        // either while thats happening or just after nothing happened before,
        // lets install GS2ML
        try {
            await fetchAndInsertGs2ml();
        } catch (err) {
            progressStates.installingGs2ml.text = "";
            progressStates.installingGs2ml.data = [0, 0];
            updateProgressState();
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
    const updateGs2ml = async () => {
        // IMPORTANT: confirm & other functions are Promises in Tauri Svelte!

        const message = "Update to the latest GS2ML release?";
        if (!(await confirm(message))) return;

        // lets install GS2ML
        try {
            await fetchAndInsertGs2ml();
        } catch (err) {
            progressStates.installingGs2ml.text = "";
            progressStates.installingGs2ml.data = [0, 0];
            updateProgressState();
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
        let idx = 0;
        for (const directory of directories) {
            try {
                progressStates.registeringMods.text = `Registering mod (${
                    idx + 1
                }/${directories.length})`;
                progressStates.registeringMods.data = [
                    idx + 1,
                    directories.length,
                ];
                updateProgressState();
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
            idx++;
        }
        // some functions need more time
        setTimeout(async () => {
            await lookForGs2mlMods();
            progressStates.registeringMods.text = "";
            progressStates.registeringMods.data = [0, 0];
            updateProgressState();
        }, 1000);
        progressStates.registeringMods.text = "";
        progressStates.registeringMods.data = [0, 0];
        updateProgressState();
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
                {#if modalStates.gs2ml.available && !modalStates.gs2ml.hasdotnet}
                    <button on:click={handleDotNetInstallButton}>
                        Install DOTNET 6.0
                    </button>
                {/if}
            </p>
            {#if modalStates.gs2ml.available}
                <!-- gs2ml update needed? -->
                {#if modalStates.gs2ml.realLatestVersion && modalStates.gs2ml.version}
                    {#if modalStates.gs2ml.version !== modalStates.gs2ml.realLatestVersion}
                        <button on:click={updateGs2ml}> Update GS2ML </button>
                    {/if}
                {/if}
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
{#if modalStates.new}
    <Modal
        title="New Profile"
        width="90"
        on:close={() => (modalStates.new = false)}
    >
        <div style="padding: 8px;">
            <div class="puppet-saveslot">
                <!-- svelte-ignore a11y-autofocus -->
                <input
                    class="puppet-saveslot-header"
                    bind:value={modalCreateProfileData.name}
                    autofocus
                />
                <img src={IconProfile} alt="Snail" />
            </div>
            <label>
                Use different game files
                <input
                    type="checkbox"
                    bind:checked={modalCreateProfileData.filesReplaced}
                />
            </label>
            {#if modalCreateProfileData.filesReplaced}
                <p>
                    Executable Path:
                    <input
                        type="text"
                        bind:value={modalCreateProfileData.files.executable}
                    />
                    <button>Browse...</button>
                </p>
                <p>
                    Data Path:
                    <input
                        type="text"
                        bind:value={modalCreateProfileData.files.data}
                    />
                    <button>Browse...</button>
                </p>
                <br />
                <button>Add audio group</button>
                <button>Remove audio group</button>
                <p>
                    Audio Group 1 Path:
                    <input
                        type="text"
                        bind:value={modalCreateProfileData.files.audiogroups[0]}
                    />
                    <button>Browse...</button>
                </p>
            {/if}
        </div>
        <button class="profile-create-button" on:click={createProfile}>
            Create
        </button>
    </Modal>
{/if}
{#if modalStates.edit}
    <Modal
        title="Edit Profile"
        width="90"
        on:close={() => (modalStates.edit = false)}
    >
        {#if modalEditProfileData.loaded}
            <div style="padding: 8px;">
                <div class="puppet-saveslot">
                    <!-- svelte-ignore a11y-autofocus -->
                    <input
                        class="puppet-saveslot-header"
                        bind:value={modalEditProfileData.name}
                    />
                    <img src={IconProfile} alt="Snail" />
                </div>
                <button
                    class="mod-entry-delete"
                    on:click={() => deleteProfile(modalEditProfileData.id)}
                />
            </div>
            <button
                class="profile-create-button"
                on:click={() => applyEditsOnProfile(modalEditProfileData.id)}
            >
                Apply
            </button>
        {/if}
    </Modal>
{/if}

<NavigationBar />

{#if profilesLoaded}
    {#key profileUpdate}
        {#each profiles as profile}
            <SaveSlot
                on:click={() => openEditProfile(profile.id)}
                header={profile.name}
                icon={IconProfile}
            />
        {/each}
    {/key}
    <SaveSlot
        header={"GS2ML"}
        footer="Manage"
        icon={IconGS2ML}
        on:click={() => openGs2mlMenu()}
    />
    <SaveSlot header={"New Profile"} plus={true} on:click={openCreateProfile} />
{/if}

<div style="height: 3rem;" />
<div class="action-bar">
    {#key profileUpdate}
        <select
            class="profile-selector"
            style={profiles.length > 0 ? "" : "opacity: 0.5"}
            disabled={profiles.length <= 0}
            bind:value={currentLaunchingProfileId}
        >
            {#each profiles as profile}
                <option value={profile.id}>{profile.name}</option>
            {:else}
                <option value="" disabled selected>
                    (No profiles created)
                </option>
            {/each}
        </select>
    {/key}
    <div class="action-progress-area">
        {#key progressStateUpdated}
            <div class="action-progress-bar">
                <div
                    class="action-progress-bar-fill"
                    style={`width: ${
                        (currentProgressState.data[0] /
                            currentProgressState.data[1]) *
                        100
                    }%;`}
                />
            </div>
            <p>{currentProgressState.text}</p>
        {/key}
    </div>
    <button class="launch-game" on:click={launchGame}>Launch Game</button>
</div>

<style>
    .gs2ml-searching {
        margin-block: 2em;
        opacity: 0.6;
    }

    .profile-selector,
    .launch-game {
        width: calc(20% - 16px);
        height: 2.5rem;
    }
    .profile-selector {
        border-width: 1px;
        border-radius: 0 !important;
        background-color: rgba(0, 0, 0, 0);
        border-color: #85448e;
        border-style: solid;
        cursor: pointer;
        user-select: none;
    }
    .profile-selector:disabled {
        cursor: not-allowed;
    }
    .profile-selector:focus {
        background-color: #331f30;
        border-color: #ea81f9;
        outline: unset;
    }

    .action-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3rem;
        background: rgb(14, 0, 14);
        border-top: 1px solid #f0c0e3;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
    }
    .action-progress-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 60%;
        overflow: hidden;
    }
    .action-bar p {
        margin-block: 0;
    }
    .action-progress-bar {
        position: relative;
        width: 100%;
        height: 4px;
        margin-bottom: 4px;
        background: #f0c0e333;
    }
    .action-progress-bar-fill {
        position: absolute;
        left: 0;
        top: 0;
        width: 0;
        height: 100%;
        background: #f0c0e3;
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

    .puppet-saveslot {
        position: relative;
        width: 180px;
        height: 275px;
        border-radius: 0;
        user-select: none;
        border-width: 1px;
        border-radius: 0 !important;
        background-color: rgba(0, 0, 0, 0);
        border-color: #85448e;
        border-style: solid;
    }
    .puppet-saveslot img {
        position: absolute;
        left: calc(50% - (65px / 2));
        top: calc(50% - (65px / 2));
        width: 65px;
        height: 65px;
        image-rendering: pixelated;
    }

    .puppet-saveslot-header,
    .puppet-saveslot-footer {
        position: absolute;
        left: 0;
        width: 100%;
        color: white;
        font-size: 22px;
        text-align: center;
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0;
    }
    .puppet-saveslot-header:focus,
    .puppet-saveslot-footer:focus {
        outline: 0;
    }
    .puppet-saveslot-header {
        top: 4px;
    }
    .puppet-saveslot-footer {
        bottom: 4px;
    }

    .profile-create-button {
        position: absolute;
        right: 4px;
        bottom: 4px;
        width: calc(100% - 8px);
        padding: 12px;
    }
</style>
