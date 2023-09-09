<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
    import SaveSlot from "$lib/components/SaveSlot/Button.svelte";

    import Profiles from "$lib/resources/profiles.js";

    // profiles
    let profileUpdate = 0;
    let profiles = Profiles.get();

    const createProfile = async () => {
        profiles = Profiles.get();
        profileUpdate++;
    };
</script>

<NavigationBar />

{#key profileUpdate}
    {#each profiles as profile}
        <SaveSlot header={profile.name} />
    {/each}
{/key}
<SaveSlot header={"GS2ML"} footer="Manage" />
<SaveSlot header={"New Profile"} plus={true} on:click={createProfile} />
