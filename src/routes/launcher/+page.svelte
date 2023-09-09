<script>
    import * as fs from "@tauri-apps/api/fs";
    import * as path from "@tauri-apps/api/path";
    import * as os from "@tauri-apps/api/os";

    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
    import SaveSlot from "$lib/components/SaveSlot/Button.svelte";
    import Modal from "$lib/components/Modal/Base.svelte";

    import Profiles from "$lib/resources/profiles.js";
    import JSONStorage from "$lib/resources/jsonstorage.js";

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

    // ICONS
    import GS2MLIcon from "$lib/components/SaveSlot/gs2ml.png";
    import ProfileIcon from "$lib/components/SaveSlot/snail.png";

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
        },
        new: false,
        edit: false,
    };

    // GS2ML
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
        if (!exists) {
            // open installer
            const message =
                "DOTNET 6.0 does not seem to be installed. Download and open the installer now? At least 1 GB of space is recommended.";
            if (await confirm(message)) {
                console.log("checking system arch...");
                const arch = await os.arch();
                console.log("arch", arch);
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
                // download the installer
                console.log("downloading installer for this arch platform...");
                fetch(installation).then((res) => {
                    if (!res.ok) {
                        console.warn("couldnt get installer!");
                        return alert(
                            "DOTNET 6.0 Installer could not be downloaded."
                        );
                    }
                    res.arrayBuffer()
                        .then((arraybuffer) => {
                            fs.writeBinaryFile(
                                "./dotnet_installer.exe",
                                arraybuffer
                            )
                                .then(() => {
                                    // TODO: run installer
                                })
                                .catch((err) => {
                                    console.warn(
                                        "couldnt write installer exe!",
                                        err
                                    );
                                    return alert(
                                        "DOTNET 6.0 Installer could not be downloaded."
                                    );
                                });
                        })
                        .catch((err) => {
                            console.warn(
                                "couldnt get installer as buffer!",
                                err
                            );
                            return alert(
                                "DOTNET 6.0 Installer could not be downloaded."
                            );
                        });
                });
            }
        }
    };
    const openGs2mlMenu = async () => {
        modalStates.gs2ml.open = true;
        modalStates.gs2ml.available = false;
        modalStates.gs2ml.searching = true;
        modalStates.gs2ml.searchable = true;
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
        </div>
    </Modal>
{/if}

<NavigationBar />

{#if profilesLoaded}
    {#key profileUpdate}
        {#each profiles as profile}
            <SaveSlot header={profile.name} icon={ProfileIcon} />
        {/each}
    {/key}
    <SaveSlot
        header={"GS2ML"}
        footer="Manage"
        icon={GS2MLIcon}
        on:click={() => openGs2mlMenu()}
    />
    <SaveSlot header={"New Profile"} plus={true} on:click={createProfile} />
{/if}

<style>
    .gs2ml-searching {
        margin-block: 2em;
        opacity: 0.6;
    }
</style>
