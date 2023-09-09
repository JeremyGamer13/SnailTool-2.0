<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
    import SaveSlot from "$lib/components/SaveSlot/Button.svelte";

    import Profiles from "$lib/resources/profiles.js";

    // ICONS
    import GS2MLIcon from "$lib/components/SaveSlot/gs2ml.png";
    import ProfileIcon from "$lib/components/SaveSlot/snail.png";

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
</script>

<NavigationBar />

{#if profilesLoaded}
    {#key profileUpdate}
        {#each profiles as profile}
            <SaveSlot header={profile.name} icon={ProfileIcon} />
        {/each}
    {/key}
    <SaveSlot header={"GS2ML"} footer="Manage" icon={GS2MLIcon} />
    <SaveSlot header={"New Profile"} plus={true} on:click={createProfile} />
{/if}
